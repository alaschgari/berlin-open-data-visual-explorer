'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';
import { Search, TrendingUp, Star } from 'lucide-react';

export interface NavItem {
    id: string;
    labelKey: string;
    icon: React.ReactNode;
    category: 'finance' | 'infrastructure' | 'society';
    priority: number;
}

interface HubViewProps {
    district: string;
    navItems: NavItem[];
    budgetVolume?: number;
    subsidiesCount?: number;
    taxRevenue?: number;
    theftCount?: number;
}

export default function HubView({
    district,
    navItems,
    budgetVolume,
    subsidiesCount,
    taxRevenue,
    theftCount
}: HubViewProps) {
    const { t, language } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');

    const categories = [
        { id: 'finance', title: t('cat_finance'), color: 'emerald' },
        { id: 'society', title: t('cat_society'), color: 'blue' },
        { id: 'infrastructure', title: t('cat_infrastructure'), color: 'amber' }
    ];

    // Formatters for micro-stats
    const formatCurrency = (val?: number) => val ? new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 1, notation: 'compact' }).format(val) : '';
    const formatNumber = (val?: number) => val ? new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-GB').format(val) : '';

    // Data Mapping for micro-metrics
    const metricsMap: Record<string, { label: string, value: string | React.ReactNode }> = {
        'budget': { label: 'Gesamtvolumen', value: formatCurrency(budgetVolume) },
        'subsidies': { label: 'Einträge', value: formatNumber(subsidiesCount) },
        'taxes': { label: 'Gesamteinnahmen', value: formatCurrency(taxRevenue) },
        'theft': { label: 'Erfasste Diebstähle', value: formatNumber(theftCount) },
    };

    // Filter Logic
    const filteredItems = useMemo(() => {
        if (!searchQuery) return navItems;
        const lowerQuery = searchQuery.toLowerCase();
        return navItems.filter(item =>
            t(item.labelKey).toLowerCase().includes(lowerQuery) ||
            t(`desc_${item.id}`).toLowerCase().includes(lowerQuery)
        );
    }, [navItems, searchQuery, t]);

    // Highlights Logic (Top 2 Modules)
    const highlightIds = ['budget', 'theft']; // Hardcoded for demo, could be dynamic
    const highlights = navItems.filter(i => highlightIds.includes(i.id));

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8 relative">

            {/* Background Blob */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

            <div className="text-center space-y-8 max-w-3xl mx-auto relative z-10">
                <div className="space-y-4">
                    <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-emerald-300 via-emerald-100 to-emerald-300 bg-clip-text text-transparent tracking-tight leading-tight">
                        {t('hub_title')}
                    </h2>
                    <p className="text-slate-400 text-lg md:text-xl font-medium tracking-wide">
                        {t('hub_subtitle')}
                    </p>
                </div>

                {/* Command Center Search */}
                <div className="relative max-w-2xl mx-auto group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder={t('hub_search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-slate-200 text-lg rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-slate-500 shadow-xl shadow-black/20"
                    />
                </div>
            </div>

            {/* Highlights Section */}
            {!searchQuery && (
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                        <h3 className="text-sm font-black text-slate-300 uppercase tracking-[0.2em]">
                            {t('hub_highlight_tag')}
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {highlights.map(item => (
                            <Link
                                key={item.id}
                                href={`/?tab=${item.id}&district=${district}`}
                                className="group relative bg-slate-800/40 backdrop-blur-md rounded-3xl p-6 border border-emerald-500/20 hover:bg-slate-800/60 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden shadow-2xl shadow-emerald-900/20 hover:-translate-y-1"
                            >
                                {/* Highlight noise pattern overlay */}
                                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

                                <div className="flex flex-col h-full gap-4 relative z-10">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-900 group-hover:scale-110 transition-all duration-300 shadow-lg">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                                                    {t(item.labelKey)}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Trending</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                        {t(`desc_${item.id}`)}
                                    </p>

                                    {/* Micro-metric */}
                                    {metricsMap[item.id] && metricsMap[item.id].value && (
                                        <div className="mt-auto pt-4 border-t border-slate-700/50 flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{metricsMap[item.id].label}</span>
                                            <span className="text-sm font-black text-white bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-700/50">{metricsMap[item.id].value}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Standard Grid Categories */}
            <div className="space-y-12">
                {categories.map(category => {
                    const categoryItems = filteredItems.filter(item => item.category === category.id);
                    if (categoryItems.length === 0) return null;

                    // Color Maps based on Category
                    const colorMap = {
                        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', hoverBg: 'group-hover:bg-emerald-500', shadow: 'shadow-emerald-500/5' },
                        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', hoverBg: 'group-hover:bg-blue-500', shadow: 'shadow-blue-500/5' },
                        amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', hoverBg: 'group-hover:bg-amber-500', shadow: 'shadow-amber-500/5' },
                    }[category.color] || { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', hoverBg: 'group-hover:bg-slate-500', shadow: 'shadow-white/5' };

                    return (
                        <section key={category.id} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">
                                    {category.title}
                                </h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-700/50 to-transparent"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {categoryItems.map(item => (
                                    <Link
                                        key={item.id}
                                        href={`/?tab=${item.id}&district=${district}`}
                                        className={`group relative bg-slate-800/20 backdrop-blur-sm rounded-3xl p-6 border border-slate-700/50 hover:bg-slate-800/40 hover:border-slate-600/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:-translate-y-1 ${colorMap.shadow}`}
                                    >
                                        <div className="flex flex-col h-full gap-4 relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 ${colorMap.bg} rounded-2xl flex items-center justify-center ${colorMap.text} ${colorMap.border} border ${colorMap.hoverBg} group-hover:text-slate-900 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                                                    {item.icon}
                                                </div>
                                                <h4 className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors">
                                                    {t(item.labelKey)}
                                                </h4>
                                            </div>
                                            <p className="text-sm text-slate-400 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">
                                                {t(`desc_${item.id}`)}
                                            </p>

                                            {/* Micro-metric */}
                                            {metricsMap[item.id] && metricsMap[item.id].value && (
                                                <div className="mt-auto pt-4 border-t border-slate-700/30 flex items-center justify-between opacity-70 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{metricsMap[item.id].label}</span>
                                                    <span className="text-xs font-bold text-slate-300">{metricsMap[item.id].value}</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    );
                })}

                {filteredItems.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-500 text-lg font-medium">{t('no_data')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
