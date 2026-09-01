import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  AvailabilityState,
  CustomRequirement,
  GalleryPhoto,
  ListingCategory,
  ListingFormState,
  PricingPackage,
  SelectedAmenity,
  SelectedRequirement,
  StepNumber,
} from "../types/listing";
import { TOTAL_STEPS } from "../types/listing";

// ────────────────────────────────────────────────────────────────────────────
// Initial state — one object per domain slice, composed into the full form.
// Keeping each slice's shape here (rather than scattered defaults inline)
// is what makes `resetForm` a one-liner instead of a maintenance trap.
// ────────────────────────────────────────────────────────────────────────────

const initialDetails: ListingFormState["details"] = {
  name: "",
  description: "",
  selectedTypeIds: [],
  tags: [],
  hallLocation: { stateId: null, lgaId: null, streetAddress: "" },
  serviceLocation: {
    businessAddress: "",
    coverageMode: "statewide",
    coverageStateIds: [],
    deselectedLgaIdsByState: {},
  },
};

const initialAvailability: AvailabilityState = { blockedDates: [] };

const initialPricing: ListingFormState["pricing"] = {
  basePrice: null,
  billingCycle: "day",
  usesPackages: false,
  packages: [],
  availability: initialAvailability,
};

const initialFormState: ListingFormState = {
  category: null,
  details: initialDetails,
  amenities: [],
  requirements: [],
  customRequirements: [],
  gallery: [],
  pricing: initialPricing,
};

// ────────────────────────────────────────────────────────────────────────────
// Store shape — state + actions, grouped by the step that owns them.
// ────────────────────────────────────────────────────────────────────────────

interface ListingStore {
  listingId: string | null;
  currentStep: StepNumber;
  form: ListingFormState;

  // Navigation
  goToStep: (step: StepNumber) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Step 1 — Category
  setCategory: (category: ListingCategory) => void;

  // Step 2 — Details
  setListingId: (id: string | null) => void;
  setListingName: (name: string) => void;
  setDescription: (description: string) => void;
  toggleSelectedType: (typeId: string) => void;
  setTags: (tags: string[]) => void;
  setHallState: (stateId: string | null) => void;
  setHallLga: (lgaId: string | null) => void;
  setHallStreetAddress: (address: string) => void;
  setServiceBusinessAddress: (address: string) => void;
  setServiceCoverageMode: (mode: "statewide" | "lga") => void;
  toggleServiceCoverageState: (stateId: string) => void;
  toggleServiceCoverageLga: (stateId: string, lgaId: string) => void;

  // Step 3 — Amenities (halls) / Requirements (services)
  setAmenityValue: (amenityId: string, value: string) => void;
  removeAmenity: (amenityId: string) => void;
  setRequirementValue: (requirementId: string, value: string) => void;
  removeRequirement: (requirementId: string) => void;
  addCustomRequirement: (text: string) => void;
  removeCustomRequirement: (id: string) => void;

  // Step 4 — Gallery
  addPhotos: (photos: GalleryPhoto[]) => void;
  updatePhoto: (id: string, patch: Partial<GalleryPhoto>) => void;
  removePhoto: (id: string) => void;
  setCoverPhoto: (id: string) => void;

  // Step 5 — Pricing & availability
  setBasePrice: (price: number | null) => void;
  setUsesPackages: (uses: boolean) => void;
  addPackage: (pkg: PricingPackage) => void;
  updatePackage: (id: string, patch: Partial<PricingPackage>) => void;
  removePackage: (id: string) => void;
  toggleBlockedDate: (isoDate: string) => void;

  hydrateFromDraft: (listingId: string, draft: ListingFormState | null, fallbackCategory?: ListingCategory) => void;

  // Root
  resetForm: () => void;
}

