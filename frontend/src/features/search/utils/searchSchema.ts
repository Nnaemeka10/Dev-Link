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

const searchableText = () =>
  z.string().transform(cleanText).refine(minTwo, "Enter at least 2 characters").default("");

export const searchSchema = z.object({
  category: z.enum(["halls", "services"]),

  location: searchableText(),
  coverageArea: searchableText(),

  dateRange: dateRangeSchema.optional(),

  capacity: z.number().min(1).optional(),
  role: z.string().optional(),
  flexible: z.number().int().min(0).max(2).default(0),
});

/**
 * INPUT: what lives in the form state / what the resolver receives.
 * The defaulted fields are optional here - form state may hold undefined
 * (e.g. mid category-switch) and the schema still parses.
 */
export type SearchFormInput = z.input<typeof searchSchema>;

/**
 * OUTPUT: what zodResolver hands to your onSubmit callbacks.
 * Defaults applied and text cleaned - location/coverageArea/flexible
 * are guaranteed present here.
 */
export type SearchFormData = z.output<typeof searchSchema>;

export const SEARCH_FORM_DEFAULTS: SearchFormData = {
  category: "halls",
  location: "",
  coverageArea: "",
  dateRange: undefined,
  capacity: undefined,
  role: undefined,
  flexible: 0,
};