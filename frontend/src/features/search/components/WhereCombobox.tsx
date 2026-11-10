"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Clock3, MapPin, Search, TrendingUp, X } from "lucide-react";

import { POPULAR_STATES } from "../lib/constants";
import { useLocationSuggestions, type LocationSuggestion } from "../hooks/useLocationSuggestions";
import { useRecentSearches, type WhereMode } from "../hooks/useRecentSearches";
import { usePopover } from "../hooks/usePopover";

const DWELL_OPEN_MS = 140; // expand-on-focus delay
const GRACE_CLOSE_MS = 180; // grace when focus leaves the field
const MIN_QUERY_LENGTH = 2;

interface WhereComboboxProps {
  mode: WhereMode;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  variant?: "segment" | "modal";
  ariaLabel?: string;
}

type OptionKind = "recent" | "popular" | "state" | "lga" | "raw";

interface Option {
  key: string;
  kind: OptionKind;
  label: string;
  sublabel?: string;
  value: string;
}

interface Section {
  title: string | null;
  options: Option[];
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent font-bold text-text-primary">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function optionIcon(kind: OptionKind) {
  if (kind === "recent") return <Clock3 className="h-4 w-4 shrink-0 text-text-primary/35" />;
  if (kind === "popular") return <TrendingUp className="h-4 w-4 shrink-0 text-accent-primary/70" />;
  if (kind === "raw") return <Search className="h-4 w-4 shrink-0 text-text-primary/35" />;
  return <MapPin className="h-4 w-4 shrink-0 text-text-primary/35" />;
}

