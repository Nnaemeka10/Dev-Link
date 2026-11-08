"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Briefcase, Check } from "lucide-react";

import { SERVICE_CATEGORIES } from "../lib/constants";
import { usePopover } from "../hooks/usePopover";

interface RoleDropdownProps {
  value: string | undefined;
  onChange: (role: string | undefined) => void;
  disabled?: boolean;
  /** "segment" = desktop pill (portal + scrim); "modal" = inline in the mobile sheet. */
  variant?: "segment" | "modal";
}

export function RoleDropdown({ value, onChange, disabled = false, variant = "segment" }: RoleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const { anchorRef, popoverRef, pos } = usePopover<HTMLUListElement>({
    open: isOpen,
    onClose: close,
    minWidth: 240,
  });

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const selectedLabel = SERVICE_CATEGORIES.find((cat) => cat.id === value)?.label ?? "Select role";

  const handleSelect = useCallback(
    (id: string) => {
      onChange(value === id ? undefined : id);
      setIsOpen(false);
    },
    [value, onChange]
  );

  const list = (
    <ul
      ref={variant === "segment" ? popoverRef : undefined}
      role="listbox"
      aria-label="Service category"
      className={
        variant === "segment"
          ? "search-popover z-50 max-h-72 overflow-y-auto overscroll-contain rounded-2xl bg-white py-2 shadow-[0_18px_40px_rgba(26,31,60,0.16)]"
          : "search-popover mt-3 max-h-72 overflow-y-auto overscroll-contain rounded-2xl border border-text-primary/10 bg-bg-primary/40 p-2"
      }
    >
      {SERVICE_CATEGORIES.map((cat) => {
        const isSelected = cat.id === value;
        return (
          <li key={cat.id} role="option" aria-selected={isSelected}>
            <button
              type="button"
              onClick={() => handleSelect(cat.id)}
              className={`flex w-full items-center justify-between rounded-xl px-4 text-left text-sm transition-colors ${
                variant === "modal" ? "py-3" : "py-2.5"
              } ${isSelected ? "font-semibold text-accent-primary" : "text-text-primary hover:bg-bg-tertiary/60"}`}
            >
              {cat.label}
              {isSelected && <Check className="h-4 w-4" />}
            </button>
          </li>
        );
      })}
    </ul>
  );

  //Modal variant: inline inside the mobile sheet
  if (variant === "modal") {
    return (
      <div ref={anchorRef} className="w-full">
        <div className="flex items-center gap-3">
          <Briefcase className="mt-4 h-5 w-5 shrink-0 text-text-primary/50" />
          <div className="min-w-0 flex-1">
            <p className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary/45">
              Service
            </p>
            <button
              type="button"
              onClick={() => (disabled ? undefined : setIsOpen((o) => !o))}
              disabled={disabled}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              className={`w-full bg-transparent text-left text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                value ? "text-text-primary" : "text-text-primary/45"
              }`}
            >
              {selectedLabel}
            </button>
          </div>
        </div>
        {isOpen && list}
      </div>
    );
  }

  //Segment variant: pill segment + scrim + portal list
  return (
    <>
      <div ref={anchorRef} className="searchbar-segment flex flex-1 items-center gap-2 px-4 py-2 xl:gap-3 xl:px-5 xl:py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary/45 xl:text-[11px]">
            Service
          </p>
          <button
            type="button"
            onClick={() => (disabled ? undefined : setIsOpen((o) => !o))}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={`w-full bg-transparent text-left text-xs focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 xl:text-sm ${
              value ? "text-text-primary" : "text-text-primary/45"
            }`}
          >
            {selectedLabel}
          </button>
        </div>
      </div>

      {portalTarget && isOpen && pos
        ? createPortal(
            <>
              <button type="button" aria-label="Close service list" className="search-scrim" onClick={close} />
              <div
                style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
                className="z-50"
              >
                {list}
              </div>
            </>,
            portalTarget
          )
        : null}
    </>
  );
}