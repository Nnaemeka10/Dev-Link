"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Modal from "@/features/createListing/components/shared/Modal";
import { useTypewriter } from "../../hooks/useTypewriter";

const PREVIEW_LENGTH = 205;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Cut on a word boundary so the preview never ends mid-word. */
function toPreview(text: string): string {
  const clean = text.trim();
  if (clean.length <= PREVIEW_LENGTH) return clean;
  const slice = clean.slice(0, PREVIEW_LENGTH);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > PREVIEW_LENGTH * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd();
}

function Caret({ solid }: { solid: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute -right-0.75 top-[0.2em] h-[0.95em] w-0.5 rounded-full bg-[#B9401D] ${
        solid ? "" : "animate-[caret-blink_1s_steps-end_infinite]"
      }`}
    />
  );
}

interface AboutSectionProps {
  description: string;
  /** Mobile card treatment: typed preview + "Read more" sheet. */
  compact?: boolean;
  title?: string;
}

/**
 * Compact: the preview types itself in once, on scroll into view, behind a
 * caret that goes solid while characters land and blinks when they stop.
 * The full preview is rendered invisibly in the same grid cell, so the
 * container reserves its final height from frame one and typing never reflows
 * the card, the badges above it, or the sections below it.
 *
 * Expanded (tablet/desktop, and the Read-more sheet): no caret, just a
 * paragraph-by-paragraph fade/rise.
 */
export default function AboutSection({
  description,
  compact = false,
  title = "About this venue",
}: AboutSectionProps) {
  const reduced = useReducedMotion();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const text = (description ?? "").trim();
  const preview = useMemo(() => toPreview(text), [text]);
  const isTruncated = preview.length < text.length;

  const paragraphs = useMemo(
    () => text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
    [text],
  );

  const { ref, visibleText, done, isTyping } = useTypewriter(preview, {
    charsPerSecond: 165,
    startInView: true,
  });

  if (!text) return null;

  if (!compact) {
    return (
      <section className="py-9">
        <h2 className="text-xl font-medium text-[#3A3734]">{title}</h2>
        <div className="mt-4 space-y-5 text-small font-medium leading-8 text-[#5E6588] md:text-base">
          {paragraphs.map((paragraph, index) => (
            <motion.p
              key={index}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: EASE_OUT }}
              className="whitespace-pre-line"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <div className="text-small font-medium leading-8 text-[#5E6588] md:text-base">
        <div ref={ref} className="grid">
          {/* Height reserve - identical string, identical wrapping, zero CLS. */}
          <span
            aria-hidden="true"
            className="invisible col-start-1 row-start-1 whitespace-pre-wrap wrap-break-word"
          >
            {preview}
            {isTruncated ? "…" : ""}
          </span>

          {/* Screen readers get the whole preview once; the animated layer is hidden from AT. */}
          <span className="sr-only">
            {preview}
            {isTruncated ? "…" : ""}
          </span>

          <span
            aria-hidden="true"
            className="col-start-1 row-start-1 whitespace-pre-wrap wrap-break-word"
          >
            {visibleText}
            {isTruncated && done ? "…" : ""}
            {!done && (
              <span className="relative inline-block w-0 align-baseline">
                <Caret solid={isTyping} />
              </span>
            )}
          </span>
        </div>
      </div>

      {isTruncated && (
        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className="mt-4 inline-flex items-center gap-1 rounded-full text-small font-extrabold text-[#B9401D] underline-offset-4 transition-opacity hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B9401D] md:text-sm"
        >
          Read more
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}

      <Modal
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={title}
        maxWidthClassName="max-w-xl"
        footer={
          <button
            type="button"
            onClick={() => setIsSheetOpen(false)}
            className="w-full rounded-full bg-text-primary py-3.5 text-sm font-bold text-white transition-all hover:bg-text-primary/85 active:scale-[0.99]"
          >
            Done
          </button>
        }
      >
        <div className="space-y-5 text-small font-medium leading-8 text-[#5E6588] md:text-base">
          {paragraphs.map((paragraph, index) => (
            <motion.p
              key={index}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: reduced ? 0 : 0.05 + index * 0.07,
                ease: EASE_OUT,
              }}
              className="whitespace-pre-line"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>
      </Modal>

      {/* Caret keyframes are scoped here so no global stylesheet edit is needed. */}
      <style jsx>{`
        @keyframes caret-blink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}