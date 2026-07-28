"use client";

import { useRouter } from "next/navigation";
import { useListingStore } from "./store/useListingStore";
import CreateListingShell from "./components/CreateListingShell";
import CategoryStep from "./components/CategoryStep";
import DetailsStep from "./components/DetailsStep";
import AttributesStep from "./components/AttributeStep";
import GalleryStep from "./components/GalleryStep";
import PricingStep from "./components/PricingStep";
import ReviewStep from "./components/ReviewStep";
import { useEffect, useState } from "react";
import { createDraft, autosaveDraft, publishListing } from "./api/listingDraft.api";
import Modal from "./components/shared/Modal";

const VENDOR_LISTINGS_PATH = "/vendor/mylistings";

export default function CreateListingPage() {
  const router = useRouter();
  const currentStep = useListingStore((s) => s.currentStep);
  const category = useListingStore((s) => s.form.category);
  const listingId = useListingStore((s) => s.listingId);
  const form = useListingStore((s) => s.form); 
  const setListingId = useListingStore((s) => s.setListingId);
  const goToStep = useListingStore((s) => s.goToStep);
  const nextStep = useListingStore((s) => s.nextStep);
  const prevStep = useListingStore((s) => s.prevStep);
  const resetForm = useListingStore((s) => s.resetForm);

  const [isSaving, setIsSaving] = useState(false);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);

   //Create draft immediately on mount if no listingId exists
   useEffect(() => {
    if (!listingId && category) {
      createDraft(category)
        .then((res) => {
          setListingId(res.id);
        })
        .catch((error) => {
          console.error("Failed to create draft listing", error);

          if (error?.message && error.message.includes("Vendor bank details required")) {
            setShowBankDetailsModal(true);
          }
          // show toast for other errors later
        });
    }
  }, [listingId, category, setListingId]);

   // Debounced Autosave on form change
  useEffect(() => {
    if (!listingId || !form.category) return;
    
    const timer = setTimeout(() => {
      setIsSaving(true);
      autosaveDraft(listingId, form)
        .catch(console.error)
        .finally(() => setIsSaving(false));
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [form, listingId]);



  // NOTE(meks): each of these is a stub — wire in your actual submit/draft
  // mutations here (they own the Cloudinary finalize + POST /listings call).
  const handleExit = () => {
    resetForm();
    router.push(VENDOR_LISTINGS_PATH);
  };

 const handleSaveAndExit = async () => {
    if (listingId) {
      try {
        await autosaveDraft(listingId, form);
      } catch (error) {
        console.error("Failed to save draft", error);
      }
    }
    router.push(VENDOR_LISTINGS_PATH);
  };

  const handleSaveDraft = async () => {
    if (listingId) {
      try {
        await autosaveDraft(listingId, form);
      } catch (error) {
        console.error("Failed to save draft", error);
      }
    }
    router.push(VENDOR_LISTINGS_PATH);
  };

  const handlePublish = async () => {
    if (!listingId) return;
    try {
      await publishListing(listingId, form);
      resetForm();
      router.push(VENDOR_LISTINGS_PATH);
    } catch (error) {
      console.error("Failed to publish listing", error);
      // TODO: Show toast notification
    }
  };

  return (
    <CreateListingShell
      currentStep={currentStep}
      category={category}
      onStepClick={goToStep}
      onExit={handleExit}
      onSaveAndExit={handleSaveAndExit}
      onPrev={prevStep}
      onNext={nextStep}
      onSaveDraft={handleSaveDraft}
      onPublish={handlePublish}
    >
      {/* Autosave indicator */}
      {isSaving && (
        <div className="fixed top-20 right-8 z-50 hidden items-center gap-2 rounded-full bg-bg-tertiary px-4 py-2 text-xs font-bold text-text-primary/60 shadow-card xl:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent-primary"></span>
          Saving...
        </div>
      )}

      {currentStep === 1 && <CategoryStep />}
      {currentStep === 2 && <DetailsStep />}
      {currentStep === 3 && <AttributesStep />}
      {currentStep === 4 && <GalleryStep />}
      {currentStep === 5 && <PricingStep />}
      {currentStep === 6 && <ReviewStep />}

      {/* Bank Details Required Modal */}
      {showBankDetailsModal && (
        <Modal
          isOpen={showBankDetailsModal}
          onClose={() => setShowBankDetailsModal(false)}
          title="Bank Details Required"
          description="You need to add your bank account details before you can create a listing. This is where your payouts will be sent."
          maxWidthClassName="max-w-md"
          footer={
            <button
              type="button"
              onClick={() => {
                setShowBankDetailsModal(false);
                router.push("/profile");
              }}
              className="w-full rounded-full bg-accent-primary py-3.5 text-sm font-bold text-white shadow-card transition-transform hover:scale-[1.01] active:scale-95"
            >
              Add Bank Details
            </button>
          }
        >
          <p className="text-sm text-text-primary/70">
            Go to your profile to securely add your bank account information. Once
            saved, you can return here and continue creating your listing.
          </p>
        </Modal>
      )}
    </CreateListingShell>
  );
}