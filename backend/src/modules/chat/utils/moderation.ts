// Escrow safety: detect attempts to move the conversation or the payment
// off-platform. WARN + LOG, never block - a false positive must never stop a
// legitimate message. The caller surfaces `warning` as an inline, dismissible
// nudge; the row is always delivered.

export type ModerationKind =
  | 'phone_number'
  | 'email_address'
  | 'external_link'
  | 'off_platform_payment'
  | 'messaging_app';

export interface ModerationResult {
  flagged: boolean;
  kinds: ModerationKind[];
  excerpt: string | null;
  warning: string | null;
}

const CLEAN: ModerationResult = { flagged: false, kinds: [], excerpt: null, warning: null };

const WARNING =
  'Keep payments and arrangements on EventVnV. Off-platform payments lose escrow protection, refund rights and support eligibility.';

/** Strip zero-width characters and normalise look-alike separators. */
function normalise(input: string): string {
  return input
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase();
}

/** Collapse "0 8 0 3 - 1 2 3  4 5 6 7" so spacing cannot defeat detection. */
function digitSkeleton(input: string): string {
  return input.replace(/[\s().\-]/g, '');
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const EMAIL_OBFUSCATED_RE = /[a-z0-9._%+-]{3,}\s*(\(|\[)?\s*(at|@)\s*(\)|\])?\s*[a-z0-9.-]{3,}\s*(\(|\[)?\s*(dot|\.)\s*(\)|\])?\s*[a-z]{2,}/i;
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s]{4,}/i;
const BARE_DOMAIN_RE = /\b[a-z0-9-]{4,}\.(com|net|org|ng|co|io|me|link|app|xyz|top|site)\b/i;

const PHONE_RE = /(?:\+?234|0)[\s().-]*[789][\s().-]*[01][\s().-]*(?:\d[\s().-]*){8}/;
const INTL_PHONE_RE = /\+\d{1,3}[\s().-]*(?:\d[\s().-]*){7,13}/;
const NUDITY_OF_DIGITS_RE = /\d{10,13}/;

const MESSAGING_APPS = [
  'whatsapp', 'whats app', 'wa.me', 'telegram', 't.me', 'signal', 'imo',
  'snapchat', 'instagram dm', 'ig dm', 'facebook messenger',
];

const OFF_PLATFORM_PAYMENT = [
  'pay directly', 'pay me directly', 'direct transfer', 'transfer to my',
  'send to my account', 'my account number', 'account number is',
  'outside the app', 'outside the platform', 'off platform', 'off-platform',
  'avoid the fee', 'avoid the charges', 'skip the fee', 'cheaper outside',
  'paypal', 'cashapp', 'cash app', 'venmo', 'zelle', 'western union', 'moneygram',
  'opay', 'palmpay', 'kuda', 'moniepoint', 'gtbank transfer', 'ussd',
];

function firstMatch(haystack: string, needles: string[]): string | null {
  for (const n of needles) {
    const i = haystack.indexOf(n);
    if (i !== -1) return haystack.slice(Math.max(0, i - 20), Math.min(haystack.length, i + n.length + 20)).trim();
  }
  return null;
}

/**
 * Pure and synchronous so it can run inside the send path without adding
 * latency. Never throws - a moderation failure must not fail a message.
 */
export function detectOffPlatform(body: string | null | undefined): ModerationResult {
  if (!body || typeof body !== 'string') return CLEAN;

  try {
    const text = normalise(body);
    const skeleton = digitSkeleton(text);
    const kinds: ModerationKind[] = [];
    let excerpt: string | null = null;

    const take = (kind: ModerationKind, sample: string | null) => {
      kinds.push(kind);
      if (!excerpt && sample) excerpt = sample.slice(0, 160);
    };

    const email = text.match(EMAIL_RE)?.[0] ?? text.match(EMAIL_OBFUSCATED_RE)?.[0] ?? null;
    if (email) take('email_address', email);

    const link = text.match(URL_RE)?.[0] ?? text.match(BARE_DOMAIN_RE)?.[0] ?? null;
    // A bare "eventvnv.com" is our own domain - not an off-platform signal.
    if (link && !/eventvnv\.com/i.test(link)) take('external_link', link);

    const phone =
      text.match(PHONE_RE)?.[0] ??
      text.match(INTL_PHONE_RE)?.[0] ??
      skeleton.match(NUDITY_OF_DIGITS_RE)?.[0] ??
      null;
    if (phone) take('phone_number', phone);

    const app = firstMatch(text, MESSAGING_APPS);
    if (app) take('messaging_app', app);

    const payment = firstMatch(text, OFF_PLATFORM_PAYMENT);
    if (payment) take('off_platform_payment', payment);

    if (kinds.length === 0) return CLEAN;

    return { flagged: true, kinds, excerpt, warning: WARNING };
  } catch {
    return CLEAN;
  }
}