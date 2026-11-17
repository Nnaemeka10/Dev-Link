"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, X } from "lucide-react";
import {
  nigeriaLgasQuery,
  useNigeriaLgas,
  useNigeriaStates,
} from "@/hooks/useNigeriaLocations";
import { useListingStore } from "../store/useListingStore";
import { hallLocationSchema, serviceLocationSchema } from "../schema/listingSchema";
import Dropdown from "./shared/Dropdown";
import FloatingInput from "./shared/FloatingInput";
import SelectableChip from "./shared/SelectableChip";
import type { ZodType } from "zod";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Field → message map from a zod schema. First issue per field wins. */
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

function HallLocationFields() {
  const hallLocation = useListingStore((s) => s.form.details.hallLocation);
  const setHallState = useListingStore((s) => s.setHallState);
  const setHallLga = useListingStore((s) => s.setHallLga);
  const setHallStreetAddress = useListingStore((s) => s.setHallStreetAddress);
  const showErrors = useShowLocationErrors();

  const { data: states = [], isLoading: statesLoading } = useNigeriaStates();
  const { data: lgas = [], isLoading: lgasLoading } = useNigeriaLgas(hallLocation.stateId);

  const stateOptions = useMemo(
    () => states.map((s) => ({ id: s.id, label: s.name })),
    [states]
  );
  const lgaOptions = useMemo(
    () => lgas.map((l) => ({ id: l.id, label: l.name })),
    [lgas]
  );

  const errors = getFieldErrors(hallLocationSchema, hallLocation);

  return (
    <div id="location-fields" className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xs:grid-cols-2">
        <Dropdown
          label="State"
          placeholder={statesLoading ? "Loading states…" : "Select a state"}
          options={stateOptions}
          selectedId={hallLocation.stateId}
          onSelect={setHallState}
          disabled={statesLoading}
          disabledHint="Loading states…"
          required
          error={showErrors ? errors.stateId : undefined}
        />
        <Dropdown
          label="Local Government"
          placeholder={lgasLoading ? "Loading LGAs…" : "Select an LGA"}
          disabledHint={!hallLocation.stateId ? "Select a state first" : "Loading LGAs…"}
          options={lgaOptions}
          selectedId={hallLocation.lgaId}
          onSelect={setHallLga}
          disabled={!hallLocation.stateId || lgasLoading}
          required
          error={showErrors ? errors.lgaId : undefined}
        />
      </div>

      <FloatingInput
        id="street-address"
        label="Primary Location / Address"
        placeholder="Put your street address"
        value={hallLocation.streetAddress}
        onChange={(e) => setHallStreetAddress(e.target.value)}
        required
        error={showErrors ? errors.streetAddress : undefined}
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

      <p className="text-xs leading-6 text-text-primary/50">
        Customers search by state and local government, so an accurate address directly
        affects how often your venue is found.
      </p>
    </div>
  );
}

