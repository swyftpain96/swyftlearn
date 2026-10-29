import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Request context threaded through AsyncLocalStorage into server actions.
 * Populated in entry.rsc.tsx before any action.apply() call.
 */
export interface RequestContext {
  ip: string;
  userAgent: string;
  /** Coarse fingerprint: hashed IP + UA for use as a rate-limit key. */
  fingerprint: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Extracts the best-effort client IP from a Request's headers.
 * Handles common proxy/CDN forwarding headers.
 */
export function extractIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; first entry is the originating client
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp =
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ?? // Cloudflare
    request.headers.get('fly-client-ip') ??    // Fly.io
    request.headers.get('x-client-ip') ??
    'unknown';

  return realIp;
}

/**
 * Builds a coarse client fingerprint from IP + User-Agent.
 * Not a true hardware ID (impossible server-side), but combines
 * two independent signals to make evasion harder.
 */
export function buildFingerprint(ip: string, userAgent: string): string {
  // Simple stable hash — good enough for rate-limit keying without crypto overhead
  const raw = `${ip}||${userAgent.slice(0, 200)}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = (h * 33) ^ raw.charCodeAt(i);
    h = h >>> 0; // keep as unsigned 32-bit
  }
  return h.toString(16).padStart(8, '0');
}
