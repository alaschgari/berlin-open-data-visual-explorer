'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SubsidyMetrics, searchSubsidies } from '@/lib/subsidies-proxy';
import { SubsidyRecord } from '@/lib/parser';
import { useLanguage } from './LanguageContext';
import {
    TrendingUp, TrendingDown, Minus,
    Briefcase, GraduationCap, Leaf,
    Heart, Home, Shield, Music,
    Globe, HelpCircle, Shuffle,
    CircleDollarSign, Filter, Info, Search
} from 'lucide-react';

const AreaIcons: Record<string, any> = {
    'Wirtschaft': Briefcase,
    'Bildung': GraduationCap,
    'Umwelt': Leaf,
    'Gesundheit': Heart,
    'Soziales': Home,
    'Sicherheit': Shield,
    'Kultur': Music,
    'Integration': Globe,
    'Sport': Globe, // Mapping more
    'Stadtentwicklung': Home,
    'Wohnen': Home,
    'Verkehr': Briefcase,
};

function GetAreaIcon(area: string) {
    for (const key in AreaIcons) {
        if (area.includes(key)) return AreaIcons[key];
    }
    return HelpCircle;
}

// Mini Sparkline component for Group Headers
const MiniSparkline = ({ data }: { data: { year: number; amount: number }[] }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data.map(d => d.amount));
    const min = Math.min(...data.map(d => d.amount));
    const range = max - min || 1;
    const width = 60;
    const height = 20;
    const padding = 2;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
        const y = height - ((d.amount - min) / range * (height - 2 * padding) + padding);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="flex flex-col items-end gap-1">
            <svg width={width} height={height} className="overflow-visible">
                <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                    className="drop-shadow-[0_0_2px_rgba(16,185,129,0.5)]"
                />
            </svg>
            <span className="text-[8px] text-slate-500 font-medium whitespace-nowrap">Trend</span>
        </div>
    );
};

interface SubsidiesViewProps {
    initialMetrics: SubsidyMetrics;
    initialList: SubsidyRecord[];
    district: string;
}

