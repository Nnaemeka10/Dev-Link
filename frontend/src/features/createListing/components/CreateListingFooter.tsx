"use client";

import type { StepNumber } from "../types/listing";
import { TOTAL_STEPS } from "../types/listing";

interface CreateListingFooterProps {
  currentStep: StepNumber;
  onPrev: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export default function CreateListingFooter({
  currentStep,
  onPrev,
  onNext,
  onSaveDraft,
  onPublish,
}: CreateListingFooterProps) {
  const isFirstStep = currentStep === 1;
  const isReviewStep = currentStep === TOTAL_STEPS;

  return (
    <footer className="fixed inset-x-0 bottom-[76px] z-30 border-t border-black/5 bg-bg-primary/90 px-4 py-4 backdrop-blur-xl xs:px-6 xl:bottom-0 xl:left-64 xl:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between">
        {isReviewStep ? (
          <>
            <button
              type="button"
              onClick={onSaveDraft}
              className="rounded-full px-5 py-3 text-sm font-semibold text-text-primary/60 transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={onPublish}
              className="flex items-center gap-2 rounded-full bg-accent-primary px-7 py-3.5 text-sm font-bold text-white shadow-card transition-all hover:scale-[1.02] hover:shadow-card-hover active:scale-95"
            >
              Publish Listing
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2L14.5 8.5L21 9.3L16.2 13.9L17.5 20.5L12 17.2L6.5 20.5L7.8 13.9L3 9.3L9.5 8.5L12 2Z" fill="currentColor" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onPrev}
              disabled={isFirstStep}
              className="flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-semibold text-text-primary/60 transition-colors hover:bg-bg-tertiary hover:text-text-primary disabled:pointer-events-none disabled:opacity-30"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Previous
            </button>
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 rounded-full bg-accent-primary px-7 py-3.5 text-sm font-bold text-white shadow-card transition-all hover:scale-[1.02] hover:shadow-card-hover active:scale-95"
            >
              Next Step
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>
    </footer>
  );
}