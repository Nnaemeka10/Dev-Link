import { z } from "zod";

// ─── Date range shape ──────────────────────────────────────────────────────────
export const dateRangeSchema = z
  .object({
    from: z.date(),
    to: z.date().optional(),
  })
  .refine((v) => !v.to || v.to >= v.from, {
    message: "End date must be on or after the start date",
    path: ["to"],
  })
  .refine(
    (v) => v.from >= new Date(new Date().toDateString()),
    {
      message: "Start date must be today or in the future",
      path: ["from"],
    }
  );

export type DateRange = z.infer<typeof dateRangeSchema>;

// ─── Main search schema ────────────────────────────────────────────────────────
export const searchSchema = z
  .object({
    category: z.enum(["halls", "services"]),

    location: z
      .string()
      .transform((v) => v.replace(/[<>"'`]/g, "").trim())
      .refine((v) => v.length === 0 || v.length >= 2, "Enter at least 2 characters"),

    // undefined = no date filter applied
    dateRange: dateRangeSchema.optional(),

    // Halls only: guest capacity
    capacity: z.number().min(1).optional(),

    // Services only: specific service role
    role: z.string().optional(),
  })
  .refine(
    (v) => {
      // If category is halls, capacity can exist but role should be empty
      if (v.category === "halls") {
        return !v.role;
      }
      // If category is services, role can exist but capacity should be empty
      if (v.category === "services") {
        return !v.capacity;
      }
      return true;
    },
    "Invalid field combination for category"
  );

export type SearchFormData = z.infer<typeof searchSchema>;
