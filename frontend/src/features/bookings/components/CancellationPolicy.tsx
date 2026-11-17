"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Clock3, LockKeyhole, ShieldCheck, Undo2 } from "lucide-react";
import Modal from "@/features/createListing/components/shared/Modal";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * The policy shown here is the policy the backend actually enforces:
 *  • escrow funding on charge success (Booking.settleSuccessfulCharge)
 *  • 24h vendor confirmation window, then auto-cancel + full refund
 *    (jobs/vendorConfirmationTimeout.job.ts)
 *  • refund requests until dispute_window_closes_at = event end + 24h
 *    (BookingHub.requestRefund), support-reviewed, FULL refunds only
 *  • dates held only while the payment popup is open (2-min rolling lease,
 *    30-minute hard session cap)
 * Keep this copy in lockstep with those paths and /terms.
 */
const HIGHLIGHTS = [
  {
    icon: LockKeyhole,
    title: "Your money is held in escrow",
    body: "The vendor is only paid after your event ends and the 24-hour dispute window closes.",
  },
  {
    icon: Undo2,
    title: "Full refund before confirmation",
    body: "Cancel before the vendor confirms and you get 100% of what you paid back.",
  },
  {
    icon: Clock3,
    title: "24 hours to confirm - or we refund you",
    body: "If the vendor doesn't confirm within 24 hours of payment, we cancel and refund automatically.",
  },
];

const FULL_SECTIONS: { heading: string; items: string[] }[] = [
  {
    heading: "Holding your dates",
    items: [
      "Your dates are held only while the secure payment popup is open. Closing or cancelling it releases them immediately.",
      "Each payment session lasts up to 30 minutes. If it ends, nothing is charged - just tap Pay again to start a fresh hold.",
      "A hold is not a booking. Only a successful payment secures your dates.",
    ],
  },
  {
    heading: "Cancelling and refunds",
    items: [
      "Unpaid selections simply expire - nothing to cancel and nothing to refund.",
      "Cancel a paid booking before the vendor confirms and you receive a full refund.",
      "If the vendor doesn't confirm within 24 hours of payment, the booking is cancelled and refunded in full automatically.",
      "You can request a refund up to 24 hours after your event ends. Requests are reviewed by our support team before being processed.",
      "Once the dispute window closes and the vendor has been paid, refunds are no longer available through the platform - contact support for exceptional cases.",
      "Only full refunds are supported. For partial adjustments, contact support@eventvnv.com.",
    ],
  },
  {
    heading: "How long refunds take",
    items: [
      "Approved refunds go back to your original payment method.",
      "Depending on your bank or card provider, the money typically lands within 3-10 business days.",
      "Always quote your booking reference (it starts with EVV-) when contacting support.",
    ],
  },
  {
    heading: "Your responsibilities",
    items: [
      "Provide accurate event details, and for services, a correct delivery address.",
      "Follow the vendor's house rules and prepare any facilities they require before they arrive.",
      "You're responsible for damage caused to a venue or equipment during your booking.",
      "Keep payments and coordination on EventVnV - off-platform payments lose escrow protection and dispute rights.",
    ],
  },
];

interface CancellationPolicyProps {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  className?: string;
}

export default function CancellationPolicy({
  accepted,
  onAcceptedChange,
  className = "",
}: CancellationPolicyProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section
      className={`rounded-[1.75rem] border border-[#EFE8DE] bg-white p-6 shadow-[0_10px_30px_rgba(36,28,18,0.05)] md:p-7 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1E6] text-[#B9401D]">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-man text-base font-extrabold text-[#252423] md:text-lg">
            Cancellation &amp; booking terms
          </h3>
          <p className="mt-0.5 text-tiny font-semibold text-[#7B7E9B] md:text-xs">
            Escrow-protected. No hidden fees.
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-3.5">
        {HIGHLIGHTS.map((item, index) => (
          <motion.li
            key={item.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 + index * 0.07, ease: EASE_OUT }}
            className="flex gap-3"
          >
            <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#B9401D]" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-small font-extrabold text-[#252423] md:text-sm">{item.title}</p>
              <p className="mt-0.5 text-tiny leading-5 text-[#5E6588] md:text-xs">{item.body}</p>
            </div>
          </motion.li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-5 text-small font-extrabold text-[#B9401D] underline underline-offset-4 transition-opacity hover:opacity-80 md:text-sm"
      >
        Read the full policy
      </button>

      {/* Explicit consent - gates Continue in BookingDetailsStep */}
      <button
        type="button"
        role="checkbox"
        aria-checked={accepted}
        onClick={() => onAcceptedChange(!accepted)}
        className="mt-5 flex w-full items-start gap-3 rounded-2xl bg-[#F7F2EA] p-4 text-left transition-colors hover:bg-[#F2EBE0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B9401D]"
      >
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            accepted ? "border-[#B9401D] bg-[#B9401D]" : "border-[#C9BFB2] bg-white"
          }`}
          aria-hidden="true"
        >
          {accepted && (
            <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ duration: 0.16 }}>
              <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
            </motion.span>
          )}
        </span>
        <span className="text-tiny font-semibold leading-5 text-[#3A3734] md:text-xs">
          I agree to the{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="font-extrabold text-[#B9401D] underline underline-offset-2"
          >
            Terms of Service
          </Link>{" "}
          and the cancellation &amp; refund policy above.
        </span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Cancellation & booking policy"
        description="How holds, escrow, cancellations and refunds work on EventVnV."
        maxWidthClassName="max-w-xl"
        footer={
          <button
            type="button"
            onClick={() => {
              onAcceptedChange(true);
              setIsOpen(false);
            }}
            className="w-full rounded-full bg-[#B9401D] py-3.5 text-sm font-extrabold text-white transition-all hover:brightness-95 active:scale-[0.99]"
          >
            Agree to the policy
          </button>
        }
      >
        <div className="space-y-6">
          {FULL_SECTIONS.map((section) => (
            <section key={section.heading}>
              <h4 className="font-man text-sm font-extrabold text-[#252423]">{section.heading}</h4>
              <ul className="mt-2.5 space-y-2">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-tiny leading-6 text-[#5E6588] md:text-xs">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#B9401D]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="border-t border-[#EFE8DE] pt-4 text-tiny font-semibold text-[#7B7E9B]">
            The complete legal text lives in our{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noreferrer"
              className="font-extrabold text-[#B9401D] underline underline-offset-2"
            >
              Terms of Service
            </Link>
            . Questions? Visit the{" "}
            <Link
              href="/help/cancellations-and-refunds"
              target="_blank"
              rel="noreferrer"
              className="font-extrabold text-[#B9401D] underline underline-offset-2"
            >
              Help Center
            </Link>
            .
          </p>
        </div>
      </Modal>
    </section>
  );
}