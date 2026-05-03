import { ListFilter, Search, SlidersHorizontal } from "lucide-react";

function FilterPill({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      className={`shrink-0 rounded-full px-5 py-3 text-sm font-bold ${
        active ? "bg-[#FFDFA7] text-[#2C2926]" : "bg-[#EEECE7] text-[#6A6786]"
      }`}
    >
      {children}
    </button>
  );
}

export default function MobileExploreHeader() {
  return (
    <>
      <header className="sticky top-0 z-30 bg-bg-primary/95 px-6 py-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-[-0.01em]">Explore</h1>
          <button type="button" className="text-[#B9401D]" aria-label="Open filters">
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-5 flex h-14 items-center gap-3 rounded-full bg-[#EEECE7] px-5 text-[#6B6E91]">
          <Search className="h-5 w-5" />
          <input
            type="search"
            placeholder="Search venues or services..."
            className="w-full bg-transparent text-sm font-semibold placeholder:text-[#7B7E9B] focus:outline-none"
          />
        </label>

        <div className="mt-5 grid grid-cols-2 text-center text-sm font-extrabold">
          <button type="button" className="border-b-2 border-[#B9401D] pb-3 text-[#B9401D]">
            Event Halls
          </button>
          <button type="button" className="border-b-2 border-transparent pb-3 text-[#686987]">
            Services
          </button>
        </div>
      </header>

      <div className="no-scrollbar flex gap-3 overflow-x-auto px-6 py-4">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#1D1D1A] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.05em] text-white"
        >
          <ListFilter className="h-4 w-4" />
          Filter
        </button>
        <FilterPill active>Price</FilterPill>
        <FilterPill>Rating</FilterPill>
        <FilterPill>Verified</FilterPill>
      </div>
    </>
  );
}
