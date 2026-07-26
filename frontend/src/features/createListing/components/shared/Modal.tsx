"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClassName?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidthClassName = "max-w-lg",
}: ModalProps) {
  const [mounted] = useState(() => typeof document !== "undefined");

  // useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-end justify-center xs:items-center xs:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 bg-text-primary/40 backdrop-blur-sm animate-fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 flex max-h-[88vh] w-full ${maxWidthClassName} animate-fade-up flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-modal xs:rounded-card`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5">
          <div>
            <h2 id="modal-title" className="font-man text-lg font-bold text-text-primary">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-text-primary/55">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-2 text-text-primary/50 transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && <div className="border-t border-black/5 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}