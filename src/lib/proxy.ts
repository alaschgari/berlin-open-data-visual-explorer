'use server';

import fs from 'fs';
import path from 'path';

import { getFinancialData as fetchRawData, calculateMetrics, calculateEnhancedMetrics, MetricType } from './data';

// "use cache" directive for Next.js 16 dynamic IO
// This function will be cached automatically by Next.js
export async function getCachedFinancialData() {
    return fetchRawData();
}

import { HISTORICAL_DATA } from './historical-data';

const PROCESSED_DIR = path.join(process.cwd(), 'data', 'processed');

export async function getCachedSummaryMetrics(metric: MetricType = 'nominal') {
    const data = await fetchRawData();
    return calculateEnhancedMetrics(data, metric);
}

/**
 * Enriches data with historical baseline for years where coverage is known to be partial.
 * Handles both a full metrics object (with byYear) and an individual data point (with year).
 */
export async function enrichMetricsWithHistory(data: any, district?: string) {
    if (district && district !== 'Berlin' && district !== 'All') return data;

    // Case 1: Individual data point (year, budget, actual)
    if (data.year !== undefined) {
        const hist = HISTORICAL_DATA.find(h => h.year === data.year);
        if (hist) {
            const histBudget = hist.budget * 1000000;
            const histActual = hist.actual * 1000000;
            if (data.budget < histBudget * 0.5 || data.actual < histActual * 0.5) {
                return {
                    ...data,
                    budget: histBudget,
                    actual: histActual,
                    isEstimated: true
                };
            }
        }
        return data;
    }

    // Case 2: Aggregated metrics object (with byYear)
    if (data.byYear) {
        const enrichedByYear = data.byYear.map((item: any) => {
            const hist = HISTORICAL_DATA.find(h => h.year === item.year);
            if (hist) {
                const histBudget = hist.budget * 1000000;
                const histActual = hist.actual * 1000000;
                if (item.budget < histBudget * 0.5 || item.actual < histActual * 0.5) {
                    return {
                        ...item,
                        budget: histBudget,
                        actual: histActual,
                        isEstimated: true
                    };
                }
            }
            return item;
        });

        // Add missing years from history
        HISTORICAL_DATA.forEach(h => {
            if (!enrichedByYear.find((i: any) => i.year === h.year)) {
                enrichedByYear.push({
                    year: h.year,
                    budget: h.budget * 1000000,
                    actual: h.actual * 1000000,
                    isEstimated: true
                });
            }
        });

        return {
            ...data,
            totalBudget: enrichedByYear.reduce((sum: number, item: any) => sum + item.budget, 0),
            totalActual: enrichedByYear.reduce((sum: number, item: any) => sum + item.actual, 0),
            budget: enrichedByYear.reduce((sum: number, item: any) => sum + item.budget, 0), // also add shorthand for page.tsx
            actual: enrichedByYear.reduce((sum: number, item: any) => sum + item.actual, 0),
            byYear: enrichedByYear.sort((a: any, b: any) => a.year - b.year)
        };
    }

    return data;
}

import { DISTRICT_SOCIAL_DATA } from './social-data';
import { getPopulation } from './demographics';

export async function getSocialCorrelationData(year?: number) {
    let data = await fetchRawData();
    if (year) {
        data = data.filter(r => r.year === year);
    }
    const metrics = calculateMetrics(data);

    const districtStats: Record<string, number> = {};

    data.forEach(r => {
        if (!districtStats[r.district]) districtStats[r.district] = 0;
        districtStats[r.district] += r.budget;
    });

    const correlationData = Object.keys(districtStats)
        .filter(d => d !== 'Berlin' && DISTRICT_SOCIAL_DATA[d])
        .map(district => {
            const totalSpending = districtStats[district];
            const population = getPopulation(district);
            const spendingPerCapita = population > 0 ? totalSpending / population : 0;

            return {
                district,
                spendingPerCapita: Math.round(spendingPerCapita),
                unemploymentRate: DISTRICT_SOCIAL_DATA[district].unemploymentRate
            };
        });

    return correlationData;
}

import { SCHOOL_RENOVATION_DATA } from './school-data';

export async function getSchoolRenovationData(year?: number) {
    let data = await fetchRawData();
    if (year) {
        data = data.filter(r => r.year === year);
    }

    const districtSpending: Record<string, number> = {};

    data.filter(r => r.chapter.includes('3701')).forEach(r => {
        if (!districtSpending[r.district]) districtSpending[r.district] = 0;
        districtSpending[r.district] += r.budget;
    });

    const result = Object.keys(SCHOOL_RENOVATION_DATA).map(district => ({
        district,
        backlog: SCHOOL_RENOVATION_DATA[district],
        spending: (districtSpending[district] || 0) / 1000000
    }));

    return result.sort((a, b) => b.backlog - a.backlog);
}

import { ROAD_CONDITION_DATA } from './road-data';

