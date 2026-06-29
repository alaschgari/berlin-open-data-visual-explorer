import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { MapPin, Search, Navigation, Info, Clock, AlertCircle } from 'lucide-react';
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

interface ParkingFeature {
    type: string;
    id: string;
    geometry: {
        type: string;
        coordinates: [number, number];
    };
    properties: {
        plz: string;
        uid: string;
        datum: string;
        anzahl: number;
        bezirk: string;
        gps_lat: number;
        gps_lon: number;
        polizei: string;
        ortsteil: string;
        standort: string;
        bemerkung: string;
        bezeichnun: string;
    };
}

interface ParkingGeoJSON {
    type: string;
    features: ParkingFeature[];
}

function MapController({ selectedSpace }: { selectedSpace: ParkingFeature | null }) {
    const map = useMap();
    useEffect(() => {
        if (selectedSpace && selectedSpace.properties.gps_lat && selectedSpace.properties.gps_lon) {
            map.flyTo(
                [selectedSpace.properties.gps_lat, selectedSpace.properties.gps_lon],
                15,
                { animate: true, duration: 1.5 }
            );
        }
    }, [selectedSpace, map]);
    return null;
}

export default function DisabledParkingMapClient({ district }: { district?: string }) {
    const { t } = useLanguage();
    const [data, setData] = useState<ParkingGeoJSON | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpace, setSelectedSpace] = useState<ParkingFeature | null>(null);

    useEffect(() => {
        fetch('/api/disabled-parking')
            .then(res => res.json())
            .then((geojson: ParkingGeoJSON) => {
                setData(geojson);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch disabled parking spaces:', err);
                setLoading(false);
            });
    }, []);

    const filteredSpaces = useMemo(() => {
        if (!data) return [];
        return data.features.filter(space => {
            const props = space.properties;
            
            // Filter by district if selected
            if (district && district !== 'Berlin' && props.bezirk !== district) {
                return false;
            }

            // Search query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const standort = (props.standort || '').toLowerCase();
                const ortsteil = (props.ortsteil || '').toLowerCase();
                const plz = (props.plz || '').toLowerCase();
                return standort.includes(query) || ortsteil.includes(query) || plz.includes(query);
            }

            return true;
        });
    }, [data, district, searchQuery]);

    const stats = useMemo(() => {
        const totalSpaces = filteredSpaces.reduce((sum, s) => sum + (Number(s.properties.anzahl) || 1), 0);
        return {
            locations: filteredSpaces.length,
            totalSpaces
        };
    }, [filteredSpaces]);

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                            {t('disabled_parking_title')}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            {t('disabled_parking_subtitle')}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('disabled_parking_search')}
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-4 bg-slate-800/40 border border-slate-700/30 rounded-2xl px-4 py-2.5 text-xs text-slate-300">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{t('disabled_parking_locations')}</span>
                                <span className="text-sm font-black text-white">{stats.locations}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-700/40"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{t('disabled_parking_total')}</span>
                                <span className="text-sm font-black text-white">{stats.totalSpaces}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative z-0">
                    <div className="h-[550px] w-full rounded-3xl overflow-hidden border border-slate-800 relative shadow-2xl">
                        {loading ? (
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                <p className="text-slate-400 mt-4 text-sm">{t('disabled_parking_loading')}</p>
                            </div>
                        ) : null}

                        <MapContainer
                            center={[52.520008, 13.404954]}
                            zoom={11}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                            <MapController selectedSpace={selectedSpace} />
                            {filteredSpaces.map((space) => {
                                const lat = space.properties.gps_lat;
                                const lon = space.properties.gps_lon;
                                if (!lat || !lon) return null;

                                const isSelected = selectedSpace?.id === space.id;

                                return (
                                    <CircleMarker
                                        key={space.id}
                                        center={[lat, lon]}
                                        radius={isSelected ? 10 : 6}
                                        pathOptions={{
                                            fillColor: '#3b82f6',
                                            fillOpacity: isSelected ? 0.9 : 0.6,
                                            color: isSelected ? '#ffffff' : '#2563eb',
                                            weight: isSelected ? 2 : 1,
                                        }}
                                        eventHandlers={{
                                            click: () => {
                                                setSelectedSpace(space);
                                            },
                                        }}
                                    />
                                );
                            })}
                        </MapContainer>
                    </div>
                </div>

                <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedSpace ? (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider bg-blue-500/10 px-2.5 py-1 rounded-full">
                                        {selectedSpace.properties.bezeichnun || 'Parkplatz'}
                                    </span>
                                    <h3 className="text-lg font-bold text-white mt-2 leading-snug">
                                        {selectedSpace.properties.standort}
                                    </h3>
                                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{selectedSpace.properties.ortsteil}, {selectedSpace.properties.plz} ({selectedSpace.properties.bezirk})</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-800/80 my-4"></div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-850/50 border border-slate-800/50 rounded-2xl p-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t('disabled_parking_spots')}</span>
                                    <span className="text-2xl font-black text-white">{selectedSpace.properties.anzahl}</span>
                                </div>
                                <div className="bg-slate-850/50 border border-slate-800/50 rounded-2xl p-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t('disabled_parking_district')}</span>
                                    <span className="text-sm font-bold text-slate-200 truncate block">{selectedSpace.properties.bezirk}</span>
                                </div>
                            </div>

                            {selectedSpace.properties.bemerkung && (
                                <div className="bg-slate-850/30 border border-slate-800/50 rounded-2xl p-4 space-y-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        {t('disabled_parking_notes')}
                                    </span>
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                        {selectedSpace.properties.bemerkung}
                                    </p>
                                </div>
                            )}

                            {selectedSpace.properties.datum && (
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5 justify-end">
                                    <span>Stand: {new Date(selectedSpace.properties.datum).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                            <Info className="w-10 h-10 text-slate-600 mb-3" />
                            <p className="text-sm text-slate-400 font-medium">{t('disabled_parking_select')}</p>
                        </div>
                    )}

                    {filteredSpaces.length > 0 && (
                        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-4 space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase px-2">{t('disabled_parking_list')}</span>
                            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                                {filteredSpaces.slice(0, 50).map((space) => (
                                    <button
                                        key={space.id}
                                        onClick={() => setSelectedSpace(space)}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-xs ${
                                            selectedSpace?.id === space.id
                                                ? 'bg-blue-600 text-white font-bold'
                                                : 'bg-slate-850/40 text-slate-300 hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <div className="truncate pr-2">
                                            <span className="block font-medium truncate">{space.properties.standort}</span>
                                            <span className={`block text-[10px] ${selectedSpace?.id === space.id ? 'text-blue-200' : 'text-slate-500'}`}>{space.properties.ortsteil}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${selectedSpace?.id === space.id ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                            {space.properties.anzahl}
                                        </span>
                                    </button>
                                ))}
                                {filteredSpaces.length > 50 && (
                                    <div className="text-[10px] text-slate-500 text-center py-2 italic">
                                        + {filteredSpaces.length - 50} weitere...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
