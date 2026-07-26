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

const VENDOR_LISTINGS_PATH = "/vendor/mylistings";

export default function CreateListingPage() {
  const router = useRouter();
  const currentStep = useListingStore((s) => s.currentStep);
  const category = useListingStore((s) => s.form.category);
  const goToStep = useListingStore((s) => s.goToStep);
  const nextStep = useListingStore((s) => s.nextStep);
  const prevStep = useListingStore((s) => s.prevStep);
  const resetForm = useListingStore((s) => s.resetForm);

  // NOTE(meks): each of these is a stub — wire in your actual submit/draft
  // mutations here (they own the Cloudinary finalize + POST /listings call).
  const handleExit = () => {
    resetForm();
    router.push(VENDOR_LISTINGS_PATH);
  };

  const handleSaveAndExit = () => {
    // TODO: persist `useListingStore.getState().form` as a draft via your API layer
    router.push(VENDOR_LISTINGS_PATH);
  };

  const handleSaveDraft = () => {
    // TODO: submit form with status "draft"
    router.push(VENDOR_LISTINGS_PATH);
  };

  const handlePublish = () => {
    // TODO: submit form with status "active"
    router.push(VENDOR_LISTINGS_PATH);
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
      {currentStep === 1 && <CategoryStep />}
      {currentStep === 2 && <DetailsStep />}
      {currentStep === 3 && <AttributesStep />}
      {currentStep === 4 && <GalleryStep />}
      {currentStep === 5 && <PricingStep />}
      {currentStep === 6 && <ReviewStep />}
    </CreateListingShell>
  );
}