//The core of the escrow system. Enforces strict double-entry bookkeeping with scoped idempotency
// keys to prevent duplicate credits on webhook replays.

import { getDB } from '../../../lib/db.js';
import { randomUUID } from 'crypto';
import type { LedgerAccount } from '../types/payment.js';
import type { PoolClient } from 'pg'; 

export const LedgerModel = {
  /**
   * Fetches or creates a ledger account for a specific booking/vendor/type.
   */
  async getOrCreateAccount(
    client: PoolClient,
    accountType: 'escrow_holding' | 'platform_revenue' | 'vendor_payable' | 'refund_reserve' | 'paystack_wallet',
    bookingId?: string,
    vendorId?: string
  ): Promise<LedgerAccount> {
    // Ensure the singleton platform_revenue account exists
    if (accountType === 'platform_revenue') {
      await client.query(
        `INSERT INTO ledger_accounts (account_type) VALUES ('platform_revenue') 
         ON CONFLICT DO NOTHING`
      );
      const res = await client.query<LedgerAccount>(
        `SELECT * FROM ledger_accounts WHERE account_type = 'platform_revenue'`
      );
      return res.rows[0];
    }

    // For booking/vendor specific accounts
    const res = await client.query<LedgerAccount>(
      `INSERT INTO ledger_accounts (account_type, booking_id, vendor_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (account_type, booking_id) DO NOTHING
       RETURNING *`,
      [accountType, bookingId, vendorId]
    );

    if (res.rows.length > 0) return res.rows[0];
    
    // If conflict occurred (already existed), fetch it
    const fetchRes = await client.query<LedgerAccount>(
      `SELECT * FROM ledger_accounts WHERE account_type = $1 AND booking_id = $2`,
      [accountType, bookingId]
    );
    return fetchRes.rows[0];
  },

  /**
   * Posts a balanced double-entry transaction.
   * Uses a single idempotency_key for the entire transaction group to prevent
   * duplicate ledger entries if a webhook is replayed.
   */
  async postBalancedEntry(
    client: any,
    idempotencyKey: string,
    entries: Array<{
      account: LedgerAccount;
      entryType: 'debit' | 'credit';
      amountKobo: number;
      description: string;
      paystackReference?: string;
    }>
  ): Promise<void> {
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
          entry.description,
          entry.paystackReference || null,
        ]
      );
    }
  }
};