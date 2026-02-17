import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export interface TaxEntry {
    type: string;
    category: string;
    monthlyAmount: number;
    cumulativeAmount: number;
}

export async function getTaxData(): Promise<TaxEntry[]> {
    const filePath = path.join(process.cwd(), 'data/raw/steuereinnahmen_012026.csv');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    return new Promise((resolve, reject) => {
        Papa.parse(fileContent, {
            header: true,
            delimiter: ';',
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data.map((row: any) => {
                    const parseNumber = (val: string) => {
                        if (!val) return 0;
                        // Handle German format: 1.234,56
                        const cleanVal = val.replace(/\./g, '').replace(',', '.');
                        return parseFloat(cleanVal) * 1000; // Convert T EUR to EUR
                    };

                    const type = (row['Steuerart'] || '').trim();
                    const category = (row['Ertragshoheit'] || '').trim();

                    let suffix = '';
                    const catLower = category.toLowerCase();
                    if (catLower.includes('landesanteil') || catLower.includes('landessteuern')) suffix = ' (Land)';
                    else if (catLower.includes('gemeindeanteil') || catLower.includes('gemeindesteuern')) suffix = ' (Gemeinde)';

                    return {
                        type: `${type}${suffix}`,
                        category: category,
                        monthlyAmount: parseNumber(row[' Einnahmen Januar 2026 (T EUR)']),
                        cumulativeAmount: parseNumber(row['Einnahmen bis Januar 2026 (T EUR)']),
                    };
                }).filter(item => item.type && item.monthlyAmount !== 0);

                resolve(data);
            },
            error: (error: any) => reject(error),
        });
    });
}

export async function getTaxMetrics() {
    const filePath = path.join(process.cwd(), 'data/raw/steuereinnahmen_012026.csv');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Quick parse to get the header for the period
    const lines = fileContent.split('\n');
    const header = lines[0].split(';');
    // " Einnahmen Januar 2026 (T EUR)" -> "Januar 2026"
    const periodMatch = header[2]?.match(/Einnahmen (.*) \(T EUR\)/);
    const period = periodMatch ? periodMatch[1] : 'Januar 2026';

    const data = await getTaxData();
    const totalMonthly = data.reduce((sum, item) => sum + item.monthlyAmount, 0);

    // Group by category (Ertragshoheit)
    const byCategory = data.reduce((acc: any, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.monthlyAmount;
        return acc;
    }, {});

    // Top 10 sources
    const topSources = [...data]
        .sort((a, b) => b.monthlyAmount - a.monthlyAmount)
        .slice(0, 10);

    return {
        totalMonthly,
        period,
        byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value: value as number })),
        topSources,
        allData: data
    };
}
