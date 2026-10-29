'use server';

import { randomBytes } from 'node:crypto';
import type { InquiryFormData, ServerInquiryResponse } from './types/index.ts';
import { sendEmail, type MailDeliveryResult } from './mailer.ts';
import { requestContextStorage } from './request-context.ts';

const TARGET_EMAIL = process.env.MENTOR_EMAIL || 'nikolamatic225@gmail.com';

let serverInquiryCounter = 0;

export async function getServerInquiryCount(): Promise<number> {
  return serverInquiryCounter;
}

export async function getServerCounter(): Promise<number> {
  return serverInquiryCounter;
}

export async function updateServerCounter(change: number): Promise<number> {
  serverInquiryCounter += change;
  return serverInquiryCounter;
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

interface RateBucket {
  count: number;
  windowStart: number;
  blocked: boolean;
  blockedUntil: number;
}

// Separate stores so IP and email are independently limited
const emailBuckets = new Map<string, RateBucket>();
const fingerprintBuckets = new Map<string, RateBucket>();

/** Window: max submissions per key per time period. */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const EMAIL_LIMIT_MAX = 3;                     // 3 per email per 15 min
const FP_LIMIT_MAX = 5;                        // 5 per IP+UA per 15 min (slightly looser — shared NAT)
const BLOCK_DURATION_MS = 60 * 60 * 1000;     // 1 hour block

function pruneBuckets(store: Map<string, RateBucket>) {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (now - bucket.windowStart > RATE_LIMIT_WINDOW_MS * 2 && now > bucket.blockedUntil) {
      store.delete(key);
    }
  }
}

function checkBucket(
  store: Map<string, RateBucket>,
  key: string,
  max: number,
  label: string,
): string | null {
  const now = Date.now();
  pruneBuckets(store);

  let bucket = store.get(key);
  if (!bucket) {
    bucket = { count: 0, windowStart: now, blocked: false, blockedUntil: 0 };
    store.set(key, bucket);
  }

  if (bucket.blocked && now < bucket.blockedUntil) {
    const remainingMin = Math.ceil((bucket.blockedUntil - now) / 60000);
    return `Too many submissions${label}. Please wait ${remainingMin} minute${remainingMin !== 1 ? 's' : ''} before trying again.`;
  }

  if (now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    bucket.count = 0;
    bucket.windowStart = now;
    bucket.blocked = false;
    bucket.blockedUntil = 0;
  }

  bucket.count += 1;

  if (bucket.count > max) {
    bucket.blocked = true;
    bucket.blockedUntil = now + BLOCK_DURATION_MS;
    return `Submission limit reached. Please wait 1 hour before submitting again.`;
  }

  return null;
}

function checkRateLimit(email: string, fingerprint: string): string | null {
  // Check per-email limit first
  const emailError = checkBucket(emailBuckets, email.toLowerCase(), EMAIL_LIMIT_MAX, ' from this email');
  if (emailError) return emailError;

  // Check per-IP+UA fingerprint limit
  if (fingerprint !== '00000000') {
    const fpError = checkBucket(fingerprintBuckets, fingerprint, FP_LIMIT_MAX, ' from this device/network');
    if (fpError) return fpError;
  }

  return null;
}

// ─── Spam Filters ─────────────────────────────────────────────────────────────

const SPAM_KEYWORDS = [
  'casino', 'crypto', 'bitcoin', 'nft', 'earn money', 'make money fast',
  'click here', 'free money', 'guaranteed', 'investment opportunity',
  'lottery', 'winner', 'congratulations you', 'urgent business',
  'dear friend', 'bank transfer', 'wire transfer', 'nigerian',
  'http://', 'https://', 'bit.ly', 'tinyurl',
];

const DISPOSABLE_EMAIL_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'guerrillamail.info',
  'spam4.me', 'yopmail.com', 'dispostable.com', 'maildrop.cc', 'trashmail.com',
  'fakeinbox.com', 'mailnull.com', '10minutemail.com', 'tempr.email',
  'discard.email', 'spamgourmet.com', 'getairmail.com',
];

function detectSpam(name: string, message: string, email: string): string | null {
  const combined = `${name} ${message}`.toLowerCase();

  // Check disposable email domains
  const emailDomain = email.split('@')[1]?.toLowerCase() ?? '';
  if (DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
    return 'Disposable email addresses are not accepted. Please use a real email address.';
  }

  // Check for spam keywords in name or message
  const matchedKeyword = SPAM_KEYWORDS.find((kw) => combined.includes(kw));
  if (matchedKeyword) {
    return 'Your message was flagged as potential spam. Please remove any URLs or promotional content and try again.';
  }

  // Name sanity: reject if it looks like a bot (all numbers, only symbols, etc.)
  if (/^\d+$/.test(name) || /^[^a-zA-ZÀ-ÿ]+$/.test(name)) {
    return 'Please enter your real full name.';
  }

  // Message too short to be genuine (if provided)
  if (message && message.length < 10) {
    return 'Your message is too short. Please describe your goals in a bit more detail.';
  }

  return null;
}

// ─── ID Generation ────────────────────────────────────────────────────────────

