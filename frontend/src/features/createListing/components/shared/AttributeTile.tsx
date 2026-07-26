"use client";

interface AttributeTileProps {
  label: string;
  value?: string;
  isCompulsory?: boolean;
  onClick: () => void;
}

export default function AttributeTile({ label, value, isCompulsory, onClick }: AttributeTileProps) {
  const isSelected = Boolean(value);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-4 rounded-card p-5 text-left transition-all duration-300 ${
        isSelected
          ? "bg-accent-tint ring-1 ring-accent-primary/40"
          : "bg-white shadow-card ring-1 ring-black/5 hover:-translate-y-0.5 hover:shadow-card-hover"
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            isSelected ? "bg-accent-primary text-white" : "bg-bg-tertiary text-text-primary/40"
          }`}
        >
          {isSelected ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </span>
        {isCompulsory && !isSelected && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
            Required
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        {value && <p className="mt-1 truncate text-xs font-medium text-accent-primary">{value}</p>}
      </div>
    </button>
  );
}