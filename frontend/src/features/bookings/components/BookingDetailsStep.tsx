"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  Check,
  Info,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Star,
  UsersRound,
} from "lucide-react";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import { useNigeriaLgas, useNigeriaStates } from "@/hooks/useNigeriaLocations";
import type { ListingDetailsResponse } from "@/features/listings/details.types";
import PackageAccordion from "@/features/listings/components/details/PackageAccordion";
import { envelope, excludedDates } from "@/features/search/utils/rangeSelection";
import { MAX_GUESTS_FALLBACK, MAX_PREFERENCES_LENGTH, MIN_GUESTS } from "../booking.data";
import type { BookingFormState } from "../booking.types";
import { usePricingQuote } from "../hooks/usePricingQuote";
import CancellationPolicy from "./CancellationPolicy";
import { DateTimeSection } from "./DateTimeSection";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const FALLBACK_IMAGE = "/placeholder.jpg";

function naira(value: number): string {
  return `₦${value.toLocaleString("en-NG")}`;
}

/** True when the service delivery address is complete enough to submit. */
export function isEventLocationComplete(form: BookingFormState): boolean {
  return (
    form.eventLocation.address.trim().length >= 5 &&
    !!form.eventLocation.stateId &&
    !!form.eventLocation.lgaId
  );
}

/**
 * Single source of truth for "can this booking proceed?".
 * BookingDetailsStep renders it as a checklist and disables Continue;
 * the page uses it to bounce a deep-linked ?step=2 back to step 1.
 * (Price availability is additionally enforced by the button.)
 */
export function bookingDetailsRequirements(
  form: BookingFormState,
  listing: ListingDetailsResponse
): string[] {
  const missing: string[] = [];
  if (form.dateRanges.length === 0) missing.push("Select your event dates");
  if (listing.kind === "service") {
    if (listing.packages?.length && !form.packageId) missing.push("Choose a package");
    if (!isEventLocationComplete(form)) missing.push("Add the event location");
  }
  if (!form.termsAccepted) missing.push("Accept the cancellation & booking terms");
  return missing;
}

interface BookingDetailsStepProps {
  form: BookingFormState;
  listing: ListingDetailsResponse;
  onContinue: () => void;
  onUpdate: (patch: Partial<BookingFormState>) => void;
  variant?: "desktop" | "mobile";
}

//  Shared pieces

