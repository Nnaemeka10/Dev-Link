"use client";

import { useId, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  // Optional: description line shown below the label (e.g. "Up to 50 guests")
  description?: string;
  // Optional: any lucide icon component
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface DropdownProps<T extends string = string> {
  // Core
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;

  // Labelling
  label?: string;                    // shown above the trigger value (e.g. "Guests")
  placeholder?: string;              // shown when no value selected
  id?: string;                       // ties a <label> outside the component

  // Trigger appearance
  triggerClassName?: string;         // override trigger button classes
  size?: "sm" | "md" | "lg";        // controls trigger padding + font size
  variant?: "outline" | "ghost" | "cell";
  // outline — bordered button (default)
  // ghost  — no border, just the text + chevron (e.g. sort dropdowns in headers)
  // cell   — flush, for use inside a bordered grid cell (BookingCard pattern)

  // Popover placement
  align?: "left" | "right";         // which edge of trigger the popover aligns to
  width?: "trigger" | "content" | number;
  // trigger  — popover matches trigger width (default)
  // content  — popover sizes to its content
  // number   — fixed px width

  // Extra structural
  className?: string;                // wrapper div
  borderRight?: boolean;             // adds border-r (for cell variant grid dividers)
  disabled?: boolean;

  // Accessibility
  'aria-label'?: string;
}

// ─── Size tokens ──────────────────────────────────────────────────────────────

const SIZE = {
  sm: {
    trigger: "px-3 py-2",
    label:   "text-[10px]",
    value:   "sm:text-xs text-micro",
    chevron: "h-3 w-3",
    option:  "px-3 py-2 text-xs",
  },
  md: {
    trigger: "px-4 py-3",
    label:   "text-[10px]",
    value:   "text-sm",
    chevron: "h-3.5 w-3.5",
    option:  "px-4 py-2.5 text-sm",
  },
  lg: {
    trigger: "px-5 py-3.5",
    label:   "text-xs",
    value:   "text-base",
    chevron: "h-4 w-4",
    option:  "px-5 py-3 text-sm",
  },
} as const;

// ─── Variant tokens ───────────────────────────────────────────────────────────

const VARIANT = {
  outline: {
    wrapper: "rounded-xl border border-[#1a1f3c]/15 bg-white hover:border-[#1a1f3c]/30 transition-colors",
    open:    "border-[#1a1f3c]/40",
  },
  ghost: {
    wrapper: "rounded-lg hover:bg-[#1a1f3c]/5 transition-colors",
    open:    "bg-[#1a1f3c]/5",
  },
  cell: {
    wrapper: "bg-white hover:bg-[#faf8f5]/60 transition-colors",
    open:    "bg-[#faf8f5]",
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function Dropdown<T extends string = string>({
  options,
  value,
  onChange,
  label,
  placeholder = "Select…",
  id,
  triggerClassName,
  size = "md",
  variant = "outline",
  align = "left",
  width = "trigger",
  className,
  borderRight = false,
  disabled = false,
  "aria-label": ariaLabel,
}: DropdownProps<T>) {
  const [open, setOpen]         = useState(false);
  const [focusedIdx, setFocused] = useState(-1);
  // DOMRect of the trigger button — used to position the portalled popover
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const triggerRef  = useRef<HTMLButtonElement>(null);
  const listRef     = useRef<HTMLUListElement>(null);
  const wrapperId   = useId();
  const listboxId   = useId();
  const internalLabelId = useId();

  const sz  = SIZE[size];
  const vt  = VARIANT[variant];

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

  // ── Measure trigger on open, and keep it current on scroll/resize ───────────
  useEffect(() => {
    if (!open) {
      // Reset so next open always measures fresh — prevents stale rect
      // from a previous open being used before the new measurement fires.
      setTriggerRect(null);
      return;
    }

    function measure() {
      if (triggerRef.current) {
        setTriggerRect(triggerRef.current.getBoundingClientRect());
      }
    }

    measure(); // immediate measurement when opening

    // Re-measure on scroll (any ancestor) and window resize so the popover
    // stays anchored if the user scrolls while the dropdown is open.
    window.addEventListener("scroll", measure, { passive: true, capture: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      window.removeEventListener("scroll", measure, { capture: true });
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  // ── Derive portal popover position from triggerRect ─────────────────────────
  function getPopoverStyle(): React.CSSProperties {
    // Return visibility:hidden (not display:none) so the element still mounts
    // and the AnimatePresence exit animation can run, but nothing is visible
    // or able to influence scroll while the rect hasn't been measured yet.
    if (!triggerRect) return { visibility: "hidden", pointerEvents: "none" };

    const top  = triggerRect.bottom + 6; // 6px gap below trigger
    const left = align === "right"
      ? triggerRect.right   // right-align: anchor to right edge of trigger
      : triggerRect.left;   // left-align: anchor to left edge

    const w =
      typeof width === "number"   ? width :
      width === "trigger"         ? triggerRect.width :
      undefined; // "content" — let CSS size it naturally

    return {
      position: "fixed",
      top,
      left,
      ...(align === "right" ? { transform: "translateX(-100%)" } : {}),
      ...(w !== undefined ? { width: w } : { minWidth: triggerRect.width }),
      zIndex: 9999,
    };
  }

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !listRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Sync focused index when opening ────────────────────────────────────────
  // Initial focused index is set in the click/keyboard handler at open time.
  // This effect only handles the initial scroll-into-view — a genuine DOM
  // side effect, not a state initialisation — so it's clean for the linter.
  //
  // IMPORTANT: we gate on triggerRect being set so we never call scrollIntoView
  // while the portalled popover is unpositioned. An unpositioned fixed element
  // sits at top:0 in the document; scrollIntoView on a child of it would scroll
  // the entire page to that position before the popover snaps into place.
  useEffect(() => {
    if (!open || focusedIdx < 0 || !triggerRect) return;
    listRef.current
      ?.querySelectorAll<HTMLElement>("[role='option']")
      [focusedIdx]
      ?.scrollIntoView({ block: "nearest" });
  // focusedIdx intentionally excluded — this only runs on open transition.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, !!triggerRect]);

  // ── Scroll focused option into view on keyboard nav ────────────────────────
  useEffect(() => {
    if (!open || focusedIdx < 0 || !triggerRect) return;
    listRef.current
      ?.querySelectorAll<HTMLElement>("[role='option']")
      [focusedIdx]
      ?.scrollIntoView({ block: "nearest" });
  // eslint-disable-next-line react-hooks/exhaustive-deps      
  }, [focusedIdx, open, !!triggerRect]);

  // ── Keyboard handler ───────────────────────────────────────────────────────
  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        const idx = options.findIndex((o) => o.value === value);
        setFocused(idx >= 0 ? idx : 0);
        setOpen(true);
      }
      return;
    }

    const enabledOptions = options.filter((o) => !o.disabled);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocused((i) => {
          // Skip disabled options going down
          let next = i + 1;
          while (next < options.length && options[next].disabled) next++;
          return Math.min(next, options.length - 1);
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocused((i) => {
          let prev = i - 1;
          while (prev >= 0 && options[prev].disabled) prev--;
          return Math.max(prev, 0);
        });
        break;
      case "Home":
        e.preventDefault();
        setFocused(options.findIndex((o) => !o.disabled));
        break;
      case "End":
        e.preventDefault();
        setFocused(options.length - 1 - [...options].reverse().findIndex((o) => !o.disabled));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIdx >= 0 && !options[focusedIdx].disabled) {
          onChange(options[focusedIdx].value);
          setOpen(false);
          triggerRef.current?.focus();
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  function selectOption(opt: DropdownOption<T>) {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className={[
        "relative",
        borderRight ? "border-r border-[#E8DDD2]" : "",
        className ?? "",
      ].join(" ")}
    >
      {/* ── Trigger ──────────────────────────────────────────────────────────── */}
      <button
        ref={triggerRef}
        id={id ?? wrapperId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-labelledby={label ? internalLabelId : undefined}
        aria-label={!label ? (ariaLabel ?? displayLabel) : undefined}
        aria-disabled={disabled}
        disabled={disabled}
        onKeyDown={onKeyDown}
        onClick={() => {
          if (disabled) return;
          if (!open) {
            // Set the initial focused index synchronously at open time —
            // this is a user-initiated state update, not a reactive effect,
            // so it batches correctly with the setOpen call.
            const idx = options.findIndex((o) => o.value === value);
            setFocused(idx >= 0 ? idx : 0);
          }
          setOpen((o) => !o);
        }}
        className={[
          "flex w-full flex-col text-left",
          sz.trigger,
          vt.wrapper,
          open ? vt.open : "",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          triggerClassName ?? "",
        ].join(" ")}
      >
        {/* Optional stacked label (Airbnb cell style) */}
        {label && (
          <span
            id={internalLabelId}
            className={`font-extrabold uppercase tracking-[0.12em] text-[#9A9AAE] ${sz.label}`}
          >
            {label}
          </span>
        )}

        {/* Value + chevron row */}
        <span className={`flex items-center justify-between gap-2 ${label ? "mt-1" : ""}`}>
          <span className={`flex items-center gap-2 truncate font-semibold text-[#1a1f3c] ${sz.value}`}>
            {selected?.icon && (
              <selected.icon className="h-4 w-4 shrink-0 text-[#1a1f3c]/50" />
            )}
            <span className="truncate">{displayLabel}</span>
          </span>
          <ChevronDown
            className={[
              `shrink-0 text-[#9A9AAE] transition-transform duration-200 ${sz.chevron}`,
              open ? "rotate-180" : "",
            ].join(" ")}
            aria-hidden="true"
          />
        </span>
      </button>

      {/* ── Popover — portalled to document.body ─────────────────────────────
           Rendering outside the React tree via createPortal means no
           overflow:hidden, clip-path, or stacking context from any ancestor
           can clip the popover. Position is derived from triggerRect (fixed
           viewport coordinates) so it stays anchored to the trigger.
      ────────────────────────────────────────────────────────────────────── */}
      {typeof window !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <motion.ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label={label ?? ariaLabel}
              tabIndex={-1}
              onKeyDown={onKeyDown}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0  }}
              exit={{    opacity: 0, y: -4  }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={getPopoverStyle()}
              className={[
                "overflow-y-auto rounded-2xl bg-white py-1.5",
                "shadow-[0_8px_32px_rgba(26,31,60,0.14),0_2px_8px_rgba(26,31,60,0.08)]",
                "border border-[#1a1f3c]/8",
                "max-h-60 no-scrollbar",
                width === "content" ? "w-max" : "",
              ].join(" ")}
            >
              {options.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isFocused  = idx === focusedIdx;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onMouseEnter={() => !opt.disabled && setFocused(idx)}
                    onClick={() => selectOption(opt)}
                    className={[
                      `flex cursor-pointer items-start justify-between gap-3 ${sz.option}`,
                      "transition-colors duration-100 select-none",
                      isFocused && !opt.disabled
                        ? "bg-[#f9f6ef] text-[#1a1f3c]"
                        : "text-[#1a1f3c]/80",
                      isSelected ? "font-semibold text-[#1a1f3c]" : "font-medium",
                      opt.disabled ? "cursor-not-allowed opacity-40" : "",
                    ].join(" ")}
                  >
                    {/* Left: icon + label + optional description */}
                    <span className="flex items-start gap-2 min-w-0">
                      {opt.icon && (
                        <opt.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#1a1f3c]/40" />
                      )}
                      <span className="flex flex-col min-w-0">
                        <span className="truncate">{opt.label}</span>
                        {opt.description && (
                          <span className="text-[11px] font-normal text-[#1a1f3c]/45 mt-0.5">
                            {opt.description}
                          </span>
                        )}
                      </span>
                    </span>

                    {/* Right: checkmark on selected */}
                    {isSelected && (
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#d65c3a]"
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}