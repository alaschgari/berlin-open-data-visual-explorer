import fs from 'fs';
import path from 'path';

export interface TaxEntry {
    type: string;
    category: string;
    monthlyAmount: number;
    cumulativeAmount: number;
}

const PROCESSED_PATH = path.join(process.cwd(), 'data/processed/taxes_012026.json');

export async function getTaxData(): Promise<TaxEntry[]> {
    if (!fs.existsSync(PROCESSED_PATH)) {
        console.warn('Processed tax data not found, returning empty array');
        return [];
    }
    const content = fs.readFileSync(PROCESSED_PATH, 'utf8');
    const { data } = JSON.parse(content);
    return data;
}

export interface TaxMetrics {
    totalMonthly: number;
    period: string;
    byCategory: { name: string; value: number }[];
    topSources: TaxEntry[];
    allData: TaxEntry[];
}

export async function getTaxMetrics(): Promise<TaxMetrics> {
    if (!fs.existsSync(PROCESSED_PATH)) {
        return {
            totalMonthly: 0,
            period: 'N/A',
            byCategory: [],
            topSources: [],
            allData: []
        };
    }

    const content = fs.readFileSync(PROCESSED_PATH, 'utf8');
    const { period, data: taxData } = JSON.parse(content) as { period: string, data: TaxEntry[] };

    const totalMonthly = taxData.reduce((sum, item) => sum + item.monthlyAmount, 0);

    // Group by category (Ertragshoheit)
    const byCategory = taxData.reduce((acc: any, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.monthlyAmount;
        return acc;
    }, {});

    // Top 10 sources
    const topSources = [...taxData]
        .sort((a, b) => b.monthlyAmount - a.monthlyAmount)
        .slice(0, 10);

    return {
        totalMonthly,
        period,
        byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value: value as number })),
        topSources,
        allData: taxData
    };
}
