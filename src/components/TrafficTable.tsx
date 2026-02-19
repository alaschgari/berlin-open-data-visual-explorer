'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import { Search, MapPin, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, Car, Bike, Footprints, Truck, Layers, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface TrafficTableProps {
    features: any[];
    onHighlight: (id: number) => void;
    highlightedId: number | null;
}

type SortField = 'segment_id' | 'car' | 'bike' | 'pedestrian' | 'heavy' | 'v85' | 'district';
type SortDirection = 'asc' | 'desc';

export default function TrafficTable({ features, onHighlight, highlightedId }: TrafficTableProps) {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('v85');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [groupBy, setGroupBy] = useState<'none' | 'speed_level' | 'district'>('none');
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to highlighted segment
    React.useEffect(() => {
        if (highlightedId && tableContainerRef.current) {
            const row = tableContainerRef.current.querySelector(`[data-segment-id="${highlightedId}"]`);
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [highlightedId]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getSpeedLevel = (v85: number) => {
        if (!v85) return t('traffic_unknown');
        if (v85 > 50) return t('traffic_speed_high');
        if (v85 > 30) return t('traffic_speed_medium');
        return t('traffic_speed_low');
    };

    const filteredAndSortedData = useMemo(() => {
        let data = [...features];

        // Filter
        if (searchTerm) {
            data = data.filter(f =>
                f.properties.segment_id.toString().includes(searchTerm)
            );
        }

        // Sort
        data.sort((a, b) => {
            const valA = a.properties[sortField] || 0;
            const valB = b.properties[sortField] || 0;
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        });

        return data;
    }, [features, searchTerm, sortField, sortDirection]);

    const groupedData = useMemo(() => {
        if (groupBy === 'none') return { [t('traffic_all_segments')]: filteredAndSortedData };

        return filteredAndSortedData.reduce((groups: any, feature: any) => {
            let key = '';
            if (groupBy === 'speed_level') {
                key = getSpeedLevel(feature.properties.v85);
            } else if (groupBy === 'district') {
                key = feature.properties.district || 'Unknown';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(feature);
            return groups;
        }, {});
    }, [filteredAndSortedData, groupBy]);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <div className="w-4 h-4" />;
        return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-emerald-400" />;
    };

    return (
        <div className="bg-slate-800/50 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col h-[600px]">
            {/* Header Controls */}
            <div className="p-6 border-b border-slate-700/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    {t('traffic_segment_data')}
                    <span className="text-xs font-normal text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded-full border border-slate-700">
                        {filteredAndSortedData.length} {t('traffic_active')}
                    </span>
                </h3>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder={t('traffic_search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 w-full md:w-64 transition-all"
                        />
                    </div>

                    {/* Grouping Toggles */}
                    <div className="flex bg-slate-900/50 rounded-xl border border-slate-700 p-1">
                        <button
                            onClick={() => setGroupBy(prev => prev === 'speed_level' ? 'none' : 'speed_level')}
                            className={`p-1.5 rounded-lg transition-all ${groupBy === 'speed_level' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            title={t('traffic_group_speed')}
                        >
                            <TrendingUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setGroupBy(prev => prev === 'district' ? 'none' : 'district')}
                            className={`p-1.5 rounded-lg transition-all ${groupBy === 'district' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            title={t('traffic_group_district')}
                        >
                            <Layers className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div
                ref={tableContainerRef}
                className="overflow-y-auto flex-1 custom-scrollbar"
            >
                {Object.entries(groupedData).map(([groupName, groupFeatures]: [string, any]) => (
                    <div key={groupName} className="mb-2">
                        {groupBy !== 'none' && (
                            <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur border-y border-slate-700/50 px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                                <span>{groupName}</span>
                                <span className="bg-slate-800 px-2 rounded-full text-slate-500">{(groupFeatures as any[]).length}</span>
                            </div>
                        )}

                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-800/80 sticky top-0 z-20 backdrop-blur-md">
                                <tr>
                                    <th className="p-4 text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('segment_id')}>
                                        <div className="flex items-center gap-1">ID <SortIcon field="segment_id" /></div>
                                    </th>
                                    <th className="p-4 text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('district')}>
                                        <div className="flex items-center gap-1">{t('traffic_district')} <SortIcon field="district" /></div>
                                    </th>
                                    <th className="p-4 text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('v85')}>
                                        <div className="flex items-center gap-1 group relative">
                                            <TrendingUp className="w-3 h-3" />
                                            {t('traffic_v85')}
                                            <SortIcon field="v85" />
                                            <div className="ml-1 text-slate-600 hover:text-indigo-400 transition-colors" title={t('traffic_v85_explanation')}>
                                                <Info className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </th>
                                    <th className="p-4 text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('car')}>
                                        <div className="flex items-center gap-1"><Car className="w-3 h-3" /> {t('traffic_cars')} <SortIcon field="car" /></div>
                                    </th>
                                    <th className="p-4 text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('bike')}>
                                        <div className="flex items-center gap-1"><Bike className="w-3 h-3" /> {t('traffic_bikes')} <SortIcon field="bike" /></div>
                                    </th>
                                    <th className="p-4 text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('pedestrian')}>
                                        <div className="flex items-center gap-1"><Footprints className="w-3 h-3" /> {t('traffic_peds')} <SortIcon field="pedestrian" /></div>
                                    </th>
                                    <th className="p-4 text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('heavy')}>
                                        <div className="flex items-center gap-1"><Truck className="w-3 h-3" /> {t('traffic_heavy')} <SortIcon field="heavy" /></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {(groupFeatures as any[]).map((feature: any) => {
                                    const props = feature.properties;
                                    const isHighlighted = highlightedId === props.segment_id;

                                    return (
                                        <tr
                                            key={props.segment_id}
                                            data-segment-id={props.segment_id}
                                            onClick={() => onHighlight(props.segment_id)}
                                            className={`group transition-all cursor-pointer ${isHighlighted
                                                ? 'bg-indigo-500/20 hover:bg-indigo-500/30'
                                                : 'hover:bg-slate-700/30'
                                                }`}
                                        >
                                            <td className="p-4">
                                                <span className={`font-mono text-xs ${isHighlighted ? 'text-indigo-300 font-bold' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                                    #{props.segment_id}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full whitespace-nowrap">
                                                    {props.district || t('traffic_unknown')}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold ${props.v85 > 50 ? 'text-rose-400' : 'text-slate-200'}`}>
                                                        {Math.round(props.v85 || 0)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">km/h</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-300">{Math.round(props.car || 0)}</td>
                                            <td className="p-4 text-sm text-slate-300">{Math.round(props.bike || 0)}</td>
                                            <td className="p-4 text-sm text-slate-300">{Math.round(props.pedestrian || 0)}</td>
                                            <td className="p-4 text-sm text-slate-300">{Math.round(props.heavy || 0)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-slate-700/50 bg-slate-900/30 text-[10px] text-slate-500 text-center">
                {t('traffic_select_row')}
            </div>
        </div>
    );
}
