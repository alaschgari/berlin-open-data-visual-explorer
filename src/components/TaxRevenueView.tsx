'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Building2, Landmark, LayoutGrid, Info, X } from 'lucide-react';
import { getTaxDescription } from '@/lib/tax-descriptions';
import { useLanguage } from './LanguageContext';

interface TaxRevenueViewProps {
    metrics: {
        totalMonthly: number;
        period: string;
        byCategory: { name: string; value: number }[];
        topSources: { type: string; category: string; monthlyAmount: number }[];
        allData: { type: string; category: string; monthlyAmount: number }[];
    };
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b'];

type ViewMode = 'all' | 'land' | 'gemeinde';

export default function TaxRevenueView({ metrics }: TaxRevenueViewProps) {
    const { t, language } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('all');
    const [activeDescription, setActiveDescription] = useState<{ name: string; text: string } | null>(null);

    const locale = language === 'de' ? 'de-DE' : 'en-GB';

    // Fix hydration mismatch by only rendering on client
    useEffect(() => {
        setMounted(true);
    }, []);

    const filteredData = useMemo(() => {
        if (viewMode === 'all') return metrics.allData;
        if (viewMode === 'land') {
            return metrics.allData.filter(item =>
                item.type.includes('(Land)') ||
                item.category.toLowerCase().includes('landessteuern')
            );
        }
        return metrics.allData.filter(item =>
            item.type.includes('(Gemeinde)') ||
            item.category.toLowerCase().includes('gemeindesteuern')
        );
    }, [viewMode, metrics.allData]);

    const activeMetrics = useMemo(() => {
        const total = filteredData.reduce((sum, item) => sum + item.monthlyAmount, 0);

        const byCat = filteredData.reduce((acc: any, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.monthlyAmount;
            return acc;
        }, {});

        const top = [...filteredData]
            .sort((a, b) => b.monthlyAmount - a.monthlyAmount)
            .slice(0, 10);

        return {
            total,
            byCategory: Object.entries(byCat).map(([name, value]) => ({ name, value: value as number })),
            topSources: top
        };
    }, [filteredData]);

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toLocaleString(locale, { maximumFractionDigits: 1 })} ${t('mio_euro')}`;
        return `${val.toLocaleString(locale)} ${t('euro')}`;
    };

    const handleInfoClick = (type: string) => {
        const desc = getTaxDescription(type);
        if (desc) {
            setActiveDescription({ name: type, text: desc });
        }
    };

    if (!mounted) {
        return <div className="min-h-[600px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            {/* Info Overlay / Popover */}
            {activeDescription && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-md w-full relative">
                        <button
                            onClick={() => setActiveDescription(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                                <Info size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-100">{activeDescription.name}</h3>
                        </div>
                        <p className="text-slate-300 leading-relaxed italic">
                            {activeDescription.text}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Period Indicator */}
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 w-fit">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
                        {language === 'de' ? 'Datenstand' : 'Data Period'}: {metrics.period}
                    </span>
                </div>

                {/* Perspective Toggle */}
                <div className="flex p-1 bg-slate-900/50 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <button
                        onClick={() => setViewMode('all')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'all' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <LayoutGrid size={14} />
                        {t('all')}
                    </button>
                    <button
                        onClick={() => setViewMode('land')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'land' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Landmark size={14} />
                        {language === 'de' ? 'Land' : 'State'}
                    </button>
                    <button
                        onClick={() => setViewMode('gemeinde')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'gemeinde' ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Building2 size={14} />
                        {language === 'de' ? 'Gemeinde' : 'Local'}
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm group hover:border-emerald-500/50 transition-all">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">
                        {viewMode === 'all' ? (language === 'de' ? 'Gesamteinnahmen' : 'Total Revenue') : viewMode === 'land' ? (language === 'de' ? 'Einnahmen Land' : 'State Revenue') : (language === 'de' ? 'Einnahmen Gemeinde' : 'Local Revenue')}
                    </h3>
                    <p className="text-3xl font-bold text-slate-100">
                        {activeMetrics.total >= 1000000000
                            ? `${(activeMetrics.total / 1000000000).toLocaleString(locale, { maximumFractionDigits: 2 })} ${language === 'de' ? 'Mrd. €' : 'B €'}`
                            : formatCurrency(activeMetrics.total)}
                    </p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-1">{metrics.period}</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Größte Quelle</h3>
                    <p className="text-2xl font-bold text-emerald-400 truncate">{activeMetrics.topSources[0]?.type}</p>
                    <p className="text-sm text-slate-500">{formatCurrency(activeMetrics.topSources[0]?.monthlyAmount || 0)}</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">{language === 'de' ? 'Anzahl Posten' : 'Items Count'}</h3>
                    <p className="text-3xl font-bold text-blue-400">{filteredData.length}</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{language === 'de' ? 'In dieser Perspektive' : 'In this perspective'}</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm group hover:border-blue-500/50 transition-all">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider">City Tax</h3>
                        <button
                            onClick={() => handleInfoClick('Übernachtungsteuer')}
                            className="text-slate-500 hover:text-blue-400 transition-colors"
                        >
                            <Info size={12} />
                        </button>
                    </div>
                    <p className="text-3xl font-bold text-blue-400">
                        {formatCurrency(metrics.allData?.find(s => s.type.includes('Übernachtung'))?.monthlyAmount || 0)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">{metrics.period}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Sources Bar Chart */}
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-white/5 shadow-inner">
                    <h2 className="text-xl font-bold text-slate-100 mb-6">Top 10 Einnahmequellen</h2>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activeMetrics.topSources} layout="vertical" margin={{ left: 100, right: 30 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="type"
                                    type="category"
                                    width={100}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl">
                                                    <p className="text-xs font-bold text-white mb-1">{payload[0].payload.type}</p>
                                                    <p className="text-emerald-400 font-bold text-sm">{formatCurrency(payload[0].value as number)}</p>
                                                    <p className="text-[10px] text-slate-500 mt-1">{payload[0].payload.category}</p>
                                                    {getTaxDescription(payload[0].payload.type) && (
                                                        <p className="text-[10px] text-blue-400 mt-2 italic font-medium">{language === 'de' ? 'Klicke in der Liste für Details' : 'Click in the list for details'}</p>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="monthlyAmount" radius={[0, 4, 4, 0]} barSize={20}>
                                    {activeMetrics.topSources.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={viewMode === 'all' ? (index === 0 ? '#10b981' : '#334155') : (viewMode === 'land' ? '#3b82f6' : '#8b5cf6')}
                                            className="hover:opacity-80 transition-opacity"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Breakdown Pie Chart */}
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-white/5 shadow-inner flex flex-col">
                    <h2 className="text-xl font-bold text-slate-100 mb-6">{language === 'de' ? 'Verteilung' : 'Distribution'}</h2>
                    <div className="flex-1 flex items-center justify-center min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={activeMetrics.byCategory}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {activeMetrics.byCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl">
                                                    <p className="text-xs font-bold text-white mb-1">{payload[0].name}</p>
                                                    <p className="text-blue-400 font-bold text-sm">{formatCurrency(payload[0].value as number)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        {activeMetrics.byCategory.map((cat, i) => (
                            <div key={cat.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase truncate" title={cat.name}>{cat.name}</p>
                                    <p className="text-xs font-bold text-slate-200">{formatCurrency(cat.value)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-slate-800/50 rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-100">{language === 'de' ? 'Detailansicht' : 'Detailed View'}: {viewMode === 'all' ? (language === 'de' ? 'Alle Steuern' : 'All Taxes') : viewMode === 'land' ? (language === 'de' ? 'Staatsebene (Land)' : 'State Level') : (language === 'de' ? 'Stadtebene (Gemeinde)' : 'Local Level')}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-700/50">
                                <th className="px-6 py-4">{language === 'de' ? 'Steuerart' : 'Tax Type'}</th>
                                <th className="px-6 py-4">{language === 'de' ? 'Kategorie' : 'Category'}</th>
                                <th className="px-6 py-4 text-right">{language === 'de' ? 'Einnahmen' : 'Revenue'} ({metrics.period})</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {[...filteredData].sort((a, b) => b.monthlyAmount - a.monthlyAmount).map((source, i) => (
                                <tr key={i} className="hover:bg-slate-700/30 transition-colors group">
                                    <td className="px-6 py-4 text-sm font-bold text-slate-200 flex items-center gap-2">
                                        <span className="group-hover:text-emerald-400 transition-colors">{source.type}</span>
                                        {getTaxDescription(source.type) && (
                                            <button
                                                onClick={() => handleInfoClick(source.type)}
                                                className="p-1 hover:bg-white/10 rounded-full text-slate-500 hover:text-blue-400 transition-all opacity-0 group-hover:opacity-100"
                                                title="Details anzeigen"
                                            >
                                                <Info size={14} />
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${source.type.includes('(Land)') ? 'bg-blue-500/10 text-blue-400' :
                                            source.type.includes('(Gemeinde)') ? 'bg-purple-500/10 text-purple-400' :
                                                'bg-slate-900 text-slate-400'
                                            }`}>
                                            {source.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-emerald-400 text-right">{formatCurrency(source.monthlyAmount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
