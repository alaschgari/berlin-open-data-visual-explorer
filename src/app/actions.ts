'use server';

import { getChapterDetails, getDistrictCompareStats } from '@/lib/proxy';
import { searchSubsidies } from '@/lib/subsidies-proxy';
import { chapterDetailsSchema, districtSchema, MAX_SUBSIDY_RESULTS, subsidySearchSchema } from '@/lib/validation';

// Only functions exported from this file are exposed as Server Actions.
// Every input is validated because Server Actions are publicly callable endpoints.

export async function getChapterDetailsAction(district: string, chapter: string) {
    const input = chapterDetailsSchema.parse({ district, chapter });
    return getChapterDetails(input.district, input.chapter);
}

export async function getDistrictCompareStatsAction(district: string) {
    return getDistrictCompareStats(districtSchema.parse(district));
}

export async function searchSubsidiesAction(
    query: string,
    district?: string,
    area?: string | string[],
    provider?: string | string[],
    recipient?: string | string[],
    limit: number = 100
) {
    const input = subsidySearchSchema.parse({ query, district, area, provider, recipient, limit });

    // -1 means "all" for server-side callers; cap it for public callers.
    const safeLimit = input.limit === -1 ? MAX_SUBSIDY_RESULTS : input.limit;
    return searchSubsidies(input.query, input.district, input.area, input.provider, input.recipient, safeLimit);
}
