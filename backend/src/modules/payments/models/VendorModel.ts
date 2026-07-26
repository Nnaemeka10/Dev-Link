// Handles secure onboarding of vendors to Paystack and encrypts their bank details before storing them.
import { getDB } from '../../../lib/db.js';
import { ENV } from '../../../lib/env.js';
import { createTransferRecipient } from '../utils/paystack.js';
import type { Vendor } from '../types/payment.js';

export const VendorModel = {
  /**
   * Onboards a vendor: Creates a Paystack Transfer Recipient and saves
   * the vendor with an encrypted bank account number.
   * Called when a user creates their first listing.
   */
  async onboardVendor(
    userId: number,
    businessName: string,
    email: string,
    bankCode: string,
    accountNumber: string
  ): Promise<Vendor> {
    const db = getDB();

    // 1. Create Transfer Recipient in Paystack
    const recipient = await createTransferRecipient(businessName, accountNumber, bankCode);
    const recipientCode = recipient.data.recipient_code;

    // 2. Encrypt account number using pgcrypto.
    // The key is passed per-query to ensure it's never hardcoded in DB schemas or logs.
    const accountLast4 = accountNumber.slice(-4);

    const result = await db.query<Vendor>(
      `INSERT INTO vendors 
        (user_id, business_name, email, bank_code, account_number_encrypted, account_number_last4, paystack_recipient_code)
       VALUES 
        ($1, $2, $3, $4, pgp_sym_encrypt($5, $6), $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        bank_code = EXCLUDED.bank_code,
        account_number_encrypted = EXCLUDED.account_number_encrypted,
        account_number_last4 = EXCLUDED.account_number_last4,
        paystack_recipient_code = EXCLUDED.paystack_recipient_code,
        updated_at = NOW()
       RETURNING *`,
      [userId, businessName, email, bankCode, accountNumber, ENV.PGCRYPTO_KEY, accountLast4, recipientCode]
    );

    return result.rows[0];
  },

  async findByUserId(userId: number): Promise<Vendor | null> {
    const db = getDB();
    const result = await db.query<Vendor>('SELECT * FROM vendors WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  }
};