export interface Listing {
  id: string;
  title: string;
  location: string;
  category: "hall" | "service";
  description: string;
  priceFrom: number;
}
