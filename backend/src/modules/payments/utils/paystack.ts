import { ENV } from '../../../lib/env.js';
import type { 
    PaystackInitializeResponse, 
    PaystackVerifyResponse, 
    PaystackRecipientResponse, 
    PaystackDvaResponse,
    PaystackTransferResponse
} from '../types/payment.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

//new
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

export async function initializePaystackTransaction(email: string, amountInNaira: number, reference: string): Promise<PaystackInitializeResponse> {
    return paystackRequest<PaystackInitializeResponse>('/transaction/initialize', 'POST', {
        email,
        amount: Math.round(amountInNaira * 100),
        reference,
        callback_url: `${ENV.CLIENT_URL}/bookings/callback`,
    });
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResponse> {
    return paystackRequest<PaystackVerifyResponse>(`/transaction/verify/${reference}`, 'GET');
}

// --- New Escrow Functions ---

/**
 * Creates a Transfer Recipient in Paystack for a Vendor.
 * Called during Listing Creation (Vendor Onboarding).
 */
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

/**
 * Creates a Dedicated Virtual Account (DVA) for a specific booking/customer.
 * The guest pays into this account to fund the escrow.
 */
export async function createDedicatedVirtualAccount(
    customerEmail: string,
    customerCode: string // Paystack customer code (e.g. from user table)
): Promise<PaystackDvaResponse> {
    return paystackRequest<PaystackDvaResponse>('/dedicated_account/assign', 'POST', {
        email: customerEmail,
        customer: customerCode,
        preferred_bank: 'test-bank', // Use a specific bank slug in production
    });
}

/**
 * Initiates a transfer to a Vendor's bank account via Paystack.
 * Called by the automated payout worker.
 */
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

/**
 * Verifies the status of a transfer (payout).
 * Used by the reconciliation job to resolve 'unknown' or 'dispatched' states.
 */
export async function verifyTransfer(reference: string): Promise<any> {
    return paystackRequest<any>(`/transfer/verify/${reference}`, 'GET');
}




// export async function initializePaystackTransaction(
//     email: string, 
//     amountInNaira: number, 
//     reference: string
// ): Promise<PaystackInitializeResponse> {
    
//     const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
//         method: 'POST',
//         headers: {
//             Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             email,
//             amount: Math.round(amountInNaira * 100), // Convert Naira to Kobo
//             reference,
//             callback_url: `${ENV.CLIENT_URL}/bookings/callback`, // Where Paystack redirects after payment
//         }),
//     });

//     if (!response.ok) {
//         const error = await response.json();
//         throw new Error(`Paystack initialization failed: ${error.message}`);
//     }

//     return response.json();
// }

// export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResponse> {
//     const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
//         method: 'GET',
//         headers: {
//             Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
//         },
//     });

//     if (!response.ok) {
//         const error = await response.json();
//         throw new Error(`Paystack verification failed: ${error.message}`);
//     }

//     return response.json();
// }

