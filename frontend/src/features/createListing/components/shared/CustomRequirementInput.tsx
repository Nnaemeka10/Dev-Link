"use client";

import { useState } from "react";
import { useListingStore } from "../../store/useListingStore";

const MAX_WORDS = 20;

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export default function CustomRequirementInput() {
  const customRequirements = useListingStore((s) => s.form.customRequirements);
  const addCustomRequirement = useListingStore((s) => s.addCustomRequirement);
  const removeCustomRequirement = useListingStore((s) => s.removeCustomRequirement);
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    addCustomRequirement(trimmed);
    setDraft("");
  };

  const overLimit = wordCount(draft) > MAX_WORDS;

  return (
    <div className="space-y-4 rounded-card bg-bg-tertiary p-6">
      <div>
        <p className="text-sm font-bold text-text-primary">Don&apos;t see your requirement listed?</p>
        <p className="mt-1 text-xs text-text-primary/50">Add your own, up to {MAX_WORDS} words.</p>
      </div>

      <div className="flex flex-col gap-3 xs:flex-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="e.g. Requires a private changing room on arrival"
          className="flex-1 rounded-input border-none bg-white px-5 py-3.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/25"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.trim() || overLimit}
          className="rounded-full bg-text-primary px-6 py-3.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-30"
        >
          Add
        </button>
      </div>
      {overLimit && <p className="text-xs font-medium text-red-600">Keep this under {MAX_WORDS} words.</p>}

      {customRequirements.length > 0 && (
        <ul className="space-y-2">
          {customRequirements.map((req) => (
            <li key={req.id} className="flex items-center justify-between gap-3 rounded-input bg-white px-4 py-3">
              <span className="text-sm text-text-primary">{req.text}</span>
              <button
                type="button"
                onClick={() => removeCustomRequirement(req.id)}
                aria-label="Remove requirement"
                className="shrink-0 text-text-primary/35 hover:text-red-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}