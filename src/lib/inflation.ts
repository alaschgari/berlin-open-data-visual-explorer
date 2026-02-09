
// Source: Destatis / Amt für Statistik (VPI Berlin or Germany base 2020=100)
// Simplified annual averages
export const CPI_DATA: Record<number, number> = {
    2013: 88.5,
    2014: 89.4,
    2015: 89.9,
    2016: 90.4,
    2017: 91.8,
    2018: 93.5,
    2019: 94.8,
    2020: 100.0,
    2021: 103.1,
    2022: 110.2,
    2023: 116.7,
    2024: 119.5, // Forecast/Estimate
    2025: 122.0  // Forecast
};

/**
 * Adjusts a monetary amount from a source year to the target year (default: 2024).
 * Formula: Amount * (CPI_Target / CPI_Source)
 */
export function adjustForInflation(amount: number, sourceYear: number, targetYear: number = 2024): number {
    const cpiSource = CPI_DATA[sourceYear];
    const cpiTarget = CPI_DATA[targetYear];

    if (!cpiSource || !cpiTarget) {
        return amount; // Return original if data missing
    }

    return amount * (cpiTarget / cpiSource);
}
