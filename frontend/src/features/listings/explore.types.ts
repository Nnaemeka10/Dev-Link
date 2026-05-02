import type { StaticImageData } from "next/image";

export type ExploreListingKind = "venue" | "service";

export interface ExploreListing {
  id: string;
  name: string;
  location: string;
  price: string;
  unit: string;
  rating: string;
  image: StaticImageData;
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
