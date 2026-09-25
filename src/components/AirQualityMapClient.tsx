'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import { Wind, Clock, MapPin, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { POLLUTANTS, type AirMeasurement, type AirStation, type Pollutant, type StationCategory } from '@/lib/air-quality';

/** Berlin air quality index: 1 = very good … 6 = very bad. */
const LQI_LEVELS: Record<number, { color: string; labelKey: string }> = {
    1: { color: '#10b981', labelKey: 'air_lqi_1' },
    2: { color: '#84cc16', labelKey: 'air_lqi_2' },
    3: { color: '#eab308', labelKey: 'air_lqi_3' },
    4: { color: '#f97316', labelKey: 'air_lqi_4' },
    5: { color: '#ef4444', labelKey: 'air_lqi_5' },
    6: { color: '#a21caf', labelKey: 'air_lqi_6' },
};
const NO_DATA_COLOR = '#64748b';

const POLLUTANT_LABELS: Record<Pollutant, string> = { pm10: 'PM₁₀', pm2: 'PM₂,₅', no2: 'NO₂', o3: 'O₃' };
const CATEGORIES: StationCategory[] = ['traffic', 'background', 'suburb'];

const lqiLevel = (lqi: number | null) => (lqi !== null ? LQI_LEVELS[Math.round(lqi)] : undefined);

