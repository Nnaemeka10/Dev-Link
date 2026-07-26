"use client";

import Modal from "./shared/Modal";
import SelectableChip from "./shared/SelectableChip";

interface TypePickerOption {
  id: string;
  label: string;
}

interface TypePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  options: TypePickerOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export default function TypePickerModal({
  isOpen,
  onClose,
  title,
  description,
  options,
  selectedIds,
  onToggle,
}: TypePickerModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      maxWidthClassName="max-w-xl"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-full bg-accent-primary py-3.5 text-sm font-bold text-white shadow-card transition-transform hover:scale-[1.01] active:scale-95"
        >
          Done {selectedIds.length > 0 && `(${selectedIds.length} selected)`}
        </button>
      }
    >
      <div className="flex flex-wrap gap-2.5">
        {options.map((opt) => (
          <SelectableChip
            key={opt.id}
            label={opt.label}
            selected={selectedIds.includes(opt.id)}
            onClick={() => onToggle(opt.id)}
          />
        ))}
      </div>
    </Modal>
  );
}