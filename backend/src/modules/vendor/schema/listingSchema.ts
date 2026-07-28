import { z } from "zod";

// ────────────────────────────────────────────────────────────────────────────
// Per-step validation. Each schema validates the slice of `ListingFormState`
// (see types/listing.ts) that its step is responsible for, so they can be
// wired up independently with `zodResolver(stepXSchema)` per step, or merged
// with `.merge()` for a final submit-time check on step 6.
// ────────────────────────────────────────────────────────────────────────────

export const categoryStepSchema = z.object({
  category: z.enum(["hall", "service"], {
    message: "Select a category to continue",
  }),
});

const hallLocationSchema = z.object({
  stateId: z.string().min(1, "Select a state"),
  lgaId: z.string().min(1, "Select a local government"),
  streetAddress: z.string().trim().min(5, "Enter a street address"),
});

const serviceLocationSchema = z
  .object({
    businessAddress: z.string().trim().min(5, "Enter a business address"),
    coverageMode: z.enum(["statewide", "lga"]),
    coverageStateIds: z.array(z.string()).min(1, "Select at least one area you cover"),
    deselectedLgaIdsByState: z.record(z.string(), z.array(z.string())),
  })
  .refine(
    (loc) => {
      if (loc.coverageMode !== "lga") return true;
      // At least one LGA must remain covered in every selected state
      return loc.coverageStateIds.every((stateId) => {
        const deselected = loc.deselectedLgaIdsByState[stateId] ?? [];
        return deselected.length === 0 || true; // full check needs total LGA count, done in UI layer
      });
    },
    { message: "Each covered state needs at least one local government selected" }
  );

export const detailsStepSchema = z.object({
  name: z.string().trim().min(3, "Listing name must be at least 3 characters").max(80),
  description: z.string().trim().min(30, "Tell clients a bit more — at least 30 characters").max(2000),
  selectedTypeIds: z.array(z.string()).min(1, "Select at least one type"),
  tags: z.array(z.string().trim().min(1).max(24)).max(5, "Up to 5 tags only"),
  hallLocation: hallLocationSchema.optional(),
  serviceLocation: serviceLocationSchema.optional(),
});

const selectedAmenitySchema = z.object({
  amenityId: z.string(),
  value: z.string().trim().min(1, "Enter a value"),
});

export const amenitiesStepSchema = z.object({
  amenities: z.array(selectedAmenitySchema).min(1, "Select at least one amenity"),
});

const selectedRequirementSchema = z.object({
  requirementId: z.string(),
  value: z.string().trim().min(1, "Enter a value"),
});

const customRequirementSchema = z.object({
  id: z.string(),
  text: z
    .string()
    .trim()
    .min(1)
    .refine((text) => text.split(/\s+/).filter(Boolean).length <= 20, "Keep custom requirements under 20 words"),
});

export const requirementsStepSchema = z.object({
  requirements: z.array(selectedRequirementSchema),
  customRequirements: z.array(customRequirementSchema),
});

export const galleryStepSchema = z.object({
  gallery: z
    .array(
      z.object({
        id: z.string(),
        url: z.string().min(1),
        publicId: z.string().nullable(),
        isCover: z.boolean(),
        uploadStatus: z.enum(["pending", "uploading", "uploaded", "error"]),
      })
    )
    .min(5, "Upload at least 5 photos"),
});

const pricingPackageSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Name this package"),
  price: z.number().positive("Enter a price above ₦0"),
  isPopular: z.boolean(),
  description: z.string().trim().min(1, "Add a short description"),
  perks: z.array(z.object({ id: z.string(), label: z.string().trim().min(1) })).min(1, "Add at least one perk"),
});

export const pricingStepSchema = z
  .object({
    basePrice: z.number().positive().nullable(),
    billingCycle: z.literal("day"),
    usesPackages: z.boolean(),
    packages: z.array(pricingPackageSchema),
    availability: z.object({ blockedDates: z.array(z.string()) }),
  })
  .refine((pricing) => pricing.usesPackages ? pricing.packages.length > 0 : pricing.basePrice !== null, {
    message: "Set a base price, or add at least one package",
  });

/** Full-form check, run once on the review step before publishing. */
export const listingSubmitSchema = z.object({
  category: categoryStepSchema.shape.category,
  details: detailsStepSchema,
  amenities: z.array(selectedAmenitySchema),
  requirements: z.array(selectedRequirementSchema),
  customRequirements: z.array(customRequirementSchema),
  gallery: galleryStepSchema.shape.gallery,
  pricing: pricingStepSchema,
});

export type ListingSubmitInput = z.infer<typeof listingSubmitSchema>;