'use client';

import React from 'react';
import BudgetChapters from '@/components/BudgetChapters';
import { getPopulation } from '@/lib/demographics';
import { useLanguage } from '@/components/LanguageContext';
import { ExternalLink, Database, Clock } from 'lucide-react';

interface HistoricBudgetViewProps {
    enrichedData: any;
    timeline: any[];
    topChapters: any[];
    district: string;
    lastSync?: Date | null;
}

export default function HistoricBudgetView({ enrichedData, timeline, topChapters, district, lastSync }: HistoricBudgetViewProps) {
    const { t, language } = useLanguage();
    const maxBudget = Math.max(...timeline.map(t => t.budget), 1);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Row: Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Budget Basis */}
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 flex flex-col shadow-inner backdrop-blur-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Budget (Geplant)</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white tracking-tight whitespace-nowrap">
                            {(enrichedData.budget / 1000000000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mrd. €
                        </span>
                    </div>
                </div>

                {/* Actual Spending */}
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 flex flex-col shadow-inner backdrop-blur-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ist-Ausgaben</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-400 tracking-tight whitespace-nowrap">
                            {(enrichedData.actual / 1000000000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mrd. €
                        </span>
                    </div>
                </div>

                {/* Difference */}
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 flex flex-col shadow-inner backdrop-blur-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Differenz</p>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-black tracking-tight whitespace-nowrap ${enrichedData.diff < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {(enrichedData.diff / 1000000000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'always' })} Mrd. €
                        </span>
                    </div>
                </div>

                {/* Per Capita */}
                <div className="bg-slate-900 border border-emerald-500/20 p-6 rounded-3xl flex flex-col shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-12 h-12 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
                    </div>
                    <p className="text-xs font-bold text-emerald-500/80 uppercase tracking-widest mb-2">BUDGET PRO KOPF</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-400 tracking-tight whitespace-nowrap">
                            {Math.round(enrichedData.budget / getPopulation(district)).toLocaleString('de-DE')} €
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-tighter">Bei {getPopulation(district).toLocaleString('de-DE')} Einwohnern</p>
                </div>
            </div>

            {/* Main Content Area: Vertically Stacked */}
            <div className="space-y-6">
                {/* 1. Budget Development Chart (Primary Visual) */}
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-white/5 shadow-inner backdrop-blur-md">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Budgetentwicklung</h2>
                            <p className="text-sm text-slate-500 font-medium">Vergleich Planung vs. tatsächliche Ausgaben</p>
                        </div>
                    </div>

                    <div className="h-64 flex items-end gap-2 relative">
                        {/* Grid Lines */}
                        <div className="absolute inset-x-0 top-0 border-t border-slate-700/30 h-0 w-full"></div>
                        <div className="absolute inset-x-0 top-1/2 border-t border-slate-700/30 h-0 w-full"></div>

                        {timeline.map((item) => (
                            <div key={item.year} className="flex-1 group relative flex flex-col items-center justify-end h-full">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 transform translate-y-2 group-hover:translate-y-0">
                                    <div className="bg-slate-900/95 border border-slate-700 backdrop-blur-xl p-3 rounded-2xl shadow-2xl min-w-[140px]">
                                        <p className="text-xs font-black text-white mb-2 pb-2 border-b border-slate-700">{item.year}</p>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between gap-4">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Soll</span>
                                                <span className="text-[10px] font-black text-white">{(item.budget / 1000000000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mrd. €</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Ist</span>
                                                <span className="text-[10px] font-black text-emerald-400">{(item.actual / 1000000000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mrd. €</span>
                                            </div>
                                        </div>
                                        {item.isEstimated && (
                                            <div className="mt-2 pt-2 border-t border-slate-700/50">
                                                <span className="text-[8px] font-black text-amber-500/80 uppercase tracking-widest">Historische Daten</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-3 h-3 bg-slate-900 border-r border-b border-slate-700 rotate-45 mx-auto -mt-1.5"></div>
                                </div>

                                {/* Bars */}
                                <div className="flex items-end gap-0.5 w-full h-full max-w-[40px]">
                                    <div
                                        className="w-1/2 bg-slate-700/50 rounded-t-sm transition-all duration-500 group-hover:bg-slate-600 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                                        style={{ height: `${(item.budget / maxBudget) * 100}%` }}
                                    ></div>
                                    <div
                                        className="w-1/2 bg-emerald-500/50 rounded-t-sm transition-all duration-500 group-hover:bg-emerald-400 group-hover:shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                                        style={{ height: `${(item.actual / maxBudget) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 mt-4 group-hover:text-white transition-colors">{item.year.toString().slice(-2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Chapters Details (Secondary Discovery) */}
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-white/5 flex flex-col shadow-inner backdrop-blur-md">
                    <h2 className="text-2xl font-black text-white tracking-tight mb-8">Top Bereiche</h2>
                    <BudgetChapters initialChapters={topChapters} district={district} />
                </div>

                {/* Data Source Disclosure (Footer) */}
                <footer className="mt-12 pt-8 border-t border-slate-800/60 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* Datengrundlage Links */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Database className="w-3.5 h-3.5 text-emerald-500/70" />
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    {t('data_foundation')}
                                </h3>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <a
                                    href="https://www.berlin.de/sen/finanzen/haushalt/haushaltsplaene/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-emerald-400 transition-colors group"
                                >
                                    <span className="border-b border-slate-700/50 group-hover:border-emerald-500/30 pb-0.5">
                                        {t('source_berlin_budget')}
                                    </span>
                                    <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                </a>
                                <a
                                    href="https://daten.berlin.de/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-emerald-400 transition-colors group"
                                >
                                    <span className="border-b border-slate-700/50 group-hover:border-emerald-500/30 pb-0.5">
                                        {t('source_open_data')}
                                    </span>
                                    <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                </a>
                            </div>
                        </div>

                        {/* Last Updated Timestamp */}
                        {lastSync && (
                            <div className="md:text-right space-y-2">
                                <div className="flex items-center md:justify-end gap-2 mb-2">
                                    <Clock className="w-3.5 h-3.5 text-emerald-500/70" />
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        {t('data_as_of')}
                                    </p>
                                </div>
                                <p className="text-[11px] font-black text-emerald-500/60 uppercase tracking-widest">
                                    {lastSync.toLocaleString(language === 'de' ? 'de-DE' : 'en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 text-center bg-slate-900/40 py-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            Basierend auf Haushaltsplänen 2010-2027
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
