import { supabase } from './supabase';

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

export async function getTaxMetrics(): Promise<TaxMetrics> {
    try {
        // Step 1: Count tax-related records in financial_records
        // Primary chapters for taxes: 2901 (Landessteuern), 2902 (Gemeindeanteile)
        // Also include any revenue titles from Einzelplan 29
        const { count, error: countError } = await supabase
            .from('financial_records')
            .select('*', { count: 'exact', head: true })
            .ilike('chapter', '29%');

        if (countError) {
            console.error('[Taxes Proxy] Count error:', countError);
            return emptyMetrics();
        }

        const totalRecords = count || 0;
        const CHUNK_SIZE = 1000;
        const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);

        console.log(`[Taxes Proxy] Fetching ${totalRecords} tax records in ${totalChunks} chunks`);

        // Step 2: Fetch all records in parallel
        const fetchPromises = [];
        for (let i = 0; i < totalChunks; i++) {
            fetchPromises.push(
                supabase
                    .from('financial_records')
                    .select('year, chapter, title_code, title, actual, budget')
                    .ilike('chapter', '29%')
                    .range(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE - 1)
            );
        }

        const chunkResults = await Promise.all(fetchPromises);
        let allRecords: any[] = [];
        chunkResults.forEach(({ data, error }) => {
            if (!error && data) allRecords = allRecords.concat(data);
        });

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
                    (r.actual > 0 || r.budget > 0);
            })
            .map(r => ({
                type: r.title || `Steuer-Titel ${r.title_code}`,
                category: (r.title?.toLowerCase().includes('gemeinde') || r.chapter?.includes('2902')) ? 'Gemeindesteuern' : 'Landessteuern',
                monthlyAmount: r.actual > 0 ? r.actual : r.budget,
                cumulativeAmount: r.actual > 0 ? r.actual : r.budget
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
