"use client";

import { useEffect, useRef, useState } from "react";

interface UsePopoverOptions {
  open: boolean;
  onClose: () => void;
  offset?: number;
  /** Anchor to the trigger's left edge + width. */
  matchWidth?: boolean;
  minWidth?: number;
}

/**
 * Shared popover plumbing: fixed-position anchoring, outside-click, Escape.
 * All setState lives inside rAF/listener callbacks - never synchronously in
 * an effect body (react-hooks/set-state-in-effect compliant). The popover
 * renders only once `pos` exists, so it never flashes at stale coordinates.
 *
 * T = the element the popover surface attaches to (div, ul, ...).
 */
export function usePopover<T extends HTMLElement = HTMLDivElement>({
  open,
  onClose,
  offset = 8,
  matchWidth = true,
  minWidth = 0,
}: UsePopoverOptions) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<T>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    let raf = 0;

    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({
        top: rect.bottom + offset,
        left: rect.left,
        width: matchWidth ? Math.max(rect.width, minWidth) : minWidth,
      });
    };

    raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true, capture: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, offset, matchWidth, minWidth]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (!anchorRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        onClose();
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return { anchorRef, popoverRef, pos };
}