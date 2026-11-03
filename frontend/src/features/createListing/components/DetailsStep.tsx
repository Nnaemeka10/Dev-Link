"use client";

import { useState } from "react";
import { useListingStore } from "../store/useListingStore";
import { EVENT_HALL_TYPES, SERVICE_TYPES } from "../data";
import FloatingInput from "./shared/FloatingInput";
import FloatingTextarea from "./shared/FloatingTextarea";
import TypePickerModal from "./TypePickerModal";
import TagsInput from "./TagsInput";
import LocationSection from "./LocationSection";
import type { ZodType } from "zod";
import { detailsStepSchema } from "../schema/listingSchema";

function getFieldErrors(schema: ZodType, data: unknown): Record<string, string> {
  const result = schema.safeParse(data);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Inline errors appear only after the user tries to leave step 2. */
function useShowLocationErrors() {
  return useListingStore((s) => Boolean(s.attemptedSteps[2]));
}

export default function DetailsStep() {
  const category = useListingStore((s) => s.form.category);
  const details = useListingStore((s) => s.form.details);
  const setListingName = useListingStore((s) => s.setListingName);
  const setDescription = useListingStore((s) => s.setDescription);
  const toggleSelectedType = useListingStore((s) => s.toggleSelectedType);

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  const typeOptions = category === "service" ? SERVICE_TYPES : EVENT_HALL_TYPES;
  const typeLabelLookup = new Map(typeOptions.map((t) => [t.id, t.label]));
  const selectedTypeLabels = details.selectedTypeIds.map((id) => typeLabelLookup.get(id)).filter(Boolean);

  const showErrors = useShowLocationErrors();
  const errors = getFieldErrors(detailsStepSchema, details);

  const modalCopy =
    category === "service"
      ? {
          title: "What services do you offer?",
          description: "Select every service that applies — clients can filter by these.",
        }
      : {
          title: "What type of event hall is this?",
          description: "Select every event type this space is suited for.",
        };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10 md:mb-14">
        <h2 className="font-man text-3xl font-bold tracking-tight text-text-primary md:text-5xl">
          Tell us about<br />your listing.
        </h2>
        <p className="mt-4 text-base text-text-primary/60 md:text-lg">
          Craft a compelling narrative for your venue or service. This is your chance to shine in the marketplace.
        </p>
      </div>

      <div className="space-y-7">
        <FloatingInput
          id="listing-name"
          label="Listing Name"
          placeholder="e.g. The Grand Orchid Hall"
          value={details.name}
          required
          onChange={(e) => setListingName(e.target.value)}
          error={showErrors ? errors.name : undefined}
        />

        {category && (
          <div className="space-y-2.5">
            <label className="block text-sm font-semibold text-text-primary">
              {category === "service" ? "Services Offered" : "Event Hall Type"}
            </label>
            <button
              type="button"
              onClick={() => setIsTypeModalOpen(true)}
              className="flex w-full flex-wrap items-center gap-2 rounded-input bg-bg-tertiary px-5 py-4 text-left transition-shadow focus:ring-2 focus:ring-accent-primary/25"
            >
              {selectedTypeLabels.length === 0 ? (
                <span className="text-base text-text-primary/40">{modalCopy.title}</span>
              ) : (
                selectedTypeLabels.map((label) => (
                  <span key={label} className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-text-primary">
                    {label}
                  </span>
                ))
              )}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="ml-auto shrink-0 text-text-primary/40">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        <FloatingTextarea
          id="description"
          label="Detailed Description"
          placeholder="Describe the ambiance, key features, and what makes this listing truly special..."
          value={details.description} 
          required
          onChange={(e) => setDescription(e.target.value)}
          error={showErrors ? errors.description : undefined}
        />

        <TagsInput />

        {category && (
          <div className="border-t border-black/5 pt-7">
            <LocationSection category={category} />
          </div>
        )}
      </div>

      {category && (
        <TypePickerModal
          isOpen={isTypeModalOpen}
          onClose={() => setIsTypeModalOpen(false)}
          title={modalCopy.title}
          description={modalCopy.description}
          options={typeOptions}
          selectedIds={details.selectedTypeIds}
          onToggle={toggleSelectedType}
        />
      )}
    </div>
  );
}