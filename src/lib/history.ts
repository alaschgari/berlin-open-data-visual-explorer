import { HISTORICAL_DATA } from './historical-data';

export interface YearlyItem {
    year: number;
    budget: number;
    actual: number;
    isEstimated?: boolean;
}

export interface AggregatedMetrics {
    byYear: YearlyItem[];
    totalBudget: number;
    totalActual: number;
    budget: number;
    actual: number;
}

/**
 * Enriches data with historical baseline for years where coverage is known to be partial.
 * Handles both a full metrics object (with byYear) and an individual data point (with year).
 */
export async function enrichMetricsWithHistory(data: YearlyItem | AggregatedMetrics, district?: string) {
    if (district && district !== 'Berlin' && district !== 'All') return data;

    // Case 1: Individual data point (year, budget, actual)
    if ('year' in data && data.year !== undefined) {
        const hist = HISTORICAL_DATA.find(h => h.year === data.year);
        if (hist) {
            const histBudget = hist.budget * 1000000;
            const histActual = hist.actual * 1000000;
            if (data.budget < histBudget * 0.85 || data.actual < histActual * 0.85) {
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
    if ('byYear' in data && data.byYear) {
        const enrichedByYear = data.byYear.map((item) => {
            const hist = HISTORICAL_DATA.find(h => h.year === item.year);
            if (hist) {
                const histBudget = hist.budget * 1000000;
                const histActual = hist.actual * 1000000;
                if (item.budget < histBudget * 0.85 || item.actual < histActual * 0.85) {
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
            if (!enrichedByYear.find((i) => i.year === h.year)) {
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
            totalBudget: enrichedByYear.reduce((sum, item) => sum + item.budget, 0),
            totalActual: enrichedByYear.reduce((sum, item) => sum + item.actual, 0),
            budget: enrichedByYear.reduce((sum, item) => sum + item.budget, 0), // also add shorthand for page.tsx
            actual: enrichedByYear.reduce((sum, item) => sum + item.actual, 0),
            byYear: enrichedByYear.sort((a, b) => a.year - b.year)
        };
    }

    return data;
}
