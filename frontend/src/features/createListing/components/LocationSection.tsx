"use client";

import { useListingStore } from "../store/useListingStore";
import { NIGERIA_STATES, getLgasByState } from "../data";
import Dropdown from "./shared/Dropdown";
import FloatingInput from "./shared/FloatingInput";
import SelectableChip from "./shared/SelectableChip";

const STATE_OPTIONS = NIGERIA_STATES.map((s) => ({ id: s.id, label: s.name }));

function HallLocationFields() {
  const hallLocation = useListingStore((s) => s.form.details.hallLocation);
  const setHallState = useListingStore((s) => s.setHallState);
  const setHallLga = useListingStore((s) => s.setHallLga);
  const setHallStreetAddress = useListingStore((s) => s.setHallStreetAddress);

  const lgaOptions = hallLocation.stateId
    ? getLgasByState(hallLocation.stateId).map((l) => ({ id: l.id, label: l.name }))
    : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xs:grid-cols-2">
        <Dropdown
          label="State"
          placeholder="Select a state"
          options={STATE_OPTIONS}
          selectedId={hallLocation.stateId}
          onSelect={setHallState}
        />
        <Dropdown
          label="Local Government"
          placeholder="Select an LGA"
          disabledHint="Select a state first"
          options={lgaOptions}
          selectedId={hallLocation.lgaId}
          onSelect={setHallLga}
          disabled={!hallLocation.stateId}
        />
      </div>
      <FloatingInput
        id="street-address"
        label="Primary Location / Address"
        placeholder="Put your street address"
        value={hallLocation.streetAddress}
        onChange={(e) => setHallStreetAddress(e.target.value)}
        leadingIcon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 21C12 21 19 15.5 19 10.5C19 6.6 15.9 3.5 12 3.5C8.1 3.5 5 6.6 5 10.5C5 15.5 12 21 12 21Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <circle cx="12" cy="10.5" r="2.3" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        }
      />
    </div>
  );
}

function ServiceLocationFields() {
  const serviceLocation = useListingStore((s) => s.form.details.serviceLocation);
  const setServiceBusinessAddress = useListingStore((s) => s.setServiceBusinessAddress);
  const setServiceCoverageMode = useListingStore((s) => s.setServiceCoverageMode);
  const toggleServiceCoverageState = useListingStore((s) => s.toggleServiceCoverageState);
  const toggleServiceCoverageLga = useListingStore((s) => s.toggleServiceCoverageLga);

  return (
    <div className="space-y-8">
      <FloatingInput
        id="business-address"
        label="Primary Business Address"
        placeholder="Put your street address"
        value={serviceLocation.businessAddress}
        onChange={(e) => setServiceBusinessAddress(e.target.value)}
      />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-text-primary">Areas of Coverage</label>
          <p className="mt-1 text-xs text-text-primary/50">
            Since your service travels, tell clients which areas you cover.
          </p>
        </div>

        <div className="flex gap-2.5">
          <SelectableChip
            label="Entire States"
            selected={serviceLocation.coverageMode === "statewide"}
            onClick={() => setServiceCoverageMode("statewide")}
          />
          <SelectableChip
            label="Specific Local Governments"
            selected={serviceLocation.coverageMode === "lga"}
            onClick={() => setServiceCoverageMode("lga")}
          />
        </div>

        <div className="flex flex-wrap gap-2.5">
          {STATE_OPTIONS.map((state) => (
            <SelectableChip
              key={state.id}
              label={state.label}
              selected={serviceLocation.coverageStateIds.includes(state.id)}
              onClick={() => toggleServiceCoverageState(state.id)}
            />
          ))}
        </div>

        {serviceLocation.coverageMode === "lga" && serviceLocation.coverageStateIds.length > 0 && (
          <div className="space-y-5 rounded-card bg-bg-tertiary p-5">
            <p className="text-xs font-medium text-text-primary/55">
              Every local government starts covered — tap one to remove it from your coverage.
            </p>
            {serviceLocation.coverageStateIds.map((stateId) => {
              const stateName = NIGERIA_STATES.find((s) => s.id === stateId)?.name ?? stateId;
              const lgas = getLgasByState(stateId);
              const deselected = serviceLocation.deselectedLgaIdsByState[stateId] ?? [];
              return (
                <div key={stateId}>
                  <p className="mb-2.5 text-sm font-bold text-text-primary">{stateName}</p>
                  <div className="flex flex-wrap gap-2">
                    {lgas.map((lga) => (
                      <SelectableChip
                        key={lga.id}
                        label={lga.name}
                        selected={!deselected.includes(lga.id)}
                        onClick={() => toggleServiceCoverageLga(stateId, lga.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LocationSection({ category }: { category: "hall" | "service" }) {
  return category === "hall" ? <HallLocationFields /> : <ServiceLocationFields />;
}