/** One selected state's LGA coverage panel - all LGAs start covered. */
function StateCoveragePanel({
  stateId,
  stateName,
  deselected,
  onToggle,
  onReset,
}: {
  stateId: string;
  stateName: string;
  deselected: string[];
  onToggle: (lgaId: string) => void;
  onReset: (ids: string[]) => void;
}) {
  const { data: lgas = [], isLoading } = useNigeriaLgas(stateId);
  const coveredCount = Math.max(lgas.length - deselected.length, 0);

  return (
    <div className="rounded-card bg-white p-4 shadow-card ring-1 ring-black/5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-text-primary">{stateName}</p>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-text-primary/45">
            {isLoading ? "Loading…" : `${coveredCount} of ${lgas.length} covered`}
          </span>
          {deselected.length > 0 && (
            <button
              type="button"
              onClick={() => onReset(deselected)}
              className="text-[11px] font-bold text-accent-primary hover:underline"
            >
              Cover all
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2 text-xs font-semibold text-text-primary/45">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading local governments…
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {lgas.map((lga) => (
            <SelectableChip
              key={lga.id}
              label={lga.name}
              selected={!deselected.includes(lga.id)}
              onClick={() => onToggle(lga.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceLocationFields() {
  const serviceLocation = useListingStore((s) => s.form.details.serviceLocation);
  const setServiceBusinessAddress = useListingStore((s) => s.setServiceBusinessAddress);
  const setServiceCoverageMode = useListingStore((s) => s.setServiceCoverageMode);
  const toggleServiceCoverageState = useListingStore((s) => s.toggleServiceCoverageState);
  const toggleServiceCoverageLga = useListingStore((s) => s.toggleServiceCoverageLga);
  const showErrors = useShowLocationErrors();

  const [stateQuery, setStateQuery] = useState("");

  const { data: states = [], isLoading: statesLoading } = useNigeriaStates();
  const errors = getFieldErrors(serviceLocationSchema, serviceLocation);

  const visibleStates = useMemo(() => {
    const q = stateQuery.trim().toLowerCase();
    if (!q) return states;
    return states.filter((s) => s.name.toLowerCase().includes(q));
  }, [states, stateQuery]);

  const selectedStates = useMemo(
    () =>
      serviceLocation.coverageStateIds
        .map((id) => states.find((s) => s.id === id))
        .filter((s): s is { id: string; name: string } => Boolean(s)),
    [serviceLocation.coverageStateIds, states]
  );

  // Warm the cache for every selected state in one batch. Shares the exact
  // query keys the per-state panels below read, so nothing fetches twice.
  useQueries({
    queries:
      serviceLocation.coverageMode === "lga"
        ? serviceLocation.coverageStateIds.map((id) => nigeriaLgasQuery(id))
        : [],
  });

  return (
    <div id="location-fields" className="space-y-8">
      <FloatingInput
        id="business-address"
        label="Primary Business Address"
        placeholder="Put your street address"
        value={serviceLocation.businessAddress}
        onChange={(e) => setServiceBusinessAddress(e.target.value)}
        required
        error={showErrors ? errors.businessAddress : undefined}
      />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-text-primary">
            Areas of Coverage
            <span className="ml-0.5 text-red-600" aria-hidden="true">
              *
            </span>
          </label>
          <p className="mt-1 text-xs text-text-primary/50">
            Since your service travels, tell clients which areas you cover.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
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

        {/* 37 states is a long chip row - a filter keeps it usable. */}
        <div className="flex items-center gap-2 rounded-input bg-bg-tertiary px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-text-primary/40" aria-hidden="true" />
          <input
            value={stateQuery}
            onChange={(e) => setStateQuery(e.target.value)}
            placeholder="Filter states"
            aria-label="Filter states"
            className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-primary/40"
          />
          {stateQuery && (
            <button
              type="button"
              onClick={() => setStateQuery("")}
              aria-label="Clear state filter"
              className="shrink-0 text-text-primary/40 transition-colors hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {statesLoading ? (
          <div className="flex flex-wrap gap-2.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-28 animate-pulse rounded-full bg-bg-tertiary"
                style={{ animationDelay: `${i * 40}ms` }}
              />
            ))}
          </div>
        ) : visibleStates.length === 0 ? (
          <p className="text-sm text-text-primary/45">No state matches “{stateQuery}”.</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {visibleStates.map((state) => (
              <SelectableChip
                key={state.id}
                label={state.name}
                selected={serviceLocation.coverageStateIds.includes(state.id)}
                onClick={() => toggleServiceCoverageState(state.id)}
              />
            ))}
          </div>
        )}

        {serviceLocation.coverageStateIds.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-text-primary/55">
              {serviceLocation.coverageStateIds.length} state
              {serviceLocation.coverageStateIds.length === 1 ? "" : "s"} selected
            </p>
            <button
              type="button"
              onClick={() =>
                [...serviceLocation.coverageStateIds].forEach((id) =>
                  toggleServiceCoverageState(id)
                )
              }
              className="text-xs font-bold text-text-primary/50 underline underline-offset-2 transition-colors hover:text-accent-primary"
            >
              Clear all
            </button>
          </div>
        )}

        {showErrors && errors.coverageStateIds && (
          <p className="text-xs font-medium text-red-600">{errors.coverageStateIds}</p>
        )}

        <AnimatePresence initial={false}>
          {serviceLocation.coverageMode === "lga" && selectedStates.length > 0 && (
            <motion.div
              key="lga-coverage"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.32, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <div className="space-y-4 rounded-card bg-bg-tertiary p-5">
                <p className="text-xs font-medium text-text-primary/55">
                  Every local government starts covered — tap one to remove it from your
                  coverage.
                </p>
                {selectedStates.map((state) => (
                  <StateCoveragePanel
                    key={state.id}
                    stateId={state.id}
                    stateName={state.name}
                    deselected={serviceLocation.deselectedLgaIdsByState[state.id] ?? []}
                    onToggle={(lgaId) => toggleServiceCoverageLga(state.id, lgaId)}
                    onReset={(ids) =>
                      ids.forEach((lgaId) => toggleServiceCoverageLga(state.id, lgaId))
                    }
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function LocationSection({ category }: { category: "hall" | "service" }) {
  return category === "hall" ? <HallLocationFields /> : <ServiceLocationFields />;
}