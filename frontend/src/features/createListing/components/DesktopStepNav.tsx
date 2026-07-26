"use client";

import type { ListingCategory, StepNumber } from "../types/listing";
import { TOTAL_STEPS } from "../types/listing";
import { getStepMeta } from "./shared/stepMeta";

interface DesktopStepNavProps {
  currentStep: StepNumber;
  category: ListingCategory | null;
  onStepClick: (step: StepNumber) => void;
}

export default function DesktopStepNav({ currentStep, category, onStepClick }: DesktopStepNavProps) {
  const steps = getStepMeta(category);

  return (
    <div className="hidden border-b border-black/5 bg-bg-primary xl:block">
      <div className="mx-auto max-w-[1600px] px-8 pb-6 pt-8">
        <h1 className="font-man text-2xl font-extrabold tracking-tight text-text-primary">Add Listing</h1>
        <p className="mt-1 text-sm font-medium text-text-primary/50">
          Step {currentStep} of {TOTAL_STEPS}
        </p>

        <nav className="mt-6 flex items-center gap-8">
          {steps.map((s) => {
            const isActive = s.step === currentStep;
            const isComplete = s.step < currentStep;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => onStepClick(s.step)}
                className="group flex flex-col items-start gap-2 pb-1"
              >
                <span
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "text-accent-primary"
                      : isComplete
                        ? "text-text-primary/70 group-hover:text-text-primary"
                        : "text-text-primary/35 group-hover:text-text-primary/60"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    {isComplete ? (
                      <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                    )}
                  </svg>
                  {s.label}
                </span>
                <span
                  className={`h-0.5 w-full rounded-full transition-colors ${
                    isActive ? "bg-accent-primary" : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}