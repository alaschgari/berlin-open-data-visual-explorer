import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { MapPin, ExternalLink, Clock, Calendar, ShoppingBag, Search, Accessibility, User, X } from 'lucide-react';
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

interface MarketFeature {
    type: string;
    geometry: {
        type: string;
        coordinates: [number, number]; // [lng, lat]
    };
    properties: {
        title: string;
        href: string;
        id: string;
        data: {
            bezirk: string;
            bezeichnung: string;
            strasse: string;
            plz: string;
            zeitraum: string;
            tage: string;
            zeiten: string;
            betreiber: string;
            email: string;
            www: string;
            barrierefreiheit: string;
            bemerkungen: string;
            lat: string;
            lng: string;
        };
    };
}

interface MarketsGeoJSON {
    type: string;
    features: MarketFeature[];
}

// District color palette
const DISTRICT_COLORS: Record<string, string> = {
    'Mitte': '#10b981',
    'Friedrichshain': '#3b82f6',
    'Friedrichshain-Kreuzberg': '#3b82f6',
    'Pankow': '#f59e0b',
    'Charlottenburg-Wilmersdorf': '#8b5cf6',
    'Spandau': '#ef4444',
    'Steglitz-Zehlendorf': '#06b6d4',
    'Tempelhof-Schöneberg': '#ec4899',
    'Neukölln': '#f97316',
    'Treptow-Köpenick': '#14b8a6',
    'Marzahn-Hellersdorf': '#a855f7',
    'Lichtenberg': '#6366f1',
    'Reinickendorf': '#84cc16',
    'Brandenburg': '#94a3b8',
};

function getDistrictColor(bezirk: string): string {
    return DISTRICT_COLORS[bezirk] || '#10b981';
}

function MapController({ selectedMarket }: { selectedMarket: MarketFeature | null }) {
    const map = useMap();
    useEffect(() => {
        if (selectedMarket) {
            map.flyTo(
                [parseFloat(selectedMarket.properties.data.lat), parseFloat(selectedMarket.properties.data.lng)],
                14,
                { animate: true, duration: 1.5 }
            );
        }
    }, [selectedMarket, map]);
    return null;
}

