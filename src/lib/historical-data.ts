
// Historical Budget Data (2010-2017)
// Source: Senatsverwaltung für Finanzen (Haushaltspläne PDF) - Simulated
// These values represent total budget (Ansatz) in Million Euro

export interface HistoricalYear {
    year: number;
    budget: number; // Mio €
    actual: number; // Mio €
}

export const HISTORICAL_DATA: HistoricalYear[] = [
    { year: 2010, budget: 19800, actual: 20100 },
    { year: 2011, budget: 20500, actual: 20400 },
    { year: 2012, budget: 21200, actual: 21500 },
    { year: 2013, budget: 22100, actual: 22800 },
    { year: 2014, budget: 23500, actual: 23200 },
    { year: 2015, budget: 24800, actual: 25100 },
    { year: 2016, budget: 26200, actual: 26800 },
    { year: 2017, budget: 28500, actual: 28900 },
    { year: 2018, budget: 29800, actual: 30100 },
    { year: 2019, budget: 31200, actual: 31500 },
    { year: 2020, budget: 32500, actual: 32200 }, // Pandemic dip?
    { year: 2021, budget: 33800, actual: 34100 },
    { year: 2022, budget: 33700, actual: 32900 },
    { year: 2023, budget: 37600, actual: 36800 },
    { year: 2024, budget: 39100, actual: 38400 },
    { year: 2025, budget: 40500, actual: 39800 }
];
