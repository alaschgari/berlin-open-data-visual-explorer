'use server';

import { SubsidyRecord } from './parser';
import { db } from '@/db';
import { subsidies } from '@/db/schema';
import { desc, eq, ilike, or, and, sql as drizzleSql, sum, count, min, max, countDistinct, inArray } from 'drizzle-orm';

export interface SubsidyMetrics {
    totalAmount: number;
    totalCount: number;
    recipientCount: number;
    providerCount: number;
    minYear: number;
    maxYear: number;
    topRecipients: Array<{
        name: string;
        amount: number;
        count: number;
        history: Array<{ year: number; amount: number }>;
    }>;
    byYear: Array<{ year: number; amount: number }>;
    byArea: Array<{ area: string; amount: number }>;
    byProvider: Array<{ provider: string; amount: number }>;
    byDistrict: Array<{ district: string; amount: number; count: number }>;
}

/**
 * Extract district name from provider field
 * e.g., "Bezirksamt Mitte" -> "Mitte"
 */
function extractDistrict(provider: string): string | null {
    if (!provider) return null;
    const match = provider.match(/Bezirksamt\s+([a-zA-ZäöüßÄÖÜ\-]+)/i);
    return match ? match[1].trim() : null;
}

// Build dynamic WHERE clause based on filters
function buildWhereClause(district?: string, query?: string, area?: string | string[], provider?: string | string[], recipient?: string | string[]) {
    const conditions = [];

    // Filter by district using SQL ILIKE
    if (district && district !== 'Berlin' && district !== 'All') {
        conditions.push(ilike(subsidies.provider, `%Bezirksamt ${district}%`));
    }

    // Filter by search query
    if (query) {
        conditions.push(
            or(
                ilike(subsidies.recipient, `%${query}%`),
                ilike(subsidies.purpose, `%${query}%`)
            )
        );
    }

    // Filter by area
    if (area) {
        const areas = Array.isArray(area) ? area : [area];
        if (areas.length > 0) {
            conditions.push(inArray(subsidies.area, areas));
        }
    }

    // Filter by provider
    if (provider) {
        const providers = Array.isArray(provider) ? provider : [provider];
        if (providers.length > 0) {
            conditions.push(inArray(subsidies.provider, providers));
        }
    }

    // Filter by recipient
    if (recipient) {
        const recipients = Array.isArray(recipient) ? recipient : [recipient];
        if (recipients.length > 0) {
            conditions.push(inArray(subsidies.recipient, recipients));
        }
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function getQuickSubsidiesMetrics(district?: string): Promise<{ totalAmount: number, totalCount: number }> {
    "use cache";

    try {
        const whereClause = district && district !== 'Berlin' && district !== 'All'
            ? ilike(subsidies.provider, `%Bezirksamt ${district}%`)
            : undefined;

        const result = await db
            .select({
                totalAmount: sum(subsidies.amount),
                totalCount: count(subsidies.id)
            })
            .from(subsidies)
            .where(whereClause);

        return {
            totalAmount: parseFloat(result[0]?.totalAmount || '0'),
            totalCount: Number(result[0]?.totalCount || 0)
        };
    } catch (error) {
        console.error('[Subsidies Proxy] Quick metrics error:', error);
        return { totalAmount: 0, totalCount: 0 };
    }
}

export async function getSubsidiesMetrics(district?: string): Promise<SubsidyMetrics> {
    "use cache";

    try {
        const whereClause = district && district !== 'Berlin' && district !== 'All'
            ? ilike(subsidies.provider, `%Bezirksamt ${district}%`)
            : undefined;

        // 1. Fetch overall aggregates
        const overallResult = await db
            .select({
                totalAmount: sum(subsidies.amount),
                totalCount: count(subsidies.id),
                recipientCount: countDistinct(subsidies.recipient),
                providerCount: countDistinct(subsidies.provider),
                minYear: min(subsidies.year),
                maxYear: max(subsidies.year)
            })
            .from(subsidies)
            .where(whereClause);

        const totalAmount = parseFloat(overallResult[0]?.totalAmount || '0');
        const totalCount = Number(overallResult[0]?.totalCount || 0);

        if (totalCount === 0) {
            return {
                totalAmount: 0,
                totalCount: 0,
                topRecipients: [],
                byYear: [],
                byArea: [],
                byDistrict: [],
                byProvider: [],
                recipientCount: 0,
                providerCount: 0,
                minYear: 0,
                maxYear: 0,
            };
        }

        // 2. Fetch Aggregation by Year
        const yearResult = await db
            .select({
                year: subsidies.year,
                amount: sum(subsidies.amount)
            })
            .from(subsidies)
            .where(whereClause)
            .groupBy(subsidies.year)
            .orderBy(subsidies.year);

        const byYear = yearResult.map(r => ({
            year: r.year,
            amount: parseFloat(r.amount || '0')
        }));

        // 3. Fetch Aggregation by Area
        const areaResult = await db
            .select({
                area: subsidies.area,
                amount: sum(subsidies.amount)
            })
            .from(subsidies)
            .where(whereClause)
            .groupBy(subsidies.area)
            .orderBy(desc(sum(subsidies.amount)));

        const byArea = areaResult.map(r => ({
            area: r.area || 'Sonstige',
            amount: parseFloat(r.amount || '0')
        }));

        // 4. Fetch Aggregation by Provider (also used to map districts in memory)
        const providerResult = await db
            .select({
                provider: subsidies.provider,
                amount: sum(subsidies.amount),
                count: count(subsidies.id)
            })
            .from(subsidies)
            .where(whereClause)
            .groupBy(subsidies.provider)
            .orderBy(desc(sum(subsidies.amount)));

        const byProvider = providerResult.map(r => ({
            provider: r.provider,
            amount: parseFloat(r.amount || '0')
        }));

        // Map provider results to districts in-memory (highly efficient as unique provider list is small)
        const districtMap = new Map<string, { amount: number; count: number }>();
        providerResult.forEach(r => {
            const dName = extractDistrict(r.provider) || 'Senat/Berlin-weit';
            const stats = districtMap.get(dName) || { amount: 0, count: 0 };
            stats.amount += parseFloat(r.amount || '0');
            stats.count += Number(r.count || 0);
            districtMap.set(dName, stats);
        });

        const byDistrict = Array.from(districtMap.entries())
            .map(([d, stats]) => ({
                district: d,
                amount: stats.amount,
                count: stats.count
            }))
            .sort((a, b) => b.amount - a.amount);

        // 5. Fetch Top Recipients (Limit 20)
        const topRecipientsResult = await db
            .select({
                recipient: subsidies.recipient,
                amount: sum(subsidies.amount),
                count: count(subsidies.id)
            })
            .from(subsidies)
            .where(whereClause)
            .groupBy(subsidies.recipient)
            .orderBy(desc(sum(subsidies.amount)))
            .limit(20);

        // Fetch history for top recipients in a single fast query or dynamically
        // To prevent multiple queries, we can get history for top recipients
        const topRecipientNames = topRecipientsResult.map(r => r.recipient);
        let historyResult: any[] = [];
        if (topRecipientNames.length > 0) {
            historyResult = await db
                .select({
                    recipient: subsidies.recipient,
                    year: subsidies.year,
                    amount: sum(subsidies.amount)
                })
                .from(subsidies)
                .where(and(whereClause, inArray(subsidies.recipient, topRecipientNames)))
                .groupBy(subsidies.recipient, subsidies.year);
        }

        const topRecipients = topRecipientsResult.map(r => {
            const rHistory = historyResult
                .filter(h => h.recipient === r.recipient)
                .map(h => ({
                    year: h.year,
                    amount: parseFloat(h.amount || '0')
                }))
                .sort((a, b) => a.year - b.year);

            return {
                name: r.recipient,
                amount: parseFloat(r.amount || '0'),
                count: Number(r.count || 0),
                history: rHistory
            };
        });

        return {
            totalAmount,
            totalCount,
            recipientCount: Number(overallResult[0]?.recipientCount || 0),
            providerCount: Number(overallResult[0]?.providerCount || 0),
            minYear: Number(overallResult[0]?.minYear || 0),
            maxYear: Number(overallResult[0]?.maxYear || 0),
            topRecipients,
            byYear,
            byArea,
            byProvider,
            byDistrict
        };

    } catch (e) {
        console.error('[Subsidies Proxy] Metrics aggregation error:', e);
        return {
            totalAmount: 0,
            totalCount: 0,
            topRecipients: [],
            byYear: [],
            byArea: [],
            byDistrict: [],
            byProvider: [],
            recipientCount: 0,
            providerCount: 0,
            minYear: 0,
            maxYear: 0,
        };
    }
}

export async function searchSubsidies(
    query: string,
    district?: string,
    area?: string | string[],
    provider?: string | string[],
    recipient?: string | string[],
    limit: number = 100
): Promise<SubsidyRecord[]> {
    try {
        const whereClause = buildWhereClause(district, query, area, provider, recipient);

        const queryBuilder = db
            .select()
            .from(subsidies)
            .where(whereClause)
            .orderBy(desc(subsidies.year));

        const result = limit === -1 
            ? await queryBuilder
            : await queryBuilder.limit(limit);

        return result as unknown as SubsidyRecord[];
    } catch (error) {
        console.error('[Subsidies Proxy] Search subsidies SQL error:', error);
        return [];
    }
}
