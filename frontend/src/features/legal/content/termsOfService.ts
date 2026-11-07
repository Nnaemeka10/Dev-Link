import type { LegalDocument } from "./legalTypes";

const LAST_UPDATED = "7 November 2026";

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
          text: "EventVnV provides an online marketplace for event halls and event services in Nigeria. By accessing or using EventVnV - as a guest, customer or vendor - you agree to be bound by these terms and our Privacy Policy.",
        },
        {
          type: "p",
          text: "If you do not agree with any part of these terms, please do not use the platform. If you have questions, contact support@eventvnv.ng before transacting.",
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
            "Selected dates are only reserved once your payment succeeds - not while you are still deciding. Until then, the dates stay open to you and other customers.",
            "Unpaid bookings expire automatically after 30 minutes, freeing the dates entirely.",
            "All prices are calculated by the platform in Naira: the listing's base price for your dates, plus 7.5% VAT. What you see at review is what you pay.",
            "Payments are processed securely through our payment partner, supporting cards and bank transfers.",
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
          text: "Only after payment succeeds are your dates locked for others, and only then is the vendor notified to confirm. This keeps the calendar honest: unpaid selections never block anyone.",
        },
        {
          type: "p",
          text: "Vendors pay EventVnV a platform service fee of 17.5% of the total booking value (inclusive of VAT), deducted from their payout. Vendor payouts are released after the event ends and the 24-hour dispute window closes without a dispute.",
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
            "If a vendor declines or does not confirm a paid booking, you are refunded automatically.",
            "Cancellations after the vendor confirms are handled per the listing's stated policy, and our support team will always help facilitate a fair outcome.",
            "Refunds are returned to your original payment method; how quickly they land depends on your bank or payment provider.",
          ],
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
          text: "You may stop using EventVnV and delete your account at any time. We may suspend or remove accounts that violate these terms, create risk for others, or abuse the platform.",
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
            "Support - support@eventvnv.ng",
            "EventVnV Support, Lagos, Nigeria",
          ],
        },
      ],
    },
  ],
};