export const useListingStore = create<ListingStore>()(
  devtools(
    persist(
      (set) => ({
        listingId: null,
        currentStep: 1,
        form: initialFormState,
        setListingId: (id) => set({ listingId: id }, false, "setListingId"),

        // ── Navigation ──────────────────────────────────────────────────────
        goToStep: (step) => set({ currentStep: step }, false, "goToStep"),
        nextStep: () =>
          set(
            (s) => ({ currentStep: Math.min(TOTAL_STEPS, s.currentStep + 1) as StepNumber }),
            false,
            "nextStep"
          ),
        prevStep: () =>
          set((s) => ({ currentStep: Math.max(1, s.currentStep - 1) as StepNumber }), false, "prevStep"),

        // ── Step 1 ──────────────────────────────────────────────────────────
        setCategory: (category) =>
          set((s) => ({ form: { ...s.form, category } }), false, "setCategory"),

        // ── Step 2 ──────────────────────────────────────────────────────────
        setListingName: (name) =>
          set((s) => ({ form: { ...s.form, details: { ...s.form.details, name } } }), false, "setListingName"),

        setDescription: (description) =>
          set(
            (s) => ({ form: { ...s.form, details: { ...s.form.details, description } } }),
            false,
            "setDescription"
          ),

        toggleSelectedType: (typeId) =>
          set(
            (s) => {
              const current = s.form.details.selectedTypeIds;
              const selectedTypeIds = current.includes(typeId)
                ? current.filter((id) => id !== typeId)
                : [...current, typeId];
              return { form: { ...s.form, details: { ...s.form.details, selectedTypeIds } } };
            },
            false,
            "toggleSelectedType"
          ),

        setTags: (tags) =>
          set(
            (s) => ({ form: { ...s.form, details: { ...s.form.details, tags: tags.slice(0, 5) } } }),
            false,
            "setTags"
          ),

        setHallState: (stateId) =>
          set(
            (s) => ({
              form: {
                ...s.form,
                details: {
                  ...s.form.details,
                  // Changing state invalidates the previously selected LGA
                  hallLocation: { ...s.form.details.hallLocation, stateId, lgaId: null },
                },
              },
            }),
            false,
            "setHallState"
          ),

        setHallLga: (lgaId) =>
          set(
            (s) => ({
              form: {
                ...s.form,
                details: { ...s.form.details, hallLocation: { ...s.form.details.hallLocation, lgaId } },
              },
            }),
            false,
            "setHallLga"
          ),

        setHallStreetAddress: (streetAddress) =>
          set(
            (s) => ({
              form: {
                ...s.form,
                details: {
                  ...s.form.details,
                  hallLocation: { ...s.form.details.hallLocation, streetAddress },
                },
              },
            }),
            false,
            "setHallStreetAddress"
          ),

        setServiceBusinessAddress: (businessAddress) =>
          set(
            (s) => ({
              form: {
                ...s.form,
                details: {
                  ...s.form.details,
                  serviceLocation: { ...s.form.details.serviceLocation, businessAddress },
                },
              },
            }),
            false,
            "setServiceBusinessAddress"
          ),

        setServiceCoverageMode: (coverageMode) =>
          set(
            (s) => ({
              form: {
                ...s.form,
                details: {
                  ...s.form.details,
                  serviceLocation: { ...s.form.details.serviceLocation, coverageMode },
                },
              },
            }),
            false,
            "setServiceCoverageMode"
          ),

        toggleServiceCoverageState: (stateId) =>
          set(
            (s) => {
              const loc = s.form.details.serviceLocation;
              const isSelected = loc.coverageStateIds.includes(stateId);
              const coverageStateIds = isSelected
                ? loc.coverageStateIds.filter((id) => id !== stateId)
                : [...loc.coverageStateIds, stateId];
              // Dropping a state clears its per-LGA deselection bookkeeping
              const deselectedLgaIdsByState = { ...loc.deselectedLgaIdsByState };
              if (isSelected) delete deselectedLgaIdsByState[stateId];
              return {
                form: {
                  ...s.form,
                  details: {
                    ...s.form.details,
                    serviceLocation: { ...loc, coverageStateIds, deselectedLgaIdsByState },
                  },
                },
              };
            },
            false,
            "toggleServiceCoverageState"
          ),

        /** LGAs start selected (covered) by default — toggling adds/removes them from the deselected list. */
        toggleServiceCoverageLga: (stateId, lgaId) =>
          set(
            (s) => {
              const loc = s.form.details.serviceLocation;
              const currentlyDeselected = loc.deselectedLgaIdsByState[stateId] ?? [];
              const isDeselected = currentlyDeselected.includes(lgaId);
              const nextForState = isDeselected
                ? currentlyDeselected.filter((id) => id !== lgaId)
                : [...currentlyDeselected, lgaId];
              return {
                form: {
                  ...s.form,
                  details: {
                    ...s.form.details,
                    serviceLocation: {
                      ...loc,
                      deselectedLgaIdsByState: { ...loc.deselectedLgaIdsByState, [stateId]: nextForState },
                    },
                  },
                },
              };
            },
            false,
            "toggleServiceCoverageLga"
          ),

        // ── Step 3 ──────────────────────────────────────────────────────────
        setAmenityValue: (amenityId, value) =>
          set(
            (s) => {
              const exists = s.form.amenities.some((a) => a.amenityId === amenityId);
              const amenities: SelectedAmenity[] = exists
                ? s.form.amenities.map((a) => (a.amenityId === amenityId ? { ...a, value } : a))
                : [...s.form.amenities, { amenityId, value }];
              return { form: { ...s.form, amenities } };
            },
            false,
            "setAmenityValue"
          ),

        removeAmenity: (amenityId) =>
          set(
            (s) => ({ form: { ...s.form, amenities: s.form.amenities.filter((a) => a.amenityId !== amenityId) } }),
            false,
            "removeAmenity"
          ),

        setRequirementValue: (requirementId, value) =>
          set(
            (s) => {
              const exists = s.form.requirements.some((r) => r.requirementId === requirementId);
              const requirements: SelectedRequirement[] = exists
                ? s.form.requirements.map((r) => (r.requirementId === requirementId ? { ...r, value } : r))
                : [...s.form.requirements, { requirementId, value }];
              return { form: { ...s.form, requirements } };
            },
            false,
            "setRequirementValue"
          ),

        removeRequirement: (requirementId) =>
          set(
            (s) => ({
              form: {
                ...s.form,
                requirements: s.form.requirements.filter((r) => r.requirementId !== requirementId),
              },
            }),
            false,
            "removeRequirement"
          ),

        addCustomRequirement: (text) =>
          set(
            (s) => {
              const requirement: CustomRequirement = { id: `custom_${Date.now()}`, text };
              return { form: { ...s.form, customRequirements: [...s.form.customRequirements, requirement] } };
            },
            false,
            "addCustomRequirement"
          ),

        removeCustomRequirement: (id) =>
          set(
            (s) => ({
              form: { ...s.form, customRequirements: s.form.customRequirements.filter((r) => r.id !== id) },
            }),
            false,
            "removeCustomRequirement"
          ),

        // ── Step 4 ──────────────────────────────────────────────────────────
        addPhotos: (photos) =>
          set(
            (s) => {
              const gallery = [...s.form.gallery, ...photos];
              // First photo added becomes the cover if none is set yet
              const hasCover = gallery.some((p) => p.isCover);
              if (!hasCover && gallery.length > 0) gallery[0] = { ...gallery[0], isCover: true };
              return { form: { ...s.form, gallery } };
            },
            false,
            "addPhotos"
          ),

        updatePhoto: (id, patch) =>
          set(
            (s) => ({
              form: { ...s.form, gallery: s.form.gallery.map((p) => (p.id === id ? { ...p, ...patch } : p)) },
            }),
            false,
            "updatePhoto"
          ),

        removePhoto: (id) =>
          set(
            (s) => {
              const removingCover = s.form.gallery.find((p) => p.id === id)?.isCover;
              const gallery = s.form.gallery.filter((p) => p.id !== id);
              if (removingCover && gallery.length > 0) gallery[0] = { ...gallery[0], isCover: true };
              return { form: { ...s.form, gallery } };
            },
            false,
            "removePhoto"
          ),

        setCoverPhoto: (id) =>
          set(
            (s) => ({
              form: { ...s.form, gallery: s.form.gallery.map((p) => ({ ...p, isCover: p.id === id })) },
            }),
            false,
            "setCoverPhoto"
          ),

        // ── Step 5 ──────────────────────────────────────────────────────────
        setBasePrice: (basePrice) =>
          set((s) => ({ form: { ...s.form, pricing: { ...s.form.pricing, basePrice } } }), false, "setBasePrice"),

        setUsesPackages: (usesPackages) =>
          set(
            (s) => ({ form: { ...s.form, pricing: { ...s.form.pricing, usesPackages } } }),
            false,
            "setUsesPackages"
          ),

        addPackage: (pkg) =>
          set(
            (s) => ({
              form: { ...s.form, pricing: { ...s.form.pricing, packages: [...s.form.pricing.packages, pkg] } },
            }),
            false,
            "addPackage"
          ),

        updatePackage: (id, patch) =>
          set(
            (s) => ({
              form: {
                ...s.form,
                pricing: {
                  ...s.form.pricing,
                  packages: s.form.pricing.packages.map((p) => (p.id === id ? { ...p, ...patch } : p)),
                },
              },
            }),
            false,
            "updatePackage"
          ),

        removePackage: (id) =>
          set(
            (s) => ({
              form: {
                ...s.form,
                pricing: { ...s.form.pricing, packages: s.form.pricing.packages.filter((p) => p.id !== id) },
              },
            }),
            false,
            "removePackage"
          ),

        toggleBlockedDate: (isoDate) =>
          set(
            (s) => {
              const current = s.form.pricing.availability.blockedDates;
              const blockedDates = current.includes(isoDate)
                ? current.filter((d) => d !== isoDate)
                : [...current, isoDate];
              return {
                form: { ...s.form, pricing: { ...s.form.pricing, availability: { blockedDates } } },
              };
            },
            false,
            "toggleBlockedDate"
          ),

        hydrateFromDraft: (listingId, draft, fallbackCategory) =>
          set((state) => ({
            listingId,
            // Spread over the fresh form so fields added to ListingFormState later
            // still get their defaults when loading older drafts
            form: draft
              ? { ...state.form, ...draft }
              : { ...state.form, category: fallbackCategory ?? state.form.category },
        })),

        // ── Root ────────────────────────────────────────────────────────────
        resetForm: () => set({ listingId: null, currentStep: 1, form: initialFormState }, false, "resetForm"),
      }),
      { name: "eventvnv-create-listing",
        partialize: (state) => ({ listingId: state.listingId, form: state.form }),
      }
    )
  )
);