"use client";

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

export default function SelectableChip({ label, selected, onClick, icon }: SelectableChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
        selected
          ? "border-accent-primary bg-accent-primary text-white shadow-card"
          : "border-black/10 bg-white text-text-primary/70 hover:border-accent-primary/30 hover:bg-bg-tertiary"
      }`}
    >
      {icon}
      {label}
      {selected && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}