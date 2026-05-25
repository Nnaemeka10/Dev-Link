import hallA from "@/assets/home/populareventsa.png";
import hallB from "@/assets/home/populareventsb.png";
import hallC from "@/assets/home/populareventsc.png";
import hallD from "@/assets/home/populareventsd.png";
import serviceB from "@/assets/home/curatedservicesb.png";
import type { GrandAtriumDetails } from "./details.types";

export const GRAND_ATRIUM_ID = "grand-atrium";

export const GRAND_ATRIUM_DETAILS: GrandAtriumDetails = {
  id: GRAND_ATRIUM_ID,
  name: "The Grand Atrium",
  location: "Victoria Island, Lagos",
  price: "₦1,250,000",
  priceRaw: 1250000,
  rating: "4.9",
  reviewsCount: "128 reviews",
  badges: ["Flexible Pricing", "Catering Included"],
  description: [
    "The Grand Atrium represents the pinnacle of Lagosian event architecture. Spanning over 2,500 square meters of curated space, this venue has hosted the city's most prestigious galas, fashion weeks, and private nuptials since its inception in 2018.",
    "Designed by award-winning architects, the space features a signature glass-vaulted ceiling that allows for breathtaking natural light transitions. Every detail, from the acoustics of the main hall to the climate-controlled bridal wings, has been engineered for seamless luxury execution.",
  ],
  gallery: [hallD, hallA, hallB, hallC, serviceB],
  features: [
    { id: "capacity", label: "Capacity", value: "Up to 1,200 Guests", icon: "capacity" },
    { id: "parking", label: "Valet Parking", value: "Secure parking for 300+ vehicles", icon: "parking" },
    { id: "power", label: "Backup Generator", value: "Industrial grade redundancy", icon: "power" },
    { id: "climate", label: "Central AC", value: "Silent, high-performance cooling", icon: "climate" },
    { id: "suite", label: "Bridal Suite", value: "Luxury dressing room & lounge", icon: "suite" },
    { id: "catering", label: "Prep Kitchen", value: "Full commercial grade facilities", icon: "catering" },
  ],
  reviewMetrics: [
    { label: "Cleanliness", value: "4.9" },
    { label: "Communication", value: "5.0" },
    { label: "Value for Money", value: "4.7" },
    { label: "Location", value: "4.9" },
    { label: "Facility Quality", value: "4.8" },
  ],
  reviews: [
    {
      id: "adewale",
      name: "Adewale O.",
      date: "January 2024",
      initials: "AO",
      body: "The acoustics in this hall are world-class. We hosted our corporate end-of-year gala here and the technical support from the venue staff was impeccable. Best in VI.",
    },
    {
      id: "chioma",
      name: "Chioma E.",
      date: "December 2023",
      initials: "CE",
      body: "Everything about the Grand Atrium screams premium. From the bridal suite's comfort to the valet efficiency. Our wedding was seamless and our guests haven't stopped talking about the venue.",
    },
  ],
  similarVenues: [
    {
      id: "maitama-art-house",
      name: "Maitama Art House",
      location: "Maitama, Abuja",
      price: "₦950,000",
      rating: "4.8",
      image: hallB,
    },
    {
      id: "lakeside-gardens",
      name: "Lakeside Gardens",
      location: "Lekki Phase 1, Lagos",
      price: "₦1,100,000",
      rating: "4.9",
      image: hallC,
    },
    {
      id: "glass-pavilion",
      name: "The Glass Pavilion",
      location: "Ikoyi, Lagos",
      price: "₦1,500,000",
      rating: "5.0",
      image: hallA,
    },
  ],
};

export const BOOKING_TIMES = ["Morning", "Afternoon", "Evening", "All Day"];
export const BOOKING_GUESTS = ["Up to 200", "400 Guests", "Up to 500", "1,200 Guests"];
