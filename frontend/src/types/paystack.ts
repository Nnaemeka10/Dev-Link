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

  export default class Paystack {
    constructor();

    checkout(options: CheckoutOptions): void;

    resumeTransaction(
      accessCode: string,
      options?: CheckoutOptions
    ): void;
  }
}