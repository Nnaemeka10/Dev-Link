import type { LocalGovernment, NigeriaState } from "./types/listing";

// ────────────────────────────────────────────────────────────────────────────
// MOCK — backend contract
//
//   GET /locations/states              → NigeriaState[]
//   GET /locations/states/:stateId/lgas → LocalGovernment[]
//
// The list below is a representative subset (3–6 LGAs per state) so the UI
// has something real to render. The backend should return the authoritative
// full list (all 774 LGAs nationwide) — the frontend doesn't hardcode counts
// or assume completeness anywhere.
// ────────────────────────────────────────────────────────────────────────────

export const NIGERIA_STATES: NigeriaState[] = [
  { id: "abia", name: "Abia" },
  { id: "adamawa", name: "Adamawa" },
  { id: "akwa-ibom", name: "Akwa Ibom" },
  { id: "anambra", name: "Anambra" },
  { id: "bauchi", name: "Bauchi" },
  { id: "bayelsa", name: "Bayelsa" },
  { id: "benue", name: "Benue" },
  { id: "borno", name: "Borno" },
  { id: "cross-river", name: "Cross River" },
  { id: "delta", name: "Delta" },
  { id: "ebonyi", name: "Ebonyi" },
  { id: "edo", name: "Edo" },
  { id: "ekiti", name: "Ekiti" },
  { id: "enugu", name: "Enugu" },
  { id: "fct", name: "Federal Capital Territory (Abuja)" },
  { id: "gombe", name: "Gombe" },
  { id: "imo", name: "Imo" },
  { id: "jigawa", name: "Jigawa" },
  { id: "kaduna", name: "Kaduna" },
  { id: "kano", name: "Kano" },
  { id: "katsina", name: "Katsina" },
  { id: "kebbi", name: "Kebbi" },
  { id: "kogi", name: "Kogi" },
  { id: "kwara", name: "Kwara" },
  { id: "lagos", name: "Lagos" },
  { id: "nasarawa", name: "Nasarawa" },
  { id: "niger", name: "Niger" },
  { id: "ogun", name: "Ogun" },
  { id: "ondo", name: "Ondo" },
  { id: "osun", name: "Osun" },
  { id: "oyo", name: "Oyo" },
  { id: "plateau", name: "Plateau" },
  { id: "rivers", name: "Rivers" },
  { id: "sokoto", name: "Sokoto" },
  { id: "taraba", name: "Taraba" },
  { id: "yobe", name: "Yobe" },
  { id: "zamfara", name: "Zamfara" },
];

