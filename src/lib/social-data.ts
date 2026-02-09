
export interface SocialMetrics {
    unemploymentRate: number; // Percentage
    childPovertyRate: number; // Percentage
    migrationBackground: number; // Percentage
}

// Approximate data based on 2023/2024 reports (Berlin Sozialstruktur)
export const DISTRICT_SOCIAL_DATA: Record<string, SocialMetrics> = {
    "Mitte": { unemploymentRate: 14.5, childPovertyRate: 33.2, migrationBackground: 54.2 },
    "Friedrichshain-Kreuzberg": { unemploymentRate: 9.8, childPovertyRate: 24.5, migrationBackground: 42.1 },
    "Pankow": { unemploymentRate: 6.5, childPovertyRate: 12.8, migrationBackground: 21.5 },
    "Charlottenburg-Wilmersdorf": { unemploymentRate: 8.2, childPovertyRate: 16.5, migrationBackground: 35.8 },
    "Spandau": { unemploymentRate: 13.2, childPovertyRate: 29.8, migrationBackground: 41.2 },
    "Steglitz-Zehlendorf": { unemploymentRate: 5.8, childPovertyRate: 9.5, migrationBackground: 23.5 },
    "Tempelhof-Schöneberg": { unemploymentRate: 9.5, childPovertyRate: 19.2, migrationBackground: 36.5 },
    "Neukölln": { unemploymentRate: 15.8, childPovertyRate: 38.5, migrationBackground: 51.2 },
    "Treptow-Köpenick": { unemploymentRate: 6.8, childPovertyRate: 13.5, migrationBackground: 14.2 },
    "Marzahn-Hellersdorf": { unemploymentRate: 10.5, childPovertyRate: 26.5, migrationBackground: 18.5 },
    "Lichtenberg": { unemploymentRate: 8.5, childPovertyRate: 18.5, migrationBackground: 22.5 },
    "Reinickendorf": { unemploymentRate: 12.5, childPovertyRate: 28.5, migrationBackground: 39.5 },
    "Berlin": { unemploymentRate: 9.8, childPovertyRate: 23.5, migrationBackground: 38.5 } // Average
};
