"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import HubModal from "@/features/saved/components/HubModal";
import { ApiError } from "@/lib/api";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** useProfile().changePassword - POST /api/profile/change-password */
  onSubmit: (payload: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

// Strength meter - same rules and palette as ResetPasswordPage so the two
// password surfaces read identically.
function getStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string } {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (score <= 1) return { level: 0, label: "Weak" };
  if (score === 2) return { level: 1, label: "Fair" };
  if (score === 3) return { level: 2, label: "Good" };
  return { level: 3, label: "Strong" };
}

const STRENGTH_COLORS = ["#D65C3A", "#D97A2A", "#2C6E49", "#2C6E49"] as const;

function StrengthBar({ password }: { password: string }) {
  const { level, label } = getStrength(password);
  const color = STRENGTH_COLORS[level];
  return (
    <div className="mt-2" aria-live="polite" aria-label={`Password strength: ${label}`}>
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= level ? color : "#EFE8DE" }}
          />
        ))}
      </div>
      <p className="mt-1.5 text-right text-xs font-semibold" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  autoComplete,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  autoComplete: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-4 pr-12 text-sm font-medium text-stone-800 outline-none transition-all focus:border-[#D65C3A]/30 focus:ring-2 focus:ring-[#D65C3A]/20"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition-colors hover:text-stone-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ChangePasswordModalProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
    setDone(false);
  }, [isOpen]);

  const canSubmit =
    current.length > 0 &&
    next.length >= 8 &&
    confirm === next &&
    next !== current &&
    !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next === current) {
      setError("New password must be different from your current password.");
      return;
    }
    if (confirm !== next) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await onSubmit({ currentPassword: current, newPassword: next });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn't change your password. Please try again."
      );
    }
  }

  return (
    <HubModal
      isOpen={isOpen}
      title={done ? "Password updated" : "Change password"}
      subtitle={done ? undefined : "You stay signed in here - other devices are signed out"}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      {done ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-base font-extrabold text-stone-900">
            Password changed successfully
          </h3>
          <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-stone-400">
            You&apos;re still signed in on this device. Every other device has
            been signed out and will need the new password.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-full bg-[#D65C3A] px-7 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-[#c24e2f]"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl bg-[#F7F2EA] px-4 py-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#D65C3A]" />
            <p className="text-xs font-semibold leading-5 text-stone-500">
              Changing your password signs out every other device immediately -
              including any session you don&apos;t recognise.
            </p>
          </div>

          <PasswordField
            id="current-password"
            label="Current password"
            value={current}
            autoComplete="current-password"
            onChange={setCurrent}
          />

          <div>
            <PasswordField
              id="new-password"
              label="New password"
              value={next}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              onChange={setNext}
            />
            {next.length > 0 && <StrengthBar password={next} />}
          </div>

          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            value={confirm}
            autoComplete="new-password"
            placeholder="Repeat your new password"
            onChange={setConfirm}
          />
          {confirm.length > 0 && confirm !== next && (
            <p className="text-xs font-semibold text-[#D65C3A]">
              Passwords do not match.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#D65C3A] py-3.5 text-sm font-extrabold text-white transition-colors hover:bg-[#c24e2f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              "Update password"
            )}
          </button>
        </form>
      )}
    </HubModal>
  );
}