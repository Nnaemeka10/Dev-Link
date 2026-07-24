

import MobileDock from "@/components/layout/MobileDock";
import SideNavBar from "@/components/layout/SideNavBar";
import VendorMobileDock from "@/components/layout/VendorMobileDock";
import VendorSideNavBar from "@/components/layout/VendorSideNavBar";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/features/auth/auth.store";
import { useProfile } from "@/features/profile/hooks/useProfile";
import type {
  Booking,
  BookingStatus,
  NotificationSettings,
  PaymentMethod,
  UserProfile,
} from "@/features/profile/profile.types";
import { useTheparam } from "@/hooks/useTheparam";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState, useRef, useEffect } from "react";

type ProfileState = ReturnType<typeof useProfile>;

// ─── Icons (inline SVG helpers) ───────────────────────────────────────────────

const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const BackArrow = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

// ─── Shared Atoms ─────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3 px-1">
      <span className="text-[#D65C3A]">{icon}</span>
      <h3 className="text-base font-bold text-stone-800">{title}</h3>
    </div>
  );
}

function PreferenceRow({
  icon,
  label,
  sublabel,
  right,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors text-left first:rounded-t-3xl last:rounded-b-3xl"
    >
      <div className="flex items-center gap-3">
        <span className="text-stone-400">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-stone-800">{label}</p>
          {sublabel && <p className="text-xs text-stone-400">{sublabel}</p>}
        </div>
      </div>
      {right && <span className="text-stone-300">{right}</span>}
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  onToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={checked}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`w-11 h-6 rounded-full relative transition-colors duration-200 disabled:opacity-60 ${
        checked ? "bg-[#D65C3A]" : "bg-stone-200"
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${
          checked ? "right-1" : "left-1"
        }`}
      />
    </button>
  );
}

// ─── Inline Edit Field ────────────────────────────────────────────────────────

