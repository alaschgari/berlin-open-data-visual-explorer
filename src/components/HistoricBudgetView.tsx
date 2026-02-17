'use client';

import React from 'react';
import BudgetChapters from '@/components/BudgetChapters';
import { getPopulation } from '@/lib/demographics';

interface HistoricBudgetViewProps {
    enrichedData: any;
    timeline: any[];
    topChapters: any[];
    district: string;
}

export default function HistoricBudgetView({ enrichedData, timeline, topChapters, district }: HistoricBudgetViewProps) {
    const maxBudget = Math.max(...timeline.map(t => t.budget), 1);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm group hover:border-emerald-500/50 transition-all">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Budget (Geplant)</h3>
                    <p className="text-3xl font-bold text-slate-100">{(enrichedData.budget / 1000000000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mrd. €</p>
                    {enrichedData.isEstimated && <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Historisch angereichert</span>}
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Ist-Ausgaben</h3>
                    <p className="text-3xl font-bold text-emerald-400">{(enrichedData.actual / 1000000000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mrd. €</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Differenz</h3>
                    <p className={`text-3xl font-bold ${enrichedData.diff >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                        {enrichedData.diff >= 0 ? '+' : ''}{(enrichedData.diff / 1000000000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mrd. €
                    </p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Nutzung</h3>
                    <p className="text-3xl font-bold text-slate-100">
                        {enrichedData.budget > 0 ? ((enrichedData.actual / enrichedData.budget) * 100).toFixed(1) : 0}%
                    </p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm group hover:border-blue-500/50 transition-all">
                    <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Budget pro Kopf</h3>
                    <p className="text-3xl font-bold text-blue-400">
                        {Math.round(enrichedData.budget / getPopulation(district)).toLocaleString('de-DE')} €
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">Bei {getPopulation(district).toLocaleString('de-DE')} Einwohnern</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timeline Chart */}
                <div className="lg:col-span-2 bg-slate-800/50 p-8 rounded-3xl border border-white/5 shadow-inner">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-slate-100">Budgetentwicklung</h2>
                            <p className="text-slate-500 text-sm">Vergleich Planung vs. tatsächliche Ausgaben</p>
                        </div>
                    </div>
                    <div className="h-[300px] flex items-end gap-2 px-4">
                        {timeline.map((item, i) => {
                            const budgetHeight = (item.budget / maxBudget) * 100;
                            const actualHeight = (item.actual / maxBudget) * 100;

                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                    <div className="w-full flex justify-center gap-1 h-full items-end pb-8">
                                        <div
                                            style={{ height: `${budgetHeight}%` }}
                                            className="w-1/2 bg-slate-700 group-hover:bg-slate-600 transition-all rounded-t-sm shadow-lg"
                                        />
                                        <div
                                            style={{ height: `${actualHeight}%` }}
                                            className={`w-1/2 ${item.isEstimated ? 'bg-emerald-500/50' : 'bg-emerald-500'} group-hover:brightness-110 transition-all rounded-t-sm shadow-lg`}
                                        />
                                    </div>
                                    <div className="absolute bottom-0 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                        {item.year.toString().slice(-2)}
                                    </div>

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-700 p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-2xl min-w-[120px]">
                                        <p className="text-[10px] text-slate-500 font-bold mb-1">{item.year}</p>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-slate-400 text-[10px]">Soll:</span>
                                            <span className="text-white text-[10px] font-bold">{(item.budget / 1000).toFixed(1)} Mrd. €</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-slate-400 text-[10px]">Ist:</span>
                                            <span className="text-emerald-400 text-[10px] font-bold">{(item.actual / 1000).toFixed(1)} Mrd. €</span>
                                        </div>
                                        {item.isEstimated && (
                                            <p className="text-[8px] text-emerald-500 border-t border-slate-800 mt-2 pt-1 font-bold">HISTORISCHE DATEN</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar: Top Chapters */}
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-white/5 flex flex-col shadow-inner">
                    <h2 className="text-xl font-bold text-slate-100 mb-6 font-[family-name:var(--font-geist-sans)]">Top Bereiche</h2>
                    <BudgetChapters initialChapters={topChapters} district={district} />
                    <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Basierend auf Ansatz 2024/25</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