/**
 * Generates a cryptographically unique inquiry ID.
 * Format: SP-<timestamp_base36>-<4_random_hex_bytes>
 * e.g.  SP-M4KW9V3F-A3F7B21C
 */
function generateInquiryId(): string {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = randomBytes(4).toString('hex').toUpperCase();
  return `SP-${timePart}-${randomPart}`;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Main Server Action ───────────────────────────────────────────────────────

export async function sendInquiryEmail(
  data: InquiryFormData
): Promise<ServerInquiryResponse> {
  const cleanName = data.name?.trim() ?? '';
  const cleanEmail = data.email?.trim() ?? '';
  const cleanMessage = data.message?.trim() ?? '';
  const languages = Array.isArray(data.languages) ? data.languages : [];

  // ── Read request context (IP + fingerprint) threaded via AsyncLocalStorage ──
  const reqCtx = requestContextStorage.getStore();
  const fingerprint = reqCtx?.fingerprint ?? '00000000';
  const clientIp = reqCtx?.ip ?? 'unknown';

  // ── Basic validation ──
  if (!cleanName || cleanName.length < 2) {
    return {
      success: false,
      message: 'Please provide your name (at least 2 characters).',
      timestamp: new Date().toISOString(),
      error: 'Invalid name',
    };
  }

  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    return {
      success: false,
      message: 'Please provide a valid email address so I can get back to you.',
      timestamp: new Date().toISOString(),
      error: 'Invalid email',
    };
  }

  // ── Spam detection ──
  const spamReason = detectSpam(cleanName, cleanMessage, cleanEmail);
  if (spamReason) {
    console.warn(`🚫 [SPAM BLOCKED] ${cleanEmail} (${clientIp}): ${spamReason}`);
    return {
      success: false,
      message: spamReason,
      timestamp: new Date().toISOString(),
      error: 'Spam detected',
    };
  }

  // ── Rate limiting (email + IP/UA fingerprint) ──
  const rateLimitError = checkRateLimit(cleanEmail, fingerprint);
  if (rateLimitError) {
    console.warn(`🛑 [RATE LIMITED] ${cleanEmail} fp=${fingerprint} ip=${clientIp}: ${rateLimitError}`);
    return {
      success: false,
      message: rateLimitError,
      timestamp: new Date().toISOString(),
      error: 'Rate limited',
    };
  }

  serverInquiryCounter += 1;
  const timestamp = new Date().toISOString();
  const inquiryId = generateInquiryId();

  const emailSubject = `[SwyftPain Mentorship] New Inquiry from ${cleanName} (${inquiryId})`;
  const emailText = [
    `SWYFTPAIN MENTORSHIP INQUIRY`,
    `----------------------------------------`,    `Inquiry ID:   ${inquiryId}`,
    `Timestamp:    ${timestamp}`,
    `From:         ${cleanName} <${cleanEmail}>`,
    `Reply-To:     ${cleanEmail}`,
    `Languages:    ${languages.length > 0 ? languages.join(', ') : 'Not specified'}`,
    `----------------------------------------`,
    `Goals / Message:`,
    cleanMessage || '(No additional message provided)',
    `----------------------------------------`,
  ].join('\n');

  console.log('\n' + '='.repeat(60));
  console.log(`📬 [INQUIRY RECEIVED] Dispatching email to ${TARGET_EMAIL}`);
  console.log(`Sender:   ${cleanName} <${cleanEmail}>`);
  console.log(`ID:       ${inquiryId}`);
  console.log(`Topics:   ${languages.join(', ') || 'General'}`);
  console.log('='.repeat(60));

  let deliveryResult: MailDeliveryResult;
  try {
    deliveryResult = await sendEmail({
      from: cleanEmail,
      fromName: cleanName,
      to: TARGET_EMAIL,
      replyTo: cleanEmail,
      subject: emailSubject,
      text: emailText,
    });
  } catch (sendErr) {
    const errorMsg = sendErr instanceof Error ? sendErr.message : String(sendErr);
    console.error(`❌ [MAIL ERROR] Failed to send email to ${TARGET_EMAIL}:`, errorMsg);
    deliveryResult = {
      delivered: false,
      method: 'none',
      message: errorMsg,
      error: errorMsg,
    };
  }

  if (!deliveryResult.delivered) {
    console.warn(
      `⚠️ [MAIL WARNING] Email could not be delivered: ${deliveryResult.error}\n` +
      `💡 TIP: Ensure SMTP credentials are set in .env.`
    );
    return {
      success: false,
      message:
        deliveryResult.error ||
        'Could not deliver your inquiry at this time. Please try again later.',
      timestamp,
      inquiryId,
      error: deliveryResult.error,
      details: {
        name: cleanName,
        email: cleanEmail,
        languages,
        message: cleanMessage,
      },
    };
  }

  console.log(`✅ [MAIL SUCCESS] Delivered to ${TARGET_EMAIL} via ${deliveryResult.method}`);

  return {
    success: true,
    message: "Thank you for reaching out! Your inquiry has been sent. I'll review your goals and email you back within 24 hours.",
    timestamp,
    inquiryId,
    details: {
      name: cleanName,
      email: cleanEmail,
      languages,
      message: cleanMessage,
    },
  };
}
