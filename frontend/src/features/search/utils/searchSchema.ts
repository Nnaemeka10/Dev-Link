import { z } from "zod";

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
    { message: "Start date must be today or in the future", path: ["from"] }
  );

export type DateRange = z.infer<typeof dateRangeSchema>;

const cleanText = (v: string) => v.replace(/[<>"'`]/g, "").trim();
const minTwo = (v: string) => v.length === 0 || v.length >= 2;

export const searchSchema = z
  .object({
    category: z.enum(["halls", "services"]),

    location: z.string().transform(cleanText).refine(minTwo, "Enter at least 2 characters"),
    coverageArea: z.string().transform(cleanText).refine(minTwo, "Enter at least 2 characters"),

    dateRange: dateRangeSchema.optional(),

    capacity: z.number().min(1).optional(),
    role: z.string().optional(),

    flexible: z.number().int().min(0).max(2),
  })
  .refine(
    (v) => {
      if (v.category === "halls") return !v.role && !v.coverageArea;
      return !v.capacity && !v.location;
    },
    { message: "Invalid field combination for category" }
  );

export type SearchFormData = z.infer<typeof searchSchema>;

export const SEARCH_FORM_DEFAULTS: SearchFormData = {
  category: "halls",
  location: "",
  coverageArea: "",
  dateRange: undefined,
  capacity: undefined,
  role: undefined,
  flexible: 0,
};