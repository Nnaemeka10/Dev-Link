"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BadgeCheck, LockKeyhole, ThumbsUp } from "lucide-react";

//  Types & Data 

interface TrustSignal {
  id: string;
  label: string;
  icon: "verified" | "escrow" | "trusted";
}

const TRUST_SIGNALS: TrustSignal[] = [
  { id: "verified", label: "Verified luxury vendors", icon: "verified" },
  { id: "escrow", label: "Secure escrow payments", icon: "escrow" },
  { id: "trusted", label: "Trusted by 10k+ hosts", icon: "trusted" },
];

function TrustIcon({ type }: { type: TrustSignal["icon"] }) {
  const cls = "h-4 w-4 flex-shrink-0 text-white";
  if (type === "verified") return <BadgeCheck className={cls} />;
  if (type === "escrow") return <LockKeyhole className={cls} />;
  return <ThumbsUp className={cls} />;
}

//  Media queries as external stores 
// Viewport size and the user's motion preference live outside React - they're
// browser state, so we subscribe to them with useSyncExternalStore instead of
// copying them into state from inside an effect.
//
// The subscribe/getSnapshot functions live at module level so their identities
// are stable. Inlining them in the component would create a new subscribe
// function every render and resubscribe the store each time.

function subscribeToMediaQuery(query: string, onChange: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const subscribeMobile = (onChange: () => void) =>
  subscribeToMediaQuery("(max-width: 767px)", onChange);
const subscribeReducedMotion = (onChange: () => void) =>
  subscribeToMediaQuery("(prefers-reduced-motion: reduce)", onChange);

const getIsMobile = () => window.matchMedia("(max-width: 767px)").matches;
const getPrefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The server can't know the viewport or the motion preference. `false` matches
// what the SSR markup implies anyway (the carousel is CSS-gated with md:hidden),
// so the hydration render is byte-identical, and React re-renders with the real
// value right after hydration.
const getServerMediaSnapshot = () => false;

//  Component 
export default function TrustSignalsBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reactive environment flags - read from the browser store, not effect-copied.
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    getIsMobile,
    getServerMediaSnapshot
  );
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getPrefersReducedMotion,
    getServerMediaSnapshot
  );

  //  Pause control 
  // Ref - not state - so pausing/resuming never triggers a re-render.
  // The interval callback reads the ref value directly.
  const isPausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  //  Auto-rotation 
  // The gates are reactive values now, not one-shot reads at mount time:
  // rotation starts/stops live when the viewport crosses the md boundary or
  // the user toggles their OS reduced-motion preference. The interval restarts
  // (deps change - cleanup - setup), which also resets the 3s beat cleanly.
  // setState is still only ever called from inside the interval callback -
  // never synchronously in the effect body.
  useEffect(() => {
    if (prefersReducedMotion || !isMobile) return;

    const id = setInterval(() => {
      if (!isPausedRef.current) {
        setCurrentIndex((prev) => (prev + 1) % TRUST_SIGNALS.length);
      }
    }, 3000);

    return () => clearInterval(id);
  }, [prefersReducedMotion, isMobile]);

  //  Touch / mouse pause 
  // Pause when user interacts, resume 5s after last interaction.
  // All mutation is to refs - zero re-renders.
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
    container.addEventListener("mousedown", pause);

    return () => {
      container.removeEventListener("touchstart", pause);
      container.removeEventListener("mousedown", pause);
      clearTimeout(resumeTimerRef.current);
    };
  }, []);

  //  Render 

  return (
    <section className="bg-bg-tertiary px-4 py-8 md:px-8 md:py-10">

      {/*  Mobile: fade carousel  */}
      {/*
        Each signal is absolutely positioned and fills the container.
        We toggle opacity + pointer-events based on currentIndex.
        No translateX, no sliding - pure opacity cross-fade.
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

      {/*  Desktop: static grid  */}
      <div className="hidden md:flex no-scrollbar mx-auto max-w-7xl gap-0 overflow-x-auto rounded-[1.6rem] bg-transparent motion-safe:animate-fade-up">
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
            {signal.icon === "verified" && <BadgeCheck className="h-4 w-4 shrink-0 text-accent-primary" />}
            {signal.icon === "escrow"   && <LockKeyhole className="h-4 w-4 shrink-0 text-accent-primary" />}
            {signal.icon === "trusted"  && <ThumbsUp    className="h-4 w-4 shrink-0 text-accent-primary" />}
            {signal.label}
          </div>
        ))}
      </div>

    </section>
  );
}