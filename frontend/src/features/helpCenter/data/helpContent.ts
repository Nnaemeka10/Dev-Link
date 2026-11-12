// 
// Help Center - content data
// Pure data (icons referenced by string id) so it can be imported safely
// by both server routes (generateStaticParams) and client components.
// 

export interface HelpArticle {
  slug: string;
  question: string;
  /** Paragraphs of the answer, rendered in order. */
  answer: string[];
  /** Featured in the "Popular articles" section on /help. */
  popular?: boolean;
}

export interface HelpCategory {
  slug: string;
  title: string;
  description: string;
  icon: "compass" | "card" | "store" | "shield" | "refund" | "heart";
  articles: HelpArticle[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    description: "Accounts, browsing, and how EventVnV works.",
    icon: "compass",
    articles: [
      {
        slug: "what-is-eventvnv",
        question: "What is EventVnV?",
        answer: [
          "EventVnV is a marketplace for events in Nigeria. Discover event halls and event services - DJs, MCs, photographers, planners, decorators and more - book them in one place, and pay securely with escrow protection.",
          "We connect you directly with independent vendors. You get transparent pricing (including VAT), real photos and verified listings; vendors get paid out after your event goes smoothly.",
        ],
        popular: true,
      },
      {
        slug: "create-an-account",
        question: "How do I create an account?",
        answer: [
          "Tap the menu in the top-right corner and choose Sign up. You can register as a customer, a vendor, or both - the same account can switch between booking and listing.",
          "You'll verify your email with a one-time code, then you're ready to browse, save listings and make bookings.",
        ],
      },
      {
        slug: "browse-and-filter",
        question: "How do I find the right hall or service?",
        answer: [
          "Use the search bar on the home page to filter by category, state and LGA, date and guest capacity. Results update instantly.",
          "Found something you like? Save it to your Saved listings so you can compare and come back later - your selected dates are never locked until you actually pay for a booking.",
        ],
      },
      {
        slug: "saved-listings",
        question: "Where do my saved listings live?",
        answer: [
          "Every listing you save goes to your Saved page, reachable from the bottom navigation on mobile or your profile menu.",
          "Saved listings are private to you - vendors are not notified when you save or unsave their listing.",
        ],
      },
    ],
  },
  {
    slug: "bookings-and-payments",
    title: "Bookings & payments",
    description: "Booking flow, payment methods, escrow and confirmations.",
    icon: "card",
    articles: [
      {
        slug: "how-do-i-book",
        question: "How do I book a hall or service?",
        answer: [
          "Open a listing, pick your dates on the calendar and tap Book. You'll go through three quick steps: event details, review (with a full price breakdown), then payment.",
          "Your booking is only created once payment succeeds. Until then nothing is reserved - you're free to change your mind at any point before paying.",
        ],
        popular: true,
      },
      {
        slug: "when-are-dates-locked",
        question: "When are my dates reserved??",
        answer: [
          "Tap Pay and we hold your selected dates while the secure payment popup is open, so nobody else can check out for them. The popup keeps your hold alive automatically - you don't need to do anything.",
          "Close or cancel the popup and the hold is released immediately. If your browser crashes or you lose connection, the hold releases itself within about 2–3 minutes.",
          "Each payment session lasts up to 30 minutes. If it runs out, the popup closes and the dates are released - just tap Pay again to start a fresh session, as long as nobody else has booked them. Your dates are permanently secured only once payment succeeds.",
        ],
        popular: true,
      },
      { 
        slug: "payment-methods",
        question: "What payment methods can I use?",
        answer: [
          "We accept payments in Naira through our secure payment partner, including debit/credit cards and bank transfer.",
          "Card details are handled entirely by the payment processor - EventVnV never sees or stores your full card number.",
        ],
        popular: true,
      },
      {
        slug: "escrow-explained",
        question: "How does escrow protect my money?",
        answer: [
          "When you pay for a booking, the money is held securely in escrow instead of going straight to the vendor. The vendor only gets paid after your event is delivered and the 24-hour dispute window closes.",
          "If a vendor declines your paid booking, or you cancel before they confirm, the funds are returned to you - so your money is never at risk of a no-show.",
        ],
        popular: true,
      },
      {
        slug: "vendor-confirmation",
        question: "When does the vendor confirm my booking?",
        answer: [
          "Right after your payment succeeds, the vendor receives your booking in their dashboard to confirm. Most vendors confirm within a few hours.",
          "Some listings have instant approval enabled - those confirm automatically the moment payment succeeds.",
        ],
      },
      {
        slug: "booking-expiry",
        question: "Why did my booking expire?",
        answer: [
          "Your dates are held only while the payment popup is open, and the popup quietly keeps the hold alive. Closing or cancelling it releases them instantly; a crash or lost connection releases them within about 2–3 minutes.",
          "A payment session lasts up to 30 minutes. When it ends, the popup closes automatically and the dates are released. Nothing is charged unless you complete payment - tap Pay again whenever you're ready.",
        ],
      },
    ],
  },
  {
    slug: "vendors-and-listings",
    title: "For vendors",
    description: "Listing your halls and services, packages and payouts.",
    icon: "store",
    articles: [
      {
        slug: "become-a-vendor",
        question: "How do I become a vendor?",
        answer: [
          "Choose Become a Vendor on the home page, then create your listing through the guided step-by-step form - category, details, pricing, photos and location.",
          "A complete location is required before you can publish: customers search by state and LGA, so accurate location details directly affect how often your listing is found.",
        ],
        popular: true,
      },
      {
        slug: "service-packages",
        question: "How do packages work for services?",
        answer: [
          "Service listings can offer multiple packages (for example Basic, Standard, Premium) each with its own price. Customers pick the package that fits when booking.",
          "The platform calculates the final price automatically from the package price and the number of days booked - you never have to negotiate or invoice manually.",
        ],
      },
      {
        slug: "when-do-i-get-notified",
        question: "When am I notified about a booking?",
        answer: [
          "You're notified the moment a customer pays for a booking on your listing - not before. Unpaid selections never reach your dashboard, so everything you see in Bookings is a real, paid opportunity.",
          "Confirm or decline paid bookings promptly from your vendor dashboard. On listings with instant approval, confirmed happens automatically.",
        ],
      },
      {
        slug: "vendor-payouts",
        question: "How and when do I get paid?",
        answer: [
          "Payouts are released after the customer's event ends and the 24-hour dispute window closes without a dispute.",
          "A platform service fee of 17.5% of the total booking value (inclusive of VAT) is deducted from your payout. You can follow each payout's status - funds held, processing, released - in your vendor dashboard.",
        ],
        popular: true,
      },
    ],
  },
  {
    slug: "account-and-security",
    title: "Account & security",
    description: "Passwords, profile settings and staying safe.",
    icon: "shield",
    articles: [
      {
        slug: "reset-password",
        question: "How do I reset my password?",
        answer: [
          "Tap Log in, then Forgot password. Enter the email address on your account and we'll send you a one-time code to verify it's you, after which you can set a new password.",
          "If the email doesn't arrive, check your spam folder - and make sure you're using the address you registered with.",
        ],
      },
      {
        slug: "update-profile",
        question: "How do I update my profile details?",
        answer: [
          "Go to your Profile page to update your name, phone number and photo. Your settings page also holds notification and security preferences.",
          "Keeping your phone number current matters - it's how vendors and our support team reach you around your event.",
        ],
      },
      {
        slug: "account-safety-tips",
        question: "How do I keep my account secure?",
        answer: [
          "Use a unique password you don't use anywhere else, and never share your login details - even with someone claiming to be support. EventVnV staff will never ask for your password.",
          "Always keep payments and messages on the platform. Off-platform payments lose escrow protection, dispute rights and support eligibility.",
        ],
      },
    ],
  },
  {
    slug: "cancellations-and-refunds",
    title: "Cancellations & refunds",
    description: "Cancelling bookings, refunds and dispute windows.",
    icon: "refund",
    articles: [
      {
        slug: "cancel-a-booking",
        question: "How do I cancel a booking?",
        answer: [
          "Haven't paid yet? Closing the payment popup releases your dates instantly - nothing to cancel, nothing charged. If the app closed unexpectedly, any leftover hold clears itself within a few minutes.",
          "For a paid booking, contact support or the vendor through your booking page. Cancelling before the vendor confirms gets you a full refund.",
        ],
        popular: true,
      },
      {
        slug: "refund-timelines",
        question: "How long do refunds take?",
        answer: [
          "Approved refunds are returned to your original payment method immediately on our side. Depending on your bank or card provider, the money typically lands within 3–10 business days.",
          "You'll always have your booking reference (it starts with EVV-) to track the refund - quote it whenever you contact support.",
        ],
      },
      {
        slug: "vendor-declined",
        question: "What if the vendor declines my paid booking?",
        answer: [
          "You are refunded automatically in full - the escrow system makes this instant on our side, with no dispute needed.",
          "Your dates are released back to open, and you're free to book another vendor. Our support team can help you find a comparable alternative fast.",
        ],
      },
      {
        slug: "dispute-window",
        question: "What is the dispute window?",
        answer: [
          "After your event ends, there is a 24-hour window during which you can raise a dispute if something went materially wrong - for example the venue didn't match the listing.",
          "During the window the vendor's payout stays on hold in escrow. Once it closes without a dispute, the payout is released to the vendor.",
        ],
      },
    ],
  },
  {
    slug: "trust-and-safety",
    title: "Trust & safety",
    description: "Verification, reporting listings and safe events.",
    icon: "heart",
    articles: [
      {
        slug: "vendor-verification",
        question: "How are vendors verified?",
        answer: [
          "Every vendor goes through verification before their listing goes live, including identity checks and payout account verification. Verified vendors carry the verified badge on their profile.",
          "Listings are also reviewed for accuracy - real photos, honest capacity claims and a complete, required location.",
        ],
      },
      {
        slug: "report-a-listing",
        question: "How do I report a listing or a user?",
        answer: [
          "If a listing looks fake, misleading or unsafe, contact support with the listing name or your booking reference. Our team reviews every report, typically within one business day.",
          "Reports are confidential - the person you report is never told who filed it.",
        ],
      },
      {
        slug: "event-day-safety",
        question: "Any tips for a safe event day?",
        answer: [
          "Keep all coordination and payment inside EventVnV so there's a record of everything that was agreed, and the escrow protections apply.",
          "Visit or verify the venue before the event where you can, keep your booking reference handy, and raise anything off within 24 hours after the event so the dispute window can work for you.",
        ],
      },
    ],
  },
];

// Flattened search index 

export interface FlatHelpArticle extends HelpArticle {
  categorySlug: string;
  categoryTitle: string;
}

export const HELP_ARTICLES: FlatHelpArticle[] = HELP_CATEGORIES.flatMap(
  (category) =>
    category.articles.map((article) => ({
      ...article,
      categorySlug: category.slug,
      categoryTitle: category.title,
    }))
);

export const POPULAR_ARTICLES: FlatHelpArticle[] = HELP_ARTICLES.filter(
  (article) => article.popular
);