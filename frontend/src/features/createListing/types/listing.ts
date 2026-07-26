// ────────────────────────────────────────────────────────────────────────────
// Create Listing — domain types
// Single source of truth for the shape of a listing draft as it's built up
// across the 6-step wizard. Mirrors what the backend will eventually receive
// on submit, plus a few UI-only fields (marked below) that never leave the
// client.
// ────────────────────────────────────────────────────────────────────────────

export type ListingCategory = "hall" | "service";

/** Both hall and service pricing are per-day only (see Step 5 corrections). */
export type BillingCycle = "day";

export const TOTAL_STEPS = 6 as const;
export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6;

// ── Reference data (backend-owned, mocked in /data) ──────────────────────────

export interface EventHallType {
  id: string;
  label: string;
  icon: string; // Material Symbols icon name
}

export interface ServiceType {
  id: string;
  label: string;
  icon: string;
}

export interface NigeriaState {
  id: string;
  name: string;
}

export interface LocalGovernment {
  id: string;
  stateId: string;
  name: string;
}

// ── Step 2: Details ───────────────────────────────────────────────────────

export interface HallLocation {
  stateId: string | null;
  lgaId: string | null;
  streetAddress: string;
}

/**
 * Service providers don't operate from one address — they cover an area.
 * `coverageMode` decides whether `coverageStateIds` is treated as "the vendor
 * covers these whole states" or "the vendor covers specific LGAs within
 * these states". When a state is added under LGA mode, every LGA in it is
 * considered covered by default — `deselectedLgaIdsByState` tracks the ones
 * the vendor has explicitly opted out of, so the payload only grows when
 * someone narrows their coverage.
 */
export interface ServiceLocation {
  businessAddress: string;
  coverageMode: "statewide" | "lga";
  coverageStateIds: string[];
  deselectedLgaIdsByState: Record<string, string[]>;
}

export interface ListingDetails {
  name: string;
  description: string;
  /** Selected EventHallType ids (hall) or ServiceType ids (service). */
  selectedTypeIds: string[];
  /** Up to 5 free-text tags. Optional. */
  tags: string[];
  hallLocation: HallLocation;
  serviceLocation: ServiceLocation;
}

// ── Step 3: Amenities (halls) / Requirements (services) ──────────────────

export type AttributeValueKind = "number" | "text" | "duration";

export interface AmenityDefinition {
  id: string;
  label: string;
  icon: string;
  category: string;
  valueKind: AttributeValueKind;
  unit?: string;
  placeholder?: string;
}

export interface SelectedAmenity {
  amenityId: string;
  value: string;
}

export interface RequirementDefinition {
  id: string;
  label: string;
  category: string;
  valueKind: AttributeValueKind;
  unit?: string;
  placeholder?: string;
  /** Empty array = applies to every service type. */
  applicableServiceTypeIds: string[];
  isCompulsory?: boolean;
}

export interface SelectedRequirement {
  requirementId: string;
  value: string;
}

export interface CustomRequirement {
  id: string;
  /** Max 20 words, enforced in the UI. */
  text: string;
}

// ── Step 4: Gallery ───────────────────────────────────────────────────────

export interface GalleryPhoto {
  id: string;
  /** Cloudinary secure_url once uploaded; blob preview URL while pending. */
  url: string;
  /** Cloudinary public_id — null until the signed upload resolves. */
  publicId: string | null;
  isCover: boolean;
  label?: string;
  /** UI-only upload progress, not sent to the backend. */
  uploadStatus: "pending" | "uploading" | "uploaded" | "error";
}

// ── Step 5: Pricing & availability ────────────────────────────────────────

export interface PricingPackagePerk {
  id: string;
  label: string;
}

export interface PricingPackage {
  id: string;
  name: string;
  price: number;
  isPopular: boolean;
  description: string;
  perks: PricingPackagePerk[];
}

/** A starting-point package a vendor can one-tap-apply, then edit, in the package builder. */
export interface PackagePreset {
  name: string;
  price: number;
  description: string;
  perks: string[];
  isPopular?: boolean;
}

export interface AvailabilityState {
  /** ISO date strings (YYYY-MM-DD) the vendor has manually blocked. */
  blockedDates: string[];
}

export interface PricingState {
  basePrice: number | null;
  billingCycle: BillingCycle;
  /** Services only — vendor opts into tiered packages instead of/alongside a base price. */
  usesPackages: boolean;
  packages: PricingPackage[];
  availability: AvailabilityState;
}

// ── Root form state ───────────────────────────────────────────────────────

export interface ListingFormState {
  category: ListingCategory | null;
  details: ListingDetails;
  amenities: SelectedAmenity[];
  requirements: SelectedRequirement[];
  customRequirements: CustomRequirement[];
  gallery: GalleryPhoto[];
  pricing: PricingState;
}

export type ListingPublishStatus = "draft" | "active";