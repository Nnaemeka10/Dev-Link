import type { ListingCategory, StepNumber } from "../../types/listing";

export interface StepMeta {
  step: StepNumber;
  label: string;
  icon: string;
}

export function getStepMeta(category: ListingCategory | null): StepMeta[] {
  return [
    { step: 1, label: "Category", icon: "category" },
    { step: 2, label: "Details", icon: "edit_note" },
    { step: 3, label: category === "service" ? "Requirements" : "Amenities", icon: "checklist" },
    { step: 4, label: "Gallery", icon: "photo_library" },
    { step: 5, label: "Pricing", icon: "payments" },
    { step: 6, label: "Review", icon: "rate_review" },
  ];
}