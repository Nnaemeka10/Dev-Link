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