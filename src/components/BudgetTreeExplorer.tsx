'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Search, Folder, FileText, Info } from 'lucide-react';

interface TreeNode {
    name: string;
    value: number;
    children?: TreeNode[];
}

interface BudgetTreeExplorerProps {
    data: TreeNode;
    onSelect: (node: TreeNode) => void;
}

// Map of official abbreviations for Berlin Senate Departments
const ABBREVIATIONS: Record<string, string> = {
    'Senatsverwaltung für Bildung, Jugend und Familie': 'SenBJF',
    'Senatsverwaltung für Finanzen': 'SenFin',
    'Senatsverwaltung für Inneres und Sport': 'SenInnSport',
    'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen': 'SenStadtWohn',
    'Senatsverwaltung für Integration, Arbeit und Soziales': 'SenIAS',
    'Senatsverwaltung für Gesundheit, Pflege und Gleichstellung': 'SenGPG',
    'Senatsverwaltung für Umwelt, Mobilität, Verbraucher- und Klimaschutz': 'SenUMVK',
    'Senatsverwaltung für Wirtschaft, Energie und Betriebe': 'SenWEB',
    'Senatsverwaltung für Kultur und Europa': 'SenKE',
    'Senatsverwaltung für Justiz, Vielfalt und Antidiskriminierung': 'SenJVA',
    'Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt': 'SenMVKU',
    'Senatsverwaltung für Arbeit, Soziales, Gleichstellung, Integration, Vielfalt und Antidiskriminierung': 'SenASGIVA',
    'Senatsverwaltung für Stadtentwicklung, Bauen und Gehäuse': 'SenStadtBau'
};

export default function BudgetTreeExplorer({ data, onSelect }: BudgetTreeExplorerProps) {
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set([data.name]));
    const [searchTerm, setSearchTerm] = useState('');

    const toggleExpand = (nodeName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newKeys = new Set(expandedKeys);
        if (newKeys.has(nodeName)) {
            newKeys.delete(nodeName);
        } else {
            newKeys.add(nodeName);
        }
        setExpandedKeys(newKeys);
    };

    const formatCurrency = (val: number) => {
        if (val >= 1e9) return `${(val / 1e9).toFixed(2)} Mrd. €`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(1)} Mio. €`;
        return `${val.toLocaleString('de-DE')} €`;
    };

    /**
     * Shortens a name based on abbreviations and redundant parent prefixes
     */
    const getDisplayText = (name: string, parentName?: string) => {
        let display = name;

        // 1. Check for official abbreviations
        for (const [full, short] of Object.entries(ABBREVIATIONS)) {
            if (display.includes(full)) {
                display = display.replace(full, short);
            }
        }

        // 2. Remove redundant parent prefix (e.g. "SenBJF - School" -> "School")
        if (parentName) {
            let parentAlias = parentName;
            for (const [full, short] of Object.entries(ABBREVIATIONS)) {
                if (parentAlias.includes(full)) {
                    parentAlias = parentAlias.replace(full, short);
                }
            }

            // Clean up separators like " - " or ": "
            const separators = [' - ', ': ', ' – '];
            for (const sep of separators) {
                if (display.startsWith(parentAlias + sep)) {
                    display = display.substring((parentAlias + sep).length);
                }
                // Also check without alias
                if (display.startsWith(parentName + sep)) {
                    display = display.substring((parentName + sep).length);
                }
            }
        }

        return display;
    };

    /**
     * Cleans up the display text for titles
     */
    const cleanTitle = (text: string) => {
        let cleaned = text.trim();
        // Remove trailing hyphens or empty separators followed by nothing
        const trailingSeps = [/ -$/, / –$/, / :$/, /-$/, /–$/];
        trailingSeps.forEach(reg => {
            cleaned = cleaned.replace(reg, '');
        });
        return cleaned.trim();
    };

    const renderNode = (node: TreeNode, depth: number, parentTotal: number, parentName?: string): JSX.Element => {
        const isExpanded = expandedKeys.has(node.name);
        const hasChildren = node.children && node.children.length > 0;
        const percentage = (node.value / parentTotal) * 100;

        // Simple search filtering (only highlights, doesn't hide parent hierarchy)
        const isMatch = searchTerm && node.name.toLowerCase().includes(searchTerm.toLowerCase());
        const displayText = cleanTitle(getDisplayText(node.name, parentName));

        // Sort children by value descending
        const sortedChildren = node.children ? [...node.children].sort((a, b) => b.value - a.value) : [];

        return (
            <div key={node.name} className="flex flex-col">
                <div
                    onClick={() => onSelect(node)}
                    title={node.name}
                    className={`group flex items-center py-2 px-3 rounded-xl cursor-pointer transition-all border ${isMatch
                        ? 'bg-emerald-500/20 border-emerald-500/30'
                        : 'border-transparent hover:bg-slate-700/30'
                        }`}
                    style={{ marginLeft: `${depth * 1.5}rem` }}
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {hasChildren ? (
                            <button
                                onClick={(e) => toggleExpand(node.name, e)}
                                className="p-1 hover:bg-slate-600/50 rounded transition-colors text-slate-500 flex-shrink-0"
                            >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        ) : (
                            <div className="w-6 flex-shrink-0" /> // Fixed width Spacer
                        )}

                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${hasChildren ? 'bg-blue-500/10 text-blue-400 font-bold' : 'bg-slate-700/50 text-slate-400'}`}>
                            {hasChildren ? <Folder size={14} /> : <FileText size={14} />}
                        </div>

                        <span className={`text-sm truncate select-none ${isMatch ? 'text-emerald-400 font-bold' : 'text-slate-200 font-medium'}`}>
                            {displayText}
                        </span>
                    </div>

                    <div className="flex items-center gap-6 text-right">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-mono font-bold text-slate-100">
                                {formatCurrency(node.value)}
                            </span>
                            <div className="w-24 h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500/50"
                                    style={{ width: `${Math.min(100, percentage)}%` }}
                                />
                            </div>
                        </div>
                        <div className="w-12 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                            {percentage < 0.1 ? '< 0.1%' : `${percentage.toFixed(1)}%`}
                        </div>
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="mt-1">
                        {sortedChildren.map(child => renderNode(child, depth + 1, node.value, node.name))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder="Haushaltstitel suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                />
            </div>

            {/* Tree Container */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-1">
                    {data.children ? [...data.children]
                        .sort((a, b) => b.value - a.value)
                        .map(child => renderNode(child, 0, data.value)) : null}
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
            `}</style>
        </div>
    );
}
