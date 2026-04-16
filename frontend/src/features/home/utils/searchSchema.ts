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
export const searchSchema = z.object({
  category: z.enum(["halls", "services"]),

  location: z
    .string()
    .transform((v) => v.replace(/[<>"'`]/g, "").trim())
    .refine((v) => v.length === 0 || v.length >= 2, "Enter at least 2 characters"),

  // undefined = no date filter applied
  dateRange: dateRangeSchema.optional(),
});

export type SearchFormData = z.infer<typeof searchSchema>;