const MarketPopupContent = ({ market, t }: { market: MarketFeature; t: (key: string) => string }) => {
    const d = market.properties.data;
    return (
        <div className="p-4 min-w-[280px] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden antialiased">
            <div className="mb-4">
                <h3 className="font-black text-lg text-white leading-tight mb-1 truncate pr-6">
                    {d.bezeichnung}
                </h3>
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {d.bezirk}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4 items-start">
                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 flex flex-col min-h-full">
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1 opacity-80">{t('markets_days')}</span>
                    <span className="text-sm font-bold text-white leading-tight">{d.tage}</span>
                </div>
                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 flex flex-col min-h-full">
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-2 opacity-80">{t('markets_times')}</span>
                    <div className="flex flex-col gap-1.5 min-h-0 flex-1">
                        {d.zeiten.split('\n').map(l => l.trim()).filter(Boolean).map((line, i) => {
                            const isClosed = line.toLowerCase().includes('geschloss');
                            return (
                                <div key={i} className={`flex items-start gap-1.5 p-1.5 rounded border leading-tight ${isClosed
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                    : 'bg-slate-900/50 border-slate-700/50 text-slate-300'
                                    }`}>
                                    {isClosed ? (
                                        <X className="w-3 h-3 shrink-0 mt-[2px] opacity-80" />
                                    ) : (
                                        <Clock className="w-3 h-3 shrink-0 mt-[2px] opacity-80" />
                                    )}
                                    <span className={`text-[11px] break-words flex-1 ${isClosed ? 'font-medium' : 'font-bold'}`}>{line}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{d.strasse}, {d.plz}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{d.zeitraum}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <User className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{d.betreiber}</span>
                </div>
                {d.barrierefreiheit === 'Ja' && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <Accessibility className="w-3 h-3 shrink-0" />
                        <span>{t('markets_accessible')}</span>
                    </div>
                )}
            </div>

            {d.www && (
                <a
                    href={d.www}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                >
                    <span className="text-[10px] uppercase tracking-widest">{t('markets_website')}</span>
                    <ExternalLink className="w-3 h-3" />
                </a>
            )}
        </div>
    );
};

export default function MarketsMapClient({ district }: { district?: string }) {
    const { t, language } = useLanguage();
    const [data, setData] = useState<MarketsGeoJSON | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMarket, setSelectedMarket] = useState<MarketFeature | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const center: [number, number] = [52.5200, 13.4050];

    useEffect(() => {
        fetch('/api/markets')
            .then(res => res.json())
            .then((geojson: MarketsGeoJSON) => {
                setData(geojson);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch markets:', err);
                setLoading(false);
            });
    }, []);

    const filteredMarkets = useMemo(() => {
        if (!data) return [];
        return data.features.filter(f => {
            const d = f.properties.data;
            // District filter
            if (district && district !== 'Berlin') {
                // Fuzzy match: e.g. "Friedrichshain-Kreuzberg" should match bezirk "Friedrichshain"
                if (!d.bezirk.toLowerCase().includes(district.toLowerCase()) &&
                    !district.toLowerCase().includes(d.bezirk.toLowerCase())) {
                    return false;
                }
            }
            // Search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return d.bezeichnung.toLowerCase().includes(term) ||
                    d.strasse.toLowerCase().includes(term) ||
                    d.bezirk.toLowerCase().includes(term) ||
                    d.betreiber.toLowerCase().includes(term);
            }
            return true;
        });
    }, [data, district, searchTerm]);

    const handleMarketClick = (market: MarketFeature) => {
        setSelectedMarket(market);
        const mapElement = document.getElementById('markets-map');
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
                                {t('markets_title')}
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            <p className="text-slate-400 text-sm">
                                {t('markets_subtitle')}
                            </p>
                            <a
                                href="https://www.berlin.de/sen/web/service/maerkte-feste/wochen-troedelmaerkte/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500/80 hover:text-emerald-500 transition-all group bg-slate-900/40 px-2 py-1 rounded-md border border-slate-700/30 active:scale-[0.98]"
                            >
                                <span className="opacity-60">{t('source')}:</span>
                                <span className="text-slate-400 group-hover:text-emerald-400">berlin.de</span>
                                <ExternalLink className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </a>
                        </div>
                    </div>

                    {/* Search & Count */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder={t('markets_search')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 w-64 transition-all"
                                aria-label={t('markets_search')}
                            />
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/50 rounded-xl border border-slate-700/50">
                            <ShoppingBag className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-black text-white tabular-nums">{filteredMarkets.length}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{t('markets_count')}</span>
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div id="markets-map" className="h-[500px] w-full rounded-2xl overflow-hidden border border-slate-700/50 relative z-0">
                    {loading && (
                        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-700 shadow-2xl">
                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-white font-medium text-sm">{t('markets_loading')}</p>
                            </div>
                        </div>
                    )}
                    <MapContainer
                        center={center}
                        zoom={10}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%' }}
                        className="z-0"
                        aria-label={t('markets_map_label')}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <MapController selectedMarket={selectedMarket} />
                        {filteredMarkets.map((market, idx) => {
                            const lat = parseFloat(market.properties.data.lat);
                            const lng = parseFloat(market.properties.data.lng);
                            if (isNaN(lat) || isNaN(lng)) return null;
                            const color = getDistrictColor(market.properties.data.bezirk);
                            const isSelected = selectedMarket?.properties.id === market.properties.id;
                            return (
                                <CircleMarker
                                    key={`${market.properties.id}-${idx}`}
                                    center={[lat, lng]}
                                    radius={isSelected ? 12 : 8}
                                    pathOptions={{
                                        fillColor: color,
                                        color: isSelected ? '#fff' : color,
                                        weight: isSelected ? 3 : 2,
                                        fillOpacity: 0.8,
                                    }}
                                    eventHandlers={{
                                        click: () => setSelectedMarket(market),
                                    }}
                                >
                                </CircleMarker>
                            );
                        })}
                    </MapContainer>

                    {/* Fixed Detail Panel - Top Right */}
                    {selectedMarket && (
                        <div className="absolute top-4 right-4 z-[1000] w-[320px] animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="relative">
                                <button
                                    onClick={() => setSelectedMarket(null)}
                                    className="absolute -top-2 -right-2 z-10 p-1.5 bg-slate-900 text-slate-400 hover:text-white rounded-full border border-slate-700 shadow-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <MarketPopupContent market={selectedMarket} t={t} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Market List */}
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMarkets.map((market, idx) => {
                        const d = market.properties.data;
                        const color = getDistrictColor(d.bezirk);
                        const isSelected = selectedMarket?.properties.id === market.properties.id;
                        return (
                            <button
                                key={`${market.properties.id}-${idx}`}
                                onClick={() => handleMarketClick(market)}
                                className={`text-left p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${isSelected
                                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                                    : 'bg-slate-900/40 border-slate-700/50 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                                        style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
                                    >
                                        <ShoppingBag className="w-4 h-4" style={{ color }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-sm text-white truncate mb-0.5">
                                            {d.bezeichnung}
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                            {d.bezirk}
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800/60 rounded-md border border-slate-700/50 text-[10px] font-bold text-slate-400">
                                                    <Calendar className="w-2.5 h-2.5" />
                                                    {d.tage}
                                                </span>
                                                {d.barrierefreiheit === 'Ja' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                                                        <Accessibility className="w-2.5 h-2.5" />
                                                        ✓
                                                    </span>
                                                )}
                                            </div>
                                            {d.zeiten && (
                                                <div className="flex flex-col gap-1 mt-1 items-start">
                                                    {d.zeiten.split('\n').map(l => l.trim()).filter(Boolean).map((line, i) => {
                                                        const isClosed = line.toLowerCase().includes('geschloss');
                                                        return (
                                                            <div key={i} className={`flex items-start gap-1.5 px-2 py-1.5 rounded-md border w-fit ${isClosed
                                                                ? 'bg-rose-500/10 border-rose-500/20'
                                                                : 'bg-slate-800/30 border-slate-700/40'
                                                                }`}>
                                                                {isClosed ? (
                                                                    <X className="w-3 h-3 mt-[2px] shrink-0 text-rose-400/80" />
                                                                ) : (
                                                                    <Clock className="w-3 h-3 mt-[2px] shrink-0 text-slate-400" />
                                                                )}
                                                                <span className={`leading-[1.3] break-words ${isClosed
                                                                    ? 'font-medium text-rose-400/90 text-[10px]'
                                                                    : 'font-bold text-slate-300 text-[10px]'
                                                                    }`}>{line}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {filteredMarkets.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="font-bold">{t('no_results')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
