"use client";

import { useEffect, useState } from "react";

/**
 * Scroll-direction aware collapse for the sticky explore header.
 * Down past `threshold` - collapsed. Any upward scroll - expanded.
 * setState only inside the rAF callback - lint-clean.
 */
export function useScrollCollapse(threshold = 120) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const delta = y - lastY;
        if (y < 24) setCollapsed(false);
        else if (delta > 4 && y > threshold) setCollapsed(true);
        else if (delta < -4) setCollapsed(false);
        lastY = y;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold]);

  return { collapsed, expand: () => setCollapsed(false) };
}