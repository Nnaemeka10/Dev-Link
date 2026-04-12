import { z } from "zod";
 
export const searchSchema = z.object({
  category: z.enum(["halls", "services"]),
 
  location: z
    .string()
    .min(2, "Enter at least 2 characters")
    // Strip any chars that could be dangerous in a query string
    .transform((v) => v.replace(/[<>"'`]/g, "").trim()),
 
  // Optional — comes from the date picker as an ISO string
  date: z
    .string()
    .optional()
    .refine(
      (v) => !v || !isNaN(Date.parse(v)),
      "Please enter a valid date"
    )
    .refine(
      (v) => !v || new Date(v) >= new Date(new Date().toDateString()),
      "Date must be today or in the future"
    ),
});
 
export type SearchFormData = z.infer<typeof searchSchema>;