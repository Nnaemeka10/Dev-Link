"use client";

import { useState } from "react";
import { useListingStore } from "../store/useListingStore";

const MAX_TAGS = 5;

export default function TagsInput() {
  const storedTags = useListingStore((s) => s.form.details.tags);
  const setTags = useListingStore((s) => s.setTags);
  const [values, setValues] = useState<string[]>(storedTags.length > 0 ? storedTags : [""]);

  const commit = (next: string[]) => {
    setValues(next);
    setTags(next.map((v) => v.trim()).filter(Boolean));
  };

  const handleChange = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    const isLastBox = index === next.length - 1;
    // Reveal the next box the moment the current last box gets its first character
    if (isLastBox && value.trim().length > 0 && next.length < MAX_TAGS) {
      next.push("");
    }
    commit(next);
  };

  const handleRemove = (index: number) => {
    const next = values.filter((_, i) => i !== index);
    commit(next.length > 0 ? next : [""]);
  };

  return (
    <div className="space-y-2.5">
      <label className="block text-sm font-semibold text-text-primary">
        Add tags <span className="font-normal text-text-primary/40">(optional, up to {MAX_TAGS})</span>
      </label>
      <div className="flex flex-wrap gap-2.5">
        {values.map((value, index) => (
          <div key={index} className="relative">
            <input
              value={value}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={index === 0 ? "e.g. rooftop" : "Add another"}
              maxLength={24}
              className="w-36 rounded-input border-none bg-bg-tertiary py-3 pl-4 pr-8 text-sm text-text-primary outline-none transition-shadow placeholder:text-text-primary/40 focus:ring-2 focus:ring-accent-primary/25 xs:w-40"
            />
            {value && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                aria-label="Remove tag"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-primary/30 hover:text-text-primary"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}