const lgasFor = (stateId: string, names: string[]): LocalGovernment[] =>
  names.map((name) => ({ id: `${stateId}-${slugify(name)}`, stateId, name }));

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const LOCAL_GOVERNMENTS: LocalGovernment[] = [
  ...lgasFor("lagos", [
    "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry",
    "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu",
    "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo",
    "Shomolu", "Surulere",
  ]),
  ...lgasFor("fct", ["Abaji", "Abuja Municipal", "Bwari", "Gwagwalada", "Kuje", "Kwali"]),
  ...lgasFor("rivers", [
    "Port Harcourt", "Obio-Akpor", "Eleme", "Ikwerre", "Okrika", "Bonny", "Degema",
  ]),
  ...lgasFor("ogun", [
    "Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Ijebu Ode", "Sagamu", "Ijebu North",
  ]),
  ...lgasFor("kano", ["Kano Municipal", "Fagge", "Dala", "Nassarawa", "Gwale", "Tarauni"]),
  ...lgasFor("oyo", [
    "Ibadan North", "Ibadan South-West", "Ibadan North-East", "Ogbomosho North", "Iseyin", "Oyo East",
  ]),
  ...lgasFor("abia", ["Aba North", "Aba South", "Umuahia North", "Umuahia South", "Ohafia"]),
  ...lgasFor("adamawa", ["Yola North", "Yola South", "Mubi North", "Numan"]),
  ...lgasFor("akwa-ibom", ["Uyo", "Eket", "Ikot Ekpene", "Oron"]),
  ...lgasFor("anambra", ["Awka North", "Awka South", "Onitsha North", "Onitsha South", "Nnewi North"]),
  ...lgasFor("bauchi", ["Bauchi", "Azare", "Misau", "Ningi"]),
  ...lgasFor("bayelsa", ["Yenagoa", "Sagbama", "Ogbia"]),
  ...lgasFor("benue", ["Makurdi", "Gboko", "Katsina-Ala", "Otukpo"]),
  ...lgasFor("borno", ["Maiduguri", "Jere", "Biu"]),
  ...lgasFor("cross-river", ["Calabar Municipal", "Calabar South", "Ikom", "Ogoja"]),
  ...lgasFor("delta", ["Warri South", "Asaba (Oshimili South)", "Sapele", "Ughelli North"]),
  ...lgasFor("ebonyi", ["Abakaliki", "Afikpo North", "Ohaozara"]),
  ...lgasFor("edo", ["Oredo", "Egor", "Ikpoba-Okha", "Auchi (Etsako West)"]),
  ...lgasFor("ekiti", ["Ado Ekiti", "Ikere", "Ikole"]),
  ...lgasFor("enugu", ["Enugu East", "Enugu North", "Enugu South", "Nsukka"]),
  ...lgasFor("gombe", ["Gombe", "Kaltungo", "Billiri"]),
  ...lgasFor("imo", ["Owerri Municipal", "Owerri North", "Owerri West", "Orlu"]),
  ...lgasFor("jigawa", ["Dutse", "Hadejia", "Birnin Kudu"]),
  ...lgasFor("kaduna", ["Kaduna North", "Kaduna South", "Zaria", "Kafanchan (Jema'a)"]),
  ...lgasFor("katsina", ["Katsina", "Daura", "Funtua"]),
  ...lgasFor("kebbi", ["Birnin Kebbi", "Argungu", "Zuru"]),
  ...lgasFor("kogi", ["Lokoja", "Okene", "Idah"]),
  ...lgasFor("kwara", ["Ilorin East", "Ilorin South", "Ilorin West", "Offa"]),
  ...lgasFor("nasarawa", ["Lafia", "Keffi", "Akwanga"]),
  ...lgasFor("niger", ["Minna (Chanchaga)", "Bida", "Suleja"]),
  ...lgasFor("ondo", ["Akure North", "Akure South", "Ondo West", "Owo"]),
  ...lgasFor("osun", ["Osogbo", "Ile-Ife (Ife Central)", "Ilesa East"]),
  ...lgasFor("plateau", ["Jos North", "Jos South", "Jos East", "Bassa"]),
  ...lgasFor("sokoto", ["Sokoto North", "Sokoto South", "Wamakko"]),
  ...lgasFor("taraba", ["Jalingo", "Wukari", "Bali"]),
  ...lgasFor("yobe", ["Damaturu", "Potiskum", "Nguru"]),
  ...lgasFor("zamfara", ["Gusau", "Kaura Namoda", "Talata Mafara"]),
];

export function getLgasByState(stateId: string): LocalGovernment[] {
  return LOCAL_GOVERNMENTS.filter((lga) => lga.stateId === stateId);
}


import type { EventHallType, ServiceType } from "./types/listing";

// ────────────────────────────────────────────────────────────────────────────
// MOCK — backend contract
//   GET /listings/hall-types    → EventHallType[]
//   GET /listings/service-types → ServiceType[]
// Shown in Step 2 as a multi-select "what kind of X do you host/offer" modal.
// ────────────────────────────────────────────────────────────────────────────

