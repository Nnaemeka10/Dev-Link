import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = "", ...props },
  ref,
) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm text-text-primary">
      {label ? <span className="font-medium">{label}</span> : null}
      <input
        ref={ref}
        className={`rounded-lg border border-text-primary/20 bg-white px-4 py-2 text-sm text-text-primary outline-none transition-shadow placeholder:text-text-primary/40 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-accent-primary">{error}</span> : null}
    </label>
  );
});

export default Input;
