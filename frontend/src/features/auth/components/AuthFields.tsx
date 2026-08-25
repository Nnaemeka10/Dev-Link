import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label: string;
  rightIcon?: "password";
}

export function AuthInput({ error, label, rightIcon, type, ...props }: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  }
  const isPassword = rightIcon === "password";

  return (
    <label className="block">
      {label ? <div className="mb-3 flex items-center justify-between">
        <span className="text-tiny md:text-xs font-extrabold uppercase tracking-[0.16em] text-[#555B7F]">{label}</span>
        {rightIcon === "password" ? (
          <Link href="/forgot-password" className="text-tiny md:text-sm font-extrabold text-[#B9401D] text-right">
            Forgot Password?
          </Link>
        ) : null}
      </div> : null}
      

      <span className="mt-3 flex h-14 items-center rounded-full bg-[#E0DDD6] md:px-5 px-3">
       <input
        {...props}
        className="min-w-0 flex-1 text-small md:text-base font-semibold text-[#252423] placeholder:text-[#B69F98] focus:outline-none"
        type={isPassword && showPassword ? "text" : type}
      />
        {isPassword ? (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="text-[#555B7F]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        ) : null}
      </span>
      {error ? <span className="mt-2 block text-tiny md:text-sm font-semibold text-[#B9401D]">{error}</span> : null}
    </label>
  );
}

export function SecurePill() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#E8E4DC] px-5 py-2 md:text-sm text-micro font-extrabold text-[#555B7F]">
      <ShieldCheck className="h-4 w-4" />
      Secure and Private
    </span>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-5">
      <span className="h-px flex-1 bg-[#EFE8DE]" />
      <span className="text-micro md:text-sm font-semibold uppercase tracking-[0.16em] text-[#555B7F]">{label}</span>
      <span className="h-px flex-1 bg-[#EFE8DE]" />
    </div>
  );
}