export const EVENT_HALL_TYPES: EventHallType[] = [
  { id: "wedding-reception", label: "Wedding Reception", icon: "favorite" },
  { id: "banquet-hall", label: "Banquet Hall", icon: "restaurant" },
  { id: "tech-conference", label: "Tech Conference", icon: "laptop_mac" },
  { id: "corporate-event", label: "Corporate Event", icon: "business_center" },
  { id: "birthday-party", label: "Birthday Party", icon: "cake" },
  { id: "cocktail-party", label: "Cocktail Party", icon: "local_bar" },
  { id: "product-launch", label: "Product Launch", icon: "rocket_launch" },
  { id: "concert-live-show", label: "Concert / Live Show", icon: "music_note" },
  { id: "religious-ceremony", label: "Religious Ceremony", icon: "church" },
  { id: "multipurpose", label: "Multipurpose / Flexible Space", icon: "space_dashboard" },
  { id: "outdoor-garden", label: "Outdoor Garden", icon: "park" },
  { id: "exhibition-trade-show", label: "Exhibition / Trade Show", icon: "storefront" },
];

/** id order here matches the O(1) lookup key used by PACKAGE_PRESETS in mockPackagePresets.ts */
export const SERVICE_TYPES: ServiceType[] = [
  { id: "dj", label: "DJ", icon: "graphic_eq" },
  { id: "mc", label: "MC", icon: "campaign" },
  { id: "photographer", label: "Photographer", icon: "photo_camera" },
  { id: "videographer", label: "Videographer", icon: "videocam" },
  { id: "event-planner", label: "Event Planner", icon: "event_note" },
  { id: "makeup-artist", label: "Makeup Artist", icon: "face_retouching_natural" },
  { id: "ushers", label: "Ushers", icon: "groups" },
  { id: "security", label: "Security", icon: "security" },
  { id: "car-rental", label: "Car Rental", icon: "directions_car" },
  { id: "hall-decorator", label: "Hall Decorator", icon: "yard" },
  { id: "culinary", label: "Culinary / Catering", icon: "skillet" },
];

import type { AmenityDefinition } from "./types/listing";

// ────────────────────────────────────────────────────────────────────────────
// MOCK — backend contract: GET /listings/amenities?category=hall → AmenityDefinition[]
//
// Grouped by `category` for rendering as sectioned grids (Step 3, hall flow).
// `valueKind` tells the UI which input to show in the value-entry modal:
//   "number"   → numeric stepper/input (e.g. capacity, parking spaces)
//   "text"     → short free-text description, capped at ~5 words in the UI
//   "duration" → not used for hall amenities today, kept for parity with
//                requirement definitions
// ────────────────────────────────────────────────────────────────────────────

export const HALL_AMENITY_DEFINITIONS: AmenityDefinition[] = [
  // Essentials
  { id: "capacity", label: "Capacity", icon: "groups", category: "Essentials", valueKind: "number", unit: "guests", placeholder: "e.g. 500" },
  { id: "parking", label: "Parking", icon: "local_parking", category: "Essentials", valueKind: "number", unit: "spaces", placeholder: "e.g. 80" },
  { id: "wifi", label: "High-Speed WiFi", icon: "wifi", category: "Essentials", valueKind: "text", placeholder: "e.g. 200Mbps fibre" },
  { id: "climate-control", label: "Central AC", icon: "ac_unit", category: "Essentials", valueKind: "text", placeholder: "e.g. Fully air-conditioned" },
  { id: "backup-generator", label: "Backup Generator", icon: "bolt", category: "Essentials", valueKind: "text", placeholder: "e.g. 100KVA, automatic" },
  { id: "security-247", label: "24/7 Security", icon: "shield", category: "Essentials", valueKind: "text", placeholder: "e.g. Gated, CCTV covered" },

  // Production & Technical
  { id: "sound-system", label: "Pro Sound System", icon: "speaker", category: "Production & Technical", valueKind: "text", placeholder: "e.g. Line array, 2 mixers" },
  { id: "elevated-stage", label: "Elevated Stage", icon: "stadium", category: "Production & Technical", valueKind: "text", placeholder: "e.g. 12ft x 20ft" },
  { id: "custom-lighting", label: "Custom Lighting", icon: "highlight", category: "Production & Technical", valueKind: "text", placeholder: "e.g. Programmable RGB rig" },
  { id: "led-screens", label: "LED Screens", icon: "tv", category: "Production & Technical", valueKind: "text", placeholder: "e.g. 2 x 10ft screens" },

  // Comfort & Guest Experience
  { id: "bridal-suite", label: "Bridal Suite", icon: "meeting_room", category: "Comfort & Guest Experience", valueKind: "text", placeholder: "e.g. Private, en-suite" },
  { id: "premium-restrooms", label: "Premium Restrooms", icon: "wc", category: "Comfort & Guest Experience", valueKind: "text", placeholder: "e.g. Attendant on-site" },
  { id: "furniture-included", label: "Furniture Included", icon: "chair", category: "Comfort & Guest Experience", valueKind: "text", placeholder: "e.g. Chairs, tables, linen" },

  // Catering & Facilities
  { id: "prep-kitchen", label: "Prep Kitchen", icon: "countertops", category: "Catering & Facilities", valueKind: "text", placeholder: "e.g. Full commercial kitchen" },
  { id: "in-house-catering", label: "In-House Catering", icon: "restaurant_menu", category: "Catering & Facilities", valueKind: "text", placeholder: "e.g. Optional, add-on menu" },
];

