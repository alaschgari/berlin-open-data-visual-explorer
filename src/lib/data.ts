
import fs from 'fs';
import path from 'path';

import { adjustForInflation } from './inflation';
import { getPopulation } from './demographics';

export interface FinancialRecord {
    year: number;
    district: string;
    chapter: string;
    title_code: string;
    title?: string;
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

import { supabase } from './supabase';

// Fetch from Supabase instead of local file
export async function getQuickFinancialMetrics(district?: string): Promise<{ budget: number, actual: number }> {
    console.log('[getQuickFinancialMetrics] Quick fetch for Hub...');
    try {
        let query = supabase.from('financial_records').select('budget, actual');

        if (district && district !== 'Berlin' && district !== 'All') {
            query = query.eq('district', district);
        }

        // Latest year only for Hub
        query = query.eq('year', 2024);

        const { data, error } = await query;
        if (error) throw error;

        const budget = (data || []).reduce((sum, r) => sum + (r.budget || 0), 0);
        const actual = (data || []).reduce((sum, r) => sum + (r.actual || 0), 0);

        return { budget, actual };
    } catch (error) {
        console.error('[getQuickFinancialMetrics] Error:', error);
        return { budget: 0, actual: 0 };
    }
}

export async function getFinancialData(): Promise<FinancialRecord[]> {
    console.log('[getFinancialData] Fetching from Supabase...');

    try {
        const { count, error: countError } = await supabase
            .from('financial_records')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('[getFinancialData] Count error:', countError);
            return [];
        }

        const totalRecords = count || 0;
        const CHUNK_SIZE = 1000;
        const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);
        const BATCH_SIZE = 5;

        console.log(`[getFinancialData] Fetching ${totalRecords} records in ${totalChunks} chunks (Batch Size: ${BATCH_SIZE})`);

        let allRecords: FinancialRecord[] = [];

        for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
            const batchLimit = Math.min(i + BATCH_SIZE, totalChunks);
            const batchPromises = [];

            for (let j = i; j < batchLimit; j++) {
                batchPromises.push(
                    supabase
                        .from('financial_records')
                        .select('year, district, chapter, title_code, budget, actual, diff')
                        .range(j * CHUNK_SIZE, (j + 1) * CHUNK_SIZE - 1)
                        .order('year', { ascending: true })
                        .then(result => ({ ...result, index: j }))
                );
            }

            const batchResults = await Promise.all(batchPromises);

            batchResults.forEach(({ data, error, index }) => {
                if (error) {
                    console.error(`[getFinancialData] Error in chunk ${index}:`, error);
                } else if (data) {
                    allRecords = allRecords.concat(data as FinancialRecord[]);
                }
            });

            if (totalChunks > BATCH_SIZE) {
                console.log(`[getFinancialData] Progress: ${Math.min(batchLimit * CHUNK_SIZE, totalRecords)}/${totalRecords} records`);
            }
        }

        console.log(`[getFinancialData] Successfully fetched ${allRecords.length} records`);
        return allRecords;
    } catch (error) {
        console.error('[getFinancialData] Unexpected error:', error);
        return [];
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
