import Image from "next/image";
import type { VendorProfile } from "../types";

interface VendorHeaderProps {
  vendor: VendorProfile;
}

export default function VendorHeader({ vendor }: VendorHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-end bg-bg-primary/80 px-4 backdrop-blur-xl xs:px-6 md:px-8">
      <div className="flex items-center gap-3 xs:gap-5">
        <button
          type="button"
          aria-label="Messages"
          className="relative text-text-primary/60 transition-colors hover:text-accent-primary"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4 5.5C4 4.67157 4.67157 4 5.5 4H18.5C19.3284 4 20 4.67157 20 5.5V15.5C20 16.3284 19.3284 17 18.5 17H8L4 20.5V5.5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          {vendor.unreadMessages > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-primary px-1 text-[10px] font-bold leading-none text-white">
              {vendor.unreadMessages}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-text-primary/10" />

        <div className="flex cursor-pointer items-center gap-3">
          <span className="hidden text-sm font-medium text-text-primary sm:inline">
            {vendor.name}
          </span>
          <div className="relative h-9 w-9 overflow-hidden rounded-full bg-bg-tertiary ring-1 ring-black/5">
            <Image
              src={vendor.avatarUrl}
              alt={`${vendor.name} profile picture`}
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}