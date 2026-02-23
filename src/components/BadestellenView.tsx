import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Pane, useMap } from 'react-leaflet';
import { ChevronDown, BarChart3, Shield, Waves, PieChart, Users, Building2, Droplets, MapPin, ExternalLink, X, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from './LanguageContext';
import { getBadestellenLive, getStatusFromImage, BadestelleFeature } from '@/lib/badestellen';

// Fix for Leaflet icon issues in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ selectedSpot }: { selectedSpot: BadestelleFeature | null }) {
    const map = useMap();
    useEffect(() => {
        if (selectedSpot) {
            map.flyTo(
                [selectedSpot.geometry.coordinates[1], selectedSpot.geometry.coordinates[0]],
                14,
                { animate: true, duration: 1.5 }
            );
        }
    }, [selectedSpot, map]);
    return null;
}

const SpotPopupContent = ({ spot, t }: { spot: BadestelleFeature; t: any }) => {
    const status = getStatusFromImage(spot.properties.data.farbe);
    return (
        <div className="p-4 min-w-[280px] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden antialiased">
            {/* Header with Name and District */}
            <div className="mb-4">
                <h3 className="font-black text-lg text-white leading-tight mb-1 truncate pr-6">
                    {spot.properties.data.badname}
                </h3>
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {spot.properties.data.bezirk}
                    </span>
                </div>
            </div>

            {/* Environmental Data Grid - Compact 2-column */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 group">
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1 opacity-80">{t('swim_water_temp')}</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-white group-hover:text-blue-400 transition-colors tabular-nums">{spot.properties.data.temp}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">°C</span>
                    </div>
                </div>
                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 group">
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1 opacity-80">{t('swim_visibility')}</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors tabular-nums">{spot.properties.data.sicht}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">m</span>
                    </div>
                </div>
            </div>

            {/* Status Section - More integrated */}
            <div className="flex items-center justify-between p-3 bg-slate-800/20 rounded-xl border border-slate-700/30 mb-4">
                <div className="flex items-center gap-2">
                    <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                            backgroundColor: status.color,
                            boxShadow: `0 0 10px ${status.color}80`
                        }}
                    ></div>
                    <span className="text-xs font-black tracking-tight" style={{ color: status.color }}>
                        {t(status.labelKey)}
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter leading-none mb-0.5">
                        {t('swim_last_sample')}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 pr-1">
                        {spot.properties.data.dat}
                    </span>
                </div>
            </div>

            {/* Action Link */}
            <a
                href={spot.properties.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-emerald-500/20"
            >
                <span className="text-[10px] uppercase tracking-widest">{t('swim_view_details')}</span>
            </a>
        </div>
    );
};

