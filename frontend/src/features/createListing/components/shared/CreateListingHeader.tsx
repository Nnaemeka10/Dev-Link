"use client";

interface CreateListingHeaderProps {
  /** Discards the in-progress draft and returns to /vendor/listings. */
  onExit: () => void;
  /** Persists the current form state as a draft, then returns to /vendor/listings. */
  onSaveAndExit: () => void;
}

export default function CreateListingHeader({ onExit, onSaveAndExit }: CreateListingHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-bg-primary/80 px-4 backdrop-blur-xl xs:px-6 md:px-8">
      <button
        type="button"
        onClick={onExit}
        className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-text-primary/60 transition-colors hover:bg-bg-tertiary hover:text-text-primary xs:px-4"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M19 12H5M5 12L11 6M5 12L11 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden xs:inline">Back</span>
      </button>

      <button
        type="button"
        onClick={onSaveAndExit}
        className="rounded-full px-4 py-2 text-sm font-medium text-text-primary/60 transition-colors hover:bg-bg-tertiary hover:text-accent-primary"
      >
        Save &amp; Exit
      </button>
    </header>
  );
}