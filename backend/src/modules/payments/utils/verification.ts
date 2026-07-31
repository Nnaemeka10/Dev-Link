
import { ENV } from '../../../lib/env.js';
import type { IdType } from '../types/verification.js';
import { getDB } from '../../../lib/db.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Helper for standard Paystack API requests
async function paystackRequest<T>(endpoint: string, method: string, body?: any): Promise<T> {
    const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
        method,
        headers: {
            Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    // Safely parse JSON: Paystack sometimes returns empty bodies for async dispatches
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
        throw new Error(`Paystack API Error (${endpoint}): ${data.message || response.statusText}`);
    }
    return data as T;
}

/** Step 1: Resolve bank account to get account name */
export async function resolveBankAccount(accountNumber: string, bankCode: string): Promise<{ account_name: string }> {
    console.log(accountNumber, bankCode);
    const res = await paystackRequest<any>(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, 'GET');
    console.log('Bank account resolution response:', res);
    
    if (!res.status) throw new Error('Could not verify this account number.');
    return { account_name: res.data.account_name };
}

/** Helper: Get or create Paystack Customer Code for ID validation */
export async function getOrCreatePaystackCustomer(userId: number, email: string, firstName: string, lastName: string): Promise<string> {
    const db = getDB();
    const userRes = await db.query('SELECT paystack_customer_code FROM users WHERE id = $1', [userId]);
    
    if (userRes.rows[0].paystack_customer_code) {
        return userRes.rows[0].paystack_customer_code;
    }

    // If missing, create on Paystack
    const res = await paystackRequest<any>('/customer', 'POST', {
        email,
        first_name: firstName,
        last_name: lastName,
        country: 'NG'
    });
    
    const customerCode = res.data.customer_code;

    // Persist the new customer code to the database immediately
    await db.query('UPDATE users SET paystack_customer_code = $1, updated_at = NOW() WHERE id = $2', [customerCode, userId]);
    
    return customerCode;
}

/**
 * Step 3: Dispatch Government ID check (BVN/NIN) for Nigeria.
 * Uses type: "bank_account" and passes the BVN as required by Paystack NG documentation.
 */
export async function dispatchIdentityVerification(
    customerCode: string, 
    firstName: string,
    lastName: string,
    bvn: string, 
    bankCode: string, 
    accountNumber: string
): Promise<void> {
    await paystackRequest<any>(`/customer/${customerCode}/identification`, 'POST', {
        country: 'NG',
        type: 'bank_account',
        account_number: accountNumber,
        bvn: bvn,
        bank_code: bankCode,
        first_name: firstName,
        last_name: lastName
    });
}
// /** Step 3: Dispatch Government ID check (BVN/NIN) - Fire and forget */
// export async function dispatchIdentityVerification(customerCode: string, idType: IdType, idNumber: string): Promise<void> {
//     await paystackRequest<any>('/customer/validate', 'POST', {
//         customer: customerCode,
//         country: 'NG',
//         type: idType,
//         value: idNumber,
//     });
// }




/** Utility: Fetch bank list for directory caching (Weekly cron) */
export async function fetchPaystackBanks(): Promise<any[]> {
    const res = await paystackRequest<any>(`/bank?country=NG`, 'GET');
    return res.data || [];
}