"use client";

import { useState } from "react";
import { useListingStore } from "../store/useListingStore";
import { HALL_AMENITY_CATEGORIES, HALL_AMENITY_DEFINITIONS } from "../data";
import { SERVICE_REQUIREMENT_CATEGORIES, getApplicableRequirements } from "../data";
import type { AmenityDefinition, RequirementDefinition } from "../types/listing";
import AttributeTile from "./shared/AttributeTile";
import AttributeValueModal from "./shared/AttributeValueModal";
import CustomRequirementInput from "./shared/CustomRequirementInput";

export default function AttributesStep() {
  const category = useListingStore((s) => s.form.category);
  const selectedTypeIds = useListingStore((s) => s.form.details.selectedTypeIds);
  const amenities = useListingStore((s) => s.form.amenities);
  const requirements = useListingStore((s) => s.form.requirements);
  const setAmenityValue = useListingStore((s) => s.setAmenityValue);
  const removeAmenity = useListingStore((s) => s.removeAmenity);
  const setRequirementValue = useListingStore((s) => s.setRequirementValue);
  const removeRequirement = useListingStore((s) => s.removeRequirement);

  const [activeAmenity, setActiveAmenity] = useState<AmenityDefinition | null>(null);
  const [activeRequirement, setActiveRequirement] = useState<RequirementDefinition | null>(null);

  const isService = category === "service";
  const applicableRequirements = getApplicableRequirements(selectedTypeIds);

  const heading = isService
    ? "What do you need from clients?"
    : "What amenities do you offer?";
  const subheading = isService
    ? "Set expectations up front — clients see these requirements before they book."
    : "Curate the distinctive features of your space. Select all that apply.";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 max-w-2xl md:mb-14">
        <h2 className="font-man text-3xl font-bold tracking-tight text-text-primary md:text-5xl">{heading}</h2>
        <p className="mt-4 text-base text-text-primary/60 md:text-lg">{subheading}</p>
      </div>

      {isService ? (
        <div className="space-y-12">
          {SERVICE_REQUIREMENT_CATEGORIES.map((cat) => {
            const items = applicableRequirements.filter((r) => r.category === cat);
            if (items.length === 0) return null;
            return (
              <section key={cat}>
                <h3 className="mb-5 font-man text-lg font-bold text-text-primary">{cat}</h3>
                <div className="grid grid-cols-2 gap-4 xs:grid-cols-3 md:grid-cols-4">
                  {items.map((req) => {
                    const selected = requirements.find((r) => r.requirementId === req.id);
                    return (
                      <AttributeTile
                        key={req.id}
                        label={req.label}
                        value={selected?.value}
                        isCompulsory={req.isCompulsory}
                        onClick={() => setActiveRequirement(req)}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}

          <CustomRequirementInput />
        </div>
      ) : (
        <div className="space-y-12">
          {HALL_AMENITY_CATEGORIES.map((cat) => {
            const items = HALL_AMENITY_DEFINITIONS.filter((a) => a.category === cat);
            return (
              <section key={cat}>
                <h3 className="mb-5 font-man text-lg font-bold text-text-primary">{cat}</h3>
                <div className="grid grid-cols-2 gap-4 xs:grid-cols-3 md:grid-cols-4">
                  {items.map((amenity) => {
                    const selected = amenities.find((a) => a.amenityId === amenity.id);
                    return (
                      <AttributeTile
                        key={amenity.id}
                        label={amenity.label}
                        value={selected?.value}
                        onClick={() => setActiveAmenity(amenity)}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {activeAmenity && (
        <AttributeValueModal
          isOpen={Boolean(activeAmenity)}
          onClose={() => setActiveAmenity(null)}
          label={activeAmenity.label}
          valueKind={activeAmenity.valueKind}
          unit={activeAmenity.unit}
          placeholder={activeAmenity.placeholder}
          initialValue={amenities.find((a) => a.amenityId === activeAmenity.id)?.value ?? ""}
          onSave={(value) => setAmenityValue(activeAmenity.id, value)}
          onRemove={
            amenities.some((a) => a.amenityId === activeAmenity.id)
              ? () => removeAmenity(activeAmenity.id)
              : undefined
          }
        />
      )}

      {activeRequirement && (
        <AttributeValueModal
          isOpen={Boolean(activeRequirement)}
          onClose={() => setActiveRequirement(null)}
          label={activeRequirement.label}
          valueKind={activeRequirement.valueKind}
          placeholder={activeRequirement.placeholder}
          initialValue={requirements.find((r) => r.requirementId === activeRequirement.id)?.value ?? ""}
          onSave={(value) => setRequirementValue(activeRequirement.id, value)}
          onRemove={
            !activeRequirement.isCompulsory && requirements.some((r) => r.requirementId === activeRequirement.id)
              ? () => removeRequirement(activeRequirement.id)
              : undefined
          }
        />
      )}
    </div>
  );
}