function SearchForm({ onSearch, onRandom, onSmartFilter, loading, initialValue, t }: {
    onSearch: (query: string) => void,
    onRandom: () => void,
    onSmartFilter: (type: 'large' | 'small' | 'providers') => void,
    loading: boolean,
    initialValue: string,
    t: any
}) {
    const [localQuery, setLocalQuery] = useState(initialValue);

    useEffect(() => {
        setLocalQuery(initialValue);
    }, [initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(localQuery);
    };

    return (
        <div className="space-y-4 mb-6">
            <form onSubmit={handleSubmit} className="relative">
                <div className="relative group">
                    <input
                        type="text"
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        placeholder={t('placeholder_search')}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-4 pr-24 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-600 transition-all font-medium"
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex gap-1">
                        <button
                            type="button"
                            onClick={onRandom}
                            title={t('random_discover')}
                            className="px-2.5 bg-slate-800 text-slate-400 rounded-lg flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors"
                        >
                            <Shuffle className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="submit"
                            className="px-4 bg-emerald-500 text-slate-900 rounded-lg flex items-center justify-center hover:bg-emerald-400 transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Smart Filters */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => onSmartFilter('large')}
                    className="px-3 py-1.5 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-400 transition-all flex items-center gap-2"
                >
                    <CircleDollarSign className="w-3 h-3" />
                    {t('large_projects')}
                </button>
                <button
                    onClick={() => onSmartFilter('small')}
                    className="px-3 py-1.5 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-bold text-blue-400 transition-all flex items-center gap-2"
                >
                    <Filter className="w-3 h-3" />
                    {t('small_funding')}
                </button>
            </div>
        </div>
    );
}

export default function SubsidiesView({ initialMetrics, initialList, district }: SubsidiesViewProps) {
    const { t, language } = useLanguage();
    const [metrics, setMetrics] = useState<SubsidyMetrics>(initialMetrics);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SubsidyRecord[]>(initialList);
    const [loading, setLoading] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
    const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
    const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
    const [recipientDetails, setRecipientDetails] = useState<SubsidyRecord[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [groupBy, setGroupBy] = useState<string[]>([]);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [topRecipientQuery, setTopRecipientQuery] = useState('');
    const [topAreaQuery, setTopAreaQuery] = useState('');
    const [topProviderQuery, setTopProviderQuery] = useState('');
    const [visibleRecipients, setVisibleRecipients] = useState(100);
    const [visibleResults, setVisibleResults] = useState(100);

    const activeMetrics = useMemo(() => {
        if (selectedRecipients.size === 0 && selectedAreas.size === 0 && selectedProviders.size === 0) return metrics;
        if (!metrics) return null;

        const recipientMap = new Map<string, { amount: number; count: number; historyMap: Map<number, number> }>();
        const areaMap = new Map<string, number>();
        const providerMap = new Map<string, number>();

        let totalAmount = 0;
        let totalCount = 0;
        const recipientSet = new Set<string>();
        const providerSet = new Set<string>();

        recipientDetails.forEach(r => {
            totalAmount += r.amount;
            totalCount += 1;
            recipientSet.add(r.recipient);
            providerSet.add(r.provider);

            // Recipient aggregation
            const rData = recipientMap.get(r.recipient) || { amount: 0, count: 0, historyMap: new Map<number, number>() };
            rData.amount += r.amount;
            rData.count += 1;
            const yearAmount = rData.historyMap.get(r.year) || 0;
            rData.historyMap.set(r.year, yearAmount + r.amount);
            recipientMap.set(r.recipient, rData);

            // Area aggregation
            areaMap.set(r.area, (areaMap.get(r.area) || 0) + r.amount);

            // Provider aggregation
            providerMap.set(r.provider, (providerMap.get(r.provider) || 0) + r.amount);
        });

        return {
            ...metrics,
            totalAmount,
            totalCount,
            recipientCount: recipientSet.size,
            providerCount: providerSet.size,
            topRecipients: Array.from(recipientMap.entries())
                .map(([name, stats]) => ({
                    name,
                    amount: stats.amount,
                    count: stats.count,
                    history: Array.from(stats.historyMap.entries())
                        .map(([year, amount]) => ({ year, amount }))
                        .sort((a, b) => a.year - b.year)
                }))
                .sort((a, b) => b.amount - a.amount),
            byArea: Array.from(areaMap.entries())
                .map(([area, amount]) => ({ area, amount }))
                .sort((a, b) => b.amount - a.amount),
            byProvider: Array.from(providerMap.entries())
                .map(([provider, amount]) => ({ provider, amount }))
                .sort((a, b) => b.amount - a.amount),
        };
    }, [metrics, recipientDetails, selectedRecipients, selectedAreas, selectedProviders]);

    const fetchFilteredData = async (
        newRecipients: Set<string>,
        newAreas: Set<string>,
        newProviders: Set<string>
    ) => {
        if (newRecipients.size === 0 && newAreas.size === 0 && newProviders.size === 0) {
            setSearchResults(initialList);
            setRecipientDetails([]);
            return;
        }

        setLoading(true);
        try {
            const data = await searchSubsidies(
                '',
                district,
                Array.from(newAreas),
                Array.from(newProviders),
                Array.from(newRecipients),
                -1
            );
            setRecipientDetails(data);
            setSearchResults(data);
        } catch (error) {
            console.error('Failed to fetch filtered data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRecipientClick = (name: string) => {
        const next = new Set(selectedRecipients);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        setSelectedRecipients(next);
        fetchFilteredData(next, selectedAreas, selectedProviders);
    };

    const handleAreaClick = (area: string) => {
        const next = new Set(selectedAreas);
        if (next.has(area)) next.delete(area);
        else next.add(area);
        setSelectedAreas(next);
        fetchFilteredData(selectedRecipients, next, selectedProviders);
    };

    const handleProviderClick = (provider: string) => {
        const next = new Set(selectedProviders);
        const cleanName = provider.replace(/^\"|\"$/g, '');
        if (next.has(provider)) next.delete(provider);
        else next.add(provider);
        setSelectedProviders(next);
        fetchFilteredData(selectedRecipients, selectedAreas, next);
    };

    const locale = language === 'de' ? 'de-DE' : 'en-GB';

    const getInsight = () => {
        if (selectedRecipients.size === 0 || recipientDetails.length === 0) return null;

        // Get details for the first selected recipient as "primary insight"
        const recipientName = Array.from(selectedRecipients)[0];
        const details = recipientDetails.filter(d => d.recipient === recipientName);

        const areas = new Set(details.map(d => d.area));
        const areaCounts: Record<string, number> = {};
        details.forEach(d => {
            areaCounts[d.area] = (areaCounts[d.area] || 0) + d.amount;
        });

        const sortedAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]);
        if (sortedAreas.length === 0) return null;

        return {
            count: areas.size,
            topArea: sortedAreas[0][0]
        };
    };

    const insight = getInsight();

    // Sync state when props change (district change)
    useEffect(() => {
        setMetrics(initialMetrics);
        setSearchResults(initialList);
        setSelectedRecipients(new Set());
        setSelectedAreas(new Set());
        setSelectedProviders(new Set());
        setRecipientDetails([]);
        setSearchQuery('');
    }, [initialMetrics, initialList]);

    const processedDetails = React.useMemo(() => {
        let sorted = [...recipientDetails];
        if (sortConfig) {
            sorted.sort((a, b) => {
                let valA = a[sortConfig.key as keyof SubsidyRecord];
                let valB = b[sortConfig.key as keyof SubsidyRecord];

                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        if (groupBy.length === 0) return sorted;

        // Generic recursive grouping function
        const groupRecursive = (items: SubsidyRecord[], groupKeys: string[], parentKey: string = ''): any[] => {
            if (groupKeys.length === 0) return items;

            const currentKey = groupKeys[0];
            const remainingKeys = groupKeys.slice(1);

            // Group items by current key
            const groups: Record<string, SubsidyRecord[]> = {};
            items.forEach(item => {
                let keyVal = '';
                if (currentKey === 'year') keyVal = String(item.year);
                else if (currentKey === 'area') keyVal = item.area;
                else if (currentKey === 'provider') keyVal = item.provider;
                else if (currentKey === 'recipient') keyVal = item.recipient;
                // Add more keys here if needed

                if (!groups[keyVal]) groups[keyVal] = [];
                groups[keyVal].push(item);
            });

            // Sort group keys
            const sortedKeys = Object.keys(groups).sort((a, b) => {
                if (currentKey === 'year') return Number(b) - Number(a); // Newest years first
                return a.localeCompare(b); // Alphabetical for others
            });

            const result: any[] = [];

            sortedKeys.forEach(keyVal => {
                const groupItems = groups[keyVal];
                const groupTotal = groupItems.reduce((sum, item) => sum + item.amount, 0);
                // Create a unique key for expanding/collapsing
                const compositeKey = parentKey ? `${parentKey}::${keyVal}` : keyVal;

                const history = Array.from(
                    groupItems.reduce((acc, item) => {
                        acc.set(item.year, (acc.get(item.year) || 0) + item.amount);
                        return acc;
                    }, new Map<number, number>())
                        .entries()
                ).map(([year, amount]) => ({ year, amount }))
                    .sort((a, b) => a.year - b.year);

                result.push({
                    isGroupHeader: true,
                    groupKey: compositeKey,
                    displayKey: keyVal,
                    groupType: currentKey,
                    count: groupItems.length,
                    total: groupTotal,
                    history: history,
                    level: groupBy.length - groupKeys.length // 0 for top level
                });

                if (!collapsedGroups.has(compositeKey)) {
                    // Recursively group remaining items
                    result.push(...groupRecursive(groupItems, remainingKeys, compositeKey));
                }
            });

            return result;
        };

        return groupRecursive(sorted, groupBy);

    }, [recipientDetails, sortConfig, groupBy, collapsedGroups]);

    const handleExport = () => {
        if (searchResults.length === 0) return;
        const headers = [t('year_label'), t('recipients'), t('purpose_label'), t('area_label'), t('provider_label'), t('amount_label')];
        const csvRows = [
            headers.join(','),
            ...searchResults.map(r => [
                r.year,
                `"${r.recipient}"`,
                `"${r.purpose?.replace(/"/g, '""')}"`,
                `"${r.area}"`,
                `"${r.provider}"`,
                r.amount
            ].join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `subsidies_berlin_${district}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        setVisibleResults(100);
        setLoading(true);
        try {
            const data = await searchSubsidies(query, district);
            setSearchResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRandom = () => {
        if (!initialList || initialList.length === 0) return;
        const randomItem = initialList[Math.floor(Math.random() * initialList.length)];
        handleRecipientClick(randomItem.recipient);
    };

    const handleSmartFilter = async (type: 'large' | 'small' | 'providers') => {
        setLoading(true);
        try {
            let filtered = [...initialList];
            if (type === 'large') {
                filtered = filtered.filter(item => item.amount > 1000000);
            } else if (type === 'small') {
                filtered = filtered.filter(item => item.amount < 50000);
            }
            setSearchResults(filtered);
            setSearchQuery('');
            setSelectedRecipients(new Set());
            setSelectedAreas(new Set());
            setSelectedProviders(new Set());
        } catch (error) {
            console.error('Smart filter failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const activeFilters = [];
    if (selectedRecipients.size > 0) activeFilters.push(Array.from(selectedRecipients).map(r => r.replace(/^"|"$/g, '')).join(', '));
    if (selectedAreas.size > 0) activeFilters.push(Array.from(selectedAreas).join(', '));
    if (selectedProviders.size > 0) activeFilters.push(Array.from(selectedProviders).map(p => p.replace(/^"|"$/g, '')).join(', '));

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Compact Summary Bar (Stats & Meta combined) */}
            <div className="bg-slate-800/40 px-4 sm:px-6 py-4 rounded-3xl border border-slate-700/50 flex flex-wrap items-center justify-between gap-4 sm:gap-6 backdrop-blur-md shadow-xl">
                <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-8 w-full sm:w-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{t('total_volume')}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tighter">
                                {(Number(activeMetrics?.totalAmount || metrics?.totalAmount || 0) / 1000000).toLocaleString(locale, { maximumFractionDigits: 1 })}
                            </span>
                            <span className="text-xs font-bold text-emerald-500/60 uppercase">{t('mio_euro')}</span>
                        </div>
                    </div>
                    <div className="w-px h-10 bg-slate-700/50 hidden sm:block"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{t('count_subsidies')}</span>
                        <span className="text-xl sm:text-2xl font-black text-blue-400 tracking-tighter">
                            {Number(activeMetrics?.totalCount || metrics?.totalCount || 0).toLocaleString(locale)}
                        </span>
                    </div>
                    <div className="w-px h-10 bg-slate-700/50 hidden lg:block"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{t('count_recipients')}</span>
                        <span className="text-xl sm:text-2xl font-black text-purple-400 tracking-tighter">
                            {Number(activeMetrics?.recipientCount || metrics?.recipientCount || 0).toLocaleString(locale)}
                        </span>
                    </div>
                    <div className="w-px h-10 bg-slate-700/50 hidden lg:block"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{t('count_providers')}</span>
                        <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tighter">
                            {Number(activeMetrics?.providerCount || metrics?.providerCount || 0).toLocaleString(locale)}
                        </span>
                    </div>
                    <div className="w-px h-10 bg-slate-700/50 hidden lg:block"></div>
                    <div className="flex flex-col col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{t('time_period')}</span>
                        <span className="text-xl sm:text-2xl font-black text-slate-300 tracking-tighter">
                            {(activeMetrics || metrics)?.minYear} — {(activeMetrics || metrics)?.maxYear}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <a
                        href="https://www.berlin.de/sen/finanzen/service/zuwendungsdatenbank/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 rounded-lg border border-blue-500/10 hover:bg-blue-500/10 transition-all group"
                    >
                        <span className="text-[9px] font-bold text-blue-400/70 uppercase tracking-widest leading-none">
                            Zuwendungsdatenbank Berlin
                        </span>
                        <svg className="w-3 h-3 text-blue-500/30 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-widest leading-none">
                            {t('stand')}: 08.02.2026
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Top Recipients */}
                <div className="bg-slate-800/50 p-4 sm:p-6 rounded-3xl border border-slate-700 shadow-inner flex flex-col h-[400px] lg:h-[600px]">
                    <div className="flex items-center justify-between mb-5 gap-4">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{t('top_recipients')}</h2>
                        <div className="relative flex-1 max-w-[180px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                            <input
                                type="text"
                                value={topRecipientQuery}
                                onChange={(e) => setTopRecipientQuery(e.target.value)}
                                placeholder={t('placeholder_search')}
                                className="w-full bg-slate-900/40 border border-slate-700/50 rounded-xl py-1.5 pl-8 pr-3 text-[10px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                        {activeMetrics?.topRecipients
                            ?.filter(r => r.name.toLowerCase().includes(topRecipientQuery.toLowerCase()))
                            ?.slice(0, visibleRecipients).map((r, i) => {
                                const isSelected = selectedRecipients.has(r.name);

                                // Simple trend logic
                                let TrendIcon = Minus;
                                let trendColor = "text-slate-600";

                                if (r.history && r.history.length >= 2) {
                                    const last = r.history[r.history.length - 1].amount;
                                    const prev = r.history[r.history.length - 2].amount;
                                    if (last > prev * 1.05) { TrendIcon = TrendingUp; trendColor = "text-emerald-500"; }
                                    else if (last < prev * 0.95) { TrendIcon = TrendingDown; trendColor = "text-rose-500"; }
                                }

                                return (
                                    <div
                                        key={i}
                                        onClick={() => handleRecipientClick(r.name)}
                                        className={`flex items-center justify-between group cursor-pointer p-3 rounded-xl transition-all ${isSelected ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-slate-700/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                                            <div className="flex flex-col items-center min-w-[1.5rem]">
                                                <span className="text-slate-600 font-bold text-[10px]">#{i + 1}</span>
                                                <TrendIcon className={`w-3 h-3 ${trendColor}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate transition-colors ${isSelected ? 'text-emerald-400' : 'text-slate-200 group-hover:text-emerald-400'
                                                    }`}>
                                                    {r.name.replace(/^"|"$/g, '')}
                                                </p>
                                                <p className="text-slate-500 text-[10px]">{r.count} {t('resolutions')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-100 font-bold text-sm">
                                                {(Number(r.amount) / 1000000).toLocaleString(locale, { maximumFractionDigits: 1 })} {t('mio_euro')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        {metrics?.topRecipients && metrics.topRecipients.length > visibleRecipients && (
                            <button
                                onClick={() => setVisibleRecipients(prev => prev + 200)}
                                className="w-full py-3 mt-2 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors bg-slate-800/30 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500/50"
                            >
                                {t('nav_more')} (+200)
                            </button>
                        )}
                    </div>
                </div>

                {/* Column 2: Area Breakdown */}
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 shadow-inner flex flex-col h-[600px]">
                    <div className="flex items-center justify-between mb-5 gap-4">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{t('top_areas')}</h2>
                        <div className="relative flex-1 max-w-[180px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                            <input
                                type="text"
                                value={topAreaQuery}
                                onChange={(e) => setTopAreaQuery(e.target.value)}
                                placeholder={t('placeholder_search')}
                                className="w-full bg-slate-900/40 border border-slate-700/50 rounded-xl py-1.5 pl-8 pr-3 text-[10px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                        {activeMetrics?.byArea
                            ?.filter(a => a.area.toLowerCase().includes(topAreaQuery.toLowerCase()))
                            ?.slice(0, 50).map((a, i) => {
                                const AreaIcon = GetAreaIcon(a.area);
                                return (
                                    <div
                                        key={i}
                                        onClick={() => handleAreaClick(a.area)}
                                        className={`group cursor-pointer px-3 py-2.5 rounded-xl transition-all ${selectedAreas.has(a.area) ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-slate-700/30 border border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-1.5 bg-slate-900/50 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                                                <AreaIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400" />
                                            </div>
                                            <div className="flex justify-between items-center text-xs flex-1 min-w-0">
                                                <span className="text-slate-300 font-medium truncate flex-1 mr-4 group-hover:text-emerald-400 transition-colors">{a.area}</span>
                                                <span className="text-slate-100 font-bold whitespace-nowrap">
                                                    {(Number(a.amount) / 1000000).toLocaleString(locale, { maximumFractionDigits: 1 })} {t('mio_euro')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-900/50 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
                                            <div
                                                className="bg-emerald-500 h-full rounded-full transition-all duration-1000 group-hover:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                                style={{ width: `${(Number(a.amount) / Number(metrics.totalAmount)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* Column 3: Top Providers (Replaces Search) */}
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 shadow-inner flex flex-col h-[600px]">
                    <div className="flex items-center justify-between mb-5 gap-4">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{t('top_providers')}</h2>
                        <div className="relative flex-1 max-w-[180px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                            <input
                                type="text"
                                value={topProviderQuery}
                                onChange={(e) => setTopProviderQuery(e.target.value)}
                                placeholder={t('placeholder_search')}
                                className="w-full bg-slate-900/40 border border-slate-700/50 rounded-xl py-1.5 pl-8 pr-3 text-[10px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                        {activeMetrics?.byProvider
                            ?.filter(p => p.provider.toLowerCase().includes(topProviderQuery.toLowerCase()))
                            ?.slice(0, 100).map((p, i) => {
                                const isSelected = selectedProviders.has(p.provider);
                                return (
                                    <div
                                        key={i}
                                        onClick={() => handleProviderClick(p.provider)}
                                        className={`flex items-center justify-between group cursor-pointer p-3 rounded-xl transition-all ${isSelected ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-slate-700/30 border border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                                            <div className="p-1.5 bg-slate-900/50 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                                                <Briefcase className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-medium truncate transition-colors ${isSelected ? 'text-emerald-400' : 'text-slate-200 group-hover:text-emerald-400'
                                                    }`}>
                                                    {p.provider.replace(/^"|"$/g, '')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-100 font-bold text-[11px]">
                                                {(Number(p.amount) / 1000000).toLocaleString(locale, { maximumFractionDigits: 1 })} {t('mio_euro')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>

            {/* Details Table (Recipient, Area, or Provider) */}
            {
                (selectedRecipients.size > 0 || selectedAreas.size > 0 || selectedProviders.size > 0) && recipientDetails.length > 0 && (
                    <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 shadow-inner animate-in fade-in duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-100 font-outfit uppercase tracking-tight">
                                {activeFilters.length > 0 ? `${t('details_for')}: ${activeFilters.join(' + ')}` : t('search_results')}
                            </h2>
                            <button
                                onClick={() => {
                                    setSelectedRecipients(new Set());
                                    setSelectedAreas(new Set());
                                    setSelectedProviders(new Set());
                                    setRecipientDetails([]);
                                    setSearchResults(initialList);
                                }}
                                className="text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            {/* Grouping Controls */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">{t('group_by')}:</span>
                                {[
                                    { key: 'year', label: t('by_year') },
                                    { key: 'recipient', label: t('by_recipient') },
                                    { key: 'provider', label: t('by_provider') },
                                    { key: 'area', label: t('by_area') }
                                ].map((option) => {
                                    const isActive = groupBy.includes(option.key);
                                    const index = groupBy.indexOf(option.key);
                                    return (
                                        <button
                                            key={option.key}
                                            onClick={() => {
                                                setGroupBy(prev => {
                                                    if (prev.includes(option.key)) {
                                                        return prev.filter(k => k !== option.key);
                                                    } else {
                                                        return [...prev, option.key];
                                                    }
                                                });
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-2 ${isActive
                                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                                                }`}
                                        >
                                            {isActive && (
                                                <span className="bg-blue-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                                                    {index + 1}
                                                </span>
                                            )}
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>


                        <div className="overflow-x-auto">
                            <table className="w-full text-sm table-fixed">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        {!groupBy.includes('year') && (
                                            <th
                                                onClick={() => setSortConfig(current => current?.key === 'year' && current.direction === 'asc' ? { key: 'year', direction: 'desc' } : { key: 'year', direction: 'asc' })}
                                                className="text-left py-3 px-4 text-slate-400 font-semibold w-24 cursor-pointer hover:text-emerald-400 transition-colors group"
                                            >
                                                <div className="flex items-center gap-1">
                                                    {t('year_label')}
                                                    {sortConfig?.key === 'year' && <span className="text-emerald-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                                                </div>
                                            </th>
                                        )}
                                        {!groupBy.includes('recipient') && (
                                            <th
                                                onClick={() => setSortConfig(current => current?.key === 'recipient' && current.direction === 'asc' ? { key: 'recipient', direction: 'desc' } : { key: 'recipient', direction: 'asc' })}
                                                className="text-left py-3 px-4 text-slate-400 font-semibold w-40 cursor-pointer hover:text-emerald-400 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    {t('recipient_label')}
                                                    {sortConfig?.key === 'recipient' && <span className="text-emerald-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                                                </div>
                                            </th>
                                        )}
                                        <th
                                            onClick={() => setSortConfig(current => current?.key === 'purpose' && current.direction === 'asc' ? { key: 'purpose', direction: 'desc' } : { key: 'purpose', direction: 'asc' })}
                                            className="text-left py-3 px-4 text-slate-400 font-semibold cursor-pointer hover:text-emerald-400 transition-colors"
                                        >
                                            <div className="flex items-center gap-1">
                                                {t('purpose_label')}
                                                {sortConfig?.key === 'purpose' && <span className="text-emerald-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                                            </div>
                                        </th>
                                        {!groupBy.includes('provider') && (
                                            <th
                                                onClick={() => setSortConfig(current => current?.key === 'provider' && current.direction === 'asc' ? { key: 'provider', direction: 'desc' } : { key: 'provider', direction: 'asc' })}
                                                className="text-left py-3 px-4 text-slate-400 font-semibold w-40 cursor-pointer hover:text-emerald-400 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    {t('provider_label')}
                                                    {sortConfig?.key === 'provider' && <span className="text-emerald-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                                                </div>
                                            </th>
                                        )}
                                        {!groupBy.includes('area') && (
                                            <th
                                                onClick={() => setSortConfig(current => current?.key === 'area' && current.direction === 'asc' ? { key: 'area', direction: 'desc' } : { key: 'area', direction: 'asc' })}
                                                className="text-left py-3 px-4 text-slate-400 font-semibold w-32 cursor-pointer hover:text-emerald-400 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    {t('area_label')}
                                                    {sortConfig?.key === 'area' && <span className="text-emerald-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                                                </div>
                                            </th>
                                        )}
                                        <th
                                            onClick={() => setSortConfig(current => current?.key === 'amount' && current.direction === 'desc' ? { key: 'amount', direction: 'asc' } : { key: 'amount', direction: 'desc' })}
                                            className="text-right py-3 px-4 text-slate-400 font-semibold w-36 whitespace-nowrap cursor-pointer hover:text-emerald-400 transition-colors"
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                {t('amount_label')}
                                                {sortConfig?.key === 'amount' && <span className="text-emerald-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedDetails.map((detail: any, idx) => {
                                        if (detail.isGroupHeader) {
                                            const isCollapsed = collapsedGroups.has(detail.groupKey);
                                            const isNested = detail.level > 0;
                                            const indentPixels = (detail.level * 24) + 16; // Base 16px + 24px per level

                                            let headerLabel = '';
                                            if (detail.groupType === 'year') {
                                                headerLabel = `${t('year_label')} ${detail.groupKey.split('::').pop()}`;
                                            } else if (detail.groupType === 'area') {
                                                headerLabel = detail.displayKey || detail.groupKey.split('::').pop();
                                            } else {
                                                headerLabel = (detail.displayKey || detail.groupKey.split('::').pop() || '').replace(/^"|"$/g, '');
                                            }

                                            return (
                                                <tr
                                                    key={`group-${detail.groupKey}`}
                                                    onClick={() => {
                                                        const newCollapsed = new Set(collapsedGroups);
                                                        if (isCollapsed) {
                                                            newCollapsed.delete(detail.groupKey);
                                                        } else {
                                                            newCollapsed.add(detail.groupKey);
                                                        }
                                                        setCollapsedGroups(newCollapsed);
                                                    }}
                                                    className={`border-t-2 cursor-pointer hover:bg-slate-700/50 transition-colors ${isNested
                                                        ? 'bg-slate-700/20 border-emerald-500/20'
                                                        : 'bg-slate-700/30 border-emerald-500/30'
                                                        }`}
                                                >
                                                    <td
                                                        colSpan={6}
                                                        className="py-3 pr-4 transition-all"
                                                        style={{ paddingLeft: `${indentPixels}px` }}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <svg
                                                                    className={`w-5 h-5 text-emerald-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                                <span className={`font-bold ${isNested ? 'text-emerald-300 text-sm' : 'text-emerald-400 text-base'}`}>
                                                                    {headerLabel}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-6">
                                                                <MiniSparkline data={detail.history} />
                                                                <span className="text-slate-400 text-sm whitespace-nowrap">
                                                                    {detail.count} {t('resolutions')} · {detail.total.toLocaleString(locale)} {t('euro')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        // Check collapse...

                                        return (
                                            <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-700/20 transition-colors">
                                                {!groupBy.includes('year') && <td className="py-3 px-4 text-slate-300 w-16 align-top">{detail.year}</td>}
                                                <td
                                                    className="py-3 px-4 text-emerald-400/90 font-medium align-top cursor-pointer hover:text-emerald-300 transition-colors group"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRecipientClick(detail.recipient);
                                                    }}
                                                >
                                                    <div className="line-clamp-2 leading-snug underline decoration-emerald-500/20 underline-offset-4 group-hover:decoration-emerald-400/50" title={detail.recipient}>
                                                        {detail.recipient}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-slate-400 align-top" title={detail.purpose?.replace(/^"|"$/g, '').replace(/\\"/g, '"') || ''}>
                                                    <div className="line-clamp-2 leading-snug">
                                                        {detail.purpose?.replace(/^"|"$/g, '').replace(/\\"/g, '"') || ''}
                                                    </div>
                                                </td>
                                                {!groupBy.includes('provider') && (
                                                    <td className="py-3 px-4 text-slate-500 text-xs w-40 align-top" title={detail.provider.replace(/^"|"$/g, '')}>
                                                        <div className="line-clamp-2 leading-tight">
                                                            {detail.provider.replace(/^"|"$/g, '')}
                                                        </div>
                                                    </td>
                                                )}
                                                {!groupBy.includes('area') && (
                                                    <td className="py-3 px-4 text-slate-400 text-xs italic truncate w-24 align-top">
                                                        {detail.area}
                                                    </td>
                                                )}
                                                <td className="py-3 px-4 text-right text-emerald-400 font-bold whitespace-nowrap w-28 align-top">
                                                    {Number(detail.amount).toLocaleString(locale)} {t('euro')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 text-sm text-slate-500">
                            {t('total_label')}: {recipientDetails.length} {t('resolutions')}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
