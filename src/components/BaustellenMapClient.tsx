'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { MapPin, Info, AlertTriangle, Calendar, Search, X, HardHat, ExternalLink } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from './LanguageContext';

// Fix for Leaflet icon issues in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface BaustellenFeature {
    type: string;
    geometry: {
        type: string;
        coordinates?: [number, number]; // [lng, lat]
        geometries?: any[];
    };
    properties: {
        id: string;
        subtype: string;
        severity: string;
        validity: {
            from: string;
            to: string;
        };
        direction: string;
        icon: string;
        street: string;
        section: string;
        content: string;
        is_future: boolean;
    };
}

interface BaustellenGeoJSON {
    type: string;
    features: BaustellenFeature[];
}

function isMajorSeverity(severity: string | null | undefined): boolean {
    if (!severity) return false;
    const s = severity.toLowerCase();
    return s.includes('gesperrt') || s.includes('vollsperrung');
}

function parseBerlinDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    // Format: "DD.MM.YYYY HH:mm" or just "DD.MM.YYYY"
    const parts = dateStr.split(' ')[0].split('.');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
}

function getCoordinates(feature: BaustellenFeature): [number, number] | null {
    const geom = feature.geometry;
    if (!geom) return null;

    if (geom.type === 'Point' && geom.coordinates) {
        return [geom.coordinates[1], geom.coordinates[0]];
    }

    if (geom.type === 'GeometryCollection' && Array.isArray(geom.geometries)) {
        const pointGeom = geom.geometries.find((g: any) => g.type === 'Point');
        if (pointGeom && pointGeom.coordinates) {
            return [pointGeom.coordinates[1], pointGeom.coordinates[0]];
        }
    }

    // Fallback for types with coordinates array (LineString, Polygon)
    if (geom.coordinates && Array.isArray(geom.coordinates)) {
        let firstCoord: any = geom.coordinates;
        while (Array.isArray(firstCoord[0])) {
            firstCoord = firstCoord[0];
        }
        if (firstCoord.length >= 2) {
            return [Number(firstCoord[1]), Number(firstCoord[0])];
        }
    }

    return null;
}

function MapController({ selectedSite }: { selectedSite: BaustellenFeature | null }) {
    const map = useMap();
    useEffect(() => {
        if (selectedSite) {
            const coords = getCoordinates(selectedSite);
            if (coords) {
                map.flyTo(coords, 14, { animate: true, duration: 1.5 });
            }
        }
    }, [selectedSite, map]);
    return null;
}

