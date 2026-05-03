import { ListFilter, Search, SlidersHorizontal } from "lucide-react";

type Tab = "halls" | "services";

interface MobileExploreHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onOpenFilters: () => void;
  activeFilters: Set<string>;
  onToggleFilter: (name: string) => void;
}

function FilterPill({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-5 py-3 text-sm font-bold ${
        active ? "bg-[#FFDFA7] text-[#2C2926]" : "bg-[#EEECE7] text-[#6A6786]"
      }`}
    >
      {children}
    </button>
  );
}

export default function MobileExploreHeader({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onOpenFilters,
  activeFilters,
  onToggleFilter,
}: MobileExploreHeaderProps) {
  const filterOptions = ["Price", "Rating", "Verified"];

  return (
    <>
      <header className="sticky top-0 z-30 bg-bg-primary/95 px-6 py-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-[-0.01em]">Explore</h1>
          <button
            type="button"
            onClick={onOpenFilters}
            className="text-[#B9401D]"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-5 flex h-14 items-center gap-3 rounded-full bg-[#EEECE7] px-5 text-[#6B6E91]">
          <Search className="h-5 w-5" />
          <input
            type="search"
            placeholder="Search venues or services..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold placeholder:text-[#7B7E9B] focus:outline-none"
          />
        </label>

        <div className="mt-5 grid grid-cols-2 text-center text-sm font-extrabold">
          <button
            type="button"
            onClick={() => onTabChange("halls")}
            className={`border-b-2 pb-3 ${
              activeTab === "halls"
                ? "border-[#B9401D] text-[#B9401D]"
                : "border-transparent text-[#686987]"
            }`}
          >
            Event Halls
          </button>
          <button
            type="button"
            onClick={() => onTabChange("services")}
            className={`border-b-2 pb-3 ${
              activeTab === "services"
                ? "border-[#B9401D] text-[#B9401D]"
                : "border-transparent text-[#686987]"
            }`}
          >
            Services
          </button>
        </div>
      </header>

      <div className="no-scrollbar flex gap-3 overflow-x-auto px-6 py-4">
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#1D1D1A] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.05em] text-white"
        >
          <ListFilter className="h-4 w-4" />
          Filter
        </button>
        {filterOptions.map((option) => (
          <FilterPill
            key={option}
            active={activeFilters.has(option)}
            onClick={() => onToggleFilter(option)}
          >
            {option}
          </FilterPill>
        ))}
      </div>
    </>
  );
}
