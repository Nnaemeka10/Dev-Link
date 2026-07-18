import { ENV } from '../../../lib/env.js';
import type { PaystackInitializeResponse, PaystackVerifyResponse } from '../types/payment.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export async function initializePaystackTransaction(
    email: string, 
    amountInNaira: number, 
    reference: string
): Promise<PaystackInitializeResponse> {
    
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            amount: Math.round(amountInNaira * 100), // Convert Naira to Kobo
            reference,
            callback_url: `${ENV.CLIENT_URL}/bookings/callback`, // Where Paystack redirects after payment
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Paystack initialization failed: ${error.message}`);
    }

    return response.json();
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Paystack verification failed: ${error.message}`);
    }

    return response.json();
}