export async function getRoadConditionData(year?: number) {
    let data = await fetchRawData();
    if (year) {
        data = data.filter(r => r.year === year);
    }

    const districtSpending: Record<string, number> = {};

    data.filter(r => r.chapter.includes('3800')).forEach(r => {
        if (!districtSpending[r.district]) districtSpending[r.district] = 0;
        districtSpending[r.district] += r.budget;
    });

    const result = Object.keys(ROAD_CONDITION_DATA).map(district => ({
        district,
        condition: ROAD_CONDITION_DATA[district],
        spending: (districtSpending[district] || 0) / 1000000
    }));

    return result.sort((a, b) => b.condition - a.condition);
}

export async function getHistoricalTrendData() {
    const data = await fetchRawData();
    const currentYears: Record<number, { budget: number, actual: number }> = {};

    data.forEach(r => {
        if (!currentYears[r.year]) currentYears[r.year] = { budget: 0, actual: 0 };
        currentYears[r.year].budget += r.budget;
        currentYears[r.year].actual += r.actual;
    });

    const currentData = Object.keys(currentYears).map(yearStr => {
        const year = parseInt(yearStr);
        return {
            year,
            budget: Math.round(currentYears[year].budget / 1000000),
            actual: Math.round(currentYears[year].actual / 1000000)
        };
    });

    const mergedData: Record<number, { budget: number, actual: number }> = {};

    HISTORICAL_DATA.forEach(h => {
        mergedData[h.year] = { budget: h.budget, actual: h.actual };
    });

    currentData.forEach(c => {
        mergedData[c.year] = { budget: c.budget, actual: c.actual };
    });

    const allData = Object.keys(mergedData)
        .map(y => ({ year: Number(y), ...mergedData[Number(y)] }))
        .sort((a, b) => a.year - b.year);

    return allData;
}

export async function getCachedFilteredData(year?: number, search?: string, district?: string, metric: MetricType = 'nominal') {
    let data = await fetchRawData();

    if (year) {
        data = data.filter(r => r.year === year);
    }

    if (district && district !== 'All') {
        data = data.filter(r => r.district === district);
    }

    if (search) {
        data = data.filter(r =>
            r.title_code.includes(search) ||
            r.chapter.includes(search)
        );
    }

    return data;
}

export async function getDistrictMetrics(district: string) {
    const data = await fetchRawData();
    const filtered = (district === 'Berlin' || district === 'All') ? data : data.filter(r => r.district === district);
    const metrics = calculateMetrics(filtered);
    return {
        ...metrics,
        budget: metrics.totalBudget, // align with page.tsx
        actual: metrics.totalActual,
        diff: metrics.totalActual - metrics.totalBudget
    };
}

export async function getTopChapters(district: string) {
    const data = await fetchRawData();
    const filtered = district === 'Berlin' ? data : data.filter(r => r.district === district);
    const recentData = filtered.filter(r => r.year >= 2024);

    const byChapter: Record<string, { name: string, amount: number }> = {};
    recentData.forEach(r => {
        if (!byChapter[r.chapter]) {
            byChapter[r.chapter] = { name: r.chapter, amount: 0 };
        }
        byChapter[r.chapter].amount += r.budget;
    });

    return Object.values(byChapter)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
}

export async function getChapterDetails(district: string, chapter: string) {
    const data = await fetchRawData();
    const filtered = district === 'Berlin' ? data : data.filter(r => r.district === district);
    const chapterData = filtered.filter(r => r.chapter === chapter && r.year >= 2024);

    return chapterData
        .sort((a, b) => b.budget - a.budget)
        .map(r => ({
            title: r.title_code,
            budget: r.budget,
            actual: r.actual
        }));
}

export async function getTimelineData(district: string) {
    const data = await fetchRawData();
    const filtered = (district === 'Berlin' || district === 'All') ? data : data.filter(r => r.district === district);

    const byYear: Record<number, { budget: number, actual: number }> = {};
    filtered.forEach(r => {
        if (!byYear[r.year]) byYear[r.year] = { budget: 0, actual: 0 };
        byYear[r.year].budget += r.budget;
        byYear[r.year].actual += r.actual;
    });

    // Merge in historical baseline for Berlin view
    if (district === 'Berlin' || district === 'All') {
        HISTORICAL_DATA.forEach(h => {
            const budgetVal = h.budget * 1000000;
            const actualVal = h.actual * 1000000;

            if (!byYear[h.year] || byYear[h.year].budget < budgetVal * 0.5) {
                byYear[h.year] = { budget: budgetVal, actual: actualVal };
            }
        });
    }

    return Object.keys(byYear).map(yearStr => ({
        year: parseInt(yearStr),
        budget: byYear[parseInt(yearStr)].budget,
        actual: byYear[parseInt(yearStr)].actual
    })).sort((a, b) => a.year - b.year);
}
export async function getLastSyncTime() {
    const filePath = path.join(PROCESSED_DIR, 'budget_data.json');
    if (!fs.existsSync(filePath)) return null;
    const stats = fs.statSync(filePath);
    return stats.mtime;
}
