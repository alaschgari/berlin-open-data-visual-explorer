'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, WMSTileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Volume2, Moon, Sun, Trees, Info } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import {
    HEALTH_THRESHOLD_DB,
    legendUrl,
    NOISE_SOURCES,
    NOISE_WMS_URL,
    noiseLayer,
    QUIET_AREAS_LAYER,
    QUIET_AREAS_WMS_URL,
    type NoisePeriod,
    type NoiseSource,
} from '@/lib/noise';
import { BASEMAP_URL, BASEMAP_ATTRIBUTION, BASEMAP_MAX_ZOOM } from '@/lib/basemap';

const WMS_ATTRIBUTION = '&copy; <a href="https://www.berlin.de/umweltatlas/">Umweltatlas Berlin</a>';

export default function NoiseMapClient() {
    const { t } = useLanguage();
    const [period, setPeriod] = useState<NoisePeriod>('den');
    const [source, setSource] = useState<NoiseSource>('total');
    const [showQuietAreas, setShowQuietAreas] = useState(false);
    const [opacity, setOpacity] = useState(0.7);

    const layer = noiseLayer(source, period);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-emerald-400" />
                    {t('noise_title')}
                </h2>
                <p className="text-sm text-slate-400 mt-1">{t('noise_subtitle')}</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Map */}
                <div className="flex-1 h-[600px] rounded-3xl overflow-hidden border border-slate-700/50">
                    <MapContainer center={[52.52, 13.405]} zoom={11} minZoom={10} className="h-full w-full" style={{ background: '#0f172a' }}>
                        <TileLayer
                            url={BASEMAP_URL}
                            maxNativeZoom={BASEMAP_MAX_ZOOM}
                            attribution={BASEMAP_ATTRIBUTION}
                        />
                        {/* key forces a fresh layer when the WMS layer changes */}
                        <WMSTileLayer
                            key={layer}
                            url={NOISE_WMS_URL}
                            params={{ layers: layer, format: 'image/png', transparent: true, version: '1.3.0' }}
                            opacity={opacity}
                            attribution={WMS_ATTRIBUTION}
                        />
                        {showQuietAreas && (
                            <WMSTileLayer
                                url={QUIET_AREAS_WMS_URL}
                                params={{ layers: QUIET_AREAS_LAYER, format: 'image/png', transparent: true, version: '1.3.0' }}
                                opacity={0.8}
                                attribution={WMS_ATTRIBUTION}
                            />
                        )}
                    </MapContainer>
                </div>

                {/* Controls */}
                <div className="w-full lg:w-96 bg-slate-900/50 rounded-3xl border border-slate-700/50 p-6 space-y-6 overflow-y-auto lg:max-h-[600px]">
                    <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">{t('noise_period')}</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {([['den', Sun], ['n', Moon]] as const).map(([p, Icon]) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${period === p ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {t(`noise_period_${p}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">{t('noise_source')}</h3>
                        <div className="space-y-1.5">
                            {NOISE_SOURCES.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSource(s)}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${source === s ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
                                >
                                    {t(`noise_source_${s}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center justify-between gap-3 cursor-pointer">
                            <span className="flex items-center gap-2 text-sm text-slate-300">
                                <Trees className="w-4 h-4 text-emerald-400" />
                                {t('noise_quiet_areas')}
                            </span>
                            <input
                                type="checkbox"
                                checked={showQuietAreas}
                                onChange={e => setShowQuietAreas(e.target.checked)}
                                className="w-4 h-4 accent-emerald-500"
                            />
                        </label>
                        <label className="block">
                            <span className="flex justify-between text-xs text-slate-400 mb-1.5">
                                <span>{t('noise_opacity')}</span>
                                <span>{Math.round(opacity * 100)}%</span>
                            </span>
                            <input
                                type="range"
                                min={0.2}
                                max={1}
                                step={0.05}
                                value={opacity}
                                onChange={e => setOpacity(Number(e.target.value))}
                                className="w-full accent-emerald-500"
                            />
                        </label>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">{t('noise_legend')}</h3>
                        {/* Legend is rendered by the WMS server; white background keeps its dark text readable */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={legendUrl(layer)} alt={t('noise_legend')} className="rounded-lg bg-white p-2 max-w-full" loading="lazy" />
                    </div>

                    <div className="flex gap-2 text-xs text-slate-400 bg-slate-800/40 rounded-xl p-3">
                        <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                        <p>
                            {t(`noise_hint_${period}`).replace('{db}', String(HEALTH_THRESHOLD_DB[period]))}
                        </p>
                    </div>
                </div>
            </div>

            <p className="text-center text-xs text-slate-500">{t('noise_source_note')}</p>
        </div>
    );
}
