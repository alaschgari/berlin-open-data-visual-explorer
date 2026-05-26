'use client';

import { useState, useEffect, useTransition } from 'react';
import { getDistrictCompareStats } from '@/lib/proxy';
import { ArrowLeft, ArrowRightLeft, Users, Landmark, LandmarkIcon, Building2, HelpingHand, Scale, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';
import Header from '@/components/Header';

const DISTRICTS = [
    "Mitte", "Friedrichshain-Kreuzberg", "Pankow", "Charlottenburg-Wilmersdorf",
    "Spandau", "Steglitz-Zehlendorf", "Tempelhof-Schöneberg", "Neukölln",
    "Treptow-Köpenick", "Marzahn-Hellersdorf", "Lichtenberg", "Reinickendorf"
];

interface CompareStats {
    population: number;
    budget: number;
    actual: number;
    diff: number;
    perCapita: number;
    subsidiesAmount: number;
    subsidiesCount: number;
    businessCount: number;
}

export default function ComparePage() {
    const { t, language } = useLanguage();
    const [district1, setDistrict1] = useState('Mitte');
    const [district2, setDistrict2] = useState('Friedrichshain-Kreuzberg');

    const [stats1, setStats1] = useState<CompareStats | null>(null);
    const [stats2, setStats2] = useState<CompareStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchComparison() {
            setLoading(true);
            try {
                const [s1, s2] = await Promise.all([
                    getDistrictCompareStats(district1),
                    getDistrictCompareStats(district2)
                ]);
                setStats1(s1);
                setStats2(s2);
            } catch (err) {
                console.error('Error fetching comparison stats:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchComparison();
    }, [district1, district2]);

    const formatCurrency = (val: number) => {
        if (val >= 1e9) {
            return `${(val / 1e9).toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: 2 })} Mrd. €`;
        }
        return `${(val / 1e6).toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: 1 })} Mio. €`;
    };

    // Helper to render comparison bar
    const renderBar = (val1: number, val2: number, inverseColor = false) => {
        const total = val1 + val2;
        if (total === 0) return null;
        const pct1 = (val1 / total) * 100;
        const pct2 = (val2 / total) * 100;

        const fill1 = inverseColor ? 'bg-emerald-500/80 shadow-emerald-500/20' : 'bg-emerald-500/80 shadow-emerald-500/20';
        const fill2 = inverseColor ? 'bg-blue-500/80 shadow-blue-500/20' : 'bg-blue-500/80 shadow-blue-500/20';

        return (
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-700/30">
                <div className={`h-full transition-all duration-500 ${fill1}`} style={{ width: `${pct1}%` }} />
                <div className={`h-full transition-all duration-500 ${fill2}`} style={{ width: `${pct2}%` }} />
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-[family-name:var(--font-geist-sans)]">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Unified Premium Header */}
                <Header />

                {/* Title */}
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-3xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                        {language === 'de' ? 'Bezirk-Vergleich' : 'District Comparison'}
                    </h2>
                    <p className="text-slate-400 text-xs font-medium">
                        {language === 'de' 
                            ? 'Vergleichen Sie Strukturdaten, Haushaltsbudgets und registrierte Wirtschaftsförderungen zwischen zwei Berliner Bezirken.'
                            : 'Compare structure data, budget plans, and registered state subsidies side-by-side between two Berlin districts.'
                        }
                    </p>
                </div>

                {/* Selection Bar */}
                <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center gap-6 relative">
                    <div className="flex-1 w-full space-y-2">
                        <label className="block text-xs font-black text-emerald-400 uppercase tracking-widest">{language === 'de' ? 'Bezirk A' : 'District A'}</label>
                        <div className="relative">
                            <select
                                value={district1}
                                onChange={(e) => setDistrict1(e.target.value)}
                                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-4 pr-10 py-3.5 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer transition-all"
                            >
                                {DISTRICTS.map(d => <option key={d} value={d} disabled={d === district2}>{d}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 bg-slate-900 border border-slate-700/50 p-3 rounded-full shadow-lg text-slate-400 hidden md:block">
                        <ArrowRightLeft className="w-5 h-5 text-emerald-500" />
                    </div>

                    <div className="flex-1 w-full space-y-2">
                        <label className="block text-xs font-black text-blue-400 uppercase tracking-widest">{language === 'de' ? 'Bezirk B' : 'District B'}</label>
                        <div className="relative">
                            <select
                                value={district2}
                                onChange={(e) => setDistrict2(e.target.value)}
                                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-4 pr-10 py-3.5 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer transition-all"
                            >
                                {DISTRICTS.map(d => <option key={d} value={d} disabled={d === district1}>{d}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading || !stats1 || !stats2 ? (
                    <div className="h-96 bg-slate-800/20 rounded-3xl border border-slate-700/50 flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">{t('loading')}</span>
                    </div>
                ) : (
                    /* Comparison Cards Container */
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Comparison Matrix Grid */}
                        <div className="grid grid-cols-1 gap-6">
                            
                            {/* Metric 1: Population */}
                            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl space-y-4">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Users className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-black uppercase tracking-wider">{t('pop_total') || 'Einwohner'}</span>
                                </div>
                                <div className="grid grid-cols-2 text-center md:text-left gap-4">
                                    <div>
                                        <p className="text-slate-500 text-xs font-bold">{district1}</p>
                                        <p className="text-2xl font-black text-white">{stats1.population.toLocaleString(language === 'de' ? 'de-DE' : 'en-US')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-500 text-xs font-bold">{district2}</p>
                                        <p className="text-2xl font-black text-white">{stats2.population.toLocaleString(language === 'de' ? 'de-DE' : 'en-US')}</p>
                                    </div>
                                </div>
                                {renderBar(stats1.population, stats2.population)}
                            </div>

                            {/* Metric 2: Total Budget */}
                            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl space-y-4">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Landmark className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-black uppercase tracking-wider">{language === 'de' ? 'Haushalt (Geplant)' : 'Total Budget (Planned)'}</span>
                                </div>
                                <div className="grid grid-cols-2 text-center md:text-left gap-4">
                                    <div>
                                        <p className="text-slate-500 text-xs font-bold">{district1}</p>
                                        <p className="text-2xl font-black text-white">{formatCurrency(stats1.budget)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-500 text-xs font-bold">{district2}</p>
                                        <p className="text-2xl font-black text-white">{formatCurrency(stats2.budget)}</p>
                                    </div>
                                </div>
                                {renderBar(stats1.budget, stats2.budget)}
                            </div>

                            {/* Metric 3: Per Capita */}
                            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl space-y-4">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Scale className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-black uppercase tracking-wider">{t('pop_density') || 'Budget pro Kopf'}</span>
                                </div>
                                <div className="grid grid-cols-2 text-center md:text-left gap-4">
                                    <div>
                                        <p className="text-slate-500 text-xs font-bold">{district1}</p>
                                        <p className="text-2xl font-black text-white">{stats1.perCapita.toLocaleString(language === 'de' ? 'de-DE' : 'en-US')} €</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-500 text-xs font-bold">{district2}</p>
                                        <p className="text-2xl font-black text-white">{stats2.perCapita.toLocaleString(language === 'de' ? 'de-DE' : 'en-US')} €</p>
                                    </div>
                                </div>
                                {renderBar(stats1.perCapita, stats2.perCapita)}
                            </div>

                            {/* Metric 4: Subsidy amount */}
                            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl space-y-4">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <HelpingHand className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-black uppercase tracking-wider">{language === 'de' ? 'Erhaltene Fördersumme' : 'Total Subsidies Received'}</span>
                                </div>
                                <div className="grid grid-cols-2 text-center md:text-left gap-4">
                                    <div>
                                        <p className="text-slate-500 text-xs font-bold">{district1}</p>
                                        <p className="text-2xl font-black text-white">{formatCurrency(stats1.subsidiesAmount)}</p>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tight">{stats1.subsidiesCount} {language === 'de' ? 'Bescheide' : 'Grants'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-500 text-xs font-bold">{district2}</p>
                                        <p className="text-2xl font-black text-white">{formatCurrency(stats2.subsidiesAmount)}</p>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tight">{stats2.subsidiesCount} {language === 'de' ? 'Bescheide' : 'Grants'}</p>
                                    </div>
                                </div>
                                {renderBar(stats1.subsidiesAmount, stats2.subsidiesAmount)}
                            </div>

                            {/* Metric 5: Business operations */}
                            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl space-y-4">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Building2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-black uppercase tracking-wider">{t('biz_operations') || 'Betriebe'}</span>
                                </div>
                                <div className="grid grid-cols-2 text-center md:text-left gap-4">
                                    <div>
                                        <p className="text-slate-500 text-xs font-bold">{district1}</p>
                                        <p className="text-2xl font-black text-white">{stats1.businessCount.toLocaleString(language === 'de' ? 'de-DE' : 'en-US')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-500 text-xs font-bold">{district2}</p>
                                        <p className="text-2xl font-black text-white">{stats2.businessCount.toLocaleString(language === 'de' ? 'de-DE' : 'en-US')}</p>
                                    </div>
                                </div>
                                {renderBar(stats1.businessCount, stats2.businessCount)}
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
