'use client';

import { useState, useEffect, useTransition } from 'react';
import { searchSubsidies } from '@/lib/subsidies-proxy';
import { SubsidyRecord } from '@/lib/parser';
import { Search, FileText, CheckCircle, CircleAlert, Sparkles, Database } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useLanguage } from '@/components/LanguageContext';
import Header from '@/components/Header';

const DISTRICTS = [
    'Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf',
    'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln',
    'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'
];

export default function BeneficiariesPage() {
    const { t, language } = useLanguage();
    const [search, setSearch] = useState('');
    const [districtFilter, setDistrictFilter] = useState('All');
    const [records, setRecords] = useState<SubsidyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const debouncedSearch = useDebounce(search, 400);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Fetch up to 100 matching rows
                const result = await searchSubsidies(debouncedSearch, districtFilter, undefined, undefined, undefined, 100);
                setRecords(result);
            } catch (err) {
                console.error('Error fetching subsidies:', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [debouncedSearch, districtFilter]);

    // Calculate quick stats on current matching slice
    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
    const averageAmount = records.length > 0 ? totalAmount / records.length : 0;

    return (
        <main className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-[family-name:var(--font-geist-sans)]">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Unified Premium Header */}
                <Header />

                {/* Main section title */}
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                            {t('tab_subsidies')}
                        </h2>
                        <div className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">Live DB</span>
                        </div>
                    </div>
                    <p className="text-slate-400 text-xs font-medium">
                        {language === 'de' 
                            ? 'Durchsuchen Sie alle registrierten Zuwendungen und Förderungen des Landes Berlin direkt aus der Datenbank.'
                            : 'Browse all registered subsidies and grants from the state of Berlin directly from the database.'
                        }
                    </p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-600">
                    <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            {language === 'de' ? 'Matching Einträge' : 'Matching Entries'}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white leading-none">
                                {loading ? '...' : records.length}
                            </span>
                            {records.length === 100 && (
                                <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                    Limit (100)
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            {language === 'de' ? 'Gesamtfördersumme (Sichtbar)' : 'Total Sum (Visible)'}
                        </span>
                        <span className="text-3xl font-black text-emerald-400 leading-none">
                            {loading ? '...' : `${totalAmount.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: 0 })} €`}
                        </span>
                    </div>

                    <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            {language === 'de' ? 'Durchschnittliche Zuwendung' : 'Average Grant'}
                        </span>
                        <span className="text-3xl font-black text-blue-400 leading-none">
                            {loading ? '...' : `${averageAmount.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: 0 })} €`}
                        </span>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('placeholder_search') || 'Empfänger oder Verwendungszweck suchen...'}
                            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-slate-100 placeholder-slate-500 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative w-full md:w-72">
                        <select
                            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-4 pr-10 py-3.5 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer transition-all"
                            value={districtFilter}
                            onChange={(e) => setDistrictFilter(e.target.value)}
                        >
                            <option value="All">{t('all_districts')}</option>
                            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Subsidies Table */}
                <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[700px]">
                            <thead className="bg-slate-900/50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4">{t('recipient_label')}</th>
                                    <th className="px-6 py-4">{t('purpose_label')}</th>
                                    <th className="px-6 py-4">{t('provider_label')}</th>
                                    <th className="px-6 py-4 text-right">{t('amount_label')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                                                    {t('loading')}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : records.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-700/20 transition-all cursor-default">
                                        <td className="px-6 py-4 font-bold text-white max-w-[200px] truncate" title={b.recipient}>
                                            {b.recipient}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 max-w-[300px] truncate" title={b.purpose}>
                                            <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wide mb-0.5">{b.area}</span>
                                            {b.purpose || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs font-bold" title={b.provider}>
                                            {b.provider} ({b.year})
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-emerald-400 font-black">
                                            {b.amount.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                ))}
                                {!loading && records.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center text-slate-500 font-bold">
                                            <CircleAlert className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                                            {t('no_results') || 'Keine Einträge gefunden.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer source badge */}
                <div className="flex justify-center items-center gap-2 text-xs text-slate-500">
                    <Database className="w-3.5 h-3.5" />
                    <span>
                        {language === 'de' 
                            ? 'Quelle: Zuwendungsdatenbank der Senatsverwaltung für Finanzen Berlin' 
                            : 'Source: Subsidy Database of the Senate Department for Finance Berlin'
                        }
                    </span>
                </div>
            </div>
        </main>
    );
}
