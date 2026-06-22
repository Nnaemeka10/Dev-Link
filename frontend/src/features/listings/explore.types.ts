// NOTE: Removed StaticImageData. Images are now strings from Cloudinary.

export type ExploreListingKind = "venue" | "service";

export interface ExploreListing {
  id: string;
  name: string;
  location: string;
  priceFrom: number; // Changed from string price to raw number
  priceUnit: string; // Changed from 'unit'
  rating: number;    // Changed from string to number
  imageUrl: string | null; // Changed from 'image'
  kind: ExploreListingKind;
  badges: string[];
  verified?: boolean;
}

export interface MapPricePin {
  label: string;
  top: string;
  left: string;
  active: boolean;
}