export const HALL_AMENITY_CATEGORIES = Array.from(
  new Set(HALL_AMENITY_DEFINITIONS.map((a) => a.category))
);



import type { RequirementDefinition } from "./types/listing";

// ────────────────────────────────────────────────────────────────────────────
// MOCK — backend contract
//   GET /listings/requirements?serviceTypeIds=dj,photographer → RequirementDefinition[]
//
// `applicableServiceTypeIds: []` means "applies to every service type" (e.g.
// setup time, vendor briefing). Non-empty means the requirement should only
// render when the vendor has selected one of those service types in Step 2 —
// the client does this filtering locally against the full list below so the
// UI stays responsive; the backend is the source of truth for the filter and
// can narrow the query itself via the `serviceTypeIds` param.
//
// Service type ids referenced below match data/mockCategories.ts.
// ────────────────────────────────────────────────────────────────────────────

export const SERVICE_REQUIREMENT_DEFINITIONS: RequirementDefinition[] = [
  // Setup & Access — mostly universal, setup time is compulsory
  {
    id: "setup-time",
    label: "Minimum setup time required",
    category: "Setup & Access",
    valueKind: "duration",
    placeholder: "e.g. 2 hours",
    applicableServiceTypeIds: [],
    isCompulsory: true,
  },
  {
    id: "venue-access-lead-time",
    label: "Requires access to venue before event",
    category: "Setup & Access",
    valueKind: "duration",
    placeholder: "e.g. 1 hour before",
    applicableServiceTypeIds: [],
  },
  {
    id: "extended-setup-time",
    label: "Extended setup time for full installation",
    category: "Setup & Access",
    valueKind: "duration",
    placeholder: "e.g. 6 hours",
    applicableServiceTypeIds: ["hall-decorator", "culinary", "event-planner"],
  },

  // Power & Technical
  {
    id: "power-outlets",
    label: "Dedicated power outlets required",
    category: "Power & Technical",
    valueKind: "number",
    unit: "outlets",
    placeholder: "e.g. 2",
    applicableServiceTypeIds: ["dj", "photographer", "videographer", "culinary"],
  },
  {
    id: "generator-backup",
    label: "Requires independent generator backup",
    category: "Power & Technical",
    valueKind: "text",
    placeholder: "e.g. 5KVA minimum",
    applicableServiceTypeIds: ["dj", "videographer"],
  },

  // Space & Environment
  {
    id: "sheltered-area-outdoors",
    label: "Sheltered area required if outdoors",
    category: "Space & Environment",
    valueKind: "text",
    placeholder: "e.g. Gazebo or marquee",
    applicableServiceTypeIds: ["dj", "photographer", "videographer", "hall-decorator", "culinary", "makeup-artist"],
  },
  {
    id: "weather-backup-plan",
    label: "Outdoor shoots require a weather backup plan",
    category: "Space & Environment",
    valueKind: "text",
    placeholder: "e.g. Indoor alternative confirmed",
    applicableServiceTypeIds: ["photographer", "videographer"],
  },
  {
    id: "water-access",
    label: "Requires water access for floral care",
    category: "Space & Environment",
    valueKind: "text",
    placeholder: "e.g. Tap within 10m of setup",
    applicableServiceTypeIds: ["hall-decorator"],
  },
  {
    id: "dedicated-kitchen-space",
    label: "Requires dedicated kitchen space or tent",
    category: "Space & Environment",
    valueKind: "text",
    placeholder: "e.g. Minimum 15sqm",
    applicableServiceTypeIds: ["culinary"],
  },
  {
    id: "parking-for-vehicle",
    label: "Requires reserved parking for service vehicle",
    category: "Space & Environment",
    valueKind: "text",
    placeholder: "e.g. 1 space near entrance",
    applicableServiceTypeIds: ["car-rental", "culinary", "hall-decorator"],
  },

  // Event Coordination
  {
    id: "vendor-briefing",
    label: "Requires vendor briefing before event",
    category: "Event Coordination",
    valueKind: "duration",
    placeholder: "e.g. 24 hours before",
    applicableServiceTypeIds: [],
  },
  {
    id: "menu-finalization",
    label: "Menu finalization required before event",
    category: "Event Coordination",
    valueKind: "duration",
    placeholder: "e.g. 48 hours before",
    applicableServiceTypeIds: ["culinary"],
  },
  {
    id: "guest-list-seating-chart",
    label: "Must be provided with guest list and seating chart",
    category: "Event Coordination",
    valueKind: "text",
    placeholder: "e.g. Shared via email, final copy",
    applicableServiceTypeIds: ["mc", "ushers", "event-planner", "security"],
  },
  {
    id: "run-of-show",
    label: "Requires a run-of-show / event timeline",
    category: "Event Coordination",
    valueKind: "text",
    placeholder: "e.g. Minute-by-minute schedule",
    applicableServiceTypeIds: ["mc", "event-planner", "dj"],
  },
  {
    id: "dress-code-brief",
    label: "Dress code or uniform brief required",
    category: "Event Coordination",
    valueKind: "text",
    placeholder: "e.g. Black-tie, agency uniform",
    applicableServiceTypeIds: ["ushers", "security", "mc"],
  },
];

