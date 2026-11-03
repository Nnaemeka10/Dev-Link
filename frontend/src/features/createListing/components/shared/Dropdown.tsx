"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface DropdownOption {
  id: string;
  label: string;
}

interface DropdownProps {
  label: string;
  placeholder: string;
  options: DropdownOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
  disabledHint?: string;
  required?: boolean;
  error?: string;
}

export default function Dropdown({
  label,
  placeholder,
  options,
  selectedId,
  onSelect,
  disabled,
  disabledHint,
  required,
  error,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const errorId = `${useId()}-error`;
  const selected = options.find((o) => o.id === selectedId);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="space-y-2.5" ref={rootRef}>
      <label className="block text-sm font-semibold text-text-primary">
        {label}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onClick={() => setIsOpen((v) => !v)}
          className={`flex w-full items-center justify-between rounded-input bg-bg-tertiary px-5 py-4 text-left text-base text-text-primary outline-none transition-shadow focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? "ring-2 ring-red-500/60 focus:ring-red-500/40" : "focus:ring-accent-primary/25"
          }`}
        >
          <span className={selected ? "text-text-primary" : "text-text-primary/40"}>
            {selected ? selected.label : disabled && disabledHint ? disabledHint : placeholder}
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={`shrink-0 text-text-primary/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {isOpen && !disabled && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-card border border-black/5 bg-white p-2 shadow-modal">
            {options.length === 0 && (
              <p className="px-3 py-2 text-sm text-text-primary/45">No options available</p>
            )}
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSelect(opt.id);
                  setIsOpen(false);
                }}
                className={`block w-full rounded-input px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  opt.id === selectedId
                    ? "bg-accent-primary/10 text-accent-primary"
                    : "text-text-primary/75 hover:bg-bg-tertiary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}