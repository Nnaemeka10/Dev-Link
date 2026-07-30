import { getDB } from '../../../lib/db.js';
import { ENV } from '../../../lib/env.js';
import type { VerificationStatus } from '../../payments/types/verification.js';

export const VendorVerificationModel = {
  async findByUserId(userId: number) {
    const db = getDB();
    const res = await db.query(
      `SELECT user_id, verification_status, resolved_account_name, id_type, id_last4, 
              account_number_last4, bank_code, paystack_recipient_code
       FROM vendors WHERE user_id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  },

  /**
   * Updates vendor verifiation details securely.
   * Encrypts the ID number (BVN/NIN) exactly like the bank account number.
   */
  async updateVerificationDetails(
    userId: number,
    data: {
      bankCode: string;
      accountNumber: string;
      resolvedAccountName: string;
      legalFirstName: string;
      legalLastName: string;
      matchScore: number;
      recipientCode: string;
      idType: string;
      idNumber: string;
      status: VerificationStatus;
    }
  ) {
    const db = getDB();
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch user email/name to satisfy NOT NULL constraints on vendors table if we need to INSERT
      const userRes = await client.query('SELECT email, first_name, last_name FROM users WHERE id = $1', [userId]);
      const userEmail = userRes.rows[0].email;
      const businessName = `${data.legalFirstName} ${data.legalLastName}`.trim();
      
      // Ensure user has a paystack_customer_code for ID validation
      let customerCode = await client.query('SELECT paystack_customer_code FROM users WHERE id = $1', [userId]);
      if (!customerCode.rows[0].paystack_customer_code) {
         // Note: In a real app, you'd call Paystack to create this.
         // For now we throw to halt the process if missing.
         throw new Error("User missing paystack_customer_code");
      }

      // 2. UPSERT the vendor row: Insert if missing, update if exists.
      await client.query(
        `INSERT INTO vendors 
          (user_id, business_name, email, bank_code, account_number_encrypted, account_number_last4, paystack_recipient_code)
         VALUES ($1, $2, $3, $4, pgp_sym_encrypt($5, $6), $7, $8)
         ON CONFLICT (user_id) DO UPDATE SET
           bank_code = EXCLUDED.bank_code,
           account_number_encrypted = EXCLUDED.account_number_encrypted,
           account_number_last4 = EXCLUDED.account_number_last4,
           paystack_recipient_code = EXCLUDED.paystack_recipient_code`,
        [userId, businessName, userEmail, data.bankCode, data.accountNumber, ENV.PGCRYPTO_KEY, data.accountNumber.slice(-4), data.recipientCode]
      );

      // 3. Now update the verification-specific fields
      await client.query(
        `UPDATE vendors SET
           resolved_account_name = $2,
           legal_first_name = $3,
           legal_last_name = $4,
           name_match_score = $5,
           id_type = $6,
           id_number_encrypted = pgp_sym_encrypt($7, $8),
           id_last4 = $9,
           verification_status = $10,
           verification_checked_at = NOW(),
           updated_at = NOW()
         WHERE user_id = $1`,
        [
          userId,
          data.resolvedAccountName,
          data.legalFirstName,
          data.legalLastName,
          data.matchScore,
          data.idType,
          data.idNumber,
          ENV.PGCRYPTO_KEY,
          data.idNumber.slice(-4),
          data.status,
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateStatusByCustomerCode(customerCode: string, status: VerificationStatus) {
    const db = getDB();
    await db.query(
      `UPDATE vendors SET 
        verification_status = $2, 
        verification_checked_at = NOW(),
        updated_at = NOW()
       WHERE user_id = (SELECT id FROM users WHERE paystack_customer_code = $1)`,
      [customerCode, status]
    );
  },

  async getBankDirectory() {
    const db = getDB();
    const res = await db.query(`SELECT id, name, code FROM bank_directory ORDER BY name ASC`);
    return res.rows;
  },

  async removePayoutMethod(userId: number) {
    const db = getDB();
    // await db.query(
    //   `UPDATE vendors SET 
    //     bank_code = NULL, 
    //     account_number_encrypted = NULL, 
    //     account_number_last4 = NULL,
    //     resolved_account_name = NULL,
    //     legal_first_name = NULL,
    //     legal_last_name = NULL,
    //     name_match_score = NULL,
    //     paystack_recipient_code = NULL,
    //     id_type = NULL,
    //     id_number_encrypted = NULL,
    //     id_last4 = NULL,
    //     verification_status = 'pending',
    //     verification_checked_at = NOW(),
    //     updated_at = NOW()
    //   WHERE user_id = $1`,
    //   [userId]
    // );
    // Delete the vendor row entirely. The UPSERT in updateVerificationDetails 
    // will handle recreating it if they add a new method later.
    await db.query(
      `DELETE FROM vendors WHERE user_id = $1`,
      [userId]
    );
  }
};