
import fs from 'fs';
import path from 'path';

import { adjustForInflation } from './inflation';
import { getPopulation } from './demographics';

export interface FinancialRecord {
    year: number;
    district: string;
    chapter: string;
    title_code: string;
    budget: number;
    actual: number;
    diff: number;
}

export type MetricType = 'nominal' | 'inflationAdjusted' | 'perCapita';

export function calculateEnhancedMetrics(data: FinancialRecord[], type: MetricType = 'nominal') {
    const dataCopy = data.map(r => {
        let budget = r.budget;
        let actual = r.actual;

        if (type === 'inflationAdjusted') {
            budget = adjustForInflation(budget, r.year);
            actual = adjustForInflation(actual, r.year);
        } else if (type === 'perCapita') {
            const pop = getPopulation(r.district);
            if (pop > 0) {
                budget = budget / pop;
                actual = actual / pop;
            }
        }
        return { ...r, budget, actual };
    });

    return calculateMetrics(dataCopy);
}

const DATA_PATH = path.join(process.cwd(), 'data/processed/financial_data.json');

// Direct file access (caching handled by proxy.ts with "use cache")
export async function getFinancialData(): Promise<FinancialRecord[]> {
    console.log(`[getFinancialData] Reading from ${DATA_PATH}`);
    if (!fs.existsSync(DATA_PATH)) {
        console.warn(`[getFinancialData] File not found: ${DATA_PATH}`);
        return [];
    }

    try {
        const content = fs.readFileSync(DATA_PATH, 'utf-8');
        const data = JSON.parse(content) as FinancialRecord[];
        console.log(`[getFinancialData] Parsed ${data.length} records`);

        // Filter out invalid records (e.g. year 0)
        return data.filter(r => r.year > 2000 && r.year < 2100);
    } catch (error) {
        console.error(`[getFinancialData] Error reading/parsing file:`, error);
        throw error;
    }
}



export async function getSummaryMetrics() {
    const data = await getFinancialData();
    return calculateMetrics(data);
}

import { HISTORICAL_DATA } from './historical-data';

export function calculateMetrics(data: FinancialRecord[]) {
    const totalBudget = data.reduce((sum, r) => sum + (r.budget || 0), 0);
    const totalActual = data.reduce((sum, r) => sum + (r.actual || 0), 0);

    // Group by Year
    const byYearRaw: Record<number, { budget: number, actual: number }> = {};
    data.forEach(r => {
        if (!byYearRaw[r.year]) byYearRaw[r.year] = { budget: 0, actual: 0 };
        byYearRaw[r.year].budget += (r.budget || 0);
        byYearRaw[r.year].actual += (r.actual || 0);
    });

    const byYear = Object.entries(byYearRaw)
        .map(([year, val]) => ({ year: Number(year), ...val }))
        .sort((a, b) => a.year - b.year);

    // Get unique districts
    const districts = Array.from(new Set(data.map(r => r.district))).sort();

    // Group by Chapter (Top 5)
    const byChapterStr: Record<string, number> = {};

    // Group by Chapter (Top 5 Expenses)
    // const byChapterStr: Record<string, number> = {}; (removed duplicate)
    data.forEach(r => {
        if (!byChapterStr[r.chapter]) byChapterStr[r.chapter] = 0;
        byChapterStr[r.chapter] += (r.actual || 0);
    });

    const topChapters = Object.entries(byChapterStr)
        .map(([chapter, amount]) => ({ chapter, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    return {
        totalBudget,
        totalActual,
        byYear,
        topChapters,
        recordCount: data.length,
        years: byYear.map(y => y.year),
        districts
    };
}

export async function getFilteredData(year?: number, search?: string) {
    let data = await getFinancialData();

    if (year) {
        data = data.filter(r => r.year === year);
    }

    if (search) {
        const lowerSearch = search.toLowerCase(); // unused but ready
        data = data.filter(r =>
            r.title_code.includes(search) ||
            r.chapter.includes(search)
        );
    }

    return data;
}
