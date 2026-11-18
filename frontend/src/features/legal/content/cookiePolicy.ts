import type { LegalDocument } from "./legalTypes";

// Update whenever the cookies or storage we use change - it renders in the hero.
const LAST_UPDATED = "18 November 2026";

/**
 * Accurate to the actual stack, not boilerplate:
 *  - one first-party cookie (`token`, lib/utils.ts generateToken)
 *  - the localStorage keys the app really writes (booking draft, last search,
 *    recent searches, create-listing persist, profile nudge)
 *  - the sessionStorage flag from ProfileCompletionNudge
 *  - Google sign-in, Paystack checkout and Cloudinary delivery as third parties
 * There are no analytics or advertising cookies today, so none are claimed.
 */
export const COOKIE_POLICY: LegalDocument = {
  eyebrow: "Legal · Cookies",
  title: "Cookie Policy",
  lastUpdated: LAST_UPDATED,
  intro:
    "This policy lists every cookie and piece of browser storage EventVnV uses, what it does, how long it lasts and how you can control it. It is deliberately short and specific: we only store what the marketplace needs to work.",
  sections: [
    {
      id: "what-they-are",
      heading: "Cookies, local storage and session storage",
      blocks: [
        {
          type: "p",
          text: "A cookie is a small file a website asks your browser to keep. It is sent back to that same website on every request, which is how a site remembers you between pages.",
        },
        {
          type: "p",
          text: "Local storage keeps data on your device until it is cleared. Session storage keeps it only until you close the tab. Neither is sent to our servers automatically - our own code reads them to restore work you were in the middle of.",
        },
        {
          type: "p",
          text: "EventVnV sets one cookie and a handful of storage keys. There are no advertising or analytics cookies on the platform today.",
        },
      ],
    },
    {
      id: "strictly-necessary",
      heading: "The one cookie we set",
      blocks: [
        {
          type: "p",
          text: "When you sign in, we set a single first-party cookie named token. It is strictly necessary: without it the site cannot know who you are, and bookings, saved listings, messages and payouts would not be possible.",
        },
        {
          type: "list",
          items: [
            "Name - token",
            "Purpose - keeps you signed in across pages and refreshes, and authenticates the realtime connection that delivers your chat messages.",
            "Duration - 7 days, or sooner if you sign out, change your password or deactivate your account.",
            "Type - first-party, strictly necessary. It is never used for advertising or profiling.",
            "Flags - HttpOnly (page scripts cannot read it), Secure in production (HTTPS only), SameSite configured to protect against cross-site request forgery, and scoped to the whole site.",
          ],
        },
        {
          type: "p",
          text: "Every token carries a version number tied to your account. Changing your password or deactivating your account invalidates all previously issued tokens immediately, so a copied cookie stops working at once.",
        },
      ],
    },
    {
      id: "local-storage",
      heading: "What we keep on your device",
      blocks: [
        {
          type: "p",
          text: "These entries live in your browser's local storage. They are never transmitted to us automatically and are not used to track you across other websites.",
        },
        {
          type: "list",
          items: [
            "eventvnv:booking-draft - the booking you are building: selected dates, start and end time, guest count, notes for the vendor and, for services, the delivery address. Kept so a refresh or a return visit does not lose your work, and cleared automatically once payment succeeds.",
            "eventvnv:last-search - your most recent search (category, location or coverage area, dates, capacity, service role and date flexibility), so the search bar is already filled in when you come back.",
            "eventvnv:recent-searches - up to five recent locations or coverage areas, shown when you focus the search field. Older entries are dropped as new ones arrive.",
            "eventvnv-create-listing - the listing draft you are building in the vendor wizard, including which photos have finished uploading, so you can leave and resume. Replaced when you start a new listing.",
            "eventvnv:profile-nudge:v1 - the date until which you asked us to stop reminding you to complete your profile. Set only when you tap \u201cRemind me later\u201d, and lasts seven days.",
          ],
        },
        {
          type: "h3",
          text: "Session storage",
        },
        {
          type: "p",
          text: "eventvnv:profile-nudge:shown records whether the profile reminder has already appeared in this browser session, so it shows at most once. It is deleted when you close the tab.",
        },
      ],
    },
    {
      id: "third-parties",
      heading: "Cookies set by services we use",
      blocks: [
        {
          type: "p",
          text: "Some features are delivered by specialist providers. When you use them, they may set cookies on their own domains. We do not control those cookies, and their handling is governed by their own policies.",
        },
        {
          type: "list",
          items: [
            "Google (sign-in) - choosing \u201cContinue with Google\u201d opens Google's sign-in flow, which may set cookies on Google domains to recognise your device and prevent abuse. We receive only your name, email address and profile photo.",
            "Paystack (checkout and payouts) - the secure payment popup runs on Paystack's domain and sets cookies for checkout state, device recognition and fraud prevention. Your card details are entered there and never reach our servers.",
            "Cloudinary (images) - listing photos and avatars are served from res.cloudinary.com. These are content-delivery requests rather than tracking cookies; the provider receives your IP address as part of serving the file.",
          ],
        },
        {
          type: "p",
          text: "We also run a security layer that inspects request metadata and IP addresses to block bots and rate-limit abuse. It does not set an advertising cookie and does not build a profile of you.",
        },
      ],
    },
    {
      id: "not-used",
      heading: "What we do not use",
      blocks: [
        {
          type: "list",
          items: [
            "No advertising or retargeting cookies.",
            "No cross-site trackers or data brokers.",
            "No third-party analytics or session-recording scripts.",
            "No social-media pixels.",
          ],
        },
        {
          type: "p",
          text: "If we ever add optional analytics or marketing cookies, we will update this page first and ask for your consent where the law requires it before anything is stored.",
        },
      ],
    },
    {
      id: "your-choices",
      heading: "How to control them",
      blocks: [
        {
          type: "p",
          text: "Every mainstream browser lets you inspect, block and delete cookies and site data. The steps are broadly the same:",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "Open your browser's privacy or site-settings panel.",
            "Find the entry for eventvnv.com to see the token cookie and the storage keys listed above.",
            "Delete individual entries, or clear all site data to remove everything at once.",
            "Use private or incognito browsing if you want everything discarded when you close the window.",
          ],
        },
        {
          type: "h3",
          text: "What happens if you block them",
        },
        {
          type: "p",
          text: "You can still browse and search listings without the token cookie, but you will not be able to sign in, save listings, book, message vendors or manage listings. Clearing local storage only discards unfinished drafts and search history - bookings you have already paid for are stored on our servers and are unaffected.",
        },
      ],
    },
    {
      id: "retention",
      heading: "How long things last",
      blocks: [
        {
          type: "list",
          items: [
            "token cookie - up to 7 days; removed immediately on sign-out, password change or account deactivation.",
            "Booking draft - until payment succeeds or you clear site data.",
            "Last search and recent searches - until you clear site data; recent searches are capped at five entries.",
            "Listing draft - until you publish it, discard it or clear site data.",
            "Profile reminder preference - seven days from the moment you tap \u201cRemind me later\u201d.",
            "Session flag - until you close the tab.",
          ],
        },
      ],
    },
    {
      id: "changes",
      heading: "Changes to this policy",
      blocks: [
        {
          type: "p",
          text: "We will update this page whenever the cookies or storage we use change, and the \u201cLast updated\u201d date above will always reflect the current version. Material changes will be announced in the app or by email.",
        },
      ],
    },
    {
      id: "contact",
      heading: "Contact us",
      blocks: [
        {
          type: "p",
          text: "Questions about cookies or how we handle your data? We are happy to walk you through it.",
        },
        {
          type: "list",
          items: [
            "General support - support@eventvnv.com",
            "Privacy and data requests - privacy@eventvnv.com",
            "EventVnV Support, Lagos, Nigeria",
          ],
        },
        {
          type: "p",
          text: "See also our Privacy Policy for the full picture of what we collect and why.",
        },
      ],
    },
  ],
};