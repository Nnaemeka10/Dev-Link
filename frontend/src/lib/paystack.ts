import type Paystack from "@paystack/inline-js";

let popup: InstanceType<typeof Paystack> | null = null;
let loadingPromise: Promise<InstanceType<typeof Paystack>> | null = null;

export async function getPaystack(): Promise<InstanceType<typeof Paystack>> {
  if (popup) {
    return popup;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = import("@paystack/inline-js").then(({ default: Paystack }) => {
    popup = new Paystack();
    return popup;
  });

  return loadingPromise;
}