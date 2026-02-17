'use client';

import React from 'react';
import { Info, Lightbulb, HelpCircle, BookOpen, Search, ExternalLink } from 'lucide-react';

interface TreeNode {
    name: string;
    value: number;
    children?: TreeNode[];
}

interface BudgetExplanationProps {
    node: TreeNode | null;
    year: string;
}

interface ExplanationEntry {
    keywords: string[];
    explanation: string;
    examples: string[];
}

const EXPLANATIONS: ExplanationEntry[] = [
    {
        keywords: ['Kita', 'Kindertages', 'Kindertagesbetreuung', 'Jugend und Familie'],
        explanation: 'Dieser Bereich umfasst alle Ausgaben für die frühkindliche Bildung und die Unterstützung von Familien in Berlin.',
        examples: ['Betriebskostenzuschüsse für Kitas', 'Ausbau von Kita-Plätzen', 'Erziehungshilfen für Familien', 'Jugendfreizeiteinrichtungen']
    },
    {
        keywords: ['Schule', 'Gymnasien', 'Sekundarschule', 'Grundschulen', 'Berufsbildende'],
        explanation: 'Hier fließen die Mittel in den Bildungssektor – von der Sanierung der Gebäude bis hin zum pädagogischen Personal.',
        examples: ['Schulneubau (Schulbauoffensive)', 'Anschaffung von digitalen Endgeräten', 'Lehrmittel und Ausstattung', 'Inklusionsmaßnahmen']
    },
    {
        keywords: ['Polizei', 'Sicherheit', 'Innere Sicherheit'],
        explanation: 'Mittel für die Einsatzfähigkeit und Modernisierung der Berliner Polizei zur Aufrechterhaltung der öffentlichen Ordnung.',
        examples: ['Moderne Einsatzfahrzeuge', 'IT-Infrastruktur für Reviere', 'Spezialausrüstung (z.B. Bodycams)', 'Sanierung von Polizeidienststellen']
    },
    {
        keywords: ['Feuerwehr', 'Brandschutz', 'Rettungsdienst'],
        explanation: 'Finanzierung des Brand- und Katastrophenschutzes sowie des Berliner Rettungsdienstes.',
        examples: ['Neue Rettungswagen (RTW)', 'Ausrüstung für Drehleiter-Fahrzeuge', 'Modernisierung der Leitstellen', 'Löschboote']
    },
    {
        keywords: ['Digitalisierung', 'IT', 'Informations- und Kommunikationstechnik'],
        explanation: 'Investitionen in die digitale Verwaltung und die Infrastruktur der "Smart City" Berlin.',
        examples: ['Breitbandausbau an Schulen', 'Einführung der E-Akte', 'Online-Bürgerservices (OZG)', 'Cybersecurity-Maßnahmen']
    },
    {
        keywords: ['Umwelt', 'Klimaschutz', 'Mobilität', 'Verkehr', 'Bahn', 'Radwege'],
        explanation: 'Dieser Block finanziert die Verkehrswende und den Schutz der natürlichen Lebensgrundlagen in der Stadt.',
        examples: ['Ausbau des Radverkehrsnetzes', 'Zuschüsse für den ÖPNV (BVG/S-Bahn)', 'Anlage von Stadtbäumen', 'Ladeinfrastruktur für E-Mobilität']
    },
    {
        keywords: ['Personal', 'Gehälter', 'Bezügekasse'],
        explanation: 'Kosten für die Menschen, die in der Berliner Verwaltung, bei der Polizei oder in Schulen arbeiten.',
        examples: ['Besoldung von Beamten', 'Tariflöhne für Angestellte', 'Renten- und Pensionsbeiträge', 'Zuschüsse zur Krankenversicherung (Beihilfe)']
    },
    {
        keywords: ['Investitionen', 'Baumaßnahmen', 'Sanierung'],
        explanation: 'Ausgaben, die langfristige physische Werte schaffen und die Stadt modernisieren.',
        examples: ['Neubau von Brücken', 'Energetische Sanierung öffentlicher Gebäude', 'Neuanlage von Parkanlagen', 'Kauf von U-Bahn-Waggons']
    },
    {
        keywords: ['Kultur', 'Museum', 'Theater', 'Bibliothek'],
        explanation: 'Förderung der vielfältigen Berliner Kulturlandschaft und Erhalt historischer Schätze.',
        examples: ['Zuschüsse für Opernhäuser und Theater', 'Ankauf von Kunstwerken', 'Modernisierung der Landesbibliothek', 'Stiftung Preußischer Kulturbesitz']
    },
    {
        keywords: ['Wissenschaft', 'Forschung', 'Hochschulen', 'Universität'],
        explanation: 'Mittel für die Berliner Universitätslandschaft und die Spitzenforschung.',
        examples: ['Grundfinanzierung der Charité', 'Sanierung von Uni-Hörsälen', 'Berlin University Alliance (BUA) Projekte', 'KI-Forschungszentren']
    },
    {
        keywords: ['Wirtschaft', 'Innovation', 'Startup', 'Tourismus'],
        explanation: 'Maßnahmen zur Stärkung des Wirtschaftsstandorts Berlin und Förderung von Innovationen.',
        examples: ['Gründer-Stipendien', 'Vermarktung Berlins als Tourismusmetropole', 'Förderung von Gewerbehöfen', 'Mittelstandsförderung']
    },
    {
        keywords: ['Soziales', 'Integration', 'Arbeitslosengeld', 'Obdachlos'],
        explanation: 'Unterstützung für bedürftige Berlinerinnen und Berliner sowie Maßnahmen zur gesellschaftlichen Teilhabe.',
        examples: ['Kosten der Unterkunft (KdU)', 'Beratung für Geflüchtete', 'Kältehilfe für Obdachlose', 'Qualifizierungsmaßnahmen für Langzeitarbeitslose']
    },
    {
        keywords: ['Justiz', 'Gericht', 'Strafvollzug'],
        explanation: 'Finanzierung des Rechtswesens und des Betriebs der Berliner Justizvollzugsanstalten.',
        examples: ['Ausstattung der Amts- und Landgerichte', 'Sicherungsmaßnahmen im Strafvollzug', 'Täter-Opfer-Ausgleich Programme', 'Resozialisierung']
    },
    {
        keywords: ['Finanzen', 'Schulden', 'Zinsen', 'Vorsorge'],
        explanation: 'Zentralverwaltung der Berliner Landesfinanzen, inklusive Zinszahlungen und Rücklagenbildung.',
        examples: ['Zinsen für Kredite am Kapitalmarkt', 'Zuführungen zur Pensionsrücklage', 'Zentrales Immobilienmanagement', 'Steuerverwaltung']
    }
];

export default function BudgetExplanation({ node, year }: BudgetExplanationProps) {
    if (!node) {
        return (
            <div className="bg-slate-800/20 border border-slate-700/50 rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-700/30 rounded-full flex items-center justify-center mb-4">
                    <HelpCircle className="text-slate-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-300 mb-2">Kein Element ausgewählt</h3>
                <p className="text-sm text-slate-500 max-w-xs">
                    Wähle ein Budget-Element im Explorer aus, um eine automatische Erklärung und Beispiele zu erhalten.
                </p>
            </div>
        );
    }

    // Find a matching explanation with improved matching logic
    const matchingEntry = EXPLANATIONS.find(entry =>
        entry.keywords.some(kw => {
            // For very short keywords (<= 2 chars like 'IT'), use word boundary check
            if (kw.length <= 2) {
                const regex = new RegExp(`\\b${kw}\\b`, 'i');
                return regex.test(node.name);
            }
            // For longer keywords, stick to case-insensitive inclusion for flexibility
            return node.name.toLowerCase().includes(kw.toLowerCase());
        })
    );

    const explanation = matchingEntry ? matchingEntry.explanation :
        `Dieser Posten umfasst Mittel für den Bereich "${node.name}" im Haushaltsjahr ${year}. Er dient der Erfüllung der entsprechenden Verwaltungsaufgaben.`;

    const examples = matchingEntry ? matchingEntry.examples : [
        'Personalkosten für die zuständigen Stellen',
        'Sachkosten für den laufenden Betrieb',
        'Zuweisungen an Dritte im Rahmen der Aufgabenerfüllung'
    ];

    return (
        <div className="bg-slate-800/20 border border-slate-700/50 rounded-2xl p-6 h-full flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <BookOpen size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Budget-Erklärung</h3>
            </div>

            <div className="space-y-4">
                <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Info className="text-blue-400 shrink-0 mt-1" size={16} />
                        <div>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {explanation}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="text-amber-400" size={16} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Beispiele für Ausgaben</span>
                    </div>
                    <ul className="space-y-2">
                        {examples.map((example, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{example}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>


            <div className="pt-4 border-t border-slate-700/30">
                <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(node.name + " Berlin Haushalt")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-all group"
                >
                    <div className="flex items-center gap-2">
                        <Search size={14} className="text-blue-400" />
                        <span className="text-xs font-bold text-slate-300">Vertiefende Recherche</span>
                    </div>
                    <ExternalLink size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                </a>
            </div>

            <div className="pt-4 mt-auto border-t border-slate-700/30">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <div className="flex flex-col">
                        <span>STATUS: AUTOMATISCH GENERIERT</span>
                        <span className="text-[8px] text-rose-500/70 font-bold uppercase tracking-tighter">Kann Fehler enthalten • Ohne Gewähr</span>
                    </div>
                    <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold">Smart Info</span>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
