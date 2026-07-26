"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

interface FloatingTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ label, hint, error, id, className = "", rows = 5, ...props }, ref) => {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-sm font-semibold text-text-primary">
            {label}
          </label>
          {hint && <span className="text-xs font-medium text-text-primary/40">{hint}</span>}
        </div>
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          className={`w-full resize-none rounded-input border-none bg-bg-tertiary px-5 py-4 text-base text-text-primary outline-none transition-shadow placeholder:text-text-primary/40 focus:ring-2 focus:ring-accent-primary/25 ${className}`}
          {...props}
        />
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  }
);

FloatingTextarea.displayName = "FloatingTextarea";
export default FloatingTextarea;