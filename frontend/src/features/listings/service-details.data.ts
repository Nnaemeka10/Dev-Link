import djImage from "@/assets/home/curatedeventsa.png";
import serviceA from "@/assets/home/curatedservicesb.png";
import serviceB from "@/assets/home/curatedservicesc.png";
import serviceC from "@/assets/home/curatedservicesd.png";

export const SERVICE_DETAILS = {
  id: "dj-spinall",
  name: "DJ Spinall - Premium Vibe Controller",
  provider: {
    name: "DJ Spinall",
    avatar: serviceB,
    joined: "2019",
    responseTime: "within an hour",
    totalEvents: 450,
    verified: true,
  },
  location: "Provides service nationwide. Based in Lagos, NG.",
  price: "₦450,000",
  rating: 5.0,
  reviewsCount: 124,
  badges: ["Contract Available", "Premium Sound", "Top Rated"],
  about:
    "With over a decade of experience moving crowds across the globe, DJ Spinall guarantees an unforgettable experience. Specializing in Afrobeats, Hip-Hop, R&B, and Electronic Dance Music, Spinall seamlessly transitions between genres to keep the dancefloor packed all night long.",
  gallery: [djImage, serviceA, serviceC, djImage, serviceA],
  packages: [
    {
      id: "pkg-1",
      name: "Basic Set",
      price: "₦450,000",
      description: "Perfect for intimate gatherings and small parties.",
      features: [
        "4 hours of DJ service",
        "Basic sound system setup",
        "1 wireless microphone",
        "Pre-event consultation",
      ],
    },
    {
      id: "pkg-2",
      name: "Standard Vibe",
      price: "₦800,000",
      description: "Ideal for weddings and corporate events.",
      features: [
        "6 hours of DJ service",
        "Premium sound system & subwoofers",
        "Basic stage lighting",
        "2 wireless microphones",
        "MC collaboration support",
      ],
      isPopular: true,
    },
    {
      id: "pkg-3",
      name: "The Spinall Experience",
      price: "₦1,500,000",
      description: "The ultimate package for large scale concerts and luxury events.",
      features: [
        "Full day DJ coverage",
        "Concert-grade line array sound system",
        "Intelligent lighting & fog machines",
        "DJ Booth setup with LED screen",
        "Dedicated sound engineer",
        "Custom event playlist & mixing",
      ],
    },
  ],
  requirements: [
    "Requires minimum 2 hours setup time prior to event.",
    "Sheltered area required if outdoors.",
    "Minimum 2 dedicated power outlets required.",
  ],
  reviews: [
    {
      id: "r1",
      name: "Kunle A.",
      initials: "KA",
      date: "May 2026",
      rating: 5,
      body: "Absolutely phenomenal! Booked him for a corporate gala and he understood the assignment perfectly. The transition from background dinner music to full-on party was flawless.",
    },
    {
      id: "r2",
      name: "Simi O.",
      initials: "SO",
      date: "March 2026",
      rating: 5,
      body: "Best DJ you can hire in Lagos right now. The crowd didn't sit down for 4 hours straight.",
    },
  ],
};
