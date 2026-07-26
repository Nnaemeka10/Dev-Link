"use client";

import { useState } from "react";
import { useListingStore } from "../store/useListingStore";
import FloatingInput from "./shared/FloatingInput";
import PackageBuilderModal from "./PackageBuilderModal";
import AvailabilitySection from "./AvailabilitySection";
import type { PricingPackage } from "../types/listing";

export default function PricingStep() {
  const category = useListingStore((s) => s.form.category);
  const selectedTypeIds = useListingStore((s) => s.form.details.selectedTypeIds);
  const pricing = useListingStore((s) => s.form.pricing);
  const setBasePrice = useListingStore((s) => s.setBasePrice);
  const setUsesPackages = useListingStore((s) => s.setUsesPackages);
  const addPackage = useListingStore((s) => s.addPackage);
  const updatePackage = useListingStore((s) => s.updatePackage);
  const removePackage = useListingStore((s) => s.removePackage);

  const [builderPackage, setBuilderPackage] = useState<PricingPackage | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const isService = category === "service";
  const primaryServiceTypeId = selectedTypeIds[0] ?? null;

  const openNewPackage = () => {
    setBuilderPackage(null);
    setIsBuilderOpen(true);
  };

  const openEditPackage = (pkg: PricingPackage) => {
    setBuilderPackage(pkg);
    setIsBuilderOpen(true);
  };

  const handleSavePackage = (pkg: PricingPackage) => {
    const exists = pricing.packages.some((p) => p.id === pkg.id);
    if (exists) updatePackage(pkg.id, pkg);
    else addPackage(pkg);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-10 max-w-2xl md:mb-14">
        <h2 className="font-man text-3xl font-bold tracking-tight text-text-primary md:text-5xl">
          Pricing &amp; Availability
        </h2>
        <p className="mt-4 text-base text-text-primary/60 md:text-lg">
          Set your rates and manage when your listing is available for bookings. A clear calendar builds trust with
          premium clients.
        </p>
      </div>

      <div className="space-y-8">
        <section className="rounded-card bg-white p-6 shadow-card ring-1 ring-black/5 md:p-8">
          <h3 className="mb-1 font-man text-xl font-bold text-text-primary">Base Pricing</h3>
          <p className="mb-6 text-sm text-text-primary/55">
            {isService
              ? "Your standard rate for a full day of service."
              : "Set your standard day rate. Custom seasonal pricing can be configured later."}
          </p>

          <div className="grid grid-cols-1 gap-6 xs:grid-cols-2">
            <div className="space-y-2.5">
              <label className="block text-sm font-semibold text-text-primary">Standard Rate</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 font-bold text-text-primary/50">
                  ₦
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={pricing.basePrice ?? ""}
                  onChange={(e) => setBasePrice(e.target.value ? Number(e.target.value) : null)}
                  placeholder="500,000"
                  className="w-full rounded-input bg-bg-tertiary py-4 pl-10 pr-5 text-lg font-bold text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/25"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-sm font-semibold text-text-primary">Billing Cycle</label>
              <div className="flex w-full items-center justify-between rounded-input bg-bg-tertiary px-5 py-4 text-base text-text-primary/70">
                Per Day
                <span className="text-xs font-medium text-text-primary/35">Only option available</span>
              </div>
            </div>
          </div>

          {isService && (
            <button
              type="button"
              onClick={openNewPackage}
              className="mt-6 flex w-full items-start gap-4 rounded-card bg-bg-tertiary p-5 text-left transition-colors hover:bg-accent-tint"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-secondary/20 text-accent-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <span>
                <span className="block font-man font-bold text-text-primary">
                  Add packages for more control over your pricing
                </span>
                <span className="mt-1 block text-sm text-text-primary/55">
                  Give clients tiered options — from a lean starter package to your full luxury experience.
                </span>
              </span>
            </button>
          )}

          {isService && pricing.packages.length > 0 && (
            <div className="mt-6 space-y-3">
              {pricing.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex items-center justify-between gap-4 rounded-card border border-black/5 p-5"
                >
                  <div className="min-w-0">
                    <p className="font-man font-bold text-text-primary">{pkg.name}</p>
                    <p className="mt-0.5 truncate text-sm text-text-primary/55">{pkg.description}</p>
                    <p className="mt-1 text-sm font-bold text-accent-primary">₦{pkg.price.toLocaleString()}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditPackage(pkg)}
                      className="rounded-full bg-bg-tertiary px-4 py-2 text-xs font-bold text-text-primary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removePackage(pkg.id)}
                      className="rounded-full px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <AvailabilitySection />
      </div>

      {isService && (
        <PackageBuilderModal
          isOpen={isBuilderOpen}
          onClose={() => setIsBuilderOpen(false)}
          serviceTypeId={primaryServiceTypeId}
          editingPackage={builderPackage}
          onSave={(pkg) => {
            handleSavePackage(pkg);
            setUsesPackages(true);
          }}
        />
      )}
    </div>
  );
}