"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { useListingStore } from "./store/useListingStore";
import CreateListingShell from "./components/CreateListingShell";
import CategoryStep from "./components/CategoryStep";
import DetailsStep from "./components/DetailsStep";
import AttributesStep from "./components/AttributeStep";
import GalleryStep from "./components/GalleryStep";
import PricingStep from "./components/PricingStep";
import ReviewStep from "./components/ReviewStep";
import {
  createDraft,
  autosaveDraft,
  publishListing,
  fetchDraft,
} from "./api/listingDraft.api";
import { usePayoutMethodStatus } from "../profile/hooks/usePayoutVerification";
import Modal from "./components/shared/Modal";
import VerificationRequiredModal from "./components/VerificationRequiredModal";
import { hallLocationSchema, serviceLocationSchema } from "./schema/listingSchema";

const VENDOR_LISTINGS_PATH = "/vendor/mylistings";

export default function CreateListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const editId = searchParams.get("edit");

  const currentStep = useListingStore((s) => s.currentStep);
  const category = useListingStore((s) => s.form.category);
  const listingId = useListingStore((s) => s.listingId);
  const form = useListingStore((s) => s.form);
  const setListingId = useListingStore((s) => s.setListingId);
  const setCategory = useListingStore((s) => s.setCategory);
  const goToStep = useListingStore((s) => s.goToStep);
  const nextStep = useListingStore((s) => s.nextStep);
  const prevStep = useListingStore((s) => s.prevStep);
  const resetForm = useListingStore((s) => s.resetForm);
  const markStepAttempted = useListingStore((s) => s.markStepAttempted);
  const clearStepAttempted = useListingStore((s) => s.clearStepAttempted);

  const [isSaving, setIsSaving] = useState(false);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [isHydrating, setIsHydrating] = useState(Boolean(editId));
  const [isPublishing, setIsPublishing] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  /** Status of the listing being edited - drives staged-edit copy. */
  const [editStatus, setEditStatus] = useState<string | null>(null);

  const { data: payoutStatus, refetch: refetchPayoutStatus } = usePayoutMethodStatus();

  const isLiveEdit = editStatus === "published" || editStatus === "pending_review";
  const isArchivedEdit = editStatus === "archived";

  // Create the draft as soon as a category exists, so uploads have a UUID.
  useEffect(() => {
    if (editId || isHydrating) return;
    if (!listingId && category) {
      createDraft(category)
        .then((res) => setListingId(res.id))
        .catch((error) => {
          console.error("Failed to create draft listing", error);
          if (
            error?.message &&
            error.message.includes("Vendor bank details required")
          ) {
            setShowBankDetailsModal(true);
          }
        });
    }
  }, [listingId, category, setListingId, editId, isHydrating]);

  // Debounced autosave. On a live listing the API stores this as a STAGED
  // payload only - the approved version keeps serving in search.
  useEffect(() => {
    if (isHydrating) return;
    if (!listingId || !form.category) return;

    const timer = setTimeout(() => {
      setIsSaving(true);
      autosaveDraft(listingId, form)
        .catch(console.error)
        .finally(() => setIsSaving(false));
    }, 1500);

    return () => clearTimeout(timer);
  }, [form, listingId, isHydrating]);

  // Hydrate an existing listing when opened with ?edit=<id>.
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;

    (async () => {
      try {
        const draft = await fetchDraft(editId);
        if (cancelled) return;
        setEditStatus(draft.status);

        if (draft.draftPayload) {
          useListingStore
            .getState()
            .hydrateFromDraft(draft.id, draft.draftPayload, draft.kind);
        } else {
          // Seeded listings predating the wizard have no payload. Start from
          // a clean form bound to THIS listing so nothing from a previous
          // session leaks in, and so autosave writes a fresh staged payload.
          resetForm();
          setListingId(draft.id);
          setCategory(draft.kind);
        }
        goToStep(2);
      } catch {
        // Deleted, suspended, or owned by someone else - start fresh.
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editId, goToStep, resetForm, setListingId, setCategory]);

  const isLocationValid = () => {
    const schema = category === "hall" ? hallLocationSchema : serviceLocationSchema;
    const data =
      category === "hall"
        ? form.details.hallLocation
        : form.details.serviceLocation;
    return schema.safeParse(data).success;
  };

  const scrollToLocation = () =>
    document
      .getElementById("location-fields")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });

  const handleNext = () => {
    if (currentStep === 2 && category) {
      if (!isLocationValid()) {
        markStepAttempted(2);
        scrollToLocation();
        return;
      }
      clearStepAttempted(2);
    }
    nextStep();
  };

  const goToListings = (notice?: string) =>
    router.push(notice ? `${VENDOR_LISTINGS_PATH}?notice=${notice}` : VENDOR_LISTINGS_PATH);

  const handleExit = () => {
    resetForm();
    goToListings();
  };

  const persist = async () => {
    if (!listingId) return;
    try {
      await autosaveDraft(listingId, form);
    } catch (error) {
      console.error("Failed to save draft", error);
    }
  };

  const handleSaveAndExit = async () => {
    await persist();
    goToListings(isLiveEdit ? "changes-saved" : "draft-saved");
  };

  const handleSaveDraft = async () => {
    await persist();
    goToListings(isLiveEdit ? "changes-saved" : "draft-saved");
  };

  const handlePublish = async () => {
    setPublishError(null);

    // Guard 1 - compulsory location.
    if (category && !isLocationValid()) {
      markStepAttempted(2);
      goToStep(2);
      setTimeout(scrollToLocation, 50);
      return;
    }

    // Guard 2 - payout account must be verified.
    const { data: payout } = await refetchPayoutStatus();
    if (payout?.status && payout.status !== "verified") {
      setShowVerificationModal(true);
      return;
    }

    if (!listingId) return;

    setIsPublishing(true);
    try {
      const result = await publishListing(listingId, form);
      const notice = result?.staged
        ? "staged"
        : isArchivedEdit
          ? "relisted"
          : "published";

      resetForm();

      // Publishing derives vendor identity: refresh /me so the contextual
      // navbar switch flips immediately, plus every surface that lists or
      // searches inventory. Not awaited - navigation stays instant and
      // React Query refetches these on mount.
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      void queryClient.invalidateQueries({ queryKey: ["vendor", "listings"] });
      void queryClient.invalidateQueries({ queryKey: ["vendor", "listings", "stats"] });
      void queryClient.invalidateQueries({ queryKey: ["explore"] });
      void queryClient.invalidateQueries({ queryKey: ["home", "listings"] });
      void queryClient.invalidateQueries({ queryKey: ["listing"] });

      goToListings(notice);
    } catch (error) {
      const { data: refreshed } = await refetchPayoutStatus();
      if (refreshed?.status && refreshed.status !== "verified") {
        setShowVerificationModal(true);
      } else {
        console.error("Publish failed:", error);
        setPublishError(
          error instanceof Error
            ? error.message
            : "We couldn't publish this listing. Your changes are saved - please try again."
        );
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const publishLabel = isLiveEdit
    ? "Publish changes"
    : isArchivedEdit
      ? "Relist listing"
      : "Publish Listing";
  const saveLabel = isLiveEdit ? "Save changes" : "Save as Draft";

  return (
    <CreateListingShell
      currentStep={currentStep}
      category={category}
      onStepClick={goToStep}
      onExit={handleExit}
      onSaveAndExit={handleSaveAndExit}
      onPrev={prevStep}
      onNext={handleNext}
      onSaveDraft={handleSaveDraft}
      onPublish={handlePublish}
      isPublishing={isPublishing}
      publishLabel={publishLabel}
      saveLabel={saveLabel}
    >
      {isSaving && (
        <div className="fixed right-8 top-20 z-50 hidden items-center gap-2 rounded-full bg-bg-tertiary px-4 py-2 text-xs font-bold text-text-primary/60 shadow-card xl:flex">
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-accent-primary"
            aria-hidden="true"
          />
          Saving...
        </div>
      )}

      {!isHydrating && (isLiveEdit || isArchivedEdit) && (
        <div className="mx-auto mb-6 flex max-w-2xl items-start gap-3 rounded-2xl border border-[#F0E9DF] bg-white px-4 py-3.5 shadow-card">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-primary" aria-hidden="true" />
          <p className="text-sm font-semibold leading-6 text-text-primary/70">
            {isLiveEdit
              ? "You're editing a live listing. Your changes stay private until you publish them - customers keep seeing the current version."
              : "This listing is unlisted. Publishing puts it back in search with the changes you make here."}
          </p>
        </div>
      )}

      {publishError && (
        <p
          role="alert"
          className="mx-auto mb-6 max-w-2xl rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
        >
          {publishError}
        </p>
      )}

      {isHydrating ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-accent-primary/20 border-t-accent-primary"
            aria-hidden="true"
          />
        </div>
      ) : (
        <>
          {currentStep === 1 && <CategoryStep />}
          {currentStep === 2 && <DetailsStep />}
          {currentStep === 3 && <AttributesStep />}
          {currentStep === 4 && <GalleryStep />}
          {currentStep === 5 && <PricingStep />}
          {currentStep === 6 && <ReviewStep />}
        </>
      )}

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
                router.push("/vendor/profile");
              }}
              className="w-full rounded-full bg-accent-primary py-3.5 text-sm font-bold text-white shadow-card transition-transform hover:scale-[1.01] active:scale-95"
            >
              Add Bank Details
            </button>
          }
        >
          <p className="text-sm text-text-primary/70">
            Go to your profile to securely add your bank account information.
            Once saved, you can return here and continue creating your listing.
          </p>
        </Modal>
      )}

      <VerificationRequiredModal
        isOpen={showVerificationModal}
        status={payoutStatus?.status}
        onSaveDraft={handleSaveDraft}
        onClose={() => setShowVerificationModal(false)}
      />
    </CreateListingShell>
  );
}