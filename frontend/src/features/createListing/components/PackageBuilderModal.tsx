"use client";

import { useEffect, useState } from "react";
import Modal from "./shared/Modal";
import SelectableChip from "./shared/SelectableChip";
import type { PricingPackage, PricingPackagePerk } from "../types/listing";
import { PACKAGE_NAME_PRESETS, PACKAGE_PERK_PRESETS, PACKAGE_TEMPLATES } from "../data";

interface PackageBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** First selected service type drives which presets show — falls back to an empty set. */
  serviceTypeId: string | null;
  editingPackage: PricingPackage | null;
  onSave: (pkg: PricingPackage) => void;
}

function makePerkId() {
  return `perk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function PackageBuilderModal({
  isOpen,
  onClose,
  serviceTypeId,
  editingPackage,
  onSave,
}: PackageBuilderModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [perks, setPerks] = useState<PricingPackagePerk[]>([]);
  const [customPerk, setCustomPerk] = useState("");

  const nameTemplates = serviceTypeId ? (PACKAGE_NAME_PRESETS[serviceTypeId] ?? []) : [];
  const perkTemplates = serviceTypeId ? (PACKAGE_PERK_PRESETS[serviceTypeId] ?? []) : [];
  const fullTemplates = serviceTypeId ? (PACKAGE_TEMPLATES[serviceTypeId] ?? []) : [];

  useEffect(() => {
    if (!isOpen) return;
    if (editingPackage) {
      setName(editingPackage.name);
      setPrice(String(editingPackage.price));
      setDescription(editingPackage.description);
      setPerks(editingPackage.perks);
    } else {
      setName("");
      setPrice("");
      setDescription("");
      setPerks([]);
    }
    setCustomPerk("");
  }, [isOpen, editingPackage]);

  const applyTemplate = (templateName: string) => {
    const template = fullTemplates.find((t) => t.name === templateName);
    if (!template) {
      setName(templateName);
      return;
    }
    setName(template.name);
    setPrice(String(template.price));
    setDescription(template.description);
    setPerks(template.perks.map((label) => ({ id: makePerkId(), label })));
  };

  const togglePerkPreset = (label: string) => {
    const exists = perks.some((p) => p.label === label);
    setPerks(exists ? perks.filter((p) => p.label !== label) : [...perks, { id: makePerkId(), label }]);
  };

  const addCustomPerk = () => {
    const trimmed = customPerk.trim();
    if (!trimmed) return;
    setPerks([...perks, { id: makePerkId(), label: trimmed }]);
    setCustomPerk("");
  };

  const removePerk = (id: string) => setPerks(perks.filter((p) => p.id !== id));

  const canSave = name.trim().length > 0 && Number(price) > 0 && description.trim().length > 0 && perks.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: editingPackage?.id ?? `pkg_${Date.now()}`,
      name: name.trim(),
      price: Number(price),
      description: description.trim(),
      perks,
      isPopular: editingPackage?.isPopular ?? false,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPackage ? "Edit Package" : "Add a Package"}
      description="Start from a template or build one from scratch."
      maxWidthClassName="max-w-xl"
      footer={
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="w-full rounded-full bg-accent-primary py-3.5 text-sm font-bold text-white shadow-card transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-40"
        >
          {editingPackage ? "Save Changes" : "Add Package"}
        </button>
      }
    >
      <div className="space-y-6">
        {fullTemplates.length > 0 && !editingPackage && (
          <div>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-text-primary/40">Quick templates</p>
            <div className="flex flex-wrap gap-2">
              {fullTemplates.map((t) => (
                <SelectableChip key={t.name} label={t.name} selected={name === t.name} onClick={() => applyTemplate(t.name)} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <label className="block text-sm font-semibold text-text-primary">Package Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard Team"
            list="package-name-presets"
            className="w-full rounded-input bg-bg-tertiary px-5 py-3.5 text-base text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/25"
          />
          <datalist id="package-name-presets">
            {nameTemplates.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2.5">
          <label className="block text-sm font-semibold text-text-primary">Price</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 font-bold text-text-primary/50">₦</span>
            <input
              type="number"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="w-full rounded-input bg-bg-tertiary py-3.5 pl-10 pr-5 text-base font-bold text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/25"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="block text-sm font-semibold text-text-primary">Short Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Perfect for intimate gatherings and small parties."
            className="w-full rounded-input bg-bg-tertiary px-5 py-3.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/25"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-text-primary">Perks Included</label>

          {perkTemplates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {perkTemplates.map((label) => (
                <SelectableChip key={label} label={label} selected={perks.some((p) => p.label === label)} onClick={() => togglePerkPreset(label)} />
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              value={customPerk}
              onChange={(e) => setCustomPerk(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomPerk())}
              placeholder="Add a custom perk"
              className="flex-1 rounded-input bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/25"
            />
            <button
              type="button"
              onClick={addCustomPerk}
              className="rounded-full bg-text-primary px-4 py-2.5 text-xs font-bold text-white"
            >
              Add
            </button>
          </div>

          {perks.length > 0 && (
            <ul className="space-y-1.5">
              {perks.map((perk) => (
                <li key={perk.id} className="flex items-center justify-between gap-2 rounded-input bg-bg-tertiary px-4 py-2.5">
                  <span className="text-sm text-text-primary">{perk.label}</span>
                  <button type="button" onClick={() => removePerk(perk.id)} className="text-text-primary/35 hover:text-red-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}