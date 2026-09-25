import { timingSafeEqual } from 'crypto';
import { env } from '@/lib/env';

/**
 * Checks the `x-sync-secret` header against SYNC_SECRET using a constant-time comparison.
 * Returns 'unconfigured' if no secret is set, so callers can respond with 503.
 */
export function checkSyncSecret(request: Request): 'ok' | 'unauthorized' | 'unconfigured' {
    if (!env.SYNC_SECRET) return 'unconfigured';
    const provided = request.headers.get('x-sync-secret');
    if (!provided) return 'unauthorized';
    const a = Buffer.from(provided);
    const b = Buffer.from(env.SYNC_SECRET);
    return a.length === b.length && timingSafeEqual(a, b) ? 'ok' : 'unauthorized';
}
