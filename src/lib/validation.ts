import { z } from 'zod';

export const MAX_SUBSIDY_RESULTS = 5000;

const shortString = z.string().max(200);
const stringOrList = z.union([shortString, z.array(shortString).max(100)]).optional();

export const districtSchema = shortString;
export const chapterDetailsSchema = z.object({ district: shortString, chapter: shortString });
export const subsidySearchSchema = z.object({
    query: shortString,
    district: shortString.optional(),
    area: stringOrList,
    provider: stringOrList,
    recipient: stringOrList,
    limit: z.number().int().min(-1).max(MAX_SUBSIDY_RESULTS),
});

/** Escapes LIKE/ILIKE wildcards so user input is matched literally. */
export function escapeLike(input: string): string {
    return input.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export const BUSINESS_SEARCH_DEFAULT_LIMIT = 2000;
export const BUSINESS_SEARCH_MAX_LIMIT = 5000;
const MAX_QUERY_LENGTH = 100;

export type BusinessSearchParams =
    | { ok: true; query: string; limit: number; districtId: string | null }
    | { ok: false; error: string };

export function parseBusinessSearchParams(searchParams: URLSearchParams): BusinessSearchParams {
    const query = searchParams.get('q')?.trim();
    const limitParam = parseInt(searchParams.get('limit') || String(BUSINESS_SEARCH_DEFAULT_LIMIT), 10);
    const limit = Number.isNaN(limitParam)
        ? BUSINESS_SEARCH_DEFAULT_LIMIT
        : Math.min(Math.max(limitParam, 1), BUSINESS_SEARCH_MAX_LIMIT);
    const districtId = searchParams.get('districtId');

    if (!query) return { ok: false, error: 'query is required' };
    if (query.length > MAX_QUERY_LENGTH) return { ok: false, error: 'query is too long' };
    if (districtId && !/^\d{1,8}$/.test(districtId)) return { ok: false, error: 'Invalid districtId' };

    return { ok: true, query, limit, districtId: districtId || null };
}
