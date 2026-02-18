'use client';

import React, { useState, useEffect } from 'react';
import { SubsidyMetrics, searchSubsidies } from '@/lib/subsidies-proxy';
import { SubsidyRecord } from '@/lib/parser';
import dynamic from 'next/dynamic';
import { districtCoordinates } from '@/lib/district-coords';
import 'leaflet/dist/leaflet.css';

// Dynamic imports for Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then(mod => mod.Tooltip), { ssr: false });
const Pane = dynamic(() => import('react-leaflet').then(mod => mod.Pane), { ssr: false });

import { useLanguage } from './LanguageContext';

interface SubsidiesViewProps {
    initialMetrics: SubsidyMetrics;
    initialList: SubsidyRecord[];
    district: string;
}

export default function SubsidiesView({ initialMetrics, initialList, district }: SubsidiesViewProps) {
    const { t, language } = useLanguage();
    const [metrics, setMetrics] = useState<SubsidyMetrics>(initialMetrics);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SubsidyRecord[]>(initialList);
    const [loading, setLoading] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
    const [recipientDetails, setRecipientDetails] = useState<SubsidyRecord[]>([]);
    const [sortByAmount, setSortByAmount] = useState<'asc' | 'desc' | null>(null);
    const [groupBy, setGroupBy] = useState<'none' | 'year' | 'area' | 'provider' | 'year+area'>('none');
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    const locale = language === 'de' ? 'de-DE' : 'en-GB';

    const processedDetails = React.useMemo(() => {
        let sorted = [...recipientDetails];
        if (sortByAmount) {
            sorted.sort((a, b) => sortByAmount === 'desc' ? b.amount - a.amount : a.amount - b.amount);
        }

        if (groupBy === 'none') return sorted;

        const groups: Record<string, any[]> = {};
        sorted.forEach(item => {
            let key = '';
            if (groupBy === 'year') key = String(item.year);
            else if (groupBy === 'area') key = item.area;
            else if (groupBy === 'provider') key = item.provider;
            else if (groupBy === 'year+area') key = `${item.year}::${item.area}`;

            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        const flattened: any[] = [];
        const sortedGroupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

        if (groupBy === 'year+area') {
            const years = Array.from(new Set(sorted.map(s => s.year))).sort((a, b) => b - a);
            years.forEach(year => {
                const yearItems = sorted.filter(s => s.year === year);
                const yearTotal = yearItems.reduce((sum, s) => sum + s.amount, 0);
                const yearKey = String(year);

                flattened.push({
                    isGroupHeader: true,
                    groupKey: yearKey,
                    groupType: 'year',
                    count: yearItems.length,
                    total: yearTotal
                });

                if (!collapsedGroups.has(yearKey)) {
                    const areas = Array.from(new Set(yearItems.map(s => s.area))).sort();
                    areas.forEach(area => {
                        const areaItems = yearItems.filter(s => s.area === area);
                        const areaTotal = areaItems.reduce((sum, s) => sum + s.amount, 0);
                        const areaKey = `${year}::${area}`;

                        flattened.push({
                            isGroupHeader: true,
                            groupKey: areaKey,
                            groupType: 'area',
                            displayKey: area,
                            count: areaItems.length,
                            total: areaTotal,
                            isNested: true,
                            parentKey: yearKey
                        });

                        if (!collapsedGroups.has(areaKey)) {
                            flattened.push(...areaItems);
                        }
                    });
                }
            });
            return flattened;
        }

        sortedGroupKeys.forEach(key => {
            const groupItems = groups[key];
            const groupTotal = groupItems.reduce((sum, item) => sum + item.amount, 0);

            flattened.push({
                isGroupHeader: true,
                groupKey: key,
                groupType: groupBy,
                count: groupItems.length,
                total: groupTotal
            });

            if (!collapsedGroups.has(key)) {
                flattened.push(...groupItems);
            }
        });

        return flattened;
    }, [recipientDetails, sortByAmount, groupBy, collapsedGroups]);

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

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await searchSubsidies(district, searchQuery);
            setSearchResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRecipientClick = (recipientName: string) => {
        if (selectedRecipient === recipientName) {
            setSelectedRecipient(null);
            setRecipientDetails([]);
            setSearchResults(initialList);
        } else {
            setSelectedRecipient(recipientName);
            const details = initialList.filter(r => r.recipient === recipientName);
            setRecipientDetails(details);
            setSearchResults(details);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Metrics Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">{t('total_volume')}</h3>
                    <p className="text-3xl font-bold text-emerald-400">
                        {(Number(metrics?.totalAmount || 0) / 1000000).toLocaleString(locale, { maximumFractionDigits: 1 })} {t('mio_euro')}
                    </p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">{t('count_subsidies')}</h3>
                    <p className="text-3xl font-bold text-blue-400">
                        {Number(metrics?.totalCount || 0).toLocaleString(locale)}
                    </p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">{t('largest_areas')}</h3>
                    <p className="text-xl font-semibold text-slate-100 truncate">
                        {metrics?.byArea?.[0]?.area || t('na')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Recipients */}
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 shadow-inner flex flex-col">
                    <h2 className="text-xl font-bold text-slate-100 mb-6">{t('top_recipients')}</h2>
                    <div className="space-y-2 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {metrics?.topRecipients?.map((r, i) => {
                            const isSelected = selectedRecipient === r.name;
                            return (
                                <div
                                    key={i}
                                    onClick={() => handleRecipientClick(r.name)}
                                    className={`flex items-center justify-between group cursor-pointer p-3 rounded-xl transition-all ${isSelected ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-slate-700/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                                        <span className="text-slate-600 font-bold text-sm min-w-[2rem]">#{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium truncate transition-colors ${isSelected ? 'text-emerald-400' : 'text-slate-200 group-hover:text-emerald-400'
                                                }`}>
                                                {r.name.replace(/^"|"$/g, '')}
                                            </p>
                                            <p className="text-slate-500 text-xs">{r.count} {t('resolutions')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-100 font-bold">
                                            {(Number(r.amount) / 1000000).toLocaleString(locale, { maximumFractionDigits: 2 })} {t('mio_euro')}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Search & Results */}
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 flex flex-col shadow-inner">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">{t('subsidies_title')}</h2>
                        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
                            >
                                {t('list_view')}
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
                            >
                                {t('map_view')}
                            </button>
                        </div>
                    </div>
                    <form onSubmit={handleSearch} className="relative mb-6">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('placeholder_search')}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-600 transition-all font-medium"
                        />
                        <div className="flex gap-2 mt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-emerald-500 text-slate-900 px-6 py-2 rounded-xl font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                disabled={loading}
                            >
                                {t('search_button')}
                            </button>
                            <button
                                type="button"
                                onClick={handleExport}
                                className="flex-1 bg-slate-800 text-slate-300 px-6 py-2 rounded-xl font-bold border border-slate-700 hover:text-white transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                {t('export_button')}
                            </button>
                        </div>
                    </form>

                    <div className="flex-1 overflow-y-auto max-h-[400px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {viewMode === 'list' ? (
                            loading ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                    <p className="text-slate-500 text-sm font-medium italic">{t('loading')}</p>
                                </div>
                            ) : searchResults?.length > 0 ? (
                                searchResults.map((r, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleRecipientClick(r.recipient)}
                                        className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all hover:bg-slate-900/60 cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-1 gap-2">
                                            <h4 className="text-slate-100 font-semibold truncate flex-1 min-w-0">
                                                {r.recipient.replace(/^"|"$/g, '')}
                                            </h4>
                                            <span className="text-emerald-400 font-bold whitespace-nowrap text-sm">
                                                {Number(r.amount).toLocaleString(locale)} {t('euro')}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed">
                                            {r.purpose.replace(/^"|"$/g, '').replace(/\\"/g, '"')}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-2 items-center">
                                                <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] font-black text-slate-400 uppercase tracking-wider">{r.year}</span>
                                                <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px]">{r.area}</span>
                                            </div>
                                            <span className="text-[9px] text-slate-700 font-medium italic truncate max-w-[100px]">{r.provider.replace(/^"|"$/g, '')}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-slate-500 text-sm italic">{t('no_results')}</p>
                                </div>
                            )
                        ) : (
                            <div className="h-[400px] rounded-xl border border-slate-700 overflow-hidden relative">
                                <MapContainer
                                    center={[52.52, 13.40]}
                                    zoom={10}
                                    style={{ height: '100%', width: '100%' }}
                                    className="z-0"
                                >
                                    <TileLayer
                                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                        attribution='&copy; CARTO'
                                    />
                                    {metrics.byDistrict?.map((d, i) => {
                                        const coordsEntry = Object.values(districtCoordinates).find(c => c.name === d.district);
                                        if (!coordsEntry) return null;

                                        const radius = Math.max(5, Math.sqrt(d.amount / 1000000) * 10);

                                        return (
                                            <CircleMarker
                                                key={i}
                                                center={[coordsEntry.lat, coordsEntry.lng]}
                                                radius={radius}
                                                pathOptions={{
                                                    color: '#10b981',
                                                    fillColor: '#10b981',
                                                    fillOpacity: 0.4,
                                                    weight: 2
                                                }}
                                            >
                                                <Tooltip>
                                                    <div className="p-2">
                                                        <p className="font-bold text-slate-900">{d.district}</p>
                                                        <p className="text-sm text-slate-700">{t('volume')}: {(d.amount / 1000000).toLocaleString(locale, { maximumFractionDigits: 2 })} {t('mio_euro')}</p>
                                                        <p className="text-xs text-slate-500">{d.count} {t('resolutions')}</p>
                                                    </div>
                                                </Tooltip>
                                            </CircleMarker>
                                        );
                                    })}
                                </MapContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recipient Details Table */}
            {selectedRecipient && recipientDetails.length > 0 && (
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 shadow-inner animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-100">
                            {t('details_for')}: {selectedRecipient.replace(/^"|"$/g, '')}
                        </h2>
                        <button
                            onClick={() => {
                                setSelectedRecipient(null);
                                setRecipientDetails([]);
                            }}
                            className="text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-3 mb-4 flex-wrap">
                        <button
                            onClick={() => setSortByAmount(sortByAmount === 'desc' ? 'asc' : 'desc')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortByAmount
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700'
                                }`}
                        >
                            {t('sort_by_amount')} {sortByAmount === 'desc' ? '↓' : sortByAmount === 'asc' ? '↑' : ''}
                        </button>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setGroupBy(groupBy === 'year' ? 'none' : 'year')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${groupBy === 'year'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700'
                                    }`}
                            >
                                {t('by_year')}
                            </button>
                            <button
                                onClick={() => setGroupBy(groupBy === 'area' ? 'none' : 'area')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${groupBy === 'area'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700'
                                    }`}
                            >
                                {t('by_area')}
                            </button>
                            <button
                                onClick={() => setGroupBy(groupBy === 'provider' ? 'none' : 'provider')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${groupBy === 'provider'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700'
                                    }`}
                            >
                                {t('by_provider')}
                            </button>
                            <button
                                onClick={() => setGroupBy(groupBy === 'year+area' ? 'none' : 'year+area')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${groupBy === 'year+area'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700'
                                    }`}
                            >
                                {t('year_area')}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">{t('year_label')}</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">{t('area_label')}</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">{t('purpose_label')}</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">{t('provider_label')}</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-semibold">{t('amount_label')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedDetails.map((detail: any, idx) => {
                                    if (detail.isGroupHeader) {
                                        const isCollapsed = collapsedGroups.has(detail.groupKey);
                                        const isNestedChild = detail.isNested && detail.parentKey;

                                        let headerLabel = '';
                                        if (detail.groupType === 'year') {
                                            headerLabel = `${t('year_label')} ${detail.groupKey}`;
                                        } else if (detail.groupType === 'area') {
                                            headerLabel = detail.displayKey || detail.groupKey;
                                        } else {
                                            headerLabel = detail.groupKey.replace(/^"|"$/g, '');
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
                                                className={`border-t-2 cursor-pointer hover:bg-slate-700/50 transition-colors ${isNestedChild
                                                    ? 'bg-slate-700/20 border-emerald-500/20'
                                                    : 'bg-slate-700/30 border-emerald-500/30'
                                                    }`}
                                            >
                                                <td colSpan={5} className={`py-3 ${isNestedChild ? 'pl-12 pr-4' : 'px-4'}`}>
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
                                                            <span className={`font-bold ${isNestedChild ? 'text-emerald-300 text-sm' : 'text-emerald-400 text-base'}`}>
                                                                {headerLabel}
                                                            </span>
                                                        </div>
                                                        <span className="text-slate-400 text-sm">
                                                            {detail.count} {t('resolutions')} · {detail.total.toLocaleString(locale)} {t('euro')}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    // Check collapse...
                                    if (groupBy !== 'none') {
                                        if (groupBy === 'year+area') {
                                            const yearKey = String(detail.year);
                                            const areaKey = `${yearKey}::${detail.area}`;
                                            if (collapsedGroups.has(yearKey) || collapsedGroups.has(areaKey)) return null;
                                        } else {
                                            let groupKey = groupBy === 'year' ? String(detail.year) : groupBy === 'area' ? detail.area : detail.provider;
                                            if (collapsedGroups.has(groupKey)) return null;
                                        }
                                    }

                                    return (
                                        <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-700/20 transition-colors">
                                            <td className="py-3 px-4 text-slate-300">{detail.year}</td>
                                            <td className="py-3 px-4 text-slate-300">{detail.area}</td>
                                            <td className="py-3 px-4 text-slate-400" title={detail.purpose.replace(/^"|"$/g, '').replace(/\\"/g, '"')}>
                                                <div className="max-w-md truncate">
                                                    {detail.purpose.replace(/^"|"$/g, '').replace(/\\"/g, '"')}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 text-xs" title={detail.provider.replace(/^"|"$/g, '')}>
                                                <div className="max-w-xs truncate">
                                                    {detail.provider.replace(/^"|"$/g, '')}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right text-emerald-400 font-bold">
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
            )}
        </div>
    );
}