const BaustellenPopupContent = ({ site, t }: { site: BaustellenFeature; t: (key: string) => string }) => {
    const p = site.properties;
    const isMajor = isMajorSeverity(p.severity);
    
    return (
        <div className="p-4 min-w-[280px] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden antialiased">
            <div className="mb-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-black text-lg text-white leading-tight truncate">
                        {p.street || t('unknown')}
                    </h3>
                    <div className={`p-1.5 rounded-lg shrink-0 ${isMajor ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {isMajor ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {p.subtype || t('unknown')}
                    </span>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1 opacity-80">{t('baustellen_severity')}</span>
                    <span className={`text-sm font-bold ${isMajor ? 'text-rose-400' : 'text-amber-400'}`}>{p.severity || t('na')}</span>
                </div>

                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1 opacity-80">{t('baustellen_period')}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-200 font-bold">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{(p.validity?.from || '').split(' ')[0]} — {(p.validity?.to || '').split(' ')[0]}</span>
                    </div>
                </div>

                <div className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800 italic">
                    {p.content || t('no_data')}
                </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">
                <Info className="w-3 h-3" />
                <span>{p.direction || '-'}</span>
            </div>
        </div>
    );
};

export default function BaustellenMapClient({ district }: { district?: string }) {
    const { t } = useLanguage();
    const [data, setData] = useState<BaustellenGeoJSON | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSite, setSelectedSite] = useState<BaustellenFeature | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Date filter state
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [startDate, setStartDate] = useState<string>(today.toISOString().split('T')[0]);

    const center: [number, number] = [52.5200, 13.4050];

    useEffect(() => {
        fetch('/api/baustellen')
            .then(res => res.json())
            .then((geojson: BaustellenGeoJSON) => {
                setData(geojson);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch baustellen:', err);
                setLoading(false);
            });
    }, []);

    const districtMapping: Record<string, string[]> = {
        'Charlottenburg-Wilmersdorf': ['Charlottenburg', 'Wilmersdorf', 'Westend', 'Grunewald', 'Halensee', 'Schmargendorf'],
        'Friedrichshain-Kreuzberg': ['Friedrichshain', 'Kreuzberg'],
        'Steglitz-Zehlendorf': ['Steglitz', 'Zehlendorf', 'Lankwitz', 'Lichterfelde', 'Dahlem', 'Nikolassee', 'Wannsee'],
        'Tempelhof-Schöneberg': ['Tempelhof', 'Schöneberg', 'Mariendorf', 'Marienfelde', 'Lichtenrade', 'Friedenau'],
        'Treptow-Köpenick': ['Treptow', 'Köpenick', 'Adlershof', 'Altglienicke', 'Bohnsdorf', 'Friedrichshagen', 'Grünau', 'Johannisthal', 'Niederschöneweide', 'Oberschöneweide', 'Rahnsdorf', 'Schmöckwitz'],
        'Marzahn-Hellersdorf': ['Marzahn', 'Hellersdorf', 'Biesdorf', 'Kaulsdorf', 'Mahlsdorf'],
    };

    const filteredSites = useMemo(() => {
        if (!data) return [];
        const filterDate = startDate ? new Date(startDate) : null;
        if (filterDate) filterDate.setHours(0, 0, 0, 0);

        return data.features.filter(f => {
            const p = f.properties;
            
            // Date Filter: if site ends before our selected date, or starts after our selected date
            // The request is "everything starting from today" by default.
            // Logic: Site is active if validity.to >= filterDate
            if (filterDate) {
                const siteTo = parseBerlinDate(p.validity?.to);
                if (siteTo && siteTo < filterDate) return false;
            }

            // District filter (Fuzzy)
            if (district && district !== 'Berlin') {
                const street = (p.street || '').toLowerCase();
                const section = (p.section || '').toLowerCase();
                const content = (p.content || '').toLowerCase();
                
                const searchTerms = [district.toLowerCase()];
                if (districtMapping[district]) {
                    districtMapping[district].forEach(term => searchTerms.push(term.toLowerCase()));
                }

                const matches = searchTerms.some(term => 
                    street.includes(term) || section.includes(term) || content.includes(term)
                );

                if (!matches) return false;
            }
            // Search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (p.street || '').toLowerCase().includes(term) ||
                       (p.content || '').toLowerCase().includes(term) ||
                       (p.subtype || '').toLowerCase().includes(term);
            }
            return true;
        }).sort((a, b) => {
            // 1. Severity: Major disruptions first
            const aMajor = isMajorSeverity(a.properties.severity);
            const bMajor = isMajorSeverity(b.properties.severity);
            if (aMajor !== bMajor) return aMajor ? -1 : 1;

            // 2. Date: Start date chronologically
            const aStart = parseBerlinDate(a.properties.validity?.from);
            const bStart = parseBerlinDate(b.properties.validity?.from);
            
            if (aStart && bStart) {
                return aStart.getTime() - bStart.getTime();
            }
            return 0;
        });
    }, [data, district, searchTerm, startDate]);

    const handleSiteClick = (site: BaustellenFeature) => {
        setSelectedSite(site);
        const mapElement = document.getElementById('baustellen-map');
        if (mapElement) {
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
                                {t('baustellen_title')}
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            <p className="text-slate-400 text-sm">
                                {t('baustellen_subtitle')}
                            </p>
                            <a
                                href="https://viz.berlin.de"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500/80 hover:text-emerald-500 transition-all group bg-slate-900/40 px-2 py-1 rounded-md border border-slate-700/30 active:scale-[0.98]"
                            >
                                <span className="opacity-60">{t('source')}:</span>
                                <span className="text-slate-400 group-hover:text-emerald-400">VIZ Berlin</span>
                                <ExternalLink className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </a>
                        </div>
                    </div>

                    {/* Filters: Search & Date & Count */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-1.5 grayscale-[0.5] focus-within:grayscale-0 transition-all">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-xs text-white focus:outline-none [color-scheme:dark]"
                            />
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder={t('hub_search_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 w-48 lg:w-64 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/50 rounded-xl border border-slate-700/50">
                            <HardHat className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-black text-white tabular-nums">{filteredSites.length}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t('baustellen_count')}</span>
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div id="baustellen-map" className="h-[500px] w-full rounded-2xl overflow-hidden border border-slate-700/50 relative z-0">
                    {loading && (
                        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-700 shadow-2xl">
                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-white font-medium text-sm">{t('baustellen_loading')}</p>
                            </div>
                        </div>
                    )}
                    <MapContainer
                        center={center}
                        zoom={11}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%' }}
                        className="z-0"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <MapController selectedSite={selectedSite} />
                        {filteredSites.map((site, idx) => {
                            const coords = getCoordinates(site);
                            if (!coords) return null;
                            
                            const [lat, lng] = coords;
                            const isMajor = isMajorSeverity(site.properties.severity);
                            const color = isMajor ? '#f43f5e' : '#f59e0b'; // rose-500 or amber-500
                            const isSelected = selectedSite?.properties.id === site.properties.id;
                            
                            return (
                                <CircleMarker
                                    key={`${site.properties.id}-${idx}`}
                                    center={[lat, lng]}
                                    radius={isSelected ? 14 : 8}
                                    pathOptions={{
                                        fillColor: color,
                                        color: isSelected ? '#fff' : color,
                                        weight: isSelected ? 3 : 2,
                                        fillOpacity: 0.8,
                                    }}
                                    eventHandlers={{
                                        click: () => setSelectedSite(site),
                                    }}
                                />
                            );
                        })}
                    </MapContainer>

                    {/* Fixed Detail Panel - Top Right */}
                    {selectedSite && (
                        <div className="absolute top-4 right-4 z-[1000] w-[320px] animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="relative">
                                <button
                                    onClick={() => setSelectedSite(null)}
                                    className="absolute -top-2 -right-2 z-10 p-1.5 bg-slate-900 text-slate-400 hover:text-white rounded-full border border-slate-700 shadow-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <BaustellenPopupContent site={selectedSite} t={t} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Site List */}
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSites.slice(0, 50).map((site, idx) => {
                        const p = site.properties;
                        const isMajor = isMajorSeverity(p.severity);
                        const isSelected = selectedSite?.properties.id === site.properties.id;
                        
                        return (
                            <button
                                key={`${p.id}-${idx}`}
                                onClick={() => handleSiteClick(site)}
                                className={`text-left p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${isSelected
                                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                                    : 'bg-slate-900/40 border-slate-700/50 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${isMajor ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                        {isMajor ? <AlertTriangle className="w-4 h-4" /> : <HardHat className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-sm text-white truncate mb-0.5">
                                            {p.street}
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 truncate">
                                            {p.subtype} • {p.severity}
                                        </p>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                <Calendar className="w-3 h-3" />
                                                {(p.validity?.from || '').split(' ')[0]} — {(p.validity?.to || '').split(' ')[0]}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {filteredSites.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500">
                        <HardHat className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="font-bold">{t('no_results')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
