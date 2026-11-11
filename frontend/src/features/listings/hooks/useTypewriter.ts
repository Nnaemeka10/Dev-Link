"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface TypewriterOptions {
  /** Reveal speed in characters per second. */
  charsPerSecond?: number;
  /** Start only when the element scrolls into view (never types off-screen). */
  startInView?: boolean;
}

/**
 * Frame-budgeted typewriter.
 *
 * - rAF-driven and time-based: characters are revealed against elapsed time,
 *   so the cadence is identical on 60Hz and 120Hz displays and never drifts
 *   when a frame is dropped.
 * - State is only committed when the visible character count actually
 *   changes, so a long preview costs ~60 renders/sec at most, not one per char.
 * - `prefers-reduced-motion` resolves to the full string on the first frame.
 * - The full string is always the fallback path (no IntersectionObserver,
 *   empty text), so content can never end up permanently hidden.
 */
export function useTypewriter(text: string, options: TypewriterOptions = {}) {
  const { charsPerSecond = 150, startInView = true } = options;

  const chars = useRef<string[]>([]);
  chars.current = Array.from(text ?? "");
  const total = chars.current.length;

  const [node, setNode] = useState<HTMLElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [done, setDone] = useState(false);

  const frameRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const length = chars.current.length;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || length === 0) {
      setVisibleCount(length);
      setDone(true);
      return;
    }

    const startAt = performance.now();
    let last = -1;

    const tick = (now: number) => {
      const next = Math.min(
        length,
        Math.floor(((now - startAt) / 1000) * charsPerSecond),
      );
      if (next !== last) {
        last = next;
        setVisibleCount(next);
      }
      if (next >= length) {
        frameRef.current = null;
        setDone(true);
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [charsPerSecond]);

  // Reset when the source text changes (e.g. navigating between listings).
  useEffect(() => {
    startedRef.current = false;
    setVisibleCount(0);
    setDone(false);
    stop();
  }, [text, stop]);

  useEffect(() => {
    if (!startInView) {
      start();
      return stop;
    }
    if (!node) return stop;

    if (typeof IntersectionObserver === "undefined") {
      start();
      return stop;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          start();
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [node, startInView, start, stop]);

  const ref = useCallback((element: HTMLElement | null) => setNode(element), []);

  return {
    ref,
    visibleText: chars.current.slice(0, visibleCount).join(""),
    done,
    /** True while characters are still landing - drives the solid caret. */
    isTyping: visibleCount > 0 && !done,
  };
}