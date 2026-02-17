export const TAX_DESCRIPTIONS: Record<string, string> = {
    'Umsatzsteuer': 'Steuer auf den Austausch von Waren und Dienstleistungen. Sie wird von Unternehmen erhoben, aber letztlich vom Endverbraucher getragen.',
    'Lohnsteuer': 'Eine Erhebungsform der Einkommensteuer, die direkt vom Arbeitgeber vom Bruttolohn einbehalten und an das Finanzamt abgeführt wird.',
    'Gewerbesteuer': 'Eine der wichtigsten Einnahmequellen der Gemeinden, erhoben auf die Ertragskraft von Gewerbebetrieben.',
    'Grunderwerbsteuer': 'Fällt beim Kauf eines Grundstücks oder einer Immobilie in Berlin an. Sie ist eine reine Landessteuer.',
    'Einkommensteuer': 'Steuer auf das Welteinkommen natürlicher Personen (z.B. aus Arbeit, Vermietung oder Kapital).',
    'Körperschaftsteuer': 'Quasi die Einkommensteuer für juristische Personen wie GmbHs oder Aktiengesellschaften.',
    'Übernachtungsteuer': 'Auch als "City Tax" bekannt. Sie beträgt 5 % auf den Preis für private Übernachtungen in Berlin.',
    'Erbschaftsteuer': 'Wird fällig, wenn Vermögen durch Erbfall auf andere Personen übergeht.',
    'Grundsteuer': 'Steuer auf das Eigentum an Grundstücken und deren Bebauung.',
    'Biersteuer': 'Eine klassische Verbrauchssteuer, die vom Land Berlin erhoben wird.',
    'Kfz-Steuer': 'Steuer für das Halten von Fahrzeugen zum Verkehr auf öffentlichen Straßen.',
    'Energiesteuer': 'Wird auf den Verbrauch von Energieerzeugnissen (Heizöl, Erdgas, Benzin) erhoben.',
    'Tabaksteuer': 'Verbrauchssteuer auf Tabakwaren wie Zigaretten oder Zigarren.',
    'Versicherungssteuer': 'Fällt auf die Zahlung von Versicherungsprämien an.',
    'Hundesteuer': 'Eine örtliche Aufwandsteuer für das Halten von Hunden im Stadtgebiet.',
    'Vergnügungsteuer': 'Wird auf kommerzielle Vergnügungsveranstaltungen erhoben.',
    'Feuerschutzsteuer': 'Abgabe der Versicherer auf Prämien für Feuerversicherungen zur Finanzierung des Brandschutzes.'
};

export function getTaxDescription(type: string): string | null {
    // Normalize type (remove suffixes like "(Land)" or "(Gemeinde)")
    const cleanType = type.replace(/\s\((Land|Gemeinde)\)$/, '').trim();

    // Exact match
    if (TAX_DESCRIPTIONS[cleanType]) return TAX_DESCRIPTIONS[cleanType];

    // Partial match
    for (const key in TAX_DESCRIPTIONS) {
        if (cleanType.includes(key)) return TAX_DESCRIPTIONS[key];
    }

    return null;
}
