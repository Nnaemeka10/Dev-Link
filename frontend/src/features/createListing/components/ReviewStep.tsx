"use client";

import { useListingStore } from "../store/useListingStore";
import { EVENT_HALL_TYPES, SERVICE_TYPES } from "../data";
import { NIGERIA_STATES, getLgasByState } from "../data";
import { HALL_AMENITY_DEFINITIONS } from "../data";
import { SERVICE_REQUIREMENT_DEFINITIONS } from "../data";

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-sm font-semibold text-accent-primary hover:underline">
      Edit
    </button>
  );
}

export default function ReviewStep() {
  const form = useListingStore((s) => s.form);
  const goToStep = useListingStore((s) => s.goToStep);

  const isService = form.category === "service";
  const typeOptions = isService ? SERVICE_TYPES : EVENT_HALL_TYPES;
  const selectedTypeLabels = form.details.selectedTypeIds
    .map((id) => typeOptions.find((t) => t.id === id)?.label)
    .filter(Boolean);

  const locationSummary = isService
    ? form.details.serviceLocation.businessAddress || "Not set"
    : (() => {
        const state = NIGERIA_STATES.find((s) => s.id === form.details.hallLocation.stateId)?.name;
        const lga = form.details.hallLocation.lgaId
          ? getLgasByState(form.details.hallLocation.stateId ?? "").find((l) => l.id === form.details.hallLocation.lgaId)?.name
          : undefined;
        const parts = [form.details.hallLocation.streetAddress, lga, state].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "Not set";
      })();

  const coverPhoto = form.gallery.find((p) => p.isCover) ?? form.gallery[0];

  const priceSummary =
    form.pricing.usesPackages && form.pricing.packages.length > 0
      ? `From ₦${Math.min(...form.pricing.packages.map((p) => p.price)).toLocaleString()}`
      : form.pricing.basePrice
        ? `₦${form.pricing.basePrice.toLocaleString()} / day`
        : "Not set";

  const attributeRows = isService
    ? form.requirements.map((r) => ({
        label: SERVICE_REQUIREMENT_DEFINITIONS.find((d) => d.id === r.requirementId)?.label ?? r.requirementId,
        value: r.value,
      }))
    : form.amenities.map((a) => ({
        label: HALL_AMENITY_DEFINITIONS.find((d) => d.id === a.amenityId)?.label ?? a.amenityId,
        value: a.value,
      }));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10 md:mb-14">
        <h2 className="font-man text-3xl font-bold tracking-tight text-text-primary md:text-5xl">
          Review and Publish
        </h2>
        <p className="mt-4 text-base text-text-primary/60 md:text-lg">
          Your curated canvas is nearly complete. Review your masterpiece.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Preview card */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-card bg-white shadow-card ring-1 ring-black/5">
            <div className="relative h-64 w-full bg-bg-tertiary md:h-80">
              {coverPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={coverPhoto.url} alt={form.details.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-text-primary/35">
                  No cover photo yet
                </div>
              )}
            </div>
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-man text-2xl font-bold text-text-primary md:text-3xl">
                  {form.details.name || "Untitled listing"}
                </h3>
                <span className="whitespace-nowrap font-man text-xl font-bold text-accent-primary">
                  {priceSummary}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-text-primary/55">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 21C12 21 19 15.5 19 10.5C19 6.6 15.9 3.5 12 3.5C8.1 3.5 5 6.6 5 10.5C5 15.5 12 21 12 21Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
                {locationSummary}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-text-primary/65">
                {form.details.description || "No description added yet."}
              </p>
            </div>
          </div>
        </div>

        {/* Details + amenities/requirements summary */}
        <div className="flex flex-col gap-8 lg:col-span-5">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-man text-lg font-bold text-text-primary">Details Check</h3>
              <EditButton onClick={() => goToStep(2)} />
            </div>
            <div className="space-y-3 rounded-card bg-white p-6 shadow-card ring-1 ring-black/5">
              <div className="flex justify-between gap-4 border-b border-black/5 pb-3 text-sm last:border-0 last:pb-0">
                <span className="text-text-primary/55">Category</span>
                <span className="text-right font-medium text-text-primary">
                  {isService ? "Event Service" : "Event Hall"}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-black/5 pb-3 text-sm last:border-0 last:pb-0">
                <span className="shrink-0 text-text-primary/55">Type{selectedTypeLabels.length > 1 ? "s" : ""}</span>
                <span className="text-right font-medium text-text-primary">
                  {selectedTypeLabels.length > 0 ? selectedTypeLabels.join(", ") : "Not set"}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-text-primary/55">Tags</span>
                <span className="text-right font-medium text-text-primary">
                  {form.details.tags.length > 0 ? form.details.tags.join(", ") : "None"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-man text-lg font-bold text-text-primary">
                {isService ? "Requirements Check" : "Amenities Check"}
              </h3>
              <EditButton onClick={() => goToStep(3)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {attributeRows.length === 0 && <p className="text-sm text-text-primary/45">None added yet.</p>}
              {attributeRows.slice(0, 6).map((row) => (
                <span
                  key={row.label}
                  className="rounded-full bg-bg-tertiary px-4 py-2 text-xs font-semibold text-text-primary"
                >
                  {row.label}: {row.value}
                </span>
              ))}
              {attributeRows.length > 6 && (
                <span className="rounded-full bg-bg-tertiary px-4 py-2 text-xs font-semibold text-text-primary/50">
                  +{attributeRows.length - 6} more
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-man text-lg font-bold text-text-primary">Gallery Check</h3>
              <EditButton onClick={() => goToStep(4)} />
            </div>
            <p className="text-sm text-text-primary/55">{form.gallery.length} photos uploaded</p>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-man text-lg font-bold text-text-primary">Pricing Check</h3>
              <EditButton onClick={() => goToStep(5)} />
            </div>
            <p className="text-sm text-text-primary/55">
              {form.pricing.usesPackages && form.pricing.packages.length > 0
                ? `${form.pricing.packages.length} package${form.pricing.packages.length > 1 ? "s" : ""} configured`
                : priceSummary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}