export default function WhereCombobox({
  mode,
  value,
  onChange,
  onBlur,
  error,
  variant = "segment",
  ariaLabel,
}: WhereComboboxProps) {
  const valueSafe = value ?? "";
  const [text, setText] = useState(value);
  // Sync-from-props during render (the sanctioned "previous prop" pattern -
  // no effect, no set-state-in-effect).
  const [prevValue, setPrevValue] = useState(valueSafe);
  if (valueSafe !== prevValue) {
    setPrevValue(valueSafe);
    setText(valueSafe);
  }

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootId = useId();
  const listId = `${rootId}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // the next focus event(programmatic refocus after a commit) and must NOT retrigger the dwell-open timer.
  const suppressNextOpenRef = useRef(false);

  const { recents, refresh, add } = useRecentSearches(mode);
  const query = text.trim();

  
  const enableFetch = query.length >= MIN_QUERY_LENGTH;
  const { data: suggestions = [], isFetching, isError, isDebouncing } =
    useLocationSuggestions(enableFetch ? query : "");

  const { anchorRef, popoverRef, pos } = usePopover({
    open: open && variant === "segment",
    onClose: () => setOpen(false),
    minWidth: 320,
  });

  const isCoverage = mode === "coverage";
  const label = isCoverage ? "Coverage area" : "Where";
  const placeholder = isCoverage ? "e.g. Lagos, Enugu…" : "Lagos, Abuja, PH…";

  //Options model
  const sections: Section[] = [];

  if (query.length >= MIN_QUERY_LENGTH) {
    if (!(isFetching && suggestions.length === 0)) {
      const states = suggestions.filter((s) => s.type === "state");
      const lgas = suggestions.filter((s) => s.type === "lga");

      if (states.length > 0) {
        sections.push({
          title: "States",
          options: states.map((s: LocationSuggestion) => ({
            key: s.id, kind: "state" as const, label: s.name,
            sublabel: "State", value: s.name,
          })),
        });
      }
      if (lgas.length > 0) {
        sections.push({
          title: isCoverage ? "LGAs , picks the whole state" : "LGAs",
          options: lgas.map((s: LocationSuggestion) => ({
            key: s.id,
            kind: "lga" as const,
            label: s.name,
            sublabel: isCoverage ? `LGA · covers ${s.state}` : `LGA , ${s.state}`,
            value: isCoverage ? s.state : s.name,
          })),
        });
      }

      // Always offer the raw query as a fallback - even when nothing matched,
      // so the user can still search with what they typed.
      const exactMatch = suggestions.some((s) => s.name.toLowerCase() === query.toLowerCase());
      if (!exactMatch) {
        sections.push({
          title: null,
          options: [{
            key: "__raw__", kind: "raw" as const, label: query,
            sublabel: isCoverage ? "Search services with this coverage" : "Search halls with this text",
            value: query,
          }],
        });
      }
    }
  } else {
    if (recents.length > 0) {
      sections.push({
        title: "Recent",
        options: recents.map((r) => ({
          key: `recent-${r.value}`, kind: "recent" as const, label: r.value,
          sublabel: "Recent search", value: r.value,
        })),
      });
    }
    sections.push({
      title: "Popular",
      options: POPULAR_STATES.map((name) => ({
        key: `popular-${name}`, kind: "popular" as const, label: name,
        sublabel: "State", value: name,
      })),
    });
  }

  const flatOptions = sections.flatMap((s) => s.options);

  // Loading = debounce pending OR request in flight, with nothing to show yet.
  // Without the isDebouncing check the dropdown flashes "No matches" for the
  // ~350ms debounce window after every keystroke.
  const isLoadingState =
    query.length >= MIN_QUERY_LENGTH &&
    (isDebouncing || (isFetching && suggestions.length === 0));

  // Settled empty = the request finished successfully and genuinely found nothing.
  const hasSettledEmpty =
    query.length >= MIN_QUERY_LENGTH &&
    !isDebouncing &&
    !isFetching &&
    !isError &&
    suggestions.length === 0;

  // Request failed - show a distinct message instead of "No matches", so a
  // network/API problem is never reported as "location not found".
  const isErrored =
    query.length >= MIN_QUERY_LENGTH && isError && !isDebouncing && !isFetching;

  // Open / close with dwell + grace
  const openNow = useCallback(() => {
    clearTimeout(closeTimer.current);
    refresh();
    setOpen(true);
    setActiveIndex(-1);
  }, [refresh]);

  const close = useCallback(() => {
    clearTimeout(openTimer.current);
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const handleFocus = () => {
    clearTimeout(closeTimer.current);
    // Skip the dwell timer for the programmatic refocus that follows a commit.
    if (suppressNextOpenRef.current) {
      suppressNextOpenRef.current = false;
      return;
    }
    openTimer.current = setTimeout(openNow, DWELL_OPEN_MS);
  };

  const handleBlur = () => {
    clearTimeout(openTimer.current);
    onBlur?.();
    // Grace period: lets a click on an option land before we close.
    closeTimer.current = setTimeout(() => setOpen(false), GRACE_CLOSE_MS);
  };

  const handleChange = (next: string) => {
    suppressNextOpenRef.current = false; // typing is always genuine intent
    setText(next);
    onChange(next);
    clearTimeout(openTimer.current);
    if (!open) openNow();
  };

  const commit = useCallback(
    (option: Option) => {
      setText(option.label);
      onChange(option.value);
      add(option.value);
      close();
      if (variant === "segment") {
        // Refocus fires onFocus - flag it so the dwell timer doesn't reopen.
        suppressNextOpenRef.current = true;
        inputRef.current?.focus();
      } else {
        // Mobile sheet: drop the keyboard so the picked value reads clearly.
        inputRef.current?.blur();
      }
    },
    [onChange, add, close, variant]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { openNow(); return; }
      setActiveIndex((i) => (flatOptions.length === 0 ? -1 : (i + 1) % flatOptions.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? flatOptions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault(); // select, never submit, from inside the combobox
      const option = flatOptions[activeIndex];
      if (option) commit(option);
      else if (query) commit({ key: "__raw__", kind: "raw", label: query, value: query });
    } else if (e.key === "Escape") {
      if (open) {
        e.stopPropagation();
        setText(valueSafe);
        close();
      }
    } else if (e.key === "Tab") {
      close();
    }
  };

  // Keep the active option in view - pure DOM sync in an effect (never a
  // ref read during render). The ref is attached to the new active row by
  // the time this runs after commit.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const input = (
    <div className = "flex justify-end">
      <div className="min-w-0 flex-1">
        <label
          htmlFor={`${rootId}-input`}
          className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary/45 xl:text-[11px]"
        >
          {label}
        </label>
        <input
          ref={inputRef}
          id={`${rootId}-input`}
          type="text"
          role="combobox"
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          aria-label={ariaLabel ?? label}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && activeIndex >= 0 ? `${rootId}-opt-${activeIndex}` : undefined}
          aria-invalid={!!error}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-primary/45 focus:outline-none"
        />
      </div>
      {text && (
        <button
          type="button"
          aria-label="Clear"
          onPointerDown={(e) => e.preventDefault()} // keep input focus
          onClick={() => {
            setText("");
            onChange("");
            inputRef.current?.focus();
          }}
          className="shrink-0 rounded-full p-1.5 text-text-primary/40 transition-colors hover:bg-text-primary/5 hover:text-text-primary/70"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  const listbox = (
    <div
      ref={listRef}
      id={listId}
      role="listbox"
      aria-label={isCoverage ? "Coverage area suggestions" : "Location suggestions"}
      className={
        variant === "segment"
          ? "search-popover max-h-80 overflow-y-auto overscroll-contain rounded-2xl bg-white py-2 shadow-[0_18px_40px_rgba(26,31,60,0.16)]"
          : "search-popover mt-3 max-h-64 overflow-y-auto overscroll-contain rounded-2xl border border-text-primary/10 bg-bg-primary/40 p-2"
      }
    >
      {isLoadingState && (
        <div className="space-y-1 px-3 py-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <div className="h-4 w-4 animate-pulse rounded-full bg-text-primary/10" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/5 animate-pulse rounded bg-text-primary/10" />
                <div className="h-2 w-1/4 animate-pulse rounded bg-text-primary/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoadingState && (hasSettledEmpty || isErrored) && (
        <p className="px-5 py-4 text-sm text-text-primary/55" role="status">
          {isErrored
            ? "Couldn't load suggestions , check your connection."
            : "No matches , try a state or LGA name, or search with this text."}
        </p>
      )}

      {!isLoadingState &&
        sections.map((section, si) => {
          if (section.options.length === 0) return null;
          const startIndex = sections.slice(0, si).reduce((acc, s) => acc + s.options.length, 0);
          return (
            <div key={section.title ?? `section-${si}`} role="group" aria-label={section.title ?? undefined}>
              {section.title && (
                <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-primary/40">
                  {section.title}
                </p>
              )}
              {section.options.map((option, oi) => {
                const index = startIndex + oi;
                const isActive = index === activeIndex;
                return (
                  <div
                    key={option.key}
                    ref={isActive ? activeRef : undefined}
                    id={`${rootId}-opt-${index}`}
                    role="option"
                    aria-selected={isActive}
                    aria-label={option.sublabel ? `${option.label}, ${option.sublabel}` : option.label}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      onPointerDown={(e) => e.preventDefault()} // beats the blur grace timer
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => commit(option)}
                      className={`flex w-full items-center gap-3 px-4 text-left transition-colors ${
                        variant === "modal" ? "py-3" : "py-2" // 44px-class rows on touch
                      } ${isActive ? "bg-bg-tertiary" : "hover:bg-bg-tertiary/60"}`}
                    >
                      {optionIcon(option.kind)}
                      <span className="min-w-0 flex-col">
                        <span className="block truncate text-sm font-semibold text-text-primary">
                          <Highlight text={option.label} query={query} />
                        </span>
                        {option.sublabel && (
                          <span className="block text-[10px] text-text-primary/45">{option.sublabel}</span>
                        )}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
    </div>
  );

  // Modal variant: inline inside the mobile sheet
  if (variant === "modal") {
    return (
      <div className="w-full">
        <div className="flex items-center gap-3">
          <MapPin className="mt-4 h-5 w-5 shrink-0 text-text-primary/50" />
          <div className="flex-1">{input}</div>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs text-red-500">{error}</p>
        )}
        {open && listbox}
      </div>
    );
  }

  // Segment variant: pill segment + scrim + portal dropdown
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <div ref={anchorRef} className="searchbar-segment flex items-center gap-2 px-4 py-2 xl:gap-3 xl:px-5 xl:py-3">
      <MapPin className="h-4 w-4 shrink-0 text-text-primary/50 xl:h-5 xl:w-5" />
      {input}
      {error && (
        <p role="alert" className="absolute -bottom-5 left-5 text-[11px] text-red-500">
          {error}
        </p>
      )}
      {portalTarget && open && pos
        ? createPortal(
            <>
              <button type="button" aria-label="Close suggestions" className="search-scrim" onClick={close} />
              <div
                ref={popoverRef}
                style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
                className="z-50"
              >
                {listbox}
              </div>
            </>,
            portalTarget
          )
        : null}
    </div>
  );
}