export default function BadestellenView({ district }: { district?: string }) {
    const { t, language } = useLanguage();
    const [data, setData] = useState<BadestelleFeature[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSpot, setSelectedSpot] = useState<BadestelleFeature | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);

    const fetchData = async (refresh = false) => {
        if (refresh) setRefreshing(true); else setLoading(true);
        try {
            const url = refresh ? '/api/badestellen?refresh=true' : '/api/badestellen';
            const res = await fetch(url);
            if (!res.ok) throw new Error('API request failed');
            const result = await res.json();
            setData(result.data);
            setLastUpdated(result.lastUpdated);
            setCooldownRemaining(result.cooldownRemaining || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Countdown timer
    useEffect(() => {
        if (cooldownRemaining <= 0) return;
        const interval = setInterval(() => {
            setCooldownRemaining(prev => {
                if (prev <= 1000) { clearInterval(interval); return 0; }
                return prev - 1000;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [lastUpdated]);

    const formatCooldown = (ms: number) => {
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatLastUpdated = (ts: number | null) => {
        if (!ts) return null;
        const d = new Date(ts);
        return d.toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const filteredData = useMemo(() => {
        if (!district || district === 'Berlin' || district === 'All') {
            return data;
        }
        return data.filter(spot => spot.properties.data.bezirk.toLowerCase().includes(district.toLowerCase()));
    }, [data, district]);

    const center: [number, number] = [52.5200, 13.4050];

    const [sortBy, setSortBy] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [groupBy, setGroupBy] = useState<'none' | 'district' | 'status'>('none');
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const latestUpdate = useMemo(() => {
        if (data.length === 0) return null;
        const dates = data.map(spot => spot.properties.data.dat).filter(Boolean);
        if (dates.length === 0) return null;

        const sorted = [...dates].sort((a, b) => {
            const [da, ma, ya] = a.split('.').map(Number);
            const [db, mb, yb] = b.split('.').map(Number);
            const dateA = new Date(ya, ma - 1, da);
            const dateB = new Date(yb, mb - 1, db);
            return dateB.getTime() - dateA.getTime();
        });
        return sorted[0];
    }, [data]);

    const processedData = useMemo(() => {
        let baseData = [...filteredData];

        // 1. Sorting
        if (sortBy) {
            baseData.sort((a, b) => {
                let valA: any, valB: any;
                if (sortBy === 'badname') {
                    valA = a.properties.data.badname;
                    valB = b.properties.data.badname;
                } else if (sortBy === 'bezirk') {
                    valA = a.properties.data.bezirk;
                    valB = b.properties.data.bezirk;
                } else if (sortBy === 'temp') {
                    valA = parseFloat(a.properties.data.temp) || 0;
                    valB = parseFloat(b.properties.data.temp) || 0;
                } else if (sortBy === 'status') {
                    valA = getStatusFromImage(a.properties.data.farbe).labelKey;
                    valB = getStatusFromImage(b.properties.data.farbe).labelKey;
                } else if (sortBy === 'date') {
                    valA = a.properties.data.dat;
                    valB = b.properties.data.dat;
                }

                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }

        // 2. Grouping
        if (groupBy === 'none') return baseData;

        const groups: Record<string, any[]> = {};
        baseData.forEach(item => {
            let key = '';
            if (groupBy === 'district') key = item.properties.data.bezirk;
            else if (groupBy === 'status') key = getStatusFromImage(item.properties.data.farbe).labelKey;

            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        const straightened: any[] = [];
        const sortedKeys = Object.keys(groups).sort();

        sortedKeys.forEach(key => {
            const items = groups[key];
            straightened.push({
                isGroupHeader: true,
                groupKey: key,
                count: items.length
            });

            if (!collapsedGroups.has(key)) {
                straightened.push(...items);
            }
        });

        return straightened;
    }, [filteredData, sortBy, sortOrder, groupBy, collapsedGroups]);

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const toggleGroup = (key: string) => {
        const next = new Set(collapsedGroups);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setCollapsedGroups(next);
    };

    const handleRowClick = (spot: BadestelleFeature) => {
        setSelectedSpot(spot);
        // Scroll map into view if on mobile
        const mapElement = document.getElementById('badestellen-map');
        if (mapElement && window.innerWidth < 1024) {
            mapElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent leading-tight">
                                {t('swim_title')}
                            </h2>
                            <button
                                onClick={() => fetchData(true)}
                                disabled={cooldownRemaining > 0 || refreshing}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${cooldownRemaining > 0
                                    ? 'bg-slate-900/50 border-slate-700/50 text-slate-600 cursor-not-allowed'
                                    : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 active:scale-[0.98]'
                                    }`}
                                title={cooldownRemaining > 0 ? `${language === 'de' ? 'Verfügbar in' : 'Available in'} ${formatCooldown(cooldownRemaining)}` : ''}
                            >
                                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                                {cooldownRemaining > 0 ? formatCooldown(cooldownRemaining) : (language === 'de' ? 'Aktualisieren' : 'Refresh')}
                            </button>
                            {lastUpdated && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900/50 rounded-full border border-slate-700/50 h-fit">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{formatLastUpdated(lastUpdated)}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            <p className="text-slate-400 text-sm">
                                {t('swim_subtitle')}
                            </p>

                            {latestUpdate && (
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500/80 bg-slate-900/40 px-2 py-1 rounded-md border border-slate-700/30">
                                    <span className="opacity-60">{t('stand')}:</span>
                                    <span className="text-slate-400">{latestUpdate}</span>
                                </div>
                            )}

                            <a
                                href="https://www.berlin.de/lageso/gesundheit/gesundheitsschutz/badegewaesser/liste-der-badestellen/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500/80 hover:text-emerald-500 transition-all group bg-slate-900/40 px-2 py-1 rounded-md border border-slate-700/30 active:scale-[0.98]"
                            >
                                <span className="opacity-60">{t('source')}:</span>
                                <span className="text-slate-400 group-hover:text-emerald-400">LAGeSo Berlin</span>
                                <ExternalLink className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div id="badestellen-map" className="h-[500px] w-full rounded-2xl overflow-hidden border border-slate-700/50 relative z-0">
                    {loading && (
                        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-700 shadow-2xl">
                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-white font-medium text-sm">{t('swim_loading')}</p>
                            </div>
                        </div>
                    )}
                    <MapContainer
                        center={center}
                        zoom={10}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%' }}
                        className="z-0"
                        aria-label={language === 'de' ? 'Badestellen-Karte' : 'Bathing spots map'}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <MapController selectedSpot={selectedSpot} />
                        <Pane name="markers" style={{ zIndex: 600 }}>
                            {filteredData.map((spot) => {
                                const status = getStatusFromImage(spot.properties.data.farbe);
                                return (
                                    <CircleMarker
                                        key={spot.properties.id}
                                        center={[spot.geometry.coordinates[1], spot.geometry.coordinates[0]]}
                                        radius={8}
                                        pathOptions={{
                                            color: selectedSpot?.properties.id === spot.properties.id ? 'white' : 'transparent',
                                            fillColor: status.color,
                                            fillOpacity: 0.8,
                                            weight: selectedSpot?.properties.id === spot.properties.id ? 2 : 0
                                        }}
                                        eventHandlers={{
                                            click: () => setSelectedSpot(spot)
                                        }}
                                    />
                                );
                            })}
                        </Pane>
                    </MapContainer>

                    {/* Fixed Detail Panel - Top Right */}
                    {selectedSpot && (
                        <div className="absolute top-4 right-4 z-[1000] w-[320px] animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="relative">
                                <button
                                    onClick={() => setSelectedSpot(null)}
                                    className="absolute -top-2 -right-2 z-10 p-1.5 bg-slate-900 text-slate-400 hover:text-white rounded-full border border-slate-700 shadow-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <SpotPopupContent spot={selectedSpot} t={t} />
                            </div>
                        </div>
                    )}



                </div>
            </div >

            {/* Detail Table */}
            < div className="bg-slate-800/50 rounded-3xl border border-slate-700/50 overflow-hidden backdrop-blur-xl shadow-xl" >
                <div className="p-6 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-white">{t('swim_table_title')}</h3>

                    {/* Grouping Controls */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setGroupBy(groupBy === 'district' ? 'none' : 'district')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'district' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-900/50 text-slate-400 border border-slate-700/50 hover:text-white hover:bg-slate-800'}`}
                        >
                            {t('by_district')}
                        </button>
                        <button
                            onClick={() => setGroupBy(groupBy === 'status' ? 'none' : 'status')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'status' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-900/50 text-slate-400 border border-slate-700/50 hover:text-white hover:bg-slate-800'}`}
                        >
                            {t('by_status')}
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[640px]">
                        <thead className="bg-slate-900/50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-700/50">
                            <tr>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors group"
                                    onClick={() => toggleSort('badname')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('swim_title')}
                                        <ChevronDown className={`w-3 h-3 transition-transform ${sortBy === 'badname' ? (sortOrder === 'desc' ? 'rotate-180 text-emerald-500' : 'text-emerald-500') : 'opacity-0 group-hover:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors group"
                                    onClick={() => toggleSort('bezirk')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('district_label')}
                                        <ChevronDown className={`w-3 h-3 transition-transform ${sortBy === 'bezirk' ? (sortOrder === 'desc' ? 'rotate-180 text-emerald-500' : 'text-emerald-500') : 'opacity-0 group-hover:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors group"
                                    onClick={() => toggleSort('temp')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('swim_temp_label')}
                                        <ChevronDown className={`w-3 h-3 transition-transform ${sortBy === 'temp' ? (sortOrder === 'desc' ? 'rotate-180 text-emerald-500' : 'text-emerald-500') : 'opacity-0 group-hover:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors group"
                                    onClick={() => toggleSort('status')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('status_label')}
                                        <ChevronDown className={`w-3 h-3 transition-transform ${sortBy === 'status' ? (sortOrder === 'desc' ? 'rotate-180 text-emerald-500' : 'text-emerald-500') : 'opacity-0 group-hover:opacity-50'}`} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors group"
                                    onClick={() => toggleSort('date')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('swim_last_sample')}
                                        <ChevronDown className={`w-3 h-3 transition-transform ${sortBy === 'date' ? (sortOrder === 'desc' ? 'rotate-180 text-emerald-500' : 'text-emerald-500') : 'opacity-0 group-hover:opacity-50'}`} />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {processedData.map((item, idx) => {
                                if (item.isGroupHeader) {
                                    const isCollapsed = collapsedGroups.has(item.groupKey);
                                    return (
                                        <tr
                                            key={`group-${item.groupKey}`}
                                            className="bg-slate-900/30 border-l-4 border-l-emerald-500/50 cursor-pointer hover:bg-slate-800/50 transition-colors"
                                            onClick={() => toggleGroup(item.groupKey)}
                                        >
                                            <td colSpan={5} className="px-6 py-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <ChevronDown className={`w-4 h-4 text-emerald-500 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                                                        <span className="font-black text-emerald-400 uppercase tracking-widest text-[11px]">
                                                            {item.groupKey}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                        {item.count} {t('entries_label')}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                const spot = item as BadestelleFeature;
                                const status = getStatusFromImage(spot.properties.data.farbe);
                                const isSelected = selectedSpot?.properties.id === spot.properties.id;
                                return (
                                    <tr
                                        key={spot.properties.id}
                                        onClick={() => handleRowClick(spot)}
                                        className={`cursor-pointer transition-all ${isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-700/20'} ${groupBy !== 'none' ? 'animate-in fade-in slide-in-from-left-2 duration-300' : ''}`}
                                    >
                                        <td className={`px-6 py-4 font-bold transition-colors ${isSelected ? 'text-emerald-400' : 'text-white'}`}>{spot.properties.data.badname}</td>
                                        <td className="px-6 py-4 text-slate-400">{spot.properties.data.bezirk}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg border border-blue-500/20 font-bold">
                                                {spot.properties.data.temp}°C
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }}></div>
                                                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: status.color }}>
                                                    {t(status.labelKey)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 tabular-nums">{spot.properties.data.dat}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div >
        </div >
    );
}
