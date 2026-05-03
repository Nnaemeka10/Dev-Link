"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useCallback, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const SERVICE_CATEGORIES = [
  { id: "dj", label: "DJ" },
  { id: "mc", label: "MC" },
  { id: "photographer", label: "Photographer" },
  { id: "videographer", label: "Videographer" },
  { id: "planner", label: "Event Planner" },
  { id: "makeup", label: "Make-up Artist" },
  { id: "ushers", label: "Ushers" },
  { id: "security", label: "Security" },
  { id: "car-rental", label: "Car Rental" },
  { id: "hall-decorator", label: "Hall Decorator" },
];

interface RoleDropdownProps {
  value: string | undefined;
  onChange: (role: string | undefined) => void;
  disabled?: boolean;
}

export function RoleDropdown({
  value,
  onChange,
  disabled = false,
}: RoleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownTop, setDropdownTop] = useState<number | null>(null);
  const [dropdownLeft, setDropdownLeft] = useState<number | null>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const selectedLabel =
    SERVICE_CATEGORIES.find((cat) => cat.id === value)?.label ?? "Select role";

  const handleSelect = useCallback(
    (id: string) => {
      onChange(value === id ? undefined : id);
      setIsOpen(false);
    },
    [value, onChange]
  );

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const clickedContainer = containerRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);

      if (!clickedContainer && !clickedDropdown) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // Update dropdown position when open
  useEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownTop(rect.bottom + 8);
      setDropdownLeft(rect.left);
      setDropdownWidth(rect.width);
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40"
          />
          <motion.ul
            ref={dropdownRef}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            aria-label="Service roles"
            style={{
              position: "fixed",
              top: dropdownTop ? `${dropdownTop}px` : 0,
              left: dropdownLeft ? `${dropdownLeft}px` : 0,
              width: dropdownWidth ? `${dropdownWidth}px` : "auto",
            }}
            className="z-50 min-w-48 max-h-80 overflow-y-auto rounded-2xl bg-white py-2 shadow-[0_8px_24px_rgba(26,31,60,0.14)]"
          >
            {SERVICE_CATEGORIES.map((category) => (
              <li key={category.id} role="option" aria-selected={value === category.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(category.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-text-primary hover:bg-bg-primary transition-colors"
                >
                  <span>{category.label}</span>
                  {value === category.id && (
                    <Check className="h-4 w-4 shrink-0 text-accent-primary" />
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div
        ref={containerRef}
        className="relative flex flex-1 items-center gap-3 md:border-l md:border-text-primary/10 px-5"
      >
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-primary/45">
            Role
          </p>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full bg-transparent text-left text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${value ? "text-text-primary" : "text-text-primary/45"}`}
          >
            {selectedLabel}
          </button>
        </div>
      </div>

      {portalTarget ? createPortal(dropdownContent, portalTarget) : null}
    </>
  );
}
