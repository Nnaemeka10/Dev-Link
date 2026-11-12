"use client";
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface PhotoLightboxProps {
  photos: { url: string; alt: string }[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function PhotoLightbox({ photos, index, onClose, onNavigate }: PhotoLightboxProps) {
  const total = photos.length;
  const prev = useCallback(() => onNavigate((index - 1 + total) % total), [index, total, onNavigate]);
  const next = useCallback(() => onNavigate((index + 1) % total), [index, total, onNavigate]);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, prev, next]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-1200 flex flex-col bg-black/95"
      role="dialog" aria-modal="true" aria-label={`Photo ${index + 1} of ${total}`}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx > 56) prev(); else if (dx < -56) next();
        touchX.current = null;
      }}
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between px-4 py-4 md:px-6">
        <button type="button" onClick={onClose} aria-label="Close photos"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10">
          <X className="h-6 w-6" />
        </button>
        <p className="text-sm font-semibold tabular-nums text-white/80">{index + 1} / {total}</p>
        <span className="h-10 w-10" aria-hidden="true" />
      </div>

      {/* Image stage */}
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 px-2 pb-6 md:px-16"
          >
            <Image
              src={photos[index].url}
              alt={photos[index].alt}
              fill priority sizes="100vw"
              className="object-contain"
            />
          </motion.div>
        </AnimatePresence>

        {total > 1 && (
          <>
            <button type="button" onClick={prev} aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition hover:bg-black/70 md:left-6">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button type="button" onClick={next} aria-label="Next photo"
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition hover:bg-black/70 md:right-6">
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </motion.div>,
    document.body,
  );
}