"use client";

import { forwardRef, ReactNode, type TextareaHTMLAttributes } from "react";

interface FloatingTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  leadingIcon?: ReactNode;
}

const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ label, hint, error, required, leadingIcon, id, className = "", rows = 5, ...props }, ref) => {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-sm font-semibold text-text-primary">
            {label}
            {required && (
              <span className="ml-0.5 text-red-600" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {hint && <span className="text-xs font-medium text-text-primary/40">{hint}</span>}
        </div>
        <div className="relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-primary/40">
              {leadingIcon}
            </span>
          )}
          <textarea
            ref={ref}
            id={id}
            rows={rows}
            className={`w-full resize-none rounded-input border-none bg-bg-tertiary px-5 py-4 text-base text-text-primary outline-none transition-shadow placeholder:text-text-primary/40 focus:ring-2 focus:ring-accent-primary/25 ${
              error ? "ring-2 ring-red-500/60 focus:ring-red-500/40" : "focus:ring-accent-primary/25"
            } ${leadingIcon ? "pl-12 pr-4" : "px-5"} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  }
);

FloatingTextarea.displayName = "FloatingTextarea";
export default FloatingTextarea;