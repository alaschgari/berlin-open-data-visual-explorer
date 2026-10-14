'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GraduationCap, MapPin, Search, X, ExternalLink } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import type { Facility, FacilityKind } from '@/lib/education';
import { BASEMAP_URL, BASEMAP_ATTRIBUTION, BASEMAP_MAX_ZOOM } from '@/lib/basemap';

const KIND_COLORS: Record<FacilityKind, string> = { kita: '#f59e0b', school: '#38bdf8' };
type KindFilter = FacilityKind | 'all';

export default function EducationMapClient() {
    const { t, language } = useLanguage();
    const locale = language === 'de' ? 'de-DE' : 'en-GB';
    const fmt = (n: number) => n.toLocaleString(locale);

    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [kind, setKind] = useState<KindFilter>('all');
    const [district, setDistrict] = useState('all');
    const [type, setType] = useState('all');
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Facility | null>(null);

    useEffect(() => {
        fetch('/api/education')
            .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
            .then((data: { facilities: Facility[] }) => setFacilities(data.facilities))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    // Reset the type filter when it no longer applies to the chosen kind
    useEffect(() => setType('all'), [kind]);

    const districts = useMemo(
        () => [...new Set(facilities.map(f => f.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de')),
        [facilities]
    );

    const types = useMemo(() => {
        const counts = new Map<string, number>();
        facilities
            .filter(f => (kind === 'all' || f.kind === kind) && f.type)
            .forEach(f => counts.set(f.type, (counts.get(f.type) ?? 0) + 1));
        return [...counts.entries()].sort((a, b) => b[1] - a[1]);
    }, [facilities, kind]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return facilities.filter(f =>
            (kind === 'all' || f.kind === kind) &&
            (district === 'all' || f.district === district) &&
            (type === 'all' || f.type === type) &&
            (!q || f.name.toLowerCase().includes(q) || f.address.toLowerCase().includes(q))
        );
    }, [facilities, kind, district, type, query]);

    const stats = useMemo(() => {
        const kitas = visible.filter(f => f.kind === 'kita');
        return {
            kitas: kitas.length,
            schools: visible.length - kitas.length,
            places: kitas.reduce((sum, f) => sum + (f.places ?? 0), 0),
        };
    }, [visible]);

    const byDistrict = useMemo(() => {
        const rows = new Map<string, { kitas: number; places: number; schools: number }>();
        visible.forEach(f => {
            const row = rows.get(f.district) ?? { kitas: 0, places: 0, schools: 0 };
            if (f.kind === 'kita') {
                row.kitas += 1;
                row.places += f.places ?? 0;
            } else {
                row.schools += 1;
            }
            rows.set(f.district, row);
        });
        return [...rows.entries()].sort((a, b) => (b[1].kitas + b[1].schools) - (a[1].kitas + a[1].schools));
    }, [visible]);

    const maxPlaces = Math.max(1, ...byDistrict.map(([, r]) => r.places));

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

    if (error || facilities.length === 0) {
        return <div className="h-[600px] flex items-center justify-center text-rose-400 bg-slate-800/50 rounded-3xl border border-slate-700">{t('edu_error')}</div>;
    }

    const selectClass = 'bg-slate-800/50 border border-slate-700/50 rounded-2xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500';

    return (
        <div className="space-y-6">
            {/* Header with stats and filters */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-emerald-400" />
                            {t('edu_title')}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">{t('edu_subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-800/40 border border-slate-700/30 rounded-2xl px-4 py-2.5">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{t('edu_kitas')}</span>
                            <span className="text-sm font-black" style={{ color: KIND_COLORS.kita }}>{fmt(stats.kitas)}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-700/40"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{t('edu_places')}</span>
                            <span className="text-sm font-black text-white">{fmt(stats.places)}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-700/40"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{t('edu_schools')}</span>
                            <span className="text-sm font-black" style={{ color: KIND_COLORS.school }}>{fmt(stats.schools)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-800/50 border border-slate-700/50 rounded-2xl p-1">
                        {(['all', 'kita', 'school'] as const).map(k => (
                            <button
                                key={k}
                                onClick={() => setKind(k)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${kind === k ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
                            >
                                {t(`edu_kind_${k}`)}
                            </button>
                        ))}
                    </div>
                    <select value={district} onChange={e => setDistrict(e.target.value)} className={selectClass} aria-label={t('edu_district')}>
                        <option value="all">{t('edu_all_districts')}</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={type} onChange={e => setType(e.target.value)} className={selectClass} aria-label={t('edu_type')}>
                        <option value="all">{t('edu_all_types')}</option>
                        {types.map(([name, count]) => <option key={name} value={name}>{name} ({fmt(count)})</option>)}
                    </select>
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder={t('edu_search')}
                            className={`${selectClass} w-full pl-8`}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Map */}
                <div className="flex-1 h-[560px] rounded-3xl overflow-hidden border border-slate-700/50 relative">
                    <MapContainer center={[52.52, 13.405]} zoom={11} preferCanvas className="h-full w-full" style={{ background: '#0f172a' }}>
                        <TileLayer url={BASEMAP_URL} maxNativeZoom={BASEMAP_MAX_ZOOM} attribution={BASEMAP_ATTRIBUTION} />
                        {visible.map(f => {
                            const isSelected = selected?.id === f.id;
                            return (
                                <CircleMarker
                                    key={f.id}
                                    center={[f.lat, f.lng]}
                                    radius={isSelected ? 9 : 4}
                                    pathOptions={{
                                        color: isSelected ? '#ffffff' : KIND_COLORS[f.kind],
                                        weight: isSelected ? 3 : 1,
                                        fillColor: KIND_COLORS[f.kind],
                                        fillOpacity: 0.75,
                                    }}
                                    eventHandlers={{ click: () => setSelected(f) }}
                                >
                                    <Tooltip direction="top">
                                        <div className="text-xs font-bold">{f.name}</div>
                                        <div className="text-[10px]">{f.type}</div>
                                    </Tooltip>
                                </CircleMarker>
                            );
                        })}
                    </MapContainer>

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 border border-slate-700/50 rounded-2xl p-3 space-y-1.5">
                        {(['kita', 'school'] as const).map(k => (
                            <div key={k} className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: KIND_COLORS[k] }}></span>
                                <span className="text-[10px] font-bold text-slate-300">{t(`edu_kind_${k}`)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-full lg:w-96 h-[560px] bg-slate-900/50 rounded-3xl border border-slate-700/50 flex flex-col overflow-hidden">
                    {selected ? (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-slate-700/50 flex justify-between items-start gap-4">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: KIND_COLORS[selected.kind] }}>{selected.type}</span>
                                    <h3 className="text-lg font-bold text-white leading-tight">{selected.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{selected.address}</p>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white" aria-label={t('air_close')}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-6 space-y-3 text-sm">
                                <div className="flex justify-between gap-4"><span className="text-slate-500">{t('edu_district')}</span><span className="text-slate-200 font-bold text-right">{selected.district}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-slate-500">{t('edu_provider')}</span><span className="text-slate-200 font-bold text-right">{selected.provider || '–'}</span></div>
                                {selected.kind === 'kita' && (
                                    <div className="flex justify-between gap-4"><span className="text-slate-500">{t('edu_places')}</span><span className="text-slate-200 font-bold">{selected.places !== null ? fmt(selected.places) : '–'}</span></div>
                                )}
                                {selected.website && (
                                    <a href={selected.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs font-bold pt-2">
                                        <ExternalLink className="w-3.5 h-3.5" />{t('edu_website')}
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-slate-700/50">
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest">{t('edu_by_district')}</h3>
                                <p className="text-xs text-slate-500 mt-1">{t('edu_select_hint')}</p>
                            </div>
                            <div className="overflow-y-auto divide-y divide-slate-800/60">
                                {byDistrict.map(([name, row]) => (
                                    <button
                                        key={name}
                                        onClick={() => setDistrict(district === name ? 'all' : name)}
                                        className={`w-full px-6 py-3 text-left hover:bg-slate-800/40 transition-colors ${district === name ? 'bg-slate-800/40' : ''}`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm font-bold text-slate-200 truncate">{name || '–'}</span>
                                            <span className="text-[11px] text-slate-400 shrink-0">
                                                <span style={{ color: KIND_COLORS.kita }}>{fmt(row.kitas)}</span>
                                                {' · '}
                                                <span style={{ color: KIND_COLORS.school }}>{fmt(row.schools)}</span>
                                            </span>
                                        </div>
                                        {row.places > 0 && (
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${(row.places / maxPlaces) * 100}%`, backgroundColor: KIND_COLORS.kita }}></div>
                                                </div>
                                                <span className="text-[10px] text-slate-500 w-24 text-right">{fmt(row.places)} {t('edu_places_short')}</span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <p className="text-center text-xs text-slate-500">{t('edu_source')}</p>
        </div>
    );
}
