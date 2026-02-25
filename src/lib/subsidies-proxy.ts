'use server';

import { SubsidyRecord } from './parser';
import { supabase } from './supabase';

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
    const match = provider.match(/Bezirksamt\s+(.+)/i);
    return match ? match[1].trim() : null;
}

async function loadSubsidiesData(): Promise<SubsidyRecord[]> {
    try {
        // Step 1: Get total count
        const { count, error: countError } = await supabase
            .from('subsidies')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('[Subsidies Proxy] Count error:', countError);
            return [];
        }

        const totalRecords = count || 0;
        const CHUNK_SIZE = 1000;
        const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);

        console.log(`[Subsidies Proxy] Fetching ${totalRecords} records in ${totalChunks} chunks`);

        // Step 2: Fetch all records in parallel chunks
        const fetchPromises = [];
        for (let i = 0; i < totalChunks; i++) {
            fetchPromises.push(
                supabase
                    .from('subsidies')
                    .select('*')
                    .range(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE - 1)
                    .order('year', { ascending: false })
            );
        }

        const chunkResults = await Promise.all(fetchPromises);
        let allRecords: SubsidyRecord[] = [];

        chunkResults.forEach(({ data, error }, index) => {
            if (error) {
                console.error(`[Subsidies Proxy] Error in chunk ${index}:`, error);
            } else if (data) {
                allRecords = allRecords.concat(data as SubsidyRecord[]);
            }
        });

        return allRecords;
    } catch (error) {
        console.error('[Subsidies Proxy] Unexpected error:', error);
        return [];
    }
}

export async function getSubsidiesMetrics(district?: string): Promise<SubsidyMetrics> {
    const allData = await loadSubsidiesData();
    if (allData.length === 0) {
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

    let data = [...allData];

    // Filter by district if specified
    if (district && district !== 'Berlin' && district !== 'All') {
        data = data.filter(record => {
            const recordDistrict = extractDistrict(record.provider);
            return recordDistrict === district;
        });
    }

    const metrics: SubsidyMetrics = {
        totalAmount: 0,
        totalCount: data.length,
        recipientCount: 0,
        providerCount: 0,
        minYear: new Date().getFullYear(),
        maxYear: new Date().getFullYear(),
        topRecipients: [],
        byYear: [],
        byArea: [],
        byProvider: [],
        byDistrict: [],
    };

    const recipientMap = new Map<string, { amount: number; count: number; historyMap: Map<number, number> }>();
    const yearMap = new Map<number, number>();
    const areaMap = new Map<string, number>();
    const providerMap = new Map<string, number>();
    const districtMap = new Map<string, { amount: number; count: number }>();

    for (const record of data) {
        metrics.totalAmount += record.amount;

        // Recipient aggregation
        const rData = recipientMap.get(record.recipient) || { amount: 0, count: 0, historyMap: new Map<number, number>() };
        rData.amount += record.amount;
        rData.count += 1;
        const yearAmount = rData.historyMap.get(record.year) || 0;
        rData.historyMap.set(record.year, yearAmount + record.amount);
        recipientMap.set(record.recipient, rData);

        // Year aggregation
        yearMap.set(record.year, (yearMap.get(record.year) || 0) + record.amount);

        // Area aggregation
        areaMap.set(record.area, (areaMap.get(record.area) || 0) + record.amount);

        // Provider aggregation
        providerMap.set(record.provider, (providerMap.get(record.provider) || 0) + record.amount);

        // District aggregation
        const dName = extractDistrict(record.provider) || 'Senat/Berlin-weit';
        const dStats = districtMap.get(dName) || { amount: 0, count: 0 };
        dStats.amount += record.amount;
        dStats.count += 1;
        districtMap.set(dName, dStats);
    }

    // Top recipients
    metrics.topRecipients = Array.from(recipientMap.entries())
        .map(([name, stats]) => ({
            name,
            amount: stats.amount,
            count: stats.count,
            history: Array.from(stats.historyMap.entries())
                .map(([year, amount]) => ({ year, amount }))
                .sort((a, b) => a.year - b.year)
        }))
        .sort((a, b) => b.amount - a.amount);

    // By Year
    metrics.byYear = Array.from(yearMap.entries())
        .map(([year, amount]) => ({ year, amount }))
        .sort((a, b) => a.year - b.year);

    // By Area
    metrics.byArea = Array.from(areaMap.entries())
        .map(([area, amount]) => ({ area, amount }))
        .sort((a, b) => b.amount - a.amount);

    // By Provider
    metrics.byProvider = Array.from(providerMap.entries())
        .map(([provider, amount]) => ({ provider, amount }))
        .sort((a, b) => b.amount - a.amount);

    // By District
    metrics.byDistrict = Array.from(districtMap.entries())
        .map(([district, stats]) => ({ district, ...stats }))
        .sort((a, b) => b.amount - a.amount);

    // Final Counts
    metrics.recipientCount = recipientMap.size;

    // Count unique providers
    const providers = new Set<string>();
    let minYear = Infinity;
    let maxYear = -Infinity;

    data.forEach(r => {
        providers.add(r.provider);
        if (r.year < minYear) minYear = r.year;
        if (r.year > maxYear) maxYear = r.year;
    });

    metrics.providerCount = providers.size;
    metrics.minYear = minYear === Infinity ? 0 : minYear;
    metrics.maxYear = maxYear === -Infinity ? 0 : maxYear;

    return metrics;
}

export async function searchSubsidies(
    query: string,
    district?: string,
    area?: string | string[],
    provider?: string | string[],
    recipient?: string | string[],
    limit: number = 100
): Promise<SubsidyRecord[]> {
    const allData = await loadSubsidiesData();
    if (allData.length === 0) return [];
    let data = [...allData];

    // Filter by district if specified
    if (district && district !== 'Berlin' && district !== 'All') {
        data = data.filter(record => {
            const recordDistrict = extractDistrict(record.provider);
            return recordDistrict === district;
        });
    }

    // Filter by area if specified
    if (area && (Array.isArray(area) ? area.length > 0 : true)) {
        const areas = Array.isArray(area) ? area : [area];
        data = data.filter(record => areas.includes(record.area));
    }

    // Filter by provider if specified
    if (provider && (Array.isArray(provider) ? provider.length > 0 : true)) {
        const providers = Array.isArray(provider) ? provider : [provider];
        data = data.filter(record => providers.includes(record.provider));
    }

    // Filter by recipient if specified
    if (recipient && (Array.isArray(recipient) ? recipient.length > 0 : true)) {
        const recipients = Array.isArray(recipient) ? recipient : [recipient];
        data = data.filter(record => recipients.includes(record.recipient));
    }

    if (!query) return limit === -1 ? data : data.slice(0, limit);

    const q = query.toLowerCase();
    const filtered = data.filter(r =>
        (r.recipient?.toLowerCase() || '').includes(q) ||
        (r.purpose?.toLowerCase() || '').includes(q)
    );
    return limit === -1 ? filtered : filtered.slice(0, limit);
}
