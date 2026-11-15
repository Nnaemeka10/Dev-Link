import { ENV } from '../../../lib/env.js';
import type {
    PaystackInitializeResponse,
    PaystackVerifyResponse,
    PaystackRecipientResponse,
    PaystackTransferResponse,
} from '../types/payment.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

async function paystackRequest<T>(endpoint: string, method: string, body?: any): Promise<T> {
    const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
        method,
        headers: {
            Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Paystack API Error (${endpoint}): ${data.message || response.statusText}`);
    }
    return data as T;
}

/**
 * Per-transaction checkout. `bank_transfer` gives the customer a ONE-TIME
 * account number matched to this reference - no dedicated virtual account,
 * no provisioning, no orphan inflows.
 */
export async function initializePaystackTransaction(
    email: string,
    amountInNaira: number,
    reference: string
): Promise<PaystackInitializeResponse> {
    return paystackRequest<PaystackInitializeResponse>('/transaction/initialize', 'POST', {
        email,
        amount: Math.round(amountInNaira * 100),
        reference,
        currency: 'NGN',
        channels: ['card', 'bank', 'ussd', 'bank_transfer'],
        callback_url: `${ENV.CLIENT_URL}/bookings/callback`,
    });
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResponse> {
    return paystackRequest<PaystackVerifyResponse>(`/transaction/verify/${reference}`, 'GET');
}

// --- Vendor payouts ---

export async function createTransferRecipient(
    businessName: string,
    accountNumber: string,
    bankCode: string
): Promise<PaystackRecipientResponse> {
    return paystackRequest<PaystackRecipientResponse>('/transferrecipient', 'POST', {
        type: 'nuban',
        name: businessName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
    });
}

export async function initiateTransfer(
    amountKobo: number,
    recipientCode: string,
    reference: string,
    reason: string
): Promise<PaystackTransferResponse> {
    return paystackRequest<PaystackTransferResponse>('/transfer', 'POST', {
        source: 'balance',
        amount: amountKobo,
        recipient: recipientCode,
        reason,
        reference,
    });
}

export async function verifyTransfer(reference: string): Promise<any> {
    return paystackRequest<any>(`/transfer/verify/${reference}`, 'GET');
}

// --- Refunds ---

export interface PaystackRefundResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        transaction: { reference: string; amount: number; id: number };
        amount: number;
        status: string; // 'pending' | 'processed' | 'failed'
        currency: string;
        createdAt: string;
    };
}

/** FULL refund of a transaction. Omitting amount refunds the entire charge. */
export async function createPaystackRefund(transactionReference: string): Promise<PaystackRefundResponse> {
    return paystackRequest<PaystackRefundResponse>('/refund', 'POST', {
        transaction: transactionReference,
    });
}