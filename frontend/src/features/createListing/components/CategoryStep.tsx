"use client";

import { useListingStore } from "../store/useListingStore";
import type { ListingCategory } from "../types/listing";

const OPTIONS: {
  value: ListingCategory;
  title: string;
  description: string;
  icon: string;
  imageAlt: string;
}[] = [
  {
    value: "hall",
    title: "Event Hall",
    description: "Physical locations like banquet halls, outdoor gardens, and dedicated venue spaces.",
    icon: "storefront",
    imageAlt: "A wide shot of a decorated banquet hall set for a wedding",
  },
  {
    value: "service",
    title: "Event Service",
    description: "Professional services such as premium catering, photography, DJs, and event coordination.",
    icon: "room_service",
    imageAlt: "A chef plating a dish for a catering service",
  },
];

export default function CategoryStep() {
  const category = useListingStore((s) => s.form.category);
  const setCategory = useListingStore((s) => s.setCategory);

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center py-6 text-center md:py-16">
      <h2 className="font-man text-3xl font-bold tracking-tight text-text-primary md:text-5xl">
        What kind of event are you hosting?
      </h2>
      <p className="mt-4 max-w-2xl text-base text-text-primary/60 md:text-lg">
        Select the primary category that best describes your offering to help clients find you effortlessly.
      </p>

      <div className="mt-12 grid w-full grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        {OPTIONS.map((opt) => {
          const isSelected = category === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCategory(opt.value)}
              className={`group relative overflow-hidden rounded-card bg-white p-2 text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover ${
                isSelected ? "ring-2 ring-accent-primary" : "ring-1 ring-black/5"
              }`}
            >
              <div className="relative mb-5 h-48 w-full overflow-hidden rounded-[calc(theme(borderRadius.card)-0.5rem)] bg-bg-tertiary md:h-56">
                <div
                  className="h-full w-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 transition-transform duration-700 group-hover:scale-105"
                  role="img"
                  aria-label={opt.imageAlt}
                />
                {isSelected && (
                  <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent-primary text-white shadow-card">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center px-4 pb-8 text-center">
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                    isSelected ? "bg-accent-primary text-white" : "bg-bg-tertiary text-text-primary/60"
                  }`}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    {opt.value === "hall" ? (
                      <path d="M4 21V9L12 3L20 9V21H14V14H10V21H4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                    ) : (
                      <path
                        d="M4 8H7L8.5 5.5H15.5L17 8H20V19H4V8ZM12 15.5C13.9 15.5 15.5 13.9 15.5 12C15.5 10.1 13.9 8.5 12 8.5C10.1 8.5 8.5 10.1 8.5 12C8.5 13.9 10.1 15.5 12 15.5Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                </div>
                <h3 className="font-man text-xl font-bold text-text-primary md:text-2xl">{opt.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-primary/55">{opt.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}