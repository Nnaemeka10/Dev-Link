"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface CapacityDropdownProps {
  value: number | undefined;
  onChange: (capacity: number | undefined) => void;
  disabled?: boolean;
}

export function CapacityDropdown({
  value,
  onChange,
  disabled = false,
}: CapacityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInputMode, setIsInputMode] = useState(false);
  const [inputValue, setInputValue] = useState(value?.toString() ?? "");
  const [dropdownTop, setDropdownTop] = useState<number | null>(null);
  const [dropdownLeft, setDropdownLeft] = useState<number | null>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const handleIncrement = useCallback(
    (amount: number) => {
      const newValue = (value ?? 0) + amount;
      if (newValue >= 1) {
        onChange(newValue);
      }
    },
    [value, onChange]
  );

  const handleValueClick = useCallback(() => {
    setIsInputMode(true);
    setInputValue(value?.toString() ?? "");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    },
    []
  );

  const handleInputBlur = useCallback(() => {
    const num = inputValue.trim() ? parseInt(inputValue, 10) : undefined;
    if (num !== undefined && num >= 1) {
      onChange(num);
      setInputValue(num.toString());
    } else {
      setInputValue(value?.toString() ?? "");
    }
    setIsInputMode(false);
  }, [inputValue, value, onChange]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleInputBlur();
      }
    },
    [handleInputBlur]
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

  const displayValue = value ? `${value}` : "Add guests";

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
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              top: dropdownTop ? `${dropdownTop}px` : 0,
              left: dropdownLeft ? `${dropdownLeft}px` : 0,
              width: dropdownWidth ? `${dropdownWidth}px` : "auto",
            }}
            className="z-50 min-w-48 overflow-hidden rounded-2xl bg-white py-2 xl:py-3 shadow-[0_8px_24px_rgba(26,31,60,0.14)]"
          >
            <div className="px-3 xl:px-4 space-y-3 xl:space-y-4">
              <p className="text-[10px] xl:text-[11px] font-semibold uppercase tracking-[0.12em] text-text-primary/45">
                Adjust capacity
              </p>

              {isInputMode ? (
                <input
                  ref={inputRef}
                  type="number"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  min="1"
                  className="w-full rounded-lg border border-text-primary/10 px-2 xl:px-3 py-1.5 xl:py-2 text-center text-base xl:text-lg font-semibold text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                />
              ) : (
                <>
                  <div className="flex items-center gap-2 xl:gap-3">
                    {/* Left: Plus buttons */}
                    <div className="flex gap-2 flex-col-reverse">
                      <button
                        type="button"
                        onClick={() => handleIncrement(100)}
                        className="rounded-lg border border-text-primary/10 px-1.5 xl:px-2 py-2 xl:py-2.5 text-[10px] xl:text-xs font-semibold text-text-primary hover:bg-bg-primary transition-colors"
                      >
                        +100
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIncrement(10)}
                        className="rounded-lg border border-text-primary/10 px-1.5 xl:px-2 py-2 xl:py-2.5 text-[10px] xl:text-xs font-semibold text-text-primary hover:bg-bg-primary transition-colors"
                      >
                        +10
                      </button>
                    </div>

                    {/* Center: Value display */}
                    <button
                      type="button"
                      onClick={handleValueClick}
                      className="flex-1 text-center text-2xl xl:text-3xl font-bold text-text-primary py-2 xl:py-3 hover:bg-bg-primary rounded-lg transition-colors cursor-pointer"
                    >
                      {value ?? 1}
                    </button>

                    {/* Right: Minus buttons */}
                    <div className="flex gap-2 flex-col">
                      <button
                        type="button"
                        onClick={() => handleIncrement(-10)}
                        disabled={!value || value <= 10}
                        className="rounded-lg border border-text-primary/10 px-1.5 xl:px-2 py-2 xl:py-2.5 text-[10px] xl:text-xs font-semibold text-text-primary hover:bg-bg-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        -10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIncrement(-100)}
                        disabled={!value || value <= 100}
                        className="rounded-lg border border-text-primary/10 px-1.5 xl:px-2 py-2 xl:py-2.5 text-[10px] xl:text-xs font-semibold text-text-primary hover:bg-bg-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        -100
                      </button>
                    </div>
                  </div>

                  <p className="text-tiny text-text-primary/40 text-center">
                    Click value to type directly
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div
        ref={containerRef}
        className="relative flex-1 flex items-center gap-2 xl:gap-3 md:border-l md:border-text-primary/10 px-4 xl:px-5"
      >
        <div className="flex-1">
          <p className="text-[10px] xl:text-[11px] font-semibold uppercase tracking-[0.12em] text-text-primary/45">
            Capacity
          </p>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full bg-transparent text-left text-xs xl:text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${value ? "text-text-primary" : "text-text-primary/45"}`}
          >
            {displayValue}
          </button>
        </div>
      </div>

      {portalTarget ? createPortal(dropdownContent, portalTarget) : null}
    </>
  );
}
