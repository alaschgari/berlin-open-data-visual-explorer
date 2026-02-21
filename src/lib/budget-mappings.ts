import TITLE_NAMES from './budget-titles';

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
    const match = chapterCode.match(/(\d{4})/);
    const cleanCode = match ? match[1] : chapterCode;

    const name = CHAPTER_NAMES[cleanCode];
    if (name) {
        return `${cleanCode} - ${name}`;
    }

    return `Unbekanntes Kapitel (${cleanCode})`;
}

/**
 * Returns a human-readable name for a budget title code.
 * @param titleCode The 5-digit title code
 * @returns The description or the original code if not mapped
 */
export function getTitleName(titleCode: string): string {
    if (!titleCode) return titleCode;
    const clean = titleCode.trim();
    return TITLE_NAMES[clean as keyof typeof TITLE_NAMES] || titleCode;
}
