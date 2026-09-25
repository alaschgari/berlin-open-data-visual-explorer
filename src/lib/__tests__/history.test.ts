import { describe, expect, it } from 'vitest';
import { enrichMetricsWithHistory, type AggregatedMetrics, type YearlyItem } from '../history';
import { HISTORICAL_DATA } from '../historical-data';

const hist = HISTORICAL_DATA[0];
const MIO = 1_000_000;

describe('enrichMetricsWithHistory', () => {
    it('replaces a partial year with the historical baseline', async () => {
        const item: YearlyItem = { year: hist.year, budget: 1, actual: 1 };
        expect(await enrichMetricsWithHistory(item)).toEqual({
            year: hist.year,
            budget: hist.budget * MIO,
            actual: hist.actual * MIO,
            isEstimated: true,
        });
    });

    it('keeps a year that is already complete', async () => {
        const item: YearlyItem = { year: hist.year, budget: hist.budget * MIO, actual: hist.actual * MIO };
        expect(await enrichMetricsWithHistory(item)).toEqual(item);
    });

    it('does not touch district-level data', async () => {
        const item: YearlyItem = { year: hist.year, budget: 1, actual: 1 };
        expect(await enrichMetricsWithHistory(item, 'Mitte')).toBe(item);
    });

    it('fills missing years and recomputes totals', async () => {
        const metrics: AggregatedMetrics = {
            byYear: [{ year: 2030, budget: 5, actual: 4 }],
            totalBudget: 5, totalActual: 4, budget: 5, actual: 4,
        };
        const result = await enrichMetricsWithHistory(metrics) as AggregatedMetrics;

        expect(result.byYear).toHaveLength(HISTORICAL_DATA.length + 1);
        expect(result.byYear.map(y => y.year)).toEqual([...result.byYear.map(y => y.year)].sort((a, b) => a - b));
        const expectedTotal = HISTORICAL_DATA.reduce((s, h) => s + h.budget * MIO, 0) + 5;
        expect(result.totalBudget).toBe(expectedTotal);
        expect(result.budget).toBe(expectedTotal);
    });
});
