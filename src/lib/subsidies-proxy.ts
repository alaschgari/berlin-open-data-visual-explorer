'use server';

import fs from 'fs';
import path from 'path';
import { SubsidyRecord, parseSubsidies } from './parser';

const PROCESSED_DIR = path.join(process.cwd(), 'data', 'processed');
const RAW_DIR = path.join(process.cwd(), 'data', 'raw');
const SUBSIDIES_RAW_FILE = path.join(RAW_DIR, 'subsidies.csv');
const SUBSIDIES_FILE = path.join(PROCESSED_DIR, 'subsidies_data.json');
const SUBISIDIES_URL = 'https://www.berlin.de/sen/finanzen/service/zuwendungsdatenbank/index.php/index/all.csv?q=';

async function checkAndUpdateSubsidies() {
    try {
        let shouldUpdate = false;

        if (!fs.existsSync(SUBSIDIES_RAW_FILE)) {
            shouldUpdate = true;
        } else {
            const stats = fs.statSync(SUBSIDIES_RAW_FILE);
            const now = new Date();
            const lastUpdate = new Date(stats.mtime);
            const diffDays = (now.getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);

            if (diffDays > 7) {
                shouldUpdate = true;
            }
        }

        if (shouldUpdate) {
            console.log(`[Subsidies Proxy] Fetching fresh data from Berlin.de...`);
            const response = await fetch(SUBISIDIES_URL);
            if (!response.ok) throw new Error(`Failed to fetch subsidies: ${response.statusText}`);

            const csvData = await response.text();

            // Ensure dir exists
            if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

            // Save raw
            fs.writeFileSync(SUBSIDIES_RAW_FILE, csvData);

            // Parse and save processed
            const records = parseSubsidies(SUBSIDIES_RAW_FILE);
            if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });
            fs.writeFileSync(SUBSIDIES_FILE, JSON.stringify(records, null, 2));

            console.log(`[Subsidies Proxy] Data updated successfully. (${records.length} records)`);
        }
    } catch (error) {
        console.error(`[Subsidies Proxy] Error updating data:`, error);
        // Fallback to existing file if fetch fails
    }
}

export interface SubsidyMetrics {
    totalAmount: number;
    totalCount: number;
    recipientCount: number;
    providerCount: number;
    minYear: number;
    maxYear: number;
    topRecipients: { name: string; amount: number; count: number; history: { year: number; amount: number }[] }[];
    byYear: { year: number; amount: number }[];
    byArea: { area: string; amount: number }[];
    byProvider: { provider: string; amount: number }[];
    byDistrict: { district: string; amount: number; count: number }[];
}

/**
 * Extract district name from provider field
 * e.g., "Bezirksamt Mitte" -> "Mitte"
 */
function extractDistrict(provider: string): string | null {
    const match = provider.match(/Bezirksamt\s+(.+)/i);
    return match ? match[1].trim() : null;
}

export async function getSubsidiesMetrics(district?: string): Promise<SubsidyMetrics> {
    await checkAndUpdateSubsidies();
    // For now we just read the file
    if (!fs.existsSync(SUBSIDIES_FILE)) {
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

    const rawData = fs.readFileSync(SUBSIDIES_FILE, 'utf8');
    let data: SubsidyRecord[] = JSON.parse(rawData);

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
    await checkAndUpdateSubsidies();
    if (!fs.existsSync(SUBSIDIES_FILE)) return [];
    const rawData = fs.readFileSync(SUBSIDIES_FILE, 'utf8');
    let data: SubsidyRecord[] = JSON.parse(rawData);

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
