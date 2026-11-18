"use client";

import type { ReactNode } from "react";
import type { ListingCategory, StepNumber } from "../types/listing";
import CreateListingHeader from "./shared/CreateListingHeader";
import CreateListingStepNav from "./shared/CreateListingStepNav";
import CreateListingFooter from "./CreateListingFooter";
import VendorMobileDock from "@/components/layout/VendorMobileDock";
import VendorDesktopSidebar from "@/components/layout/VendorSideNavBar";

interface CreateListingShellProps {
  currentStep: StepNumber;
  category: ListingCategory | null;
  onStepClick: (step: StepNumber) => void;
  onExit: () => void;
  onSaveAndExit: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  children: ReactNode;
  isPublishing?: boolean;
  /** Staged-edit copy: "Publish changes" / "Save changes" on a live listing. */
  publishLabel?: string;
  saveLabel?: string;
}

export default function CreateListingShell({
  currentStep,
  category,
  onStepClick,
  onExit,
  onSaveAndExit,
  onPrev,
  onNext,
  onSaveDraft,
  onPublish,
  isPublishing,
  publishLabel,
  saveLabel,
  children,
}: CreateListingShellProps) {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* App-wide desktop sidebar slot - xl and up, same pattern as the vendor dashboard */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 xl:block">
        <VendorDesktopSidebar embedded />
      </aside>

      <div className="xl:pl-64">
        <CreateListingHeader onExit={onExit} onSaveAndExit={onSaveAndExit} />
        <CreateListingStepNav
          currentStep={currentStep}
          category={category}
          onStepClick={onStepClick}
        />

        <main className="mx-auto max-w-400 px-4 pb-48 pt-8 xs:px-6 md:px-8 md:pt-12 xl:pb-32">
          {children}
        </main>

        <CreateListingFooter
          currentStep={currentStep}
          onPrev={onPrev}
          onNext={onNext}
          onSaveDraft={onSaveDraft}
          onPublish={onPublish}
          isPublishing={isPublishing}
          publishLabel={publishLabel}
          saveLabel={saveLabel}
        />
      </div>

      {/* App-wide mobile/tablet dock slot */}
      <div className="fixed inset-x-0 bottom-0 z-40 xl:hidden">
        <VendorMobileDock />
      </div>
    </div>
  );
}