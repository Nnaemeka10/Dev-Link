import type { ListingCategory, StepNumber } from "../../types/listing";
import DesktopStepNav from "./DesktopStepNav";
import MobileStepHeading from "./MobileStepHeading";

interface CreateListingStepNavProps {
  currentStep: StepNumber;
  category: ListingCategory | null;
  onStepClick: (step: StepNumber) => void;
}

export default function CreateListingStepNav({ currentStep, category, onStepClick }: CreateListingStepNavProps) {
  return (
    <>
      <DesktopStepNav currentStep={currentStep} category={category} onStepClick={onStepClick} />
      <MobileStepHeading currentStep={currentStep} category={category} />
    </>
  );
}