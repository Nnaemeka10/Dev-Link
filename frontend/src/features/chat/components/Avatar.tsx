"use client";

import { initialsOf } from "../utils";

interface AvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  isOnline?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
} as const;

const DOT = {
  xs: "h-2 w-2",
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
} as const;

/**
 * Avatars may be Google- or Cloudinary-hosted, so a plain <img> is used rather
 * than next/image (no remote-pattern coupling, and referrerPolicy is required
 * for Google URLs). Initials are derived from the server's display_name.
 */
export function Avatar({
  name = "Guest",
  avatarUrl,
  isOnline,
  size = "md",
  className = "",
}: AvatarProps) {
  const label = name?.trim() || "Guest";

  return (
    <div className={`relative shrink-0 ${className}`}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={label}
          referrerPolicy="no-referrer"
          className={`${SIZES[size]} rounded-full object-cover ring-1 ring-[#F0E9DF]`}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`${SIZES[size]} flex items-center justify-center rounded-full bg-[#F7D1C8] font-extrabold uppercase text-[#B9401D] ring-1 ring-[#F0E9DF]`}
        >
          {initialsOf(label)}
        </span>
      )}

      {isOnline && (
        <span
          aria-label="Online"
          className={`absolute bottom-0 right-0 ${DOT[size]} rounded-full bg-[#2D5A27] ring-2 ring-white`}
        />
      )}
    </div>
  );
}