import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const DESKTOP_FILTERS = ["Price: ₦50k - ₦500k", "Rating 4.5+", "Verified Only", "Capacity: 200+", "Instant Book"];

export function DesktopExploreHeader() {
  return (
    <header className="border-b border-[#EDE4D8] bg-bg-primary">
      <div className="flex h-25 items-center gap-8 px-8">
        <Link href="/" className="text-2xl flex font-semibold tracking-[-0.02em] text-text-primary items-end gap-1">
          <Image src="/logo.svg" alt="EventVnv" width={30} height={30} />
          <p className="font-semibold logo translate-y-1.5">EventVnV </p>
        </Link>

        <div className="flex h-14 w-100 items-center rounded-full bg-[#E9E5DF]">
          <div className="flex-1 px-5">
            <p className="text-tiny font-extrabold uppercase text-[#555B7F]">Location</p>
            <p className="text-sm text-[#777067]">Lagos, Nigeria</p>
          </div>
          <div className="h-8 w-px bg-[#DAD2C8]" />
          <div className="flex-1 px-5">
            <p className="text-tiny font-extrabold uppercase text-[#555B7F]">Date</p>
            <p className="text-sm text-[#777067]">Add dates</p>
          </div>
          <button type="button" className="mr-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#A83A1C] text-white">
            <Search className="h-4 w-4" />
          </button>
        </div>

        <nav className="ml-auto flex items-center gap-8 text-sm font-semibold text-[#555B7F]">
          <button type="button" className="border-b-2 border-[#A83A1C] pb-2 text-[#A83A1C]">
            Browse Venues
          </button>
          <button type="button">Become a Vendor</button>
          <button type="button">Login</button>
        </nav>
      </div>

      <div className="flex h-20 items-center gap-4 border-t border-[#EDE4D8] px-8">
        <div className="flex rounded-full bg-[#E9E5DF] p-1">
          <button type="button" className="rounded-full bg-white px-8 py-3 text-sm font-extrabold text-[#A83A1C]">
            Event Halls
          </button>
          <button type="button" className="rounded-full px-8 py-3 text-sm font-bold text-[#555B7F]">
            Services
          </button>
        </div>
        <button type="button" className="inline-flex items-center gap-2 rounded-full bg-[#FFDFA7] px-6 py-3 text-sm font-extrabold">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
        {DESKTOP_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className="rounded-full border border-[#E9DDD1] bg-[#FFFCF7] px-6 py-3 text-sm font-medium text-[#2C2926]"
          >
            {filter}
          </button>
        ))}
      </div>
    </header>
  );
}

export function DesktopResultsHeader() {
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        <h2 className="text-[2rem] font-extrabold tracking-[-0.02em]">Venues in Lagos</h2>
        <p className="mt-1 text-lg text-[#555B7F]">248 premium editorial spaces found for your event</p>
      </div>
      <button type="button" className="flex items-center gap-1 text-sm font-extrabold text-[#A83A1C]">
        Sort by: Recommended
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}
