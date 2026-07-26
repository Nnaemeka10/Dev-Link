"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, hint, error, leadingIcon, id, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-sm font-semibold text-text-primary">
            {label}
          </label>
          {hint && <span className="text-xs font-medium text-text-primary/40">{hint}</span>}
        </div>
        <div className="relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-primary/40">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={`w-full rounded-input border-none bg-bg-tertiary py-4 text-base text-text-primary outline-none transition-shadow placeholder:text-text-primary/40 focus:ring-2 focus:ring-accent-primary/25 ${
              leadingIcon ? "pl-12 pr-4" : "px-5"
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";
export default FloatingInput;