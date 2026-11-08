"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Users } from "lucide-react";

import { usePopover } from "../hooks/usePopover";

interface CapacityDropdownProps {
  value: number | undefined;
  onChange: (capacity: number | undefined) => void;
  disabled?: boolean;
  /** "segment" = desktop pill (portal + scrim); "modal" = inline in the mobile sheet. */
  variant?: "segment" | "modal";
}

export function CapacityDropdown({ value, onChange, disabled = false, variant = "segment" }: CapacityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInputMode, setIsInputMode] = useState(false);
  const [inputValue, setInputValue] = useState(value?.toString() ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  const { anchorRef, popoverRef, pos } = usePopover({ open: isOpen, onClose: close, minWidth: 260 });

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const handleIncrement = useCallback(
    (amount: number) => {
      const newValue = (value ?? 0) + amount;
      if (newValue >= 1) onChange(newValue);
    },
    [value, onChange]
  );

  const handleValueClick = useCallback(() => {
    setIsInputMode(true);
    setInputValue(value?.toString() ?? "");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [value]);

  const handleInputBlur = useCallback(() => {
    const num = inputValue.trim() ? parseInt(inputValue, 10) : undefined;
    if (num !== undefined && num >= 1) {
      onChange(num);
      setInputValue(num.toString());
    } else {
      setInputValue(value?.toString() ?? "");
    }
    setIsInputMode(false);
  }, [inputValue, value, onChange]);

  const displayValue = value ? `${value}` : "Add guests";

  const panel = (
    <div className="space-y-4 px-4 py-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary/45 xl:text-[11px]">
        Adjust capacity
      </p>

      {isInputMode ? (
        <input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={(e) => e.key === "Enter" && handleInputBlur()}
          min="1"
          className="w-full rounded-lg border border-text-primary/10 px-3 py-2 text-center text-lg font-semibold text-text-primary transition-colors focus:border-accent-primary focus:outline-none"
        />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="flex flex-col-reverse gap-2">
              <button type="button" onClick={() => handleIncrement(100)} className="rounded-lg border border-text-primary/10 px-2 py-2.5 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-primary">+100</button>
              <button type="button" onClick={() => handleIncrement(10)} className="rounded-lg border border-text-primary/10 px-2 py-2.5 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-primary">+10</button>
            </div>
            <button
              type="button"
              onClick={handleValueClick}
              className="flex-1 cursor-pointer rounded-lg py-3 text-center text-3xl font-bold text-text-primary transition-colors hover:bg-bg-primary"
            >
              {value ?? 1}
            </button>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => handleIncrement(-10)} disabled={!value || value <= 10} className="rounded-lg border border-text-primary/10 px-2 py-2.5 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-primary disabled:cursor-not-allowed disabled:opacity-30">-10</button>
              <button type="button" onClick={() => handleIncrement(-100)} disabled={!value || value <= 100} className="rounded-lg border border-text-primary/10 px-2 py-2.5 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-primary disabled:cursor-not-allowed disabled:opacity-30">-100</button>
            </div>
          </div>
          <p className="text-center text-tiny text-text-primary/40">Click value to type directly</p>
        </>
      )}
    </div>
  );

  // Modal variant: inline inside the mobile sheet 
  if (variant === "modal") {
    return (
      <div ref={anchorRef} className="w-full">
        <div className="flex items-center gap-3">
          <Users className="mt-4 h-5 w-5 shrink-0 text-text-primary/50" />
          <div className="min-w-0 flex-1">
            <p className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary/45">
              Guests
            </p>
            <button
              type="button"
              onClick={() => (disabled ? undefined : setIsOpen((o) => !o))}
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              className={`w-full bg-transparent text-left text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                value ? "text-text-primary" : "text-text-primary/45"
              }`}
            >
              {displayValue}
            </button>
          </div>
        </div>
        {isOpen && (
          <div className="search-popover mt-3 rounded-2xl border border-text-primary/10 bg-bg-primary/40 py-3">
            {panel}
          </div>
        )}
      </div>
    );
  }

  //  Segment variant: pill segment + scrim + portal panel 
  return (
    <>
      <div ref={anchorRef} className="searchbar-segment flex flex-1 items-center gap-2 px-4 py-2 xl:gap-3 xl:px-5 xl:py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary/45 xl:text-[11px]">
            Capacity
          </p>
          <button
            type="button"
            onClick={() => (disabled ? undefined : setIsOpen((o) => !o))}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className={`w-full bg-transparent text-left text-xs focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 xl:text-sm ${
              value ? "text-text-primary" : "text-text-primary/45"
            }`}
          >
            {displayValue}
          </button>
        </div>
      </div>

      {portalTarget && isOpen && pos
        ? createPortal(
            <>
              <button type="button" aria-label="Close capacity" className="search-scrim" onClick={close} />
              <div
                ref={popoverRef}
                style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
                className="search-popover z-50 overflow-hidden rounded-2xl bg-white py-3 shadow-[0_18px_40px_rgba(26,31,60,0.16)]"
              >
                {panel}
              </div>
            </>,
            portalTarget
          )
        : null}
    </>
  );
}