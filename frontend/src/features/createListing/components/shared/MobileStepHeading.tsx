import type { ListingCategory, StepNumber } from "../../types/listing";
import { TOTAL_STEPS } from "../../types/listing";
import { getStepMeta } from "./stepMeta";

interface MobileStepHeadingProps {
  currentStep: StepNumber;
  category: ListingCategory | null;
}

export default function MobileStepHeading({ currentStep, category }: MobileStepHeadingProps) {
  const steps = getStepMeta(category);
  const activeLabel = steps.find((s) => s.step === currentStep)?.label ?? "";

  return (
    <div className="border-b border-black/5 bg-bg-primary px-4 pb-4 pt-1 xs:px-6 xl:hidden">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-man text-base font-bold text-text-primary">{activeLabel}</h1>
        <span className="text-xs font-semibold uppercase tracking-wider text-text-primary/45">
          Step {currentStep} of {TOTAL_STEPS}
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              step <= currentStep ? "bg-accent-primary" : "bg-black/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}