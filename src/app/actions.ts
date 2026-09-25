'use server';

import { z } from 'zod';
import { getChapterDetails, getDistrictCompareStats } from '@/lib/proxy';
import { searchSubsidies } from '@/lib/subsidies-proxy';

// Only functions exported from this file are exposed as Server Actions.
// Every input is validated because Server Actions are publicly callable endpoints.

const MAX_SUBSIDY_RESULTS = 5000;
const shortString = z.string().max(200);
const stringOrList = z.union([shortString, z.array(shortString).max(100)]).optional();

export async function getChapterDetailsAction(district: string, chapter: string) {
    const input = z.object({ district: shortString, chapter: shortString }).parse({ district, chapter });
    return getChapterDetails(input.district, input.chapter);
}

export async function getDistrictCompareStatsAction(district: string) {
    return getDistrictCompareStats(shortString.parse(district));
}

export async function searchSubsidiesAction(
    query: string,
    district?: string,
    area?: string | string[],
    provider?: string | string[],
    recipient?: string | string[],
    limit: number = 100
) {
    const input = z.object({
        query: shortString,
        district: shortString.optional(),
        area: stringOrList,
        provider: stringOrList,
        recipient: stringOrList,
        limit: z.number().int().min(-1).max(MAX_SUBSIDY_RESULTS),
    }).parse({ query, district, area, provider, recipient, limit });

    // -1 means "all" for server-side callers; cap it for public callers.
    const safeLimit = input.limit === -1 ? MAX_SUBSIDY_RESULTS : input.limit;
    return searchSubsidies(input.query, input.district, input.area, input.provider, input.recipient, safeLimit);
}