function VenueCard({
  listing,
  compact,
}: {
  listing: ListingDetailsResponse;
  compact: boolean;
}) {
  const image = listing.primaryImage?.url || listing.images[0]?.url || FALLBACK_IMAGE;
  const isService = listing.kind === "service";
  const coverage = (listing.serviceAreas ?? [])
    .map((area) => area.city)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
  const locationLabel = isService ? coverage || listing.location : listing.location;

  return (
    <article
      className={`flex items-center gap-4 rounded-[1.75rem] bg-white shadow-[0_18px_40px_rgba(34,27,18,0.06)] ${
        compact ? "p-5" : "gap-6 rounded-[2.2rem] p-8"
      }`}
    >
      <Image
        src={image}
        alt={listing.title}
        width={compact ? 96 : 112}
        height={compact ? 96 : 112}
        className={`shrink-0 rounded-[1.4rem] object-cover ${compact ? "h-24 w-24" : "h-28 w-28"}`}
      />
      <div className="min-w-0">
        {!compact && (
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#7B7E9B]">
            Current selection
          </p>
        )}
        <h2
          className={`truncate font-extrabold text-[#252423] ${
            compact ? "text-base" : "mt-2 text-2xl"
          }`}
        >
          {listing.title}
        </h2>
        <p className="mt-1 flex items-center gap-1 text-tiny font-semibold text-[#5E6588] md:text-sm">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{locationLabel || "Location not set"}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFE3A2] px-2.5 py-1 text-micro font-extrabold text-[#7E6000]">
            <Star className="h-3 w-3 fill-current" aria-hidden="true" />
            {listing.rating.toFixed(1)} ({listing.reviewCount})
          </span>
          {/* Capacity is a HALL concept - services travel, they have no capacity. */}
          {!isService && listing.capacity ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F1EA] px-2.5 py-1 text-micro font-extrabold text-[#B9401D]">
              <UsersRound className="h-3 w-3" aria-hidden="true" />
              Up to {listing.capacity.toLocaleString()} guests
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  tone = "light",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  tone?: "light" | "muted";
}) {
  return (
    <section
      className={`rounded-[1.75rem] p-6 md:p-7 ${
        tone === "muted"
          ? "bg-[#F4F1EA]"
          : "bg-white shadow-[0_18px_40px_rgba(34,27,18,0.06)]"
      }`}
    >
      <h3 className="font-man text-base font-extrabold text-[#252423] md:text-lg">{title}</h3>
      {subtitle && (
        <p className="mt-1 text-tiny font-semibold text-[#7B7E9B] md:text-xs">{subtitle}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function GuestStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    const parsed = parseInt(draft, 10);
    const next = Number.isFinite(parsed)
      ? Math.max(MIN_GUESTS, Math.min(max, parsed))
      : value;
    onChange(next);
    setEditing(false);
  };

  const buttonClass =
    "flex h-10 w-10 items-center justify-center rounded-full border border-[#DED5C8] bg-white text-[#252423] transition-all hover:border-[#B9401D]/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F7F2EA] px-4 py-3">
      <span className="text-small font-bold text-[#3A3734] md:text-sm">Expected guests</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Decrease guests"
          disabled={value <= MIN_GUESTS}
          onClick={() => onChange(Math.max(MIN_GUESTS, value - 1))}
          className={buttonClass}
        >
          <Minus className="h-4 w-4" />
        </button>
        {editing ? (
          <input
            autoFocus
            type="number"
            inputMode="numeric"
            value={draft}
            min={MIN_GUESTS}
            max={max}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit();
              if (event.key === "Escape") setEditing(false);
            }}
            aria-label="Expected guests"
            className="w-20 rounded-lg border border-[#DED5C8] bg-white px-2 py-1.5 text-center text-sm font-extrabold text-[#252423] focus:border-[#B9401D] focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(String(value));
              setEditing(true);
            }}
            title="Tap to type a number"
            className="w-20 text-center text-base font-extrabold text-[#252423] underline decoration-[#C9BFB2] decoration-dotted underline-offset-4"
          >
            {value.toLocaleString()}
          </button>
        )}
        <button
          type="button"
          aria-label="Increase guests"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={buttonClass}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function EventLocationFields({
  form,
  onUpdate,
}: {
  form: BookingFormState;
  onUpdate: (patch: Partial<BookingFormState>) => void;
}) {
  const [touched, setTouched] = useState(false);
  const { data: states = [], isLoading: statesLoading } = useNigeriaStates();
  const { data: lgas = [], isLoading: lgasLoading } = useNigeriaLgas(form.eventLocation.stateId);

  const stateOptions = useMemo<DropdownOption[]>(
    () => states.map((state) => ({ value: state.id, label: state.name })),
    [states]
  );
  const lgaOptions = useMemo<DropdownOption[]>(
    () => lgas.map((lga) => ({ value: lga.id, label: lga.name })),
    [lgas]
  );

  const patchLocation = (patch: Partial<BookingFormState["eventLocation"]>) => {
    setTouched(true);
    onUpdate({ eventLocation: { ...form.eventLocation, ...patch } });
  };

  const addressInvalid = touched && form.eventLocation.address.trim().length < 5;
  const lgaInvalid = touched && !!form.eventLocation.stateId && !form.eventLocation.lgaId;

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="event-address"
          className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#555B7F]"
        >
          Street address
        </label>
        <input
          id="event-address"
          type="text"
          value={form.eventLocation.address}
          onChange={(event) => patchLocation({ address: event.target.value })}
          onBlur={() => setTouched(true)}
          placeholder="e.g. 12 Allen Avenue, opposite the park"
          autoComplete="street-address"
          aria-invalid={addressInvalid}
          className={`mt-2.5 w-full rounded-2xl border bg-white px-4 py-3.5 text-small font-semibold text-[#252423] outline-none transition-shadow placeholder:text-[#B69F98] focus:ring-2 md:text-sm ${
            addressInvalid
              ? "border-[#B9401D]/60 focus:ring-[#B9401D]/20"
              : "border-[#E8DDD2] focus:border-[#B9401D]/40 focus:ring-[#B9401D]/15"
          }`}
        />
        {addressInvalid && (
          <p className="mt-1.5 text-tiny font-bold text-[#B9401D]">
            Enter the full street address (at least 5 characters).
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Dropdown
          label="State"
          placeholder={statesLoading ? "Loading states…" : "Select a state"}
          options={stateOptions}
          value={form.eventLocation.stateId}
          disabled={statesLoading}
          onChange={(stateId) => patchLocation({ stateId, lgaId: "" })}
        />
        <Dropdown
          label="Local government"
          placeholder={
            !form.eventLocation.stateId
              ? "Select a state first"
              : lgasLoading
                ? "Loading LGAs…"
                : "Select an LGA"
          }
          options={lgaOptions}
          value={form.eventLocation.lgaId}
          disabled={!form.eventLocation.stateId || lgasLoading}
          onChange={(lgaId) => patchLocation({ lgaId })}
        />
      </div>
      {lgaInvalid && (
        <p className="text-tiny font-bold text-[#B9401D]">Select the local government.</p>
      )}

      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#555B7F]">
          Country
        </span>
        <div className="mt-2.5 flex items-center justify-between rounded-2xl bg-[#F7F2EA] px-4 py-3.5">
          <span className="text-small font-extrabold text-[#252423] md:text-sm">Nigeria</span>
          <span className="text-tiny font-bold text-[#9A9AAE]">Currently the only supported country</span>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-2xl bg-[#FFF7F2] px-4 py-3 text-tiny font-semibold leading-5 text-[#8A5A44]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B9401D]" aria-hidden="true" />
        This is where the vendor will deliver the service - not their business address. They see it
        before they approve your booking.
      </p>
    </div>
  );
}

function RequirementsList({ items }: { items: string[] }) {
  return (
    <AnimatePresence initial={false}>
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className="overflow-hidden"
        >
          <ul className="mt-4 space-y-1.5 rounded-2xl bg-[#FFF7F2] px-4 py-3">
            {items.map((item) => (
              <motion.li
                key={item}
                layout
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                className="flex items-center gap-2 text-tiny font-bold text-[#8A5A44]"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#B9401D]" aria-hidden="true" />
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

//  Step

export default function BookingDetailsStep({
  form,
  listing,
  onContinue,
  onUpdate,
  variant = "desktop",
}: BookingDetailsStepProps) {
  const router = useRouter();
  const isService = listing.kind === "service";
  const mobile = variant === "mobile";

  // dateRanges is the source of truth; the envelope + holes drive the quote.
  const dateRange = envelope(form.dateRanges);
  const excluded = excludedDates(form.dateRanges);
  const {
    data: quote,
    isLoading: isQuoteLoading,
    isError: isQuoteError,
    refetch: refetchQuote,
  } = usePricingQuote(listing.id, dateRange, form.packageId, excluded);

  const hasDates = form.dateRanges.length > 0;
  const selectedPackage = listing.packages?.find((pkg) => pkg.id === form.packageId);
  const missing = bookingDetailsRequirements(form, listing);
  // Never let the customer reach checkout without a computed price.
  const canContinue = missing.length === 0 && !!quote && !isQuoteLoading;
  const guestMax = listing.capacity && listing.capacity > 0 ? listing.capacity : MAX_GUESTS_FALLBACK;

  const handleDateRangesChange = (ranges: BookingFormState["dateRanges"]) =>
    onUpdate({ dateRanges: ranges, dateRange: envelope(ranges) });

  const mappedPackages = (listing.packages ?? []).map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    price: naira(pkg.price),
    description: pkg.description ?? "",
    isPopular: pkg.isPopular,
    features: pkg.features.map((feature) => feature.text),
  }));

  const hireLabel = isService ? "Service fee" : "Venue hire";

  const costPanel = (
    <SectionCard title="Estimated cost" tone={mobile ? "muted" : "light"}>
      {!hasDates ? (
        <div className="flex flex-col items-center py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F2EA] text-[#B9401D]">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-small font-extrabold text-[#252423]">
            Select dates to calculate price
          </p>
          <p className="mt-1 max-w-56 text-tiny font-semibold text-[#9A9AAE]">
            Your total is the daily rate × the days you keep, plus 7.5% VAT.
          </p>
        </div>
      ) : isQuoteLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-3/4 rounded bg-[#E8E4DC]" />
          <div className="h-4 w-1/2 rounded bg-[#E8E4DC]" />
          <div className="h-8 w-full rounded bg-[#E8E4DC]" />
        </div>
      ) : isQuoteError || !quote ? (
        <div className="flex flex-col items-center py-6 text-center">
          <AlertCircle className="h-6 w-6 text-[#B9401D]" aria-hidden="true" />
          <p className="mt-2 text-small font-extrabold text-[#252423]">
            We couldn&apos;t price these dates
          </p>
          <p className="mt-1 text-tiny font-semibold text-[#9A9AAE]">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => void refetchQuote()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#E8DDD2] px-5 py-2 text-tiny font-extrabold text-[#252423] transition-colors hover:bg-[#F7F2EA]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3.5 border-b border-[#E8DED2] pb-5">
            {selectedPackage && (
              <div className="flex justify-between gap-6 text-small md:text-sm">
                <span className="text-[#6B5F57]">Package</span>
                <strong className="text-right text-[#252423]">{selectedPackage.name}</strong>
              </div>
            )}
            <div className="flex justify-between gap-6 text-small md:text-sm">
              <span className="text-[#6B5F57]">
                {hireLabel} × {quote.days} {quote.days === 1 ? "day" : "days"}
              </span>
              <strong className="text-[#252423]">{naira(quote.subtotal)}</strong>
            </div>
            <div className="flex justify-between gap-6 text-small text-[#555B7F] md:text-sm">
              <span>VAT (7.5%)</span>
              <span>{naira(quote.vat)}</span>
            </div>
            {excluded.length > 0 && (
              <p className="flex items-center gap-1.5 text-tiny font-bold text-[#2D5A27]">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {excluded.length} removed {excluded.length === 1 ? "day isn't" : "days aren't"} charged
              </p>
            )}
          </div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-small font-extrabold text-[#252423] md:text-base">Total estimate</p>
              <p className="mt-0.5 text-micro font-bold uppercase tracking-[0.14em] text-[#9A9AAE]">
                Includes VAT · no hidden fees
              </p>
            </div>
            <motion.strong
              key={quote.total}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="shrink-0 text-xl font-extrabold text-[#B9401D] md:text-3xl"
            >
              {naira(quote.total)}
            </motion.strong>
          </div>
        </>
      )}
    </SectionCard>
  );

  const notesField = (
    <SectionCard
      title="Notes for the vendor"
      subtitle="Optional - setup instructions, access details, anything they should know."
      tone={mobile ? "muted" : "light"}
    >
      <textarea
        value={form.preferences}
        onChange={(event) =>
          onUpdate({ preferences: event.target.value.slice(0, MAX_PREFERENCES_LENGTH) })
        }
        rows={4}
        placeholder="e.g. Load-in through the rear gate from 08:00. Two power outlets needed near the stage."
        className="w-full resize-none rounded-2xl border border-[#E8DDD2] bg-white px-4 py-3.5 text-small font-semibold text-[#252423] outline-none transition-shadow placeholder:text-[#B69F98] focus:border-[#B9401D]/40 focus:ring-2 focus:ring-[#B9401D]/15 md:text-sm"
      />
      <p className="mt-1.5 text-right text-micro font-bold text-[#9A9AAE]">
        {form.preferences.length}/{MAX_PREFERENCES_LENGTH}
      </p>
    </SectionCard>
  );

  const packageBlock =
    isService && mappedPackages.length > 0 ? (
      <SectionCard
        title="Choose a package"
        subtitle="Pick what fits - you can change this before you pay."
        tone={mobile ? "muted" : "light"}
      >
        <PackageAccordion
          packages={mappedPackages}
          selectedId={form.packageId ?? ""}
          onSelect={(id) => onUpdate({ packageId: id })}
          variant={mobile ? "mobile" : "desktop"}
        />
      </SectionCard>
    ) : null;

  const locationBlock = isService ? (
    <SectionCard
      title="Event location"
      subtitle="Where should the vendor show up?"
      tone={mobile ? "muted" : "light"}
    >
      <EventLocationFields form={form} onUpdate={onUpdate} />
    </SectionCard>
  ) : (
    <SectionCard
      title="Guest count"
      subtitle="Helps the vendor prepare the right setup."
      tone={mobile ? "muted" : "light"}
    >
      <GuestStepper
        value={form.guests}
        max={guestMax}
        onChange={(guests) => onUpdate({ guests })}
      />
      {listing.capacity ? (
        <p className="mt-2.5 text-tiny font-semibold text-[#7B7E9B]">
          This venue holds up to {listing.capacity.toLocaleString()} guests.
        </p>
      ) : null}
    </SectionCard>
  );

  const dateTime = (
    <DateTimeSection
      dateRanges={form.dateRanges}
      startTime={form.startTime}
      endTime={form.endTime}
      onDateRangesChange={handleDateRangesChange}
      onStartTimeChange={(startTime) => onUpdate({ startTime })}
      onEndTimeChange={(endTime) => onUpdate({ endTime })}
      unavailableDates={listing.unavailableDates ?? []}
      listingId={listing.id}
      availableFrom={listing.availableFrom}
      availableTo={listing.availableTo}
    />
  );

  if (mobile) {
    return (
      <section className="px-5 pb-64">
        <div className="space-y-6">
          <VenueCard listing={listing} compact />
          {dateTime}
          {packageBlock}
          {locationBlock}
          {notesField}
          {costPanel}
          <CancellationPolicy
            accepted={form.termsAccepted}
            onAcceptedChange={(termsAccepted) => onUpdate({ termsAccepted })}
          />
        </div>

        <div className="fixed inset-x-0 bottom-20 z-40 border-t border-[#EFE8DE] bg-bg-primary/95 px-5 pb-[env(safe-area-inset-bottom,0px)] pt-3 backdrop-blur">
          <AnimatePresence initial={false}>
            {missing.length > 0 && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pb-2 text-tiny font-bold text-[#8A5A44]"
              >
                {missing[0]}
                {missing.length > 1 ? ` · +${missing.length - 1} more` : ""}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between gap-4 py-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-small font-extrabold text-[#555B7F]"
            >
              ‹ Back
            </button>
            <button
              type="button"
              onClick={onContinue}
              disabled={!canContinue}
              className="rounded-full bg-[#B9401D] px-7 py-4 text-small font-extrabold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue to pay
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-8 py-12 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="space-y-6">
        <VenueCard listing={listing} compact={false} />
        {dateTime}
        {packageBlock}
        {locationBlock}
        {notesField}
      </div>

      <aside className="h-fit space-y-6 lg:sticky lg:top-8">
        {costPanel}
        <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_18px_40px_rgba(34,27,18,0.06)]">
          <RequirementsList items={missing} />
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="mt-4 w-full rounded-full bg-[#B9401D] px-8 py-5 text-base font-extrabold text-white shadow-[0_16px_26px_rgba(185,64,29,0.2)] transition-all hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {isQuoteLoading && hasDates ? "Calculating price…" : "Continue to payment"}
          </button>
          <p className="mt-3 text-center text-tiny font-semibold text-[#9A9AAE]">
            You won&apos;t be charged yet
          </p>
        </div>
        <CancellationPolicy
          accepted={form.termsAccepted}
          onAcceptedChange={(termsAccepted) => onUpdate({ termsAccepted })}
        />
      </aside>
    </section>
  );
}