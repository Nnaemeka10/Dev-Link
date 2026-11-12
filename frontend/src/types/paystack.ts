declare module "@paystack/inline-js" {
  export interface CheckoutOptions {
    key?: string;
    email?: string;
    amount?: number;
    currency?: string;
    reference?: string;
    accessCode?: string;
    onSuccess?: (transaction: unknown) => void;
    onCancel?: () => void;
    onError?: (error: unknown) => void;
    onLoad?: () => void;
  }

  export interface PaystackTransaction {
    id: string;
    [key: string]: unknown;
  }

  export default class Paystack {
    constructor();
    checkout(options: CheckoutOptions): PaystackTransaction;
    newTransaction(options: CheckoutOptions): PaystackTransaction;
    resumeTransaction(accessCode: string, options?: CheckoutOptions): PaystackTransaction;
    /** Closes the checkout iframe. Accepts the transaction or its id. */
    cancelTransaction(transaction: PaystackTransaction | string): void;
  }
}