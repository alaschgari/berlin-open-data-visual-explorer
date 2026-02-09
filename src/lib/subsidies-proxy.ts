'use server';

import fs from 'fs';
import path from 'path';
import { SubsidyRecord } from './parser';

const PROCESSED_DIR = path.join(process.cwd(), 'data', 'processed');
const SUBSIDIES_FILE = path.join(PROCESSED_DIR, 'subsidies_data.json');

export interface SubsidyMetrics {
    totalAmount: number;
    totalCount: number;
    topRecipients: { name: string; amount: number; count: number }[];
    byYear: { year: number; amount: number }[];
    byArea: { area: string; amount: number }[];
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
    // Use "use cache" if this were a server action/component in Next.js 15
    // For now we just read the file
    if (!fs.existsSync(SUBSIDIES_FILE)) {
        return {
            totalAmount: 0,
            totalCount: 0,
            topRecipients: [],
            byYear: [],
            byArea: [],
            byDistrict: [],
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
        topRecipients: [],
        byYear: [],
        byArea: [],
        byDistrict: [],
    };

    const recipientMap = new Map<string, { amount: number; count: number }>();
    const yearMap = new Map<number, number>();
    const areaMap = new Map<string, number>();
    const districtMap = new Map<string, { amount: number; count: number }>();

    for (const record of data) {
        metrics.totalAmount += record.amount;

        // Recipient aggregation
        const rData = recipientMap.get(record.recipient) || { amount: 0, count: 0 };
        rData.amount += record.amount;
        rData.count += 1;
        recipientMap.set(record.recipient, rData);

        // Year aggregation
        yearMap.set(record.year, (yearMap.get(record.year) || 0) + record.amount);

        // Area aggregation
        areaMap.set(record.area, (areaMap.get(record.area) || 0) + record.amount);

        // District aggregation
        const dName = extractDistrict(record.provider) || 'Senat/Berlin-weit';
        const dStats = districtMap.get(dName) || { amount: 0, count: 0 };
        dStats.amount += record.amount;
        dStats.count += 1;
        districtMap.set(dName, dStats);
    }

    // Top recipients
    metrics.topRecipients = Array.from(recipientMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 100);

    // By Year
    metrics.byYear = Array.from(yearMap.entries())
        .map(([year, amount]) => ({ year, amount }))
        .sort((a, b) => a.year - b.year);

    // By Area
    metrics.byArea = Array.from(areaMap.entries())
        .map(([area, amount]) => ({ area, amount }))
        .sort((a, b) => b.amount - a.amount);

    // By District
    metrics.byDistrict = Array.from(districtMap.entries())
        .map(([district, stats]) => ({ district, ...stats }))
        .sort((a, b) => b.amount - a.amount);

    return metrics;
}

export async function searchSubsidies(query: string, district?: string): Promise<SubsidyRecord[]> {
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

    if (!query) return data.slice(0, 100); // Return top 100 if no query

    const q = query.toLowerCase();
    return data.filter(r =>
        r.recipient.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q)
    );
}