export const SERVICE_REQUIREMENT_CATEGORIES = Array.from(
  new Set(SERVICE_REQUIREMENT_DEFINITIONS.map((r) => r.category))
);

/** Requirements that apply given the vendor's selected service type ids. */
export function getApplicableRequirements(selectedServiceTypeIds: string[]): RequirementDefinition[] {
  return SERVICE_REQUIREMENT_DEFINITIONS.filter(
    (req) =>
      req.applicableServiceTypeIds.length === 0 ||
      req.applicableServiceTypeIds.some((id) => selectedServiceTypeIds.includes(id))
  );
}


import type { PackagePreset } from "./types/listing";

// ────────────────────────────────────────────────────────────────────────────
// MOCK — backend contract: GET /listings/package-presets?serviceTypeId=dj
//
// Keyed by service type id (see data/mockCategories.ts) for an O(1) lookup —
// `PACKAGE_TEMPLATES[serviceTypeId]` gives the package builder its starting
// templates. `PACKAGE_NAME_PRESETS` / `PACKAGE_PERK_PRESETS` are looser
// suggestion lists so a vendor can mix a preset name with custom perks (or
// vice versa) instead of only accepting a whole template.
// ────────────────────────────────────────────────────────────────────────────

export const PACKAGE_TEMPLATES: Record<string, PackagePreset[]> = {
  dj: [
    {
      name: "Basic Set",
      price: 450_000,
      description: "Perfect for intimate gatherings and small parties.",
      perks: ["4 hours of DJ service", "Basic sound system setup", "1 wireless microphone", "Pre-event consultation"],
    },
    {
      name: "Standard Vibe",
      price: 800_000,
      description: "Ideal for weddings and corporate events.",
      perks: ["8 hours of DJ service", "Full sound system + lighting", "2 wireless microphones", "MC coordination"],
      isPopular: true,
    },
    {
      name: "The Spinall Experience",
      price: 1_500_000,
      description: "The ultimate package for large scale concerts and luxury events.",
      perks: ["Full-day coverage", "Concert-grade sound rig", "Backup DJ on standby", "Custom setlist curation"],
    },
  ],

  mc: [
    {
      name: "Solo Host",
      price: 300_000,
      description: "One MC for intimate ceremonies and small receptions.",
      perks: ["Up to 4 hours hosting", "Program flow coordination", "Pre-event briefing"],
    },
    {
      name: "Dual Hosting",
      price: 600_000,
      description: "Bilingual or duo hosting for weddings and galas.",
      perks: ["Full-day hosting", "Two MCs (English + local language)", "Guest engagement segments"],
      isPopular: true,
    },
    {
      name: "Celebrity Host",
      price: 1_800_000,
      description: "High-profile hosting for large corporate or televised events.",
      perks: ["Full-day hosting", "Dedicated production liaison", "Custom script writing"],
    },
  ],

  photographer: [
    {
      name: "Essential Coverage",
      price: 350_000,
      description: "4 hours of photography, 50 edited soft copies.",
      perks: ["4 hours of photography", "50 edited soft copies"],
    },
    {
      name: "Premium Documentary",
      price: 750_000,
      description: "10 hours, 2 photographers, 150 edited pictures, all raw files.",
      perks: ["10 hours coverage", "2 photographers", "150 edited pictures", "All raw files included"],
      isPopular: true,
    },
    {
      name: "Luxury Fine Art",
      price: 1_200_000,
      description: "Full day, pre-wedding shoot, luxury photo album, drone coverage.",
      perks: ["Full-day coverage", "Pre-wedding shoot included", "Luxury printed photo album", "Drone coverage"],
    },
  ],

  videographer: [
    {
      name: "Highlight Reel",
      price: 400_000,
      description: "Same-day edit teaser plus a 5-minute highlight film.",
      perks: ["4 hours coverage", "3–5 minute highlight film", "Same-day teaser clip"],
    },
    {
      name: "Cinematic Story",
      price: 950_000,
      description: "Full-day, multi-camera coverage with a documentary-style edit.",
      perks: ["Full-day coverage", "2 videographers", "15-minute cinematic film", "Drone footage"],
      isPopular: true,
    },
    {
      name: "Feature Film",
      price: 1_800_000,
      description: "Multi-day coverage with a full-length feature edit and raw footage.",
      perks: ["Multi-day coverage", "Full-length feature edit", "All raw footage delivered"],
    },
  ],

  "event-planner": [
    {
      name: "Day-of Coordination",
      price: 500_000,
      description: "On-the-day logistics and vendor coordination only.",
      perks: ["Timeline management", "Vendor coordination on the day", "Emergency troubleshooting"],
    },
    {
      name: "Full Planning",
      price: 2_000_000,
      description: "End-to-end planning from concept to execution.",
      perks: ["Concept & theme design", "Vendor sourcing & booking", "Budget management", "Full day-of coordination"],
      isPopular: true,
    },
    {
      name: "Luxury Concierge",
      price: 4_500_000,
      description: "White-glove planning for large-scale, multi-day celebrations.",
      perks: ["Multi-day event planning", "Dedicated planning team", "Guest travel & logistics support"],
    },
  ],

  "makeup-artist": [
    {
      name: "Solo Glam",
      price: 120_000,
      description: "One full face of makeup for the celebrant.",
      perks: ["1 full makeup application", "False lashes included", "Touch-up kit provided"],
    },
    {
      name: "Bridal Party",
      price: 350_000,
      description: "Celebrant plus up to 4 guests, on-site.",
      perks: ["Celebrant + 4 guests", "On-site service", "Trial session included"],
      isPopular: true,
    },
    {
      name: "VIP Glam Squad",
      price: 700_000,
      description: "Multiple artists for large bridal trains or media events.",
      perks: ["Celebrant + 8 guests", "2 makeup artists on-site", "Hair styling included"],
    },
  ],

  ushers: [
    {
      name: "Standard Team",
      price: 200_000,
      description: "4 ushers for guest reception and seating.",
      perks: ["4 ushers", "Guest reception & seating", "Standard uniform"],
    },
    {
      name: "VIP Protocol",
      price: 450_000,
      description: "8 ushers with dedicated VIP and gift table handling.",
      perks: ["8 ushers", "Dedicated VIP handling", "Gift table management", "Branded uniform"],
      isPopular: true,
    },
  ],

  security: [
    {
      name: "Basic Detail",
      price: 250_000,
      description: "2 guards for access control and crowd management.",
      perks: ["2 security personnel", "Access control", "Basic crowd management"],
    },
    {
      name: "Full Event Security",
      price: 600_000,
      description: "6 guards with a team lead and bag-check protocol.",
      perks: ["6 security personnel", "Team lead on-site", "Bag-check protocol", "Emergency response plan"],
      isPopular: true,
    },
  ],

  "car-rental": [
    {
      name: "Single Vehicle",
      price: 180_000,
      description: "One luxury vehicle with driver for the event day.",
      perks: ["1 vehicle + driver", "Full-day rental", "Fuel included"],
    },
    {
      name: "Convoy Package",
      price: 700_000,
      description: "Fleet of vehicles for the couple and bridal train.",
      perks: ["4 vehicles + drivers", "Full-day rental", "Decorated lead car"],
      isPopular: true,
    },
  ],

  "hall-decorator": [
    {
      name: "Bud Package",
      price: 250_000,
      description: "Centerpieces for 10 tables and a small stage backdrop.",
      perks: ["Centerpieces for 10 tables", "Small stage backdrop"],
    },
    {
      name: "Full Bloom",
      price: 600_000,
      description: "Full hall decor, ceiling draping, premium centerpieces, and red carpet.",
      perks: ["Full hall decor", "Ceiling draping", "Premium centerpieces", "Red carpet entrance"],
      isPopular: true,
    },
    {
      name: "Botanical Luxe",
      price: 1_100_000,
      description: "Fresh floral installation with a signature statement backdrop.",
      perks: ["Fresh floral installation", "Signature statement backdrop", "Full venue styling"],
    },
  ],

  culinary: [
    {
      name: "Intimate Menu",
      price: 400_000,
      description: "3-course plated menu for up to 50 guests.",
      perks: ["3-course plated menu", "Up to 50 guests", "Service staff included"],
    },
    {
      name: "Grand Buffet",
      price: 1_200_000,
      description: "Full buffet spread with live cooking stations for up to 200 guests.",
      perks: ["Buffet spread", "2 live cooking stations", "Up to 200 guests", "Service staff included"],
      isPopular: true,
    },
    {
      name: "Signature Tasting",
      price: 2_500_000,
      description: "Chef's tasting menu with premium ingredients for up to 300 guests.",
      perks: ["Chef's tasting menu", "Premium ingredients", "Up to 300 guests", "Dedicated event chef"],
    },
  ],
};

/** Loose name suggestions per service type, for the "or pick a name" quick-select in the builder. */
export const PACKAGE_NAME_PRESETS: Record<string, string[]> = Object.fromEntries(
  Object.entries(PACKAGE_TEMPLATES).map(([serviceTypeId, templates]) => [
    serviceTypeId,
    templates.map((t) => t.name),
  ])
);

/** Loose perk suggestions per service type, for the "or pick a perk" quick-select in the builder. */
export const PACKAGE_PERK_PRESETS: Record<string, string[]> = Object.fromEntries(
  Object.entries(PACKAGE_TEMPLATES).map(([serviceTypeId, templates]) => [
    serviceTypeId,
    Array.from(new Set(templates.flatMap((t) => t.perks))),
  ])
);

export function getPackageTemplates(serviceTypeId: string): PackagePreset[] {
  return PACKAGE_TEMPLATES[serviceTypeId] ?? [];
}

