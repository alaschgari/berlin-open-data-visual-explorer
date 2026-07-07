import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, useMap } from 'react-leaflet';
import { Info, Settings, Layers, Eye } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from './LanguageContext';

interface LayerOption {
    id: string;
    labelDe: string;
    labelEn: string;
    category: 'versorgungsgebiete' | 'bestand' | 'potenzial';
}

const LAYERS: LayerOption[] = [
    // Wärmeversorgungsgebiete
    { id: '3_0_waermeversorgungsgeb_2025', labelDe: 'Wärmeversorgungsgebiete 2025 (Status Quo)', labelEn: 'Heat Supply Areas 2025 (Status Quo)', category: 'versorgungsgebiete' },
    { id: '3_1_waermeversorgungsgeb_2030', labelDe: 'Wärmeversorgungsgebiete 2030', labelEn: 'Heat Supply Areas 2030', category: 'versorgungsgebiete' },
    { id: '3_2_waermeversorgungsgeb_2035', labelDe: 'Wärmeversorgungsgebiete 2035', labelEn: 'Heat Supply Areas 2035', category: 'versorgungsgebiete' },
    { id: '3_3_waermeversorgungsgeb_2040', labelDe: 'Wärmeversorgungsgebiete 2040', labelEn: 'Heat Supply Areas 2040', category: 'versorgungsgebiete' },
    { id: '3_4_waermeversorgungsgeb_2045', labelDe: 'Wärmeversorgungsgebiete 2045', labelEn: 'Heat Supply Areas 2045', category: 'versorgungsgebiete' },
    // Bestandsanalyse
    { id: '1_1_waermeverbrauchsdichte', labelDe: 'Wärmeverbrauchsdichte (MWh/ha)', labelEn: 'Heat Consumption Density (MWh/ha)', category: 'bestand' },
    { id: '1_2_waermeliniendichte', labelDe: 'Wärmeliniendichte (kWh/m)', labelEn: 'Heat Line Density (kWh/m)', category: 'bestand' },
    { id: '1_3_0_verbrauch_hauptquelle', labelDe: 'Hauptenergieträger des Baublocks', labelEn: 'Main Energy Source of Block', category: 'bestand' },
    // Potenzialanalyse
    { id: '2_2_geothermie_hinweise', labelDe: 'Hinweise Geothermienutzung', labelEn: 'Geothermal Energy Use Notes', category: 'potenzial' },
    { id: '2_4_potenzial_geothermie', labelDe: 'Geothermiepotenzial für Wärmenetze', labelEn: 'Geothermal Potential for Heat Networks', category: 'potenzial' },
    { id: '2_3_potenzial_solarthermie_isu5', labelDe: 'Solarthermiepotenzial (Baublock)', labelEn: 'Solar Thermal Potential (Block)', category: 'potenzial' },
];

// Map controller to handle zoom / bounds if needed.
function MapController({ district }: { district?: string }) {
    const map = useMap();
    useEffect(() => {
        // Berlin center default view
        map.setView([52.5200, 13.4050], 11);
    }, [map]);
    return null;
}

export default function WaermeplanungMapClient({ district }: { district?: string }) {
    const { t, language } = useLanguage();
    const [selectedLayer, setSelectedLayer] = useState<string>('3_0_waermeversorgungsgeb_2025');
    const [opacity, setOpacity] = useState<number>(0.75);

    const legendUrl = `https://gdi.berlin.de/services/wms/waermeplanung?VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${selectedLayer}&SLD_VERSION=1.1.0`;

    const activeLayerObj = LAYERS.find(l => l.id === selectedLayer);
    const activeLayerTitle = activeLayerObj ? (language === 'de' ? activeLayerObj.labelDe : activeLayerObj.labelEn) : '';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                        <Layers className="w-6 h-6 text-emerald-400" />
                        {t('tab_waermeplanung')}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
                        {t('desc_waermeplanung')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Control Panel (Sidebar) */}
                <div className="lg:col-span-1 space-y-6 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                            <Settings className="w-4 h-4 text-emerald-400" />
                            <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">{t('layer')}</h3>
                        </div>

                        {/* Category Versorgungsgebiete */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
                                {language === 'de' ? 'Wärmeversorgungsgebiete' : 'Heat Supply Areas'}
                            </h4>
                            <div className="space-y-1">
                                {LAYERS.filter(l => l.category === 'versorgungsgebiete').map(layer => (
                                    <button
                                        key={layer.id}
                                        onClick={() => setSelectedLayer(layer.id)}
                                        className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all ${
                                            selectedLayer === layer.id
                                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                                                : 'bg-slate-800/20 border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40'
                                        }`}
                                    >
                                        {language === 'de' ? layer.labelDe : layer.labelEn}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Bestand */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
                                {language === 'de' ? 'Bestandsanalyse' : 'Current State Analysis'}
                            </h4>
                            <div className="space-y-1">
                                {LAYERS.filter(l => l.category === 'bestand').map(layer => (
                                    <button
                                        key={layer.id}
                                        onClick={() => setSelectedLayer(layer.id)}
                                        className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all ${
                                            selectedLayer === layer.id
                                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                                                : 'bg-slate-800/20 border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40'
                                        }`}
                                    >
                                        {language === 'de' ? layer.labelDe : layer.labelEn}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Potenzial */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
                                {language === 'de' ? 'Potenzialanalyse' : 'Potential Analysis'}
                            </h4>
                            <div className="space-y-1">
                                {LAYERS.filter(l => l.category === 'potenzial').map(layer => (
                                    <button
                                        key={layer.id}
                                        onClick={() => setSelectedLayer(layer.id)}
                                        className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all ${
                                            selectedLayer === layer.id
                                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                                                : 'bg-slate-800/20 border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40'
                                        }`}
                                    >
                                        {language === 'de' ? layer.labelDe : layer.labelEn}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Opacity Control */}
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                {t('opacity')}
                            </span>
                            <span className="font-mono text-emerald-400 font-bold">{Math.round(opacity * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={opacity}
                            onChange={(e) => setOpacity(parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>

                    {/* Legend */}
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <Info className="w-3.5 h-3.5 text-slate-500" />
                            {t('legend')}
                        </span>
                        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-center min-h-[60px] overflow-auto max-h-[250px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={legendUrl}
                                alt={`Legend for ${activeLayerTitle}`}
                                className="max-w-full h-auto brightness-90 contrast-125 filter invert"
                                style={{ mixBlendMode: 'color-dodge' }}
                                onError={(e) => {
                                    // Fallback if invert style/image loading fails or is hard to see in dark mode
                                    (e.target as HTMLElement).className = 'max-w-full h-auto brightness-100';
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Map Area */}
                <div className="lg:col-span-3 h-[600px] w-full rounded-2xl overflow-hidden border border-slate-800 relative z-0">
                    <MapContainer
                        center={[52.5200, 13.4050]}
                        zoom={11}
                        className="h-full w-full"
                        aria-label="Wärmeplanung WMS Map"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <WMSTileLayer
                            url="https://gdi.berlin.de/services/wms/waermeplanung"
                            params={{
                                layers: selectedLayer,
                                format: 'image/png',
                                transparent: true,
                                version: '1.3.0',
                            }}
                            opacity={opacity}
                        />
                        <MapController district={district} />
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}