function InlineEditField({
  label,
  value,
  type = "text",
  icon,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  type?: string;
  icon?: React.ReactNode;
  onChange: (v: string) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Keep draft in sync if parent value changes externally
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = async () => {
    if (draft === value) {
      setEditing(false);
      return;
    }

    await onChange(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {editing ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            {icon && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                {icon}
              </span>
            )}
            <input
              ref={inputRef}
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") cancel();
              }}
              className={`w-full bg-white border border-[#D65C3A]/40 rounded-xl py-3 text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#D65C3A]/30 transition-all ${
                icon ? "pl-10 pr-4" : "px-4"
              }`}
            />
          </div>
          <button
            onClick={commit}
            disabled={disabled}
            className="shrink-0 px-3 py-3 bg-[#D65C3A] text-white rounded-xl text-xs font-bold hover:bg-[#c24e2f] transition-colors"
          >
            {disabled ? "Saving" : "Save"}
          </button>
          <button
            onClick={cancel}
            className="shrink-0 px-3 py-3 bg-stone-100 text-stone-500 rounded-xl text-xs font-bold hover:bg-stone-200 transition-colors"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          onClick={() => {
            if (!disabled) setEditing(true);
          }}
          className="flex items-center justify-between px-4 py-3 bg-stone-50 rounded-xl cursor-text border border-transparent hover:border-stone-200 hover:bg-white transition-all group"
        >
          <div className="flex items-center gap-3">
            {icon && <span className="text-stone-400">{icon}</span>}
            <span className="text-sm font-medium text-stone-700">{value}</span>
          </div>
          <span className="text-xs text-[#D65C3A] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Edit
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Payment Drawer ───────────────────────────────────────────────────────────

function PaymentDrawer({
  open,
  onClose,
  payments,
  onSetDefault,
  onRemove,
  onAdd,
  isUpdating,
}: {
  open: boolean;
  onClose: () => void;
  payments: PaymentMethod[];
  onSetDefault: (id: string) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
  onAdd: () => void;
  isUpdating?: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      {/* Sheet — slides up on mobile, centered modal on md+ */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
        <div className="pointer-events-auto w-full md:w-[480px] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden">
          {/* Mobile drag handle */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-10 h-1 bg-stone-200 rounded-full" />
          </div>
          {/* Header */}
          <div className="px-6 pt-4 pb-3 flex items-center justify-between border-b border-stone-100">
            <h3 className="text-lg font-bold text-stone-900">Payment Methods</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors text-sm font-bold"
            >
              ✕
            </button>
          </div>
          {/* List */}
          <div className="px-6 py-4 space-y-3 max-h-[55vh] overflow-y-auto">
            {payments.length === 0 ? (
              <div className="py-8 text-center text-sm font-medium text-stone-400">
                No reusable payment methods yet.
              </div>
            ) : payments.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 bg-stone-50 hover:border-stone-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  {pm.type === "card" ? (
                    <div className="w-12 h-8 bg-[#1a1f36] rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white text-[9px] font-black tracking-wider">
                        {pm.label.toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <div className="w-12 h-8 bg-stone-200 rounded-lg flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-stone-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 6l9-3 9 3M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6M3 6h18"
                        />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-stone-800">
                      {pm.type === "card"
                        ? `${pm.label} •••• ${pm.last4}`
                        : pm.label}
                    </p>
                    <p className="text-xs text-stone-400">
                      {pm.type === "card"
                        ? `Expires ${pm.expiry}`
                        : `Account ending in ${pm.last4}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {pm.isDefault ? (
                    <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full">
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => onSetDefault(pm.id)}
                      disabled={isUpdating}
                      className="text-[10px] text-stone-400 font-semibold hover:text-[#D65C3A] transition-colors"
                    >
                      Set default
                    </button>
                  )}
                  {!pm.isDefault && (
                    <button
                      onClick={() => onRemove(pm.id)}
                      disabled={isUpdating}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-stone-300 hover:text-red-400 transition-all"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Footer CTA */}
          <div className="px-6 py-4 border-t border-stone-100">
            <button
              onClick={onAdd}
              className="w-full py-3.5 border-2 border-dashed border-stone-200 rounded-2xl text-sm font-semibold text-stone-400 hover:border-[#D65C3A]/40 hover:text-[#D65C3A] transition-all"
            >
              + Add new payment method
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Bookings Section ─────────────────────────────────────────────────────────

type BookingTab = "pending" | "past";

function BookingCard({ booking }: { booking: Booking }) {
  const statusConfig: Record<
    BookingStatus,
    { label: string; bg: string; text: string }
  > = {
    pending: {
      label: "Awaiting Approval",
      bg: "bg-amber-50",
      text: "text-amber-700",
    },
    confirmed: {
      label: "Confirmed",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
    past: { label: "Completed", bg: "bg-stone-100", text: "text-stone-500" },
    cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-500" },
  };

  const cfg = statusConfig[booking.status];

  return (
    <div className="flex gap-4 p-4 bg-stone-50 rounded-2xl hover:bg-white border border-transparent hover:border-stone-200 hover:shadow-sm transition-all group cursor-pointer">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-stone-200">
        <img
          src={booking.imageUrl}
          alt={booking.eventTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h4 className="text-sm font-bold text-stone-900 leading-snug line-clamp-2">
            {booking.eventTitle}
          </h4>
          <span
            className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${cfg.bg} ${cfg.text}`}
          >
            {cfg.label}
          </span>
        </div>
        <p className="text-xs text-stone-400 mb-2">{booking.vendorName}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {booking.eventDate}
          </span>
          <span className="flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {booking.location}
          </span>
          <span className="flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            {booking.ticketCount} {booking.ticketCount === 1 ? "ticket" : "tickets"}
          </span>
        </div>
        <p className="text-sm font-bold text-stone-800 mt-2">
          ₦{booking.amount.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function BookingsSection({ bookings }: { bookings: Booking[] }) {
  const [tab, setTab] = useState<BookingTab>("pending");
  const pending = bookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed"
  );
  const past = bookings.filter(
    (b) => b.status === "past" || b.status === "cancelled"
  );
  const displayed = tab === "pending" ? pending : past;

  return (
    <div className="space-y-5">
      {/* Tab pills */}
      <div className="flex gap-1 p-1 bg-stone-100 rounded-2xl w-fit">
        {(["pending", "past"] as BookingTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            {t === "pending" ? "Pending" : "Past Bookings"}
            {t === "pending" && pending.length > 0 && (
              <span className="ml-1.5 bg-[#D65C3A] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {displayed.length === 0 ? (
        <div className="text-center py-14 text-stone-300">
          <svg
            className="w-12 h-12 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
          <p className="text-sm font-medium">
            No {tab === "pending" ? "pending bookings" : "past bookings"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Profile Content (shared across all breakpoints) ─────────────────────

function ProfileContent({
  profileState,
}: {
  profileState: ProfileState;
}) {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    profile,
    bookings,
    payments,
    notifications,
    isProfileLoading,
    isBookingsLoading,
    isPaymentsLoading,
    updateField,
    isUpdatingField,
    uploadAvatar,
    isUploadingAvatar,
    setDefaultPayment,
    removePayment,
    isUpdatingPayment,
    toggleNotification,
    isUpdatingNotifications,
    deactivateAccount,
    isDeactivating,
  } = profileState;

  const handleSetDefault = async (id: string) => {
    setActionError(null);
    await setDefaultPayment(id);
  };

  const handleRemove = async (id: string) => {
    setActionError(null);
    await removePayment(id);
  };

  const handleUpdateField = (field: "fullName" | "email" | "phone" | "location") =>
    async (value: string) => {
      setActionError(null);
      try {
        await updateField(field, value);
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Profile update failed");
        throw error;
      }
    };

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST", redirectOn401: false });
    clearAuth();
    router.push("/login");
  };

  const handleDeactivate = async () => {
    await deactivateAccount();
    clearAuth();
    router.push("/login");
  };

  const defaultCard = payments.find((p) => p.isDefault);

  if (isProfileLoading || !profile) {
    return (
      <div className="max-w-2xl xl:max-w-3xl space-y-4 pb-20">
        <div className="h-28 rounded-3xl bg-white/70 animate-pulse" />
        <div className="h-64 rounded-3xl bg-white/70 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl xl:max-w-3xl space-y-10 pb-20">
      {/* ── Profile Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="w-full h-full object-cover"
            />
          </div>
          <label className="absolute bottom-0 right-0 w-7 h-7 bg-[#D65C3A] rounded-full flex items-center justify-center shadow-md hover:bg-[#c24e2f] transition-colors cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={isUploadingAvatar}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setActionError(null);
                try {
                  await uploadAvatar(file);
                } catch (error) {
                  setActionError(error instanceof Error ? error.message : "Avatar upload failed");
                } finally {
                  event.target.value = "";
                }
              }}
            />
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </label>
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight">
            {profile.fullName}
          </h2>
          <p className="text-sm text-stone-400 mt-0.5">
            Member since {profile.memberSince}
          </p>
        </div>
      </div>

      {/* ── Personal Information ──────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          title="Personal Information"
        />
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InlineEditField
              label="Full Name"
              value={profile.fullName}
              onChange={handleUpdateField("fullName")}
              disabled={isUpdatingField}
            />
            <InlineEditField
              label="Email Address"
              value={profile.email}
              type="email"
              onChange={handleUpdateField("email")}
              disabled={isUpdatingField}
            />
            <InlineEditField
              label="Phone Number"
              value={profile.phone}
              type="tel"
              onChange={handleUpdateField("phone")}
              disabled={isUpdatingField}
            />
            <InlineEditField
              label="Primary Location"
              value={profile.location}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              onChange={handleUpdateField("location")}
              disabled={isUpdatingField}
            />
          </div>
          {actionError && <p className="text-xs font-semibold text-red-500">{actionError}</p>}
        </div>
      </section>

      {/* ── Payment Methods ───────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
          title="Payment Methods"
        />
        <button
          onClick={() => setPaymentDrawerOpen(true)}
          className="w-full bg-white rounded-3xl p-5 shadow-sm border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {defaultCard?.type === "card" ? (
                <div className="w-14 h-9 bg-[#1a1f36] rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-black tracking-wider">
                    {defaultCard.label.toUpperCase()}
                  </span>
                </div>
              ) : (
                <div className="w-14 h-9 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l9-3 9 3M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6M3 6h18" />
                  </svg>
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-stone-800">
                  {defaultCard
                    ? defaultCard.type === "card"
                      ? `${defaultCard.label} •••• ${defaultCard.last4}`
                      : defaultCard.label
                    : "No payment method"}
                </p>
                <p className="text-xs text-stone-400">
                  {isPaymentsLoading
                    ? "Loading saved methods"
                    : `${payments.length} method${payments.length !== 1 ? "s" : ""} saved - tap to manage`}
                </p>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-stone-300 group-hover:text-[#D65C3A] transition-colors shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </section>

      {/* ── Bookings ──────────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          }
          title="Bookings"
        />
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
          {isBookingsLoading ? (
            <div className="space-y-3">
              <div className="h-24 rounded-2xl bg-stone-50 animate-pulse" />
              <div className="h-24 rounded-2xl bg-stone-50 animate-pulse" />
            </div>
          ) : (
            <BookingsSection bookings={bookings} />
          )}
        </div>
      </section>

      {/* ── Preferences ──────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          }
          title="Preferences"
        />
        <div className="bg-white rounded-3xl divide-y divide-stone-50 shadow-sm border border-stone-100">
          <PreferenceRow
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
            label="Push Notifications"
            sublabel="Mobile and browser alerts"
            right={
              <Toggle
                checked={notifications.pushNotifications}
                disabled={isUpdatingNotifications}
                onToggle={() => toggleNotification("pushNotifications")}
              />
            }
          />
          <PreferenceRow
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            }
            label="Booking Updates"
            sublabel="Status changes and booking messages"
            right={
              <Toggle
                checked={notifications.bookingUpdates}
                disabled={isUpdatingNotifications}
                onToggle={() => toggleNotification("bookingUpdates")}
              />
            }
          />
          <PreferenceRow
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 10v2" />
              </svg>
            }
            label="Promotions"
            sublabel="Offers and platform announcements"
            right={
              <Toggle
                checked={notifications.emailPromotions}
                disabled={isUpdatingNotifications}
                onToggle={() => toggleNotification("emailPromotions")}
              />
            }
          />
          <PreferenceRow
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l1.8-3.6A7.06 7.06 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            label="SMS Alerts"
            sublabel="Text messages for urgent updates"
            right={
              <Toggle
                checked={notifications.smsAlerts}
                disabled={isUpdatingNotifications}
                onToggle={() => toggleNotification("smsAlerts")}
              />
            }
          />
          <PreferenceRow
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            }
            label="Language"
            sublabel="English (UK)"
            right={<ChevronRight />}
          />
          <PreferenceRow
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Timezone"
            sublabel="(GMT +01:00) Lagos"
            right={<ChevronRight />}
          />
        </div>
      </section>

      {/* ── Security ─────────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          title="Security"
        />
        <div className="bg-white rounded-3xl divide-y divide-stone-50 shadow-sm border border-stone-100">
          <PreferenceRow
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            }
            label="Change Password"
            sublabel="Last changed 3 months ago"
            right={<ChevronRight />}
          />
          <PreferenceRow
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            label="Two-Factor Authentication"
            sublabel="Not enabled"
            right={<ChevronRight />}
          />
        </div>
      </section>

      {/* ── Become a Vendor ──────────────────────────────────────────── */}
      <section>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D65C3A] to-[#8c2a09] p-7 shadow-lg shadow-[#D65C3A]/20 cursor-pointer hover:shadow-xl hover:shadow-[#D65C3A]/30 transition-all group">
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-4 bottom-2 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="flex items-center gap-1 text-white/70 text-xs font-semibold group-hover:text-white transition-colors">
                Go to Vendor Portal
                <svg
                  className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white mb-1 tracking-tight">
              Become a Vendor
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">
              List your events, sell tickets, and grow your audience on the platform.
            </p>
          </div>
        </div>
      </section>

      {/* ── Help & Support ────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          title="Help & Support"
        />
        <div className="bg-white rounded-3xl divide-y divide-stone-50 shadow-sm border border-stone-100">
          <PreferenceRow
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Help Center"
            sublabel="FAQs and support guides"
            right={<ChevronRight />}
          />
          <PreferenceRow
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            }
            label="Contact Us"
            sublabel="Chat with our support team"
            right={<ChevronRight />}
          />
        </div>
      </section>

      {/* ── Legal ────────────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title="Legal"
        />
        <div className="bg-white rounded-3xl divide-y divide-stone-50 shadow-sm border border-stone-100">
          {[
            { label: "Terms of Service", sublabel: "Last updated Jan 2025" },
            { label: "Privacy Policy", sublabel: "How we handle your data" },
            { label: "Cookie Policy", sublabel: "Cookie preferences" },
            { label: "Cancellation Policy", sublabel: "Refunds & cancellations" },
          ].map((item) => (
            <PreferenceRow
              key={item.label}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
              label={item.label}
              sublabel={item.sublabel}
              right={<ChevronRight />}
            />
          ))}
        </div>
      </section>

      {/* ── Account Actions (Log out) ─────────────────────────────────── */}
      <section>
        <div className="bg-white rounded-3xl divide-y divide-stone-50 shadow-sm border border-stone-100">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-stone-50 transition-colors rounded-t-3xl rounded-b-3xl text-left"
          >
            <svg
              className="w-4 h-4 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="text-sm font-semibold text-stone-700">Log out</span>
          </button>
        </div>
      </section>

      {/* ── Danger Zone ──────────────────────────────────────────────── */}
      <section className="pb-4">
        <div className="rounded-3xl border border-red-100 bg-red-50/50 p-6">
          <h4 className="text-sm font-bold text-red-500 mb-1">Danger Zone</h4>
          <p className="text-xs text-stone-400 mb-4 leading-relaxed">
            Once you deactivate your account, all your data will be permanently
            removed. This cannot be undone.
          </p>
          <button
            onClick={() => setShowDeactivateConfirm(true)}
            disabled={isDeactivating}
            className="px-5 py-2.5 border border-red-200 text-red-400 rounded-full text-xs font-bold hover:bg-red-100 hover:text-red-500 transition-all disabled:opacity-60"
          >
            {isDeactivating ? "Deactivating" : "Deactivate Account"}
          </button>
        </div>
      </section>

      {/* ── Payment Drawer ────────────────────────────────────────────── */}
      <PaymentDrawer
        open={paymentDrawerOpen}
        onClose={() => setPaymentDrawerOpen(false)}
        payments={payments}
        onSetDefault={async (id) => {
          try {
            await handleSetDefault(id);
          } catch (error) {
            setActionError(error instanceof Error ? error.message : "Payment update failed");
          }
        }}
        onRemove={async (id) => {
          try {
            await handleRemove(id);
          } catch (error) {
            setActionError(error instanceof Error ? error.message : "Payment update failed");
          }
        }}
        onAdd={() => {
          router.push("/bookings");
        }}
        isUpdating={isUpdatingPayment}
      />

      {/* ── Logout Confirmation Modal ─────────────────────────────────── */}
      {showLogoutConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div className="pointer-events-auto bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl">
              <h3 className="text-lg font-bold text-stone-900 mb-2">Log out?</h3>
              <p className="text-sm text-stone-400 mb-6">
                You&apos;ll need to sign in again to access your account.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-2xl bg-stone-100 text-stone-600 text-sm font-bold hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    void handleLogout();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-[#D65C3A] text-white text-sm font-bold hover:bg-[#c24e2f] transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Deactivate Confirmation Modal ─────────────────────────────── */}
      {showDeactivateConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setShowDeactivateConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div className="pointer-events-auto bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl">
              <h3 className="text-lg font-bold text-stone-900 mb-2">Deactivate account?</h3>
              <p className="text-sm text-stone-400 mb-6">
                Your account will be disabled and you will be signed out.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeactivateConfirm(false)}
                  className="flex-1 py-3 rounded-2xl bg-stone-100 text-stone-600 text-sm font-bold hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    void handleDeactivate();
                  }}
                  disabled={isDeactivating}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}



function MobileProfileView({ profileState }: { profileState: ProfileState }) {
    const router = useRouter();
    const path = useTheparam();
      
    const pathMapping = {
      vendor: <VendorMobileDock />,
      home: <MobileDock />
    }
  return (
    <section className="flex flex-col md:hidden min-h-screen bg-[#f9f6ef] pb-32">
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-4 bg-[#f9f6ef]/90 backdrop-blur-sm border-b border-stone-100">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-stone-100 shadow-sm">
          <BackArrow />
        </button>
        <h1 className="text-base font-bold text-stone-900">Profile</h1>
        {/* Spacer to centre title */}
        <div className="w-9" />
      </header>
      <div className="px-4 pt-6 pb-10">
        <ProfileContent profileState={profileState} />
      </div>
      {pathMapping[path]}
    </section>
  );
}

function TabletProfileView({ profileState }: { profileState: ProfileState }) {
  const router = useRouter();
  const path = useTheparam();
    
  const pathMapping = {
    vendor: <VendorMobileDock />,
    home: <MobileDock />
  }
  return (
    <section className="hidden md:flex xl:hidden flex-col min-h-screen bg-[#f9f6ef] pb-32">
      <header className="sticky top-0 z-40 flex items-center px-8 py-5 bg-[#f9f6ef]/90 backdrop-blur-sm border-b border-stone-100 gap-4">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-stone-100 shadow-sm">
          <BackArrow />
        </button>
        <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
          Profile Settings
        </h1>
      </header>
      <div className="px-10 lg:px-14 pt-8 pb-10">
        <ProfileContent profileState={profileState} />
      </div>
      {pathMapping[path]}
    </section>
  );
}

function DesktopProfileView({ profileState }: { profileState: ProfileState }) {
    const path = useTheparam();
    const pathMapping = {
          vendor: <VendorSideNavBar />,
          home: <SideNavBar />
        }
  return (
    <section className="hidden xl:flex min-h-screen bg-[#f9f6ef]">
      
      {pathMapping[path]}

      <div className="w-[85%] ml-[15%]">
        <div className="px-4 pb-28 pt-8 md:px-10 lg:px-14 xl:px-16">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight mb-1">
              Profile Settings
            </h1>
            <p className="text-stone-400 text-sm">
              Manage your account, bookings and preferences.
            </p>
          </div>
          <ProfileContent profileState={profileState} />
        </div>
      </div>
    </section>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const profileState = useProfile();

  return (
    <>
      <MobileProfileView profileState={profileState} />
      <TabletProfileView profileState={profileState} />
      <DesktopProfileView profileState={profileState} />
    </>
  );
}
