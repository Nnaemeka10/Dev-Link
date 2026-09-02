import { VerificationStatus } from "./verification.js";

export interface PaystackInitializeResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

export interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        domain: string;
        status: string; // 'success', 'failed', 'abandoned'
        reference: string;
        amount: number; // In kobo
        currency: string;
        customer: {
            email: string;
        };
    };
}


export interface Vendor {
    id: string;
    user_id: number;
    business_name: string;
    email: string;
    bank_code: string;
    account_number_encrypted: Buffer;
    account_number_last4: string;
    paystack_recipient_code: string;
    verification_status: VerificationStatus;
}

export interface LedgerAccount {
    id: string;
    account_type: 'escrow_holding' | 'platform_revenue' | 'vendor_payable' | 'refund_reserve' | 'paystack_wallet';
    booking_id?: string;
    vendor_id?: string;
}

export interface LedgerEntry {
    id: string;
    transaction_group: string;
    idempotency_key: string;
    account_id: string;
    entry_type: 'debit' | 'credit';
    amount_kobo: number;
    description: string;
    paystack_reference?: string;
}

export interface WebhookEvent {
    id: string;
    provider: string;
    event_type: string;
    paystack_event_id?: string;
    signature_verified: boolean;
    raw_payload: any;
    status: 'received' | 'processed' | 'failed' | 'ignored';
}

export interface PayoutAttempt {
    id: string;
    booking_id: string;
    dispatch_reference: string;
    amount_kobo: number;
    recipient_code: string;
    status: 'created' | 'dispatched' | 'awaiting_webhook' | 'succeeded' | 'failed' | 'unknown';
    paystack_transfer_code?: string;
}

// API Response types for Paystack
export interface PaystackRecipientResponse {
    status: boolean;
    message: string;
    data: {
        recipient_code: string;
    };
}

export interface PaystackDvaResponse {
    status: boolean;
    message: string;
    data: {
        account_name: string;
        account_number: string;
        bank: { slug: string; name: string };
    };
}

export interface PaystackTransferResponse {
    status: boolean;
    message: string;
    data: {
        reference: string;
        transfer_code: string;
        status: string;
    };
}