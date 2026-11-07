import type { LegalDocument } from "./legalTypes";

// Update whenever the policy changes - it renders in the hero.
const LAST_UPDATED = "7 November 2026";

export const PRIVACY_POLICY: LegalDocument = {
  eyebrow: "Legal · Privacy",
  title: "Privacy Policy",
  lastUpdated: LAST_UPDATED,
  intro:
    "This policy explains how EventVnV collects, uses, shares and protects your personal data when you use our marketplace to discover, book and provide event halls and services. It is written to comply with the Nigeria Data Protection Act (NDPA) 2023.",
  sections: [
    {
      id: "overview",
      heading: "Who we are and what this covers",
      blocks: [
        {
          type: "p",
          text: "EventVnV (\u201cwe\u201d, \u201cus\u201d) operates a marketplace that connects customers planning events with independent vendors of event halls and event services across Nigeria. We act as a data controller for the personal data described in this policy.",
        },
        {
          type: "p",
          text: "This policy applies to everyone who uses EventVnV - customers browsing or booking, vendors listing halls and services, and visitors just passing through. It does not apply to the internal practices of vendors or payment processors, which are governed by their own policies.",
        },
        {
          type: "p",
          text: "If you have questions about this policy or how we handle your data, contact us at privacy@eventvnv.ng.",
        },
      ],
    },
    {
      id: "info-we-collect",
      heading: "Information we collect",
      blocks: [
        {
          type: "p",
          text: "We collect only the information needed to run a safe, functional marketplace:",
        },
        {
          type: "list",
          items: [
            "Account information - your name, email address, phone number and password (stored only as a secure hash).",
            "Profile information - whether you use EventVnV as a customer, a vendor, or both.",
            "Booking information - the listing, selected dates and times, event details and booking references for bookings you make.",
            "Transaction information - amounts, VAT, payment status and payout status. Card details are processed by our payment partner; we never store full card numbers.",
            "Listing information - for vendors: listing details, photos, pricing, packages, location and payout details.",
            "Communications - messages you exchange with other users on the platform, and conversations with our support team.",
            "Device and usage information - IP address, browser type and pages you visit, used to keep the service secure and improve it.",
          ],
        },
      ],
    },
    {
      id: "how-we-use",
      heading: "How we use your information",
      blocks: [
        {
          type: "list",
          items: [
            "Operating your account and letting you browse, save, book and manage listings.",
            "Processing bookings, payments, escrow holding and vendor payouts.",
            "Notifying the right people at the right time - for example, a vendor is notified once a booking has been paid for and is ready to confirm.",
            "Providing customer support and resolving disputes within the booking dispute window.",
            "Keeping the platform safe - detecting fraud, fake listings and abuse.",
            "Improving EventVnV, using aggregated data that does not identify you.",
            "Sending you product news and offers - only where you have agreed to it, and you can opt out any time.",
          ],
        },
      ],
    },
    {
      id: "legal-bases",
      heading: "Our legal bases (NDPA)",
      blocks: [
        {
          type: "p",
          text: "Under the Nigeria Data Protection Act 2023, we process your personal data on one or more of these grounds:",
        },
        {
          type: "list",
          items: [
            "Performance of a contract - to create your account, process your bookings and pay out vendors.",
            "Legitimate interests - to secure the platform, prevent fraud and improve the service, balanced against your rights.",
            "Consent - for optional communications like marketing emails, which you can withdraw at any time.",
            "Legal obligation - where Nigerian law requires us to keep records, such as transaction and tax records.",
          ],
        },
      ],
    },
    {
      id: "sharing",
      heading: "How we share information",
      blocks: [
        {
          type: "p",
          text: "We do not sell your personal data. We share it only where it is necessary:",
        },
        {
          type: "list",
          items: [
            "With vendors - the details they need to host your event (name, contact information and booking details) once a booking is paid for and shared for fulfilment.",
            "With payment partners - our payment processor handles card payments and bank transfers and receives the data needed to complete them.",
            "With service providers - hosting, analytics and communication tools that help us run the platform, bound by confidentiality obligations.",
            "With authorities - where we are legally required, or to protect the rights, property or safety of our users.",
            "In a business transfer - if EventVnV is merged or acquired, with notice to you beforehand where possible.",
          ],
        },
      ],
    },
    {
      id: "payments-escrow",
      heading: "Payments and escrow",
      blocks: [
        {
          type: "p",
          text: "When you pay for a booking, your money is held in escrow while the vendor confirms and delivers the service. To make that work, we track the payment status of every booking - pending, paid, funds held, confirmed, refunded and payout released.",
        },
        {
          type: "p",
          text: "We store booking references and payout records for vendors. Sensitive card data is handled entirely by our payment processor and never touches our servers.",
        },
      ],
    },
    {
      id: "retention",
      heading: "How long we keep your data",
      blocks: [
        {
          type: "p",
          text: "We keep your personal data only as long as your account is active, or as long as we need it for the purposes in this policy.",
        },
        {
          type: "list",
          items: [
            "Transaction and payout records are retained for the period required by Nigerian tax and financial record-keeping law.",
            "Booking history is retained so both customers and vendors have a reliable record of what was agreed.",
            "Unpaid, expired bookings are cleaned up automatically.",
            "When you ask us to delete your account, we remove or anonymise your data unless the law requires us to keep it.",
          ],
        },
      ],
    },
    {
      id: "security",
      heading: "Security",
      blocks: [
        {
          type: "p",
          text: "We protect your data with encryption in transit, strict access controls and monitoring for suspicious activity. Payments run through a PCI-compliant processor.",
        },
        {
          type: "p",
          text: "No online service can promise perfect security. If we ever become aware of a breach affecting your data, we will notify you and the relevant authorities as required by the NDPA.",
        },
      ],
    },
    {
      id: "your-rights",
      heading: "Your rights",
      blocks: [
        {
          type: "p",
          text: "The NDPA gives you real control over your data. You can ask us to:",
        },
        {
          type: "list",
          items: [
            "Give you access to the personal data we hold about you.",
            "Correct data that is inaccurate or incomplete.",
            "Delete your data, subject to records we must legally retain.",
            "Restrict or object to certain processing.",
            "Withdraw consent for marketing at any time.",
            "Receive your data in a portable format.",
          ],
        },
        {
          type: "p",
          text: "To exercise any of these rights, email privacy@eventvnv.ng. If you are unhappy with our response, you may complain to the Nigeria Data Protection Commission (NDPC).",
        },
      ],
    },
    {
      id: "cookies",
      heading: "Cookies and analytics",
      blocks: [
        {
          type: "p",
          text: "We use a small number of cookies and similar technologies: essential ones that keep you signed in and the platform secure, analytics ones that help us understand which features matter, and preference ones that remember your settings.",
        },
        {
          type: "p",
          text: "You can control or delete cookies through your browser settings. Blocking essential cookies will stop parts of EventVnV from working.",
        },
      ],
    },
    {
      id: "children",
      heading: "Children",
      blocks: [
        {
          type: "p",
          text: "EventVnV is intended for users aged 18 and over. Accounts and bookings require an adult, and we do not knowingly collect data from children. If you believe a child has given us personal data, contact privacy@eventvnv.ng and we will delete it.",
        },
      ],
    },
    {
      id: "changes",
      heading: "Changes to this policy",
      blocks: [
        {
          type: "p",
          text: "We may update this policy as the platform evolves. When we do, we will change the \u201cLast updated\u201d date above, and for material changes we will notify you in the app or by email before the new policy takes effect.",
        },
      ],
    },
    {
      id: "contact",
      heading: "Contact us",
      blocks: [
        {
          type: "p",
          text: "Questions about privacy? We are here to help.",
        },
        {
          type: "list",
          items: [
            "General support - support@eventvnv.ng",
            "Privacy and data requests - privacy@eventvnv.ng",
            "EventVnV Support, Lagos, Nigeria",
          ],
        },
      ],
    },
  ],
};