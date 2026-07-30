// src/modules/payments/types/verification.types.ts
export type IdType = 'bvn' | 'nin';
export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'manual_review';

export interface PayoutMethodPayload {
  bankCode: string;
  accountNumber: string;
  legalFirstName: string;
  legalLastName: string;
  idType: IdType;
  idNumber: string;
}

export interface PayoutMethodStatusResponse {
  status: VerificationStatus;
  resolvedAccountName?: string | null;
  nameMatchScore?: number | null;
  message?: string;
}

export interface BankDirectoryItem {
  id: number;
  name: string;
  code: string;
}