'use client';

import React from 'react';
import { Info, Lightbulb, HelpCircle, BookOpen, Search, ExternalLink } from 'lucide-react';

interface TreeNode {
    name: string;
    value: number;
    children?: TreeNode[];
}

import { useLanguage } from './LanguageContext';

interface BudgetExplanationProps {
    node: TreeNode | null;
    year: string;
}

// Comprehensive explanations for budget categories
const EXPLANATIONS = [
    {
        keyword: "Personal",
        explanation: "Diese Mittel sind für die Gehälter und Lohnnebenkosten der Beschäftigten in diesem Bereich vorgesehen. Berlin investiert hier in qualifizierte Fachkräfte für die Verwaltung und soziale Dienste.",
        examples: ["Bruttogehälter", "Sozialversicherungsbeiträge", "Beihilfezahlungen", "Pensionsrückstellungen"]
    },
    {
        keyword: "Sach",
        explanation: "Hierbei handelt es sich um Kosten für den laufenden Betrieb, wie Miete, Energie oder Büromaterial, die zur Aufgabenerfüllung notwendig sind.",
        examples: ["Mietzahlungen", "Energiekosten", "Instandhaltung von Gebäuden", "IT-Infrastruktur"]
    },
    {
        keyword: "Investition",
        explanation: "Investitionsmittel fließen in langfristige Projekte wie den Bau von Schulen, Straßen oder die Anschaffung von Großgeräten, um die Infrastruktur Berlins zu stärken.",
        examples: ["Neubau von Bildungseinrichtungen", "Sanierung von Brücken", "Anschaffung von Polizeifahrzeugen", "Digitalisierung der Schulen"]
    },
    {
        keyword: "Zuweisung",
        explanation: "Dies sind Gelder, die an Bezirke, andere Bundesländer oder private Organisationen weitergegeben werden, damit diese spezifische Aufgaben übernehmen.",
        examples: ["Zuweisungen an die Bezirke", "Fördergelder für kulturelle Projekte", "Zuschüsse an gemeinnützige Vereine", "Mittel für den ÖPNV"]
    },
    {
        keyword: "Bildung",
        explanation: "Ausgaben für Bildung umfassen Schulen, Kitas und Universitäten. Dies ist eine der größten Investitionen Berlins in die Zukunft seiner Bürger.",
        examples: ["Lehrermaterialien", "Kita-Gutscheine", "Forschungsmittel", "Schulsanierungsprogramm"]
    },
    {
        keyword: "Wirtschaft",
        explanation: "Diese Mittel dienen der Förderung des Wirtschaftsstandorts Berlin, der Unterstützung von Startups und der Ansiedlung von Unternehmen.",
        examples: ["Gründerstipendien", "Messeauftritte Berlins", "Technologieförderung", "Tourismusmarketing"]
    },
    {
        keyword: "Jugend",
        explanation: "Mittel für Jugend und Familie unterstützen die soziale Infrastruktur, Jugendarbeit und den Schutz von Kindern in der Stadt.",
        examples: ["Jugendfreizeiteinrichtungen", "Erziehungsberatung", "Kinderschutzprojekte", "Ferienpass-Aktionen"]
    },
    {
        keyword: "Schule",
        explanation: "Diese Mittel sind speziell für den Schulbetrieb, die pädagogische Ausstattung und die Instandhaltung der Berliner Schulgebäude vorgesehen.",
        examples: ["Digitale Tafeln", "Schulbücher", "Mobile Endgeräte für Schüler", "Kleinere Instandsetzungen"]
    }
];

export default function BudgetExplanation({ node, year }: BudgetExplanationProps) {
    const { t } = useLanguage();

    if (!node) {
        return (
            <div className="bg-slate-800/20 border border-slate-700/50 rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-700/30 rounded-full flex items-center justify-center mb-4">
                    <HelpCircle className="text-slate-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-300 mb-2">{t('brand_sub')}</h3>
                <p className="text-sm text-slate-500 max-w-xs">{t('no_explanation')}</p>
            </div>
        );
    }

    const matchingEntry = EXPLANATIONS.find(e => {
        const lowerName = node.name.toLowerCase();
        const lowerKeyword = e.keyword.toLowerCase();

        // Exact word match or start of word to avoid false positives (like 'it' in 'Moabit')
        // We use a regex for word boundaries or check if the keyword is a significant part of the name
        const wordRegex = new RegExp(`${lowerKeyword}`, 'i');
        return wordRegex.test(lowerName) && lowerName.split(/[\wüöäÜÖÄ]+/).length > 0;
    });

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
                <h3 className="text-lg font-bold text-white">{t('smart_explanation')}</h3>
            </div>

            <div className="space-y-4">
                <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Info className="text-blue-400 shrink-0 mt-1" size={16} />
                        <div>
                            <p className="text-sm text-slate-300 leading-relaxed">{explanation}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="text-amber-400" size={16} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Beispiele</span>
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
                        <span className="text-xs font-bold text-slate-300">{t('deep_research')}</span>
                    </div>
                    <ExternalLink size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                </a>
            </div>

            <div className="pt-4 mt-auto border-t border-slate-700/30">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <div className="flex flex-col">
                        <span>STATUS: AUTOMATIC</span>
                        <span className="text-[8px] text-rose-500/70 font-bold uppercase tracking-tighter">{t('disclaimer_ai')}</span>
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
