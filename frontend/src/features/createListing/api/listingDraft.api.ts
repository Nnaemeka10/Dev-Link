// src/features/create-listing/api/listingDraft.api.ts
import { apiFetch } from "@/lib/api";
import type { ListingFormState } from "../types/listing";


export async function createDraft(kind: "hall" | "service"): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/vendor/listings", {
    method: "POST",
    body: JSON.stringify({ kind }),
  });
}

export async function autosaveDraft(listingId: string, payload: ListingFormState): Promise<void> {
  // Convert Naira to Kobo before sending to backend
  const pricingPayload = {
    ...payload.pricing,
    basePrice: payload.pricing.basePrice ? Math.round(payload.pricing.basePrice * 100) : null,
    packages: payload.pricing.packages.map((p) => ({
      ...p,
      price: Math.round(p.price * 100),
    })),
  };

  await apiFetch(`/api/vendor/listings/${listingId}/draft`, {
    method: "PATCH",
    body: JSON.stringify({ ...payload, pricing: pricingPayload }),
  });
}

export async function publishListing(listingId: string, payload: ListingFormState): Promise<void> {
  const pricingPayload = {
    ...payload.pricing,
    basePrice: payload.pricing.basePrice ? Math.round(payload.pricing.basePrice * 100) : null,
    packages: payload.pricing.packages.map((p) => ({
      ...p,
      price: Math.round(p.price * 100),
    })),
  };

  await apiFetch(`/api/vendor/listings/${listingId}/publish`, {
    method: "POST",
    body: JSON.stringify({ draft_payload: { ...payload, pricing: pricingPayload } }),
  });
}

export async function signCloudinaryUpload(listingId: string): Promise<{
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}> {
  return apiFetch("/api/vendor/uploads/cloudinary/sign", {
    method: "POST",
    body: JSON.stringify({ listingId }),
  });
}

/**
 * Direct-to-Cloudinary upload via XHR for progress tracking.
 * Must be outside apiFetch because Cloudinary requires FormData, not JSON.
 */
export function uploadToCloudinary(
  file: File,
  listingId: string,
  onProgress: (pct: number) => void
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      const { signature, timestamp, folder, apiKey, cloudName } = await signCloudinaryUpload(listingId);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          resolve({ secure_url: res.secure_url, public_id: res.public_id });
        } else {
          reject(new Error("Upload failed"));
        }
      };
      
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    } catch (error) {
      reject(error);
    }
  });
}