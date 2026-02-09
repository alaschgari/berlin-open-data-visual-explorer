
export const CHAPTER_NAMES: Record<string, string> = {
    "9540": "Zentrale Finanzangelegenheiten / Landeshauptkasse",
    "4500": "Pauschale Zuweisungen / Zentrale Aufgaben",
    "4021": "Kindertagesbetreuung / Jugendamt",
    "3960": "Soziales / Grundsicherung SGB II",
    "3911": "Soziales / Grundsicherung SGB XII",
    "3701": "Schulbau",
    "3800": "Tiefbau"
};

/**
 * Returns the human-readable name for a given chapter code.
 * @param chapterCode The 4-digit chapter code (e.g. "9540")
 * @returns The mapped name or "Unbekanntes Kapitel (Code)"
 */
export function getChapterName(chapterCode: string): string {
    // The chapter code might come in as "9540" or "09540" or "9540 Description"
    // We need to extract the 4-digit code first.
    // Based on previous data inspection, chapter is often "0624 Amtsgericht Neukölln" or similar.
    // So we should try to match the first 4 digits.

    const match = chapterCode.match(/(\d{4})/);
    const cleanCode = match ? match[1] : chapterCode;

    const name = CHAPTER_NAMES[cleanCode];
    if (name) {
        return `${cleanCode} - ${name}`;
    }

    return `Unbekanntes Kapitel (${cleanCode})`;
}