export default function AirQualityMapClient() {
    const { t, language } = useLanguage();
    const locale = language === 'de' ? 'de-DE' : 'en-GB';

    const [stations, setStations] = useState<AirStation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [category, setCategory] = useState<StationCategory | 'all'>('all');
    const [selected, setSelected] = useState<AirStation | null>(null);
    const [series, setSeries] = useState<AirMeasurement[]>([]);
    const [seriesLoading, setSeriesLoading] = useState(false);
    const [pollutant, setPollutant] = useState<Pollutant>('no2');

    useEffect(() => {
        fetch('/api/air-quality')
            .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
            .then((data: { stations: AirStation[] }) => setStations(data.stations))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selected) return;
        let cancelled = false;
        setSeriesLoading(true);
        fetch(`/api/air-quality/${selected.code}`)
            .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
            .then((data: { series: AirMeasurement[] }) => { if (!cancelled) setSeries(data.series); })
            .catch(() => { if (!cancelled) setSeries([]); })
            .finally(() => { if (!cancelled) setSeriesLoading(false); });
        return () => { cancelled = true; };
    }, [selected]);

    const visible = useMemo(
        () => stations.filter(s => category === 'all' || s.category === category),
        [stations, category]
    );

    const stats = useMemo(() => {
        const withIndex = visible.filter((s): s is AirStation & { lqi: number } => s.lqi !== null);
        const worst = withIndex.reduce<(AirStation & { lqi: number }) | null>((w, s) => (!w || s.lqi > w.lqi ? s : w), null);
        const average = withIndex.length ? withIndex.reduce((sum, s) => sum + s.lqi, 0) / withIndex.length : null;
        const measuredAt = stations.find(s => s.measuredAt)?.measuredAt ?? null;
        return { reporting: withIndex.length, worst, average, measuredAt };
    }, [visible, stations]);

    const chartData = useMemo(() => series
        .filter(m => m.pollutant === pollutant)
        .map(m => ({
            time: new Date(m.datetime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
            value: m.value,
        })), [series, pollutant, locale]);

    const availablePollutants = useMemo(
        () => POLLUTANTS.filter(p => series.some(m => m.pollutant === p)),
        [series]
    );

    useEffect(() => {
        if (availablePollutants.length && !availablePollutants.includes(pollutant)) setPollutant(availablePollutants[0]);
    }, [availablePollutants, pollutant]);

    if (loading) {
        return (
            <div className="h-[600px] flex items-center justify-center bg-slate-800/50 rounded-3xl border border-slate-700">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-medium">{t('loading')}</p>
                </div>
            </div>
        );
    }

    if (error || stations.length === 0) {
        return <div className="h-[600px] flex items-center justify-center text-rose-400 bg-slate-800/50 rounded-3xl border border-slate-700">{t('air_error')}</div>;
    }

    const worstLevel = lqiLevel(stats.worst?.lqi ?? null);

    return (
        <div className="space-y-6">
            {/* Header with stats and filters */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Wind className="w-5 h-5 text-emerald-400" />
                            {t('air_title')}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">{t('air_subtitle')}</p>
                        {stats.measuredAt && (
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {t('air_measured_at')} {new Date(stats.measuredAt).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-slate-800/50 border border-slate-700/50 rounded-2xl p-1">
                            {(['all', ...CATEGORIES] as const).map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCategory(c)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${category === c ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {t(`air_category_${c}`)}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 bg-slate-800/40 border border-slate-700/30 rounded-2xl px-4 py-2.5">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{t('air_stations')}</span>
                                <span className="text-sm font-black text-white">{stats.reporting} / {visible.length}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-700/40"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{t('air_average')}</span>
                                <span className="text-sm font-black text-white">{stats.average !== null ? stats.average.toFixed(1) : '–'}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-700/40"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{t('air_worst')}</span>
                                <span className="text-sm font-black" style={{ color: worstLevel?.color ?? NO_DATA_COLOR }}>
                                    {stats.worst ? stats.worst.name.replace(/^\d+\s*/, '') : '–'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Map */}
                <div className="flex-1 h-[560px] rounded-3xl overflow-hidden border border-slate-700/50 relative">
                    <MapContainer center={[52.52, 13.405]} zoom={11} className="h-full w-full" style={{ background: '#0f172a' }}>
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />
                        {visible.map(station => {
                            const level = lqiLevel(station.lqi);
                            const isSelected = selected?.code === station.code;
                            return (
                                <CircleMarker
                                    key={station.code}
                                    center={[station.lat, station.lng]}
                                    radius={isSelected ? 14 : 10}
                                    pathOptions={{
                                        color: isSelected ? '#ffffff' : '#0f172a',
                                        weight: isSelected ? 3 : 2,
                                        fillColor: level?.color ?? NO_DATA_COLOR,
                                        fillOpacity: 0.9,
                                    }}
                                    eventHandlers={{ click: () => setSelected(station) }}
                                >
                                    <Tooltip direction="top">
                                        <div className="text-xs font-bold">{station.name}</div>
                                        <div className="text-[10px]">{level ? t(level.labelKey) : t('air_no_index')}</div>
                                    </Tooltip>
                                </CircleMarker>
                            );
                        })}
                    </MapContainer>

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 border border-slate-700/50 rounded-2xl p-3 space-y-1.5">
                        {Object.entries(LQI_LEVELS).map(([value, level]) => (
                            <div key={value} className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: level.color }}></span>
                                <span className="text-[10px] font-bold text-slate-300">{value} · {t(level.labelKey)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-full lg:w-96 bg-slate-900/50 rounded-3xl border border-slate-700/50 flex flex-col overflow-hidden">
                    {selected ? (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-slate-700/50 flex justify-between items-start gap-4">
                                <div>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t(`air_category_${selected.category}`)}</span>
                                    <h3 className="text-lg font-bold text-white leading-tight">{selected.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{selected.address}</p>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white" aria-label={t('air_close')}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-900"
                                        style={{ backgroundColor: lqiLevel(selected.lqi)?.color ?? NO_DATA_COLOR }}
                                    >
                                        {selected.lqi ?? '–'}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">{t('air_index')}</p>
                                        <p className="text-base font-bold text-white">{lqiLevel(selected.lqi) ? t(lqiLevel(selected.lqi)!.labelKey) : t('air_no_index')}</p>
                                    </div>
                                </div>

                                {Object.keys(selected.pollutantIndex).length > 0 && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(selected.pollutantIndex).map(([key, value]) => (
                                            <div key={key} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2">
                                                <span className="text-xs font-bold text-slate-400">{POLLUTANT_LABELS[key as Pollutant] ?? key.toUpperCase()}</span>
                                                <span className="text-xs font-black" style={{ color: LQI_LEVELS[value]?.color ?? NO_DATA_COLOR }}>{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-bold text-white uppercase tracking-widest">{t('air_last_hours')}</h4>
                                        <div className="flex gap-1">
                                            {availablePollutants.map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setPollutant(p)}
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${pollutant === p ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                                >
                                                    {POLLUTANT_LABELS[p]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-48">
                                        {seriesLoading ? (
                                            <div className="h-full flex items-center justify-center text-xs text-slate-500">{t('loading')}</div>
                                        ) : chartData.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-xs text-slate-500">{t('air_no_series')}</div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                                    <CartesianGrid stroke="#1e293b" vertical={false} />
                                                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={24} />
                                                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                                    <RechartsTooltip
                                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: 11 }}
                                                        formatter={(value) => [`${value} µg/m³`, POLLUTANT_LABELS[pollutant]]}
                                                    />
                                                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2">{t('air_unit_hint')}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-slate-700/50">
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest">{t('air_ranking')}</h3>
                                <p className="text-xs text-slate-500 mt-1">{t('air_select_hint')}</p>
                            </div>
                            <div className="overflow-y-auto divide-y divide-slate-800/60">
                                {[...visible]
                                    .sort((a, b) => (b.lqi ?? -1) - (a.lqi ?? -1))
                                    .map(station => {
                                        const level = lqiLevel(station.lqi);
                                        return (
                                            <button
                                                key={station.code}
                                                onClick={() => setSelected(station)}
                                                className="w-full flex items-center justify-between gap-3 px-6 py-3 text-left hover:bg-slate-800/40 transition-colors"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-200 truncate">{station.name}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase">{t(`air_category_${station.category}`)}</p>
                                                </div>
                                                <span
                                                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-slate-900"
                                                    style={{ backgroundColor: level?.color ?? NO_DATA_COLOR }}
                                                >
                                                    {station.lqi ?? '–'}
                                                </span>
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <p className="text-center text-xs text-slate-500">{t('air_source')}</p>
        </div>
    );
}
