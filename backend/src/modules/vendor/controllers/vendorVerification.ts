import { Request, Response } from 'express';
import { VendorVerificationModel } from '../models/VendorVerification.js';
import { resolveBankAccount, dispatchIdentityVerification, getOrCreatePaystackCustomer } from '../../payments/utils/verification.js';
import { createTransferRecipient } from '../../payments/utils/paystack.js';
import { matchIdentity } from '../../payments/utils/nameMatch.js';
import { getDB } from '../../../lib/db.js';

export const submitPayoutMethod = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });

    const { bankCode, accountNumber, legalFirstName, legalLastName, idType, idNumber } = req.body;
    if (!bankCode || !accountNumber || !legalFirstName || !legalLastName || !idType || !idNumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 1. Idempotency Check: Prevent double submission
    const existingVendor = await VendorVerificationModel.findByUserId(req.user.userId);
    if (existingVendor?.verification_status === 'verified') {
      return res.status(200).json({ status: 'verified', message: 'Account already verified.' });
    }
    if (existingVendor?.verification_status === 'pending') {
      return res.status(409).json({ message: 'Verification already in progress. This usually takes 5 minutes.' });
    }

    // 2. Resolve Bank Account (Synchronous Paystack Call)
    let resolvedName: string;
    try {
      const resolved = await resolveBankAccount(accountNumber, bankCode);
      resolvedName = resolved.account_name;
    } catch (error: any) {
      return res.status(422).json({ message: 'Could not verify this account number. Please check your details.' });
    }

    // 3. Name Cross-Match (In-process)
    const matchScore = matchIdentity(`${legalFirstName} ${legalLastName}`, resolvedName);
    const nameMatched = matchScore >= 0.85;

    // 4. Create Transfer Recipient (Synchronous Paystack Call)
    let recipientCode = existingVendor?.paystack_recipient_code;
    try {
      const recipient = await createTransferRecipient(resolvedName, accountNumber, bankCode);
      recipientCode = recipient.data.recipient_code;
    } catch (error: any) {
      console.error('Paystack recipient creation failed:', error);
      return res.status(502).json({ message: 'Failed to setup payout recipient. Please try again.' });
    }

    
 // 5. Get or Create Paystack Customer Code for ID Validation
    const db = getDB();
    const userRes = await db.query('SELECT email FROM users WHERE id = $1', [req.user.userId]);
    const userEmail = userRes.rows[0].email;

    let customerCode: string;
    try {
      customerCode = await getOrCreatePaystackCustomer(req.user.userId, userEmail, legalFirstName, legalLastName);
    } catch (error: any) {
      console.error('Failed to get/create Paystack customer:', error);
      return res.status(502).json({ message: 'Failed to initialize payment profile for verification.' });
    }


    // Determine preliminary status based on name match
    const preliminaryStatus = nameMatched ? 'pending' : 'manual_review';

    // Save all details to DB securely
    await VendorVerificationModel.updateVerificationDetails(req.user.userId, {
      bankCode, accountNumber, resolvedAccountName: resolvedName,
      legalFirstName, legalLastName, matchScore, recipientCode,
      idType, idNumber, status: preliminaryStatus
    });

    if (!nameMatched) {
      return res.status(202).json({
        status: 'manual_review',
        message: 'We need to manually confirm your account details. Payouts are held until verified.'
      });
    }

    // Fire-and-forget ID verification dispatch
    try {
      await dispatchIdentityVerification(customerCode, idType, idNumber);
    } catch (error: any) {
      console.error(`ID Verification dispatch failed for user ${req.user.userId}:`, error.message);
      // We leave status as 'pending'. The reconciliation job will pick it up and retry.
    }

    return res.status(202).json({
      status: 'pending',
      message: 'Verification initiated. This usually completes within 5 minutes.'
    });

  } catch (error: any) {
    console.error('Submit payout method error:', error);
    res.status(500).json({ message: 'Failed to submit payout method' });
  }
};

export const getPayoutMethodStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const vendor = await VendorVerificationModel.findByUserId(req.user.userId);
    if (!vendor) {
      return res.status(200).json({ status: 'unregistered' });
    }

    res.status(200).json({
      status: vendor.verification_status,
      resolvedAccountName: vendor.resolved_account_name,
      idType: vendor.id_type,
      idLast4: vendor.id_last4,
      accountLast4: vendor.account_number_last4,
      bankCode: vendor.bank_code
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch status' });
  }
};

export const getBanks = async (req: Request, res: Response) => {
  try {
    const banks = await VendorVerificationModel.getBankDirectory();
    res.status(200).json(banks);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch bank directory' });
  }
};

export const removePayoutMethod = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });

    await VendorVerificationModel.removePayoutMethod(req.user.userId);
    res.status(200).json({ message: 'Payout method removed successfully' });
  } catch (error: any) {
    console.error('Remove payout method error:', error);
    res.status(500).json({ message: 'Failed to remove payout method' });
  }
};