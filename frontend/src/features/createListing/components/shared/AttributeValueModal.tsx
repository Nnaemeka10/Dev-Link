"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { AttributeValueKind } from "../../types/listing";

const MAX_WORDS = 5;

function clampWords(value: string, maxWords: number): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return value;
  return words.slice(0, maxWords).join(" ");
}

interface AttributeValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  valueKind: AttributeValueKind;
  unit?: string;
  placeholder?: string;
  initialValue: string;
  onSave: (value: string) => void;
  onRemove?: () => void;
}

export default function AttributeValueModal({
  isOpen,
  onClose,
  label,
  valueKind,
  unit,
  placeholder,
  initialValue,
  onSave,
  onRemove,
}: AttributeValueModalProps) {
  const [value, setValue] = useState(initialValue);



  if (!isOpen) return null;

  const handleSave = () => {
    if (!value.trim()) return;
    onSave(value.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={label}
      maxWidthClassName="max-w-sm"
      footer={
        <div className="flex gap-3">
          {onRemove && (
            <button
              type="button"
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="rounded-full px-5 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!value.trim()}
            className="flex-1 rounded-full bg-accent-primary py-3 text-sm font-bold text-white shadow-card transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      }
    >
      {valueKind === "number" ? (
        <div className="relative">
          <input
            autoFocus
            type="number"
            inputMode="numeric"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder ?? "0"}
            className="w-full rounded-input bg-bg-tertiary px-5 py-4 text-2xl font-bold text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/25"
          />
          {unit && (
            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-text-primary/40">
              {unit}
            </span>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(clampWords(e.target.value, valueKind === "duration" ? 6 : MAX_WORDS))}
            placeholder={placeholder ?? "Add a short detail"}
            className="w-full rounded-input bg-bg-tertiary px-5 py-4 text-base text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/25"
          />
          <p className="text-xs text-text-primary/40">
            Keep it to {valueKind === "duration" ? "a short phrase" : `${MAX_WORDS} words or fewer`}
          </p>
        </div>
      )}
    </Modal>
  );
}