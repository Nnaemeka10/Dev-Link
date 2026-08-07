import { Eye, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label: string;
  rightIcon?: "password";
}

export function AuthInput({ error, label, rightIcon, ...props }: AuthInputProps) {
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
          className="min-w-0 flex-1 bg-transparent text-tiny md:text-base font-semibold text-[#252423] placeholder:text-[#B69F98] focus:outline-none"
        />
        {rightIcon === "password" ? <Eye className="h-5 w-5 text-[#555B7F]" /> : null}
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
