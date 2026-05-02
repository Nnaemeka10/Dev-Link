import djImage from "@/assets/home/curatedeventsa.png";
import hallA from "@/assets/home/populareventsa.png";
import hallB from "@/assets/home/populareventsb.png";
import hallC from "@/assets/home/populareventsc.png";
import hallD from "@/assets/home/populareventsd.png";
import type { ExploreListing, MapPricePin } from "./explore.types";

export const MOBILE_EXPLORE_LISTINGS: ExploreListing[] = [
  {
    id: "grand-atrium",
    name: "Grand Atrium",
    location: "Victoria Island, Lagos",
    price: "₦1,250,000",
    unit: "event",
    rating: "4.9",
    image: hallD,
    kind: "venue",
    badges: ["Flexible Pricing", "Catering Included"],
    verified: true,
  },
  {
    id: "dj-spinall",
    name: "DJ Spinall",
    location: "Lagos, NG",
    price: "₦450,000",
    unit: "set",
    rating: "5.0",
    image: djImage,
    kind: "service",
    badges: ["Contract Available", "Premium Sound"],
    verified: true,
  },
  {
    id: "terra-gardens",
    name: "The Terra Gardens",
    location: "Lekki, Lagos",
    price: "₦800,000",
    unit: "event",
    rating: "4.7",
    image: hallC,
    kind: "venue",
    badges: ["Garden View"],
  },
];

export const DESKTOP_EXPLORE_LISTINGS: ExploreListing[] = [
  {
    id: "glass-pavilion",
    name: "The Glass Pavilion",
    location: "Victoria Island, Lagos",
    price: "₦450,000",
    unit: "day",
    rating: "4.9",
    image: hallB,
    kind: "venue",
    badges: [],
    verified: true,
  },
  {
    id: "heritage-loft",
    name: "Heritage Loft",
    location: "Ikeja GRA, Lagos",
    price: "₦280,000",
    unit: "day",
    rating: "4.7",
    image: hallA,
    kind: "venue",
    badges: [],
  },
  {
    id: "orchid-gardens",
    name: "The Orchid Gardens",
    location: "Lekki Phase 1, Lagos",
    price: "₦600,000",
    unit: "day",
    rating: "4.8",
    image: hallC,
    kind: "venue",
    badges: [],
  },
  {
    id: "imperial-ballroom",
    name: "Imperial Ballroom",
    location: "Eko Atlantic, Lagos",
    price: "₦1,200,000",
    unit: "day",
    rating: "5.0",
    image: hallD,
    kind: "venue",
    badges: [],
    verified: true,
  },
];

export const MAP_PRICE_PINS: MapPricePin[] = [
  { label: "₦1.2M", top: "15%", left: "78%", active: false },
  { label: "₦450k", top: "20%", left: "42%", active: false },
  { label: "₦280k", top: "36%", left: "28%", active: true },
  { label: "₦600k", top: "58%", left: "60%", active: false },
  { label: "₦350k", top: "72%", left: "35%", active: false },
];

export const INITIAL_MOBILE_COMPARE_IDS = ["grand-atrium", "dj-spinall"];
export const INITIAL_DESKTOP_COMPARE_IDS = ["heritage-loft", "imperial-ballroom"];
