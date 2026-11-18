import type { LegalDocument } from "./legalTypes";

const LAST_UPDATED = "18 November 2026";

export const TERMS_OF_SERVICE: LegalDocument = {
  eyebrow: "Legal · Terms",
  title: "Terms & Conditions",
  lastUpdated: LAST_UPDATED,
  intro:
    "These terms govern your use of the EventVnV marketplace - whether you are booking a hall or service, or listing your venue for events. By creating an account or making a booking, you agree to them.",
  sections: [
    {
      id: "agreement",
      heading: "Agreement to these terms",
      blocks: [
        {
          type: "p",
          text: "EventVnV provides an online marketplace for event halls and event services in Nigeria. By accessing or using EventVnV - as a guest, customer or vendor - you agree to be bound by these terms, our Privacy Policy and our Cookie Policy.",
        },
        {
          type: "p",
          text: "If you do not agree with any part of these terms, please do not use the platform. If you have questions, contact support@eventvnv.com before transacting.",
        },
      ],
    },
    {
      id: "the-platform",
      heading: "What EventVnV is (and is not)",
      blocks: [
        {
          type: "p",
          text: "EventVnV is a marketplace that connects customers with independent vendors. Each vendor is an independent business. When you book a hall, a DJ, a photographer or any other service, your contract is with that vendor - not with EventVnV.",
        },
        {
          type: "p",
          text: "We do not own or operate the venues, and we do not deliver the services. We provide discovery, booking, escrow-protected payments, messaging and support - and we hold funds securely so both sides can transact with confidence.",
        },
      ],
    },
    {
      id: "accounts",
      heading: "Accounts and eligibility",
      blocks: [
        {
          type: "list",
          items: [
            "You must be at least 18 years old to create an account and make bookings.",
            "Provide accurate, complete information when registering, and keep it up to date.",
            "Keep your password confidential - activity on your account is your responsibility.",
            "One person, one account. Do not share accounts with others.",
          ],
        },
      ],
    },
    {
      id: "bookings-payments",
      heading: "Bookings and payments",
      blocks: [
        {
          type: "p",
          text: "Booking is simple: pick your dates, add your event details, review the summary and pay. A few important mechanics:",
        },
        {
          type: "list",
          items: [
            "When you open the secure payment popup, we temporarily reserve your selected dates so you can complete payment without another customer taking them. During a hold, those dates cannot be checked out by other customers.",
            "Holds are free of charge, are not confirmed bookings, and lapse automatically if payment is not completed. Only a successfully paid booking secures your dates.",
            "Prices are set by vendors. EventVnV adds Value Added Tax (VAT) at 7.5% of the vendor's price (the subtotal). The amount payable at checkout is the subtotal plus VAT.",
            "EventVnV charges vendors a commission of 10% of the subtotal. VAT is collected on behalf of, and remitted to, the relevant tax authority and does not form part of EventVnV's revenue.",
            "Payments are processed by our payment partner. We do not store full card details. Funds are held in escrow until the booking is confirmed and the event has completed.",
            "Every booking has a unique reference you can use when contacting support.",
          ],
        },
      ],
    },
    {
      id: "escrow-confirmation",
      heading: "Escrow, vendor confirmation and payouts",
      blocks: [
        {
          type: "p",
          text: "When your payment succeeds, the money is held in escrow - the vendor does not receive it directly. The booking then moves to the vendor for confirmation. On some listings with instant approval, the booking confirms automatically.",
        },
        {
          type: "p",
          text: "Your dates are held only while the payment popup is open. The hold is maintained automatically during an active payment session and is released immediately when you close or cancel the popup. If your session ends unexpectedly (for example, a browser crash or loss of connectivity), the hold lapses automatically within a few minutes. Each payment session is limited to 30 minutes, after which the hold is released and checkout must be restarted. Holds are free, are not confirmed bookings, and only a successfully paid booking secures your dates.",
        },
        {
          type: "p",
          text: "Vendor earnings equal the subtotal less the 10% commission. Payouts are initiated automatically after the event ends and the 24-hour dispute window closes, to the bank account on the vendor's profile. Payouts require a verified vendor profile and valid bank details. Payouts are paused while a dispute or refund request is open, or where we reasonably suspect fraud or a breach of these terms.",
        },
      ],
    },
    {
      id: "cancellations-refunds",
      heading: "Cancellations and refunds",
      blocks: [
        {
          type: "list",
          items: [
            "Unpaid bookings simply expire - nothing to cancel, nothing to refund.",
            "If you cancel a paid booking before the vendor confirms, you receive a full refund.",
            "Closing or cancelling the payment popup releases your dates immediately. A hold is not a confirmed booking; dates are secured only when payment succeeds.",
            "If a vendor does not confirm a paid booking within 24 hours of payment, the booking is cancelled and a full refund is issued automatically.",
            "You may request a full refund up to 24 hours after the event ends. Refund requests are reviewed by our support team before being processed.",
            "Once the dispute window closes and the vendor has been paid, refunds are no longer available through the platform; contact support for exceptional cases.",
            "Only full refunds are supported. For partial adjustments, contact support@eventvnv.com.",
            "Refunds are returned to your original payment method; how quickly they land depends on your bank or payment provider.",
          ],
        },
      ],
    },
    {
      id: "taxes",
      heading: "Taxes",
      blocks: [
        {
          type: "p",
          text: "VAT shown at checkout is collected by EventVnV as agent for the vendor and remitted to the relevant tax authority. Vendors remain responsible for their own income tax and any other taxes applicable to their business.",
        },
      ],
    },
    {
      id: "vendor-obligations",
      heading: "Vendor obligations",
      blocks: [
        {
          type: "p",
          text: "If you list on EventVnV, you are responsible for what you publish and deliver:",
        },
        {
          type: "list",
          items: [
            "Listings must be accurate - real photos, true capacity, honest pricing and a complete location, which is required before publishing.",
            "Keep your availability calendar and details current, and honor every confirmed booking.",
            "Respond to paid booking requests promptly by confirming or declining them.",
            "Hold all licences and permits your business needs, and comply with Nigerian law.",
            "Deliver the service as described. You are contracting directly with the customer.",
          ],
        },
      ],
    },
    {
      id: "customer-obligations",
      heading: "Customer obligations",
      blocks: [
        {
          type: "list",
          items: [
            "Give accurate event details when booking, and complete payment within the booking window.",
            "Use halls and services lawfully and respectfully, and follow the vendor's house rules.",
            "You are responsible for damage caused to a venue or equipment during your booking.",
            "Treat vendors and staff with courtesy - harassment is not tolerated.",
          ],
        },
      ],
    },
    {
      id: "prohibited",
      heading: "Prohibited activities",
      blocks: [
        {
          type: "list",
          items: [
            "Taking payments off-platform to bypass escrow protection - this puts both sides at risk and is grounds for removal.",
            "Fake, misleading or duplicated listings, or listing something you are not authorised to offer.",
            "Fraudulent bookings, stolen payment methods, or chargeback abuse.",
            "Scraping, reverse engineering, or interfering with the platform's operation.",
            "Harassment, hate speech, or any unlawful activity on the platform.",
          ],
        },
      ],
    },
    {
      id: "ip",
      heading: "Intellectual property",
      blocks: [
        {
          type: "p",
          text: "The EventVnV name, logo and platform design are our property. By publishing a listing, you grant EventVnV a licence to display its content (photos, descriptions, pricing) on the platform for the purpose of promoting your business.",
        },
        {
          type: "p",
          text: "You keep ownership of your listing content and can remove it when you take your listings down.",
        },
      ],
    },
    {
      id: "disclaimers-liability",
      heading: "Disclaimers and liability",
      blocks: [
        {
          type: "p",
          text: "EventVnV is provided on an \u201cas is\u201d basis. While we verify vendors and hold payments in escrow, we do not control how a venue or service performs on the day.",
        },
        {
          type: "p",
          text: "To the fullest extent permitted by Nigerian law, EventVnV's total liability for any claim relating to a booking is limited to the platform fees or escrow amounts involved in that booking. Nothing in these terms excludes liability that cannot be excluded by law.",
        },
      ],
    },
    {
      id: "termination",
      heading: "Termination",
      blocks: [
        {
          type: "p",
          text: "You may deactivate your account at any time from your profile, and ask us to delete your data. We may suspend or remove accounts that violate these terms, create risk for others, or abuse the platform.",
        },
        {
          type: "p",
          text: "If your account is closed, bookings already in escrow will still be honoured: customers keep their confirmed events, and vendors keep their pending payouts.",
        },
      ],
    },
    {
      id: "law",
      heading: "Governing law",
      blocks: [
        {
          type: "p",
          text: "These terms are governed by the laws of the Federal Republic of Nigeria. Any dispute will first be raised with our support team so we can try to resolve it amicably, and failing that, resolved in the courts of Nigeria.",
        },
      ],
    },
    {
      id: "changes-contact",
      heading: "Changes and contact",
      blocks: [
        {
          type: "p",
          text: "We may update these terms as the platform grows. Material changes will be announced in the app or by email, and the \u201cLast updated\u201d date above will always reflect the current version.",
        },
        {
          type: "list",
          items: [
            "Support - support@eventvnv.com",
            "EventVnV Support, Lagos, Nigeria",
          ],
        },
      ],
    },
  ],
};