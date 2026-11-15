// The core of the escrow system. Strict double-entry bookkeeping with
// deterministic, business-scoped idempotency keys so webhook replays and
// verify/webhook races can never double-post.

import { randomUUID } from 'crypto';
import type { PoolClient } from 'pg';
import type { LedgerAccount } from '../types/payment.js';

export type LedgerAccountType =
    | 'escrow_holding'
    | 'platform_revenue'
    | 'vendor_payable'
    | 'refund_reserve'
    | 'paystack_wallet'
    | 'tax_payable';

/** Exactly one of each system-wide (enforced by partial unique indexes, 031). */
const SINGLETON_TYPES: ReadonlySet<LedgerAccountType> = new Set([
    'platform_revenue',
    'paystack_wallet',
    'refund_reserve',
    'tax_payable',
]);

export const LedgerModel = {
    /**
     * Fetches or creates a ledger account. Singletons are keyed by type alone;
     * booking-scoped accounts by (type, booking_id). Race-safe: the unique
     * index arbitrates, then we re-read.
     */
    async getOrCreateAccount(
        client: PoolClient,
        accountType: LedgerAccountType,
        bookingId?: string,
        vendorId?: string
    ): Promise<LedgerAccount> {
        if (SINGLETON_TYPES.has(accountType)) {
            await client.query(
                `INSERT INTO ledger_accounts (account_type) VALUES ($1)
                 ON CONFLICT DO NOTHING`,
                [accountType]
            );
            const res = await client.query<LedgerAccount>(
                `SELECT * FROM ledger_accounts WHERE account_type = $1`,
                [accountType]
            );
            return res.rows[0];
        }

        if (!bookingId) {
            throw new Error(`LEDGER_ACCOUNT_REQUIRES_BOOKING: ${accountType}`);
        }

        await client.query(
            `INSERT INTO ledger_accounts (account_type, booking_id, vendor_id)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [accountType, bookingId, vendorId ?? null]
        );
        const res = await client.query<LedgerAccount>(
            `SELECT * FROM ledger_accounts WHERE account_type = $1 AND booking_id = $2`,
            [accountType, bookingId]
        );
        return res.rows[0];
    },

    /**
     * Posts a balanced double-entry group under ONE deterministic idempotency
     * key (e.g. `charge:<reference>`, `payout:<bookingId>`, `refund:<bookingId>`).
     * Replays hit uq_ledger_group_idempotency and no-op per entry.
     *
     * Throws before writing anything if the group doesn't balance - an
     * unbalanced ledger is worse than a failed request.
     */
    async postBalancedEntry(
        client: PoolClient,
        idempotencyKey: string,
        entries: Array<{
            account: LedgerAccount;
            entryType: 'debit' | 'credit';
            amountKobo: number;
            description: string;
            paystackReference?: string;
        }>
    ): Promise<void> {
        if (!idempotencyKey || idempotencyKey.length === 0) {
            throw new Error('LEDGER_IDEMPOTENCY_KEY_REQUIRED');
        }
        if (entries.length < 2) {
            throw new Error('LEDGER_GROUP_NEEDS_TWO_LEGS');
        }

        let debits = 0;
        let credits = 0;
        for (const e of entries) {
            if (!Number.isInteger(e.amountKobo) || e.amountKobo <= 0) {
                throw new Error(`LEDGER_INVALID_AMOUNT: ${e.amountKobo}`);
            }
            if (e.entryType === 'debit') debits += e.amountKobo;
            else credits += e.amountKobo;
        }
        if (debits !== credits) {
            throw new Error(`LEDGER_IMBALANCE: debits=${debits} credits=${credits} key=${idempotencyKey}`);
        }

        const transactionGroup = randomUUID();

        for (const entry of entries) {
            await client.query(
                `INSERT INTO ledger_entries
                    (transaction_group, idempotency_key, account_id, entry_type, amount_kobo, description, paystack_reference)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (idempotency_key, account_id) DO NOTHING`,
                [
                    transactionGroup,
                    idempotencyKey,
                    entry.account.id,
                    entry.entryType,
                    entry.amountKobo,
                    entry.description.slice(0, 255),
                    entry.paystackReference ?? null,
                ]
            );
        }
    },
};