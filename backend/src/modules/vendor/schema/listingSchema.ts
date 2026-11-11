import { z } from "zod";

/**
 * Two layers of validation live here:
 *
 * 1. STRICT per-step schemas - used by the wizard for inline field errors.
 * 2. LAX publish shapes + a category-aware superRefine — used by
 *    listingSubmitSchema on the server.
 *
 * The split exists because the wizard carries BOTH location objects in one
 * payload for the whole session. The object belonging to the OTHER category
 * is never filled in, so it arrives at publish time at its initial values:
 *
 *   hallLocation:    { stateId: null, lgaId: null, streetAddress: "" }
 *   serviceLocation: { businessAddress: "", coverageMode: "statewide",
 *                      coverageStateIds: [], deselectedLgaIdsByState: {} }
 *
 * A strict shape on the inactive object rejects the whole submission. The lax
 * shapes accept it untouched, and superRefine enforces the real requirement
 * for the category actually being published.
 */

export const categoryStepSchema = z.object({
  category: z.enum(["hall", "service"], {
    message: "Select a category to continue",
  }),
});

export const hallLocationSchema = z.object({
  stateId: z.string().min(1, "Select a state"),
  lgaId: z.string().min(1, "Select a local government"),
  streetAddress: z.string().trim().min(5, "Enter a street address"),
});

export const serviceLocationSchema = z.object({
  businessAddress: z.string().trim().min(5, "Enter a business address"),
  coverageMode: z.enum(["statewide", "lga"]),
  coverageStateIds: z.array(z.string()).min(1, "Select at least one area you cover"),
  deselectedLgaIdsByState: z.record(z.string(), z.array(z.string())),
});

const hallLocationLax = z.object({
  stateId: z.string().nullable(),
  lgaId: z.string().nullable(),
  streetAddress: z.string(),
});

const serviceLocationLax = z.object({
  businessAddress: z.string(),
  coverageMode: z.enum(["statewide", "lga"]),
  coverageStateIds: z.array(z.string()),
  deselectedLgaIdsByState: z.record(z.string(), z.array(z.string())),
});

export const detailsStepSchema = z.object({
  name: z.string().trim().min(3, "Listing name must be at least 3 characters").max(80),
  description: z
    .string()
    .trim()
    .min(30, "Tell clients a bit more, at least 30 characters")
    .max(2000),
  selectedTypeIds: z.array(z.string()).min(1, "Select at least one type"),
  tags: z.array(z.string().trim().min(1).max(24)).max(5, "Up to 5 tags only"),
  hallLocation: hallLocationSchema.optional(),
  serviceLocation: serviceLocationSchema.optional(),
});

const detailsPublishSchema = detailsStepSchema.extend({
  hallLocation: hallLocationLax.optional(),
  serviceLocation: serviceLocationLax.optional(),
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
    .refine(
      (text) => text.split(/\s+/).filter(Boolean).length <= 20,
      "Keep custom requirements under 20 words",
    ),
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
      }),
    )
    .min(5, "Upload at least 5 photos"),
});

const pricingPackageSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Name this package"),
  price: z.number().positive("Enter a price above ₦0"),
  isPopular: z.boolean(),
  description: z.string().trim().min(1, "Add a short description"),
  perks: z
    .array(z.object({ id: z.string(), label: z.string().trim().min(1) }))
    .min(1, "Add at least one perk"),
});

/**
 * basePrice is nullable on purpose: a service using packages may leave the
 * Standard Rate empty. VendorListing.processDraftPayload then derives
 * listings.base_price_kobo from MIN(service_packages.price_kobo) so price
 * filtering and price sorting still work.
 */
export const pricingStepSchema = z
  .object({
    basePrice: z.number().positive().nullable(),
    billingCycle: z.literal("day"),
    usesPackages: z.boolean(),
    packages: z.array(pricingPackageSchema),
    availability: z.object({ blockedDates: z.array(z.string()) }),
  })
  .refine(
    (pricing) => (pricing.usesPackages ? pricing.packages.length > 0 : pricing.basePrice !== null),
    { message: "Set a base price, or add at least one package" },
  );

export const listingSubmitSchema = z
  .object({
    category: categoryStepSchema.shape.category,
    details: detailsPublishSchema,
    amenities: z.array(selectedAmenitySchema),
    requirements: z.array(selectedRequirementSchema),
    customRequirements: z.array(customRequirementSchema),
    gallery: galleryStepSchema.shape.gallery,
    pricing: pricingStepSchema,
  })
  .superRefine((payload, ctx) => {
    if (payload.category === "hall") {
      const loc = payload.details.hallLocation;
      if (!loc || !loc.stateId || !loc.lgaId || (loc.streetAddress ?? "").trim().length < 5) {
        ctx.addIssue({
          code: "custom",
          path: ["details", "hallLocation"],
          message: "Complete the venue address (state, LGA and street address)",
        });
      }
      // Halls owe no business address / coverage areas.
      return;
    }

    const loc = payload.details.serviceLocation;
    if (!loc) {
      ctx.addIssue({
        code: "custom",
        path: ["details", "serviceLocation"],
        message: "Complete your service location details",
      });
      return;
    }
    if (!loc.businessAddress || loc.businessAddress.trim().length < 5) {
      ctx.addIssue({
        code: "custom",
        path: ["details", "serviceLocation", "businessAddress"],
        message: "Enter a business address",
      });
    }
    if (loc.coverageStateIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["details", "serviceLocation", "coverageStateIds"],
        message: "Select at least one area you cover",
      });
    }
  });

export type ListingSubmitInput = z.infer<typeof listingSubmitSchema>;