import { Check } from "lucide-react";

export default function BookingStepper({
  labels,
  step,
  variant = "desktop",
}: {
  labels: string[];
  step: number;
  variant?: "desktop" | "mobile";
}) {
  if (variant === "mobile") {
    return (
      <div className="px-6 pb-7 pt-2">
        <div className="mb-3 flex items-center justify-between text-xs font-extrabold uppercase tracking-[0.12em] text-[#555B7F]">
          <span>Step {Math.min(step, labels.length).toString().padStart(2, "0")} / {labels.length.toString().padStart(2, "0")}</span>
          <span>{labels[Math.min(step, labels.length) - 1]}</span>
        </div>
        <div className="h-1 rounded-full bg-[#E8E4DC]">
          <div className="h-full rounded-full bg-[#B9401D]" style={{ width: `${(Math.min(step, labels.length) / labels.length) * 100}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-fit items-center rounded-full px-8 py-4">
      {labels.map((label, index) => {
        const currentStep = index + 1;
        const complete = step > currentStep;
        const active = step === currentStep;

        return (
          <div key={label} className="flex items-center gap-4">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold ${
                active || complete ? "bg-[#B9401D] text-white" : "bg-[#E8E4DC] text-[#555B7F]"
              } ${active ? "ring-4 ring-[#EFD8CF]" : ""}`}
            >
              {complete ? <Check className="h-4 w-4" /> : currentStep}
            </span>
            <span className={`hidden text-xs font-extrabold uppercase tracking-[0.08em] lg:inline ${active ? "text-[#B9401D]" : "text-[#555B7F]"}`}>
              {label}
            </span>
            {index < labels.length - 1 ? <span className="h-px w-12 bg-[#DCD7CE]" /> : null}
          </div>
        );
      })}
    </div>
  );
}
