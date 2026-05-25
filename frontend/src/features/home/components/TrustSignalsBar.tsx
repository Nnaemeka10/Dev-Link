"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, LockKeyhole, ThumbsUp } from "lucide-react";

// ─── Types & Data ─────────────────────────────────────────────────────────────

interface TrustSignal {
  id: string;
  label: string;
  icon: "verified" | "escrow" | "trusted";
}

const TRUST_SIGNALS: TrustSignal[] = [
  { id: "verified", label: "Verified luxury vendors", icon: "verified" },
  { id: "escrow",   label: "Secure escrow payments",  icon: "escrow"   },
  { id: "trusted",  label: "Trusted by 10k+ hosts",   icon: "trusted"  },
];

function TrustIcon({ type }: { type: TrustSignal["icon"] }) {
  const cls = "h-4 w-4 flex-shrink-0 text-white";
  if (type === "verified") return <BadgeCheck className={cls} />;
  if (type === "escrow")   return <LockKeyhole className={cls} />;
  return <ThumbsUp className={cls} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrustSignalsBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // ── Pause control ────────────────────────────────────────────────────────────
  // Ref — not state — so pausing/resuming never triggers a re-render.
  // The interval callback reads the ref value directly.
  const isPausedRef   = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef   = useRef<HTMLDivElement>(null);

  // ── Auto-rotation ─────────────────────────────────────────────────────────
  // We check prefers-reduced-motion once at effect time (not in a lazy
  // initialiser) because it's only used to gate a side-effect, not render output.
  // setState is called inside the interval callback — not synchronously in
  // the effect body — so no cascading render lint error.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    const id = setInterval(() => {
      if (!isPausedRef.current) {
        setCurrentIndex((prev) => (prev + 1) % TRUST_SIGNALS.length);
      }
    }, 3000);

    return () => clearInterval(id);
  }, []); // runs once — isPausedRef is a ref so it doesn't need to be a dep

  // ── Touch / mouse pause ────────────────────────────────────────────────────
  // Pause when user interacts, resume 5s after last interaction.
  // All mutation is to refs — zero re-renders.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function pause() {
      isPausedRef.current = true;
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        isPausedRef.current = false;
      }, 5000);
    }

    container.addEventListener("touchstart", pause, { passive: true });
    container.addEventListener("mousedown",  pause);

    return () => {
      container.removeEventListener("touchstart", pause);
      container.removeEventListener("mousedown",  pause);
      clearTimeout(resumeTimerRef.current);
    };
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="bg-bg-tertiary px-4 py-8 md:px-8 md:py-10">

      {/* ── Mobile: fade carousel ─────────────────────────────────────────── */}
      {/*
        Each signal is absolutely positioned and fills the container.
        We toggle opacity + pointer-events based on currentIndex.
        No translateX, no sliding — pure opacity cross-fade.
        transition-opacity with duration-400 gives the 300-500ms feel requested.
      */}
      <div
        ref={containerRef}
        className="md:hidden mx-auto max-w-7xl"
        aria-live="polite"        // announces signal changes to screen readers
        aria-atomic="true"        // reads the whole new signal, not just the diff
      >
        <div className="relative h-20 overflow-hidden rounded-[1.6rem] bg-[#C8562D]">
          {TRUST_SIGNALS.map((signal, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={signal.id}
                aria-hidden={!isActive}
                className={[
                  "absolute inset-0 flex items-center justify-center gap-2 px-5",
                  "transition-opacity duration-400 ease-in-out",
                  isActive
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none",
                ].join(" ")}
              >
                <TrustIcon type={signal.icon} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                  {signal.label}
                </span>
              </div>
            );
          })}

          {/* Dot indicators */}
          <div
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5"
            aria-hidden="true"
          >
            {TRUST_SIGNALS.map((_, i) => (
              <span
                key={i}
                className={[
                  "block h-1 rounded-full transition-all duration-300",
                  i === currentIndex
                    ? "w-4 bg-white"
                    : "w-1 bg-white/40",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Desktop: static grid ─────────────────────────────────────────── */}
      <div className="hidden md:flex no-scrollbar mx-auto max-w-7xl gap-0 overflow-x-auto rounded-[1.6rem] bg-transparent motion-safe:animate-[var(--animate-fade-up)]">
        {TRUST_SIGNALS.map((signal, index) => (
          <div
            key={signal.id}
            className={[
              "flex min-w-0 flex-1 items-center justify-center gap-2 px-5 py-4",
              "text-xs font-semibold uppercase tracking-[0.12em] text-black",
              index !== TRUST_SIGNALS.length - 1 ? "border-r border-text-primary/10" : "",
            ].join(" ")}
          >
            {/* Desktop icons use accent colour, not white */}
            {signal.icon === "verified" && <BadgeCheck className="h-4 w-4 flex-shrink-0 text-accent-primary" />}
            {signal.icon === "escrow"   && <LockKeyhole className="h-4 w-4 flex-shrink-0 text-accent-primary" />}
            {signal.icon === "trusted"  && <ThumbsUp    className="h-4 w-4 flex-shrink-0 text-accent-primary" />}
            {signal.label}
          </div>
        ))}
      </div>

    </section>
  );
}