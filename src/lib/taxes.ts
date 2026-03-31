import { db } from '@/db';
import { financialRecords } from '@/db/schema';
import { eq, ilike, and, desc } from 'drizzle-orm';

export interface TaxEntry {
    type: string;
    category: string;
    monthlyAmount: number;
    cumulativeAmount: number;
}

export interface TaxMetrics {
    totalMonthly: number;
    period: string;
    byCategory: { name: string; value: number }[];
    topSources: TaxEntry[];
    allData: TaxEntry[];
}

export async function getTaxData(): Promise<TaxEntry[]> {
    const metrics = await getTaxMetrics();
    return metrics.allData;
}

export async function getQuickTaxMetrics(): Promise<{ totalMonthly: number }> {
    "use cache";
    try {
        const data = await db
            .select({
                actual: financialRecords.actual,
                budget: financialRecords.budget
            })
            .from(financialRecords)
            .where(
                and(
                    ilike(financialRecords.chapter, '29%'),
                    eq(financialRecords.year, 2024)
                )
            );

        const totalMonthly = (data || []).reduce((sum, r) => sum + ((r.actual || 0) > 0 ? (r.actual || 0) : (r.budget || 0)), 0);
        return { totalMonthly };
    } catch (e) {
        console.error('[Taxes Proxy] Quick metrics error:', e);
        return { totalMonthly: 0 };
    }
}

export async function getTaxMetrics(): Promise<TaxMetrics> {
    "use cache";
    try {
        console.log('[Taxes Proxy] Fetching from Neon...');
        // Simply fetch all relevant records from Neon
        const allRecords = await db
            .select({
                year: financialRecords.year,
                chapter: financialRecords.chapter,
                title_code: financialRecords.title_code,
                title: financialRecords.title,
                actual: financialRecords.actual,
                budget: financialRecords.budget
            })
            .from(financialRecords)
            .where(ilike(financialRecords.chapter, '29%'));

        console.log(`[Taxes Proxy] Successfully fetched ${allRecords.length} tax records`);

        // Filter for latest year available and only actual tax titles
        // Tax titles usually have range 10-18 in the first two digits of title_code
        const latestYear = Math.max(...allRecords.map(r => r.year), 2025);
        const latestData = allRecords.filter(r => r.year === latestYear);

        const taxEntries: TaxEntry[] = latestData
            .filter(r => {
                // In Einzelplan 29 (and specific chapters 2900, 2901, 2902), 
                // most titles are tax revenue or related allocations.
                // We filter for values > 0 and exclude titles that look like debt/interest (usually 57xxx/58xxx)
                const code = r.title_code || '';
                const isDebt = code.startsWith('57') || code.startsWith('58') || code.startsWith('54');

                return (r.chapter?.includes('2900') || r.chapter?.includes('2901') || r.chapter?.includes('2902')) &&
                    !isDebt &&
                    ((r.actual || 0) > 0 || (r.budget || 0) > 0);
            })
            .map(r => ({
                type: r.title || `Steuer-Titel ${r.title_code}`,
                category: (r.title?.toLowerCase().includes('gemeinde') || r.chapter?.includes('2902')) ? 'Gemeindesteuern' : 'Landessteuern',
                monthlyAmount: (r.actual || 0) > 0 ? (r.actual || 0) : (r.budget || 0),
                cumulativeAmount: (r.actual || 0) > 0 ? (r.actual || 0) : (r.budget || 0)
            }));

        if (taxEntries.length === 0) return emptyMetrics();

        const totalMonthly = taxEntries.reduce((sum, item) => sum + item.monthlyAmount, 0);

        // Group by category
        const byCategoryMap = new Map<string, number>();
        taxEntries.forEach(item => {
            byCategoryMap.set(item.category, (byCategoryMap.get(item.category) || 0) + item.monthlyAmount);
        });

        // Top 10 sources
        const topSources = [...taxEntries]
            .sort((a, b) => b.monthlyAmount - a.monthlyAmount)
            .slice(0, 10);

        return {
            totalMonthly,
            period: `Haushaltsjahr ${latestYear}`,
            byCategory: Array.from(byCategoryMap.entries()).map(([name, value]) => ({ name, value })),
            topSources,
            allData: taxEntries
        };

    } catch (error) {
        console.error('[Taxes Proxy] Unexpected error:', error);
        return emptyMetrics();
    }
}

function emptyMetrics(): TaxMetrics {
    return {
        totalMonthly: 0,
        period: 'N/A',
        byCategory: [],
        topSources: [],
        allData: []
    };
}
