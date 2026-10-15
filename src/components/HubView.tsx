'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { Search, ChevronRight, Wind, Waves, Construction } from 'lucide-react';
import type { SubsidyMetrics } from '@/lib/subsidies-proxy';
import { TaxMetrics } from '@/lib/taxes';
import { getStatusFromImage, type BadestelleFeature } from '@/lib/badestellen';
import type { AirStation } from '@/lib/air-quality';
import { SESSION_CACHE } from './DashboardClient';

export interface NavItem {
    id: string;
    labelKey: string;
    icon: React.ReactNode;
    category: 'finance' | 'infrastructure' | 'society';
    priority: number;
}

interface HubViewProps {
    district: string;
    navItems: NavItem[];
    budgetVolumePromise?: Promise<any>;
    subsidiesMetricsPromise?: Promise<SubsidyMetrics>;
    taxRevenuePromise?: Promise<TaxMetrics>;
    theftCountPromise?: Promise<number>;
    onNavigate: (tab: string) => void;
    isNavigating: boolean;
}

type Format = (val?: number) => string;

// Resolves one district metric with Suspense; a missing value says so instead of showing dashes
function MetricValue({ promise, field, cacheKey, format }: {
    promise?: Promise<any>,
    field: string,
    cacheKey?: string,
    format: Format,
}) {
    if (!promise) return null;
    if (cacheKey && SESSION_CACHE[cacheKey]) {
        return <MetricText value={SESSION_CACHE[cacheKey][field]} format={format} />;
    }
    return (
        <React.Suspense fallback={<span className="inline-block w-14 h-3.5 bg-slate-700/50 animate-pulse rounded align-middle" aria-hidden="true"></span>}>
            <MetricValueInner promise={promise} field={field} cacheKey={cacheKey} format={format} />
        </React.Suspense>
    );
}

function MetricValueInner({ promise, field, cacheKey, format }: { promise: Promise<any>, field: string, cacheKey?: string, format: Format }) {
    const data = React.use(promise);
    if (cacheKey) SESSION_CACHE[cacheKey] = data;
    return <MetricText value={data ? data[field] : undefined} format={format} />;
}

function MetricText({ value, format }: { value?: number, format: Format }) {
    const { t } = useLanguage();
    return value ? <span className="text-slate-200">{format(value)}</span> : <span className="text-slate-400">{t('hub_no_value')}</span>;
}

/** Air quality index wording, 1 = very good … 6 = very poor. */
const LQI_COLORS = ['#10b981', '#84cc16', '#eab308', '#f97316', '#ef4444', '#a21caf'];

interface LiveFacts {
    air?: { average: number; worst: string } | null;
    swim?: { good: number; total: number } | null;
    works?: number | null;
}

// Three city-wide readings that change while you watch; each links into its module
function LiveStrip({ onNavigate }: { onNavigate: (tab: string) => void }) {
    const { t, language } = useLanguage();
    const [facts, setFacts] = useState<LiveFacts>({});

    useEffect(() => {
        const load = <T,>(url: string, pick: (json: any) => T, key: keyof LiveFacts) =>
            fetch(url)
                .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
                .then(json => setFacts(f => ({ ...f, [key]: pick(json) })))
                .catch(() => setFacts(f => ({ ...f, [key]: null })));

        load('/api/air-quality', (json: { stations: AirStation[] }) => {
            const rated = json.stations.filter(s => s.lqi !== null) as (AirStation & { lqi: number })[];
            if (rated.length === 0) return null;
            const worst = rated.reduce((w, s) => (s.lqi > w.lqi ? s : w));
            return { average: rated.reduce((sum, s) => sum + s.lqi, 0) / rated.length, worst: worst.name.replace(/^\d+\s*/, '') };
        }, 'air');
        load('/api/badestellen', (json: { data: BadestelleFeature[] }) => {
            const spots = Array.isArray(json.data) ? json.data : [];
            if (spots.length === 0) return null;
            const good = spots.filter(s => getStatusFromImage(s.properties.data.farbe).labelKey === 'swim_status_good').length;
            return { good, total: spots.length };
        }, 'swim');
        load('/api/baustellen', (json: { features?: unknown[] }) => json.features?.length || null, 'works');
    }, []);

    const fmt = (n: number) => n.toLocaleString(language === 'de' ? 'de-DE' : 'en-GB');
    const lqi = facts.air ? Math.min(6, Math.max(1, Math.round(facts.air.average))) : null;

    const tiles = [
        {
            tab: 'air_quality', icon: <Wind className="w-4 h-4" />, label: t('hub_live_air'), state: facts.air,
            value: facts.air && lqi ? <><span style={{ color: LQI_COLORS[lqi - 1] }}>{t(`air_lqi_${lqi}`)}</span></> : null,
            detail: facts.air ? `${t('hub_live_air_worst')} ${facts.air.worst}` : '',
        },
        {
            tab: 'badestellen', icon: <Waves className="w-4 h-4" />, label: t('hub_live_swim'), state: facts.swim,
            value: facts.swim ? `${fmt(facts.swim.good)} / ${fmt(facts.swim.total)}` : null,
            detail: t('hub_live_swim_detail'),
        },
        {
            tab: 'baustellen', icon: <Construction className="w-4 h-4" />, label: t('hub_live_works'), state: facts.works,
            value: facts.works ? fmt(facts.works) : null,
            detail: t('hub_live_works_detail'),
        },
    ];

    return (
        <section aria-label={t('hub_live_title')} className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl border border-slate-700/60 bg-slate-900/60 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/60 overflow-hidden">
            {tiles.map(tile => (
                <button
                    key={tile.tab}
                    onClick={() => onNavigate(tile.tab)}
                    className="group text-left px-5 py-4 hover:bg-slate-800/60 transition-colors"
                >
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                        {tile.icon}{tile.label}
                        <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </span>
                    <span className="block mt-1.5 text-xl font-bold text-white tabular-nums">
                        {tile.state === undefined
                            ? <span className="inline-block w-24 h-5 bg-slate-700/50 animate-pulse rounded align-middle" aria-label={t('loading')}></span>
                            : tile.value ?? <span className="text-base font-medium text-slate-400">{t('hub_no_value')}</span>}
                    </span>
                    {tile.state && <span className="block mt-0.5 text-xs text-slate-400 truncate">{tile.detail}</span>}
                </button>
            ))}
        </section>
    );
}

const CATEGORY_ACCENT: Record<NavItem['category'], string> = {
    finance: 'text-emerald-400',
    society: 'text-sky-400',
    infrastructure: 'text-amber-400',
};

export default function HubView({
    district,
    navItems,
    budgetVolumePromise,
    subsidiesMetricsPromise,
    taxRevenuePromise,
    theftCountPromise,
    onNavigate,
}: HubViewProps) {
    const { t, language } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const locale = language === 'de' ? 'de-DE' : 'en-GB';

    const categories: { id: NavItem['category']; title: string }[] = [
        { id: 'society', title: t('cat_society') },
        { id: 'infrastructure', title: t('cat_infrastructure') },
        { id: 'finance', title: t('cat_finance') },
    ];

    const formatCurrency: Format = val => (val ? new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 1, notation: 'compact' }).format(val) : '');
    const formatNumber: Format = val => (val ? new Intl.NumberFormat(locale).format(val) : '');

    // District-specific figures shown next to the modules that have one
    const metricsMap: Record<string, { label: string, value: React.ReactNode }> = {
        budget: { label: t('hub_metric_budget'), value: <MetricValue promise={budgetVolumePromise} field="budget" cacheKey={`budget-${district}`} format={formatCurrency} /> },
        subsidies: { label: t('hub_metric_subsidies'), value: <MetricValue promise={subsidiesMetricsPromise} field="totalCount" cacheKey={`subsidies-${district}`} format={formatNumber} /> },
        taxes: { label: t('hub_metric_taxes'), value: <MetricValue promise={taxRevenuePromise} field="totalMonthly" cacheKey={`taxes-${district}`} format={formatCurrency} /> },
        theft: { label: t('hub_metric_theft'), value: <MetricValue promise={theftCountPromise} field="count" format={formatNumber} /> },
    };

    const filteredItems = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return navItems;
        return navItems.filter(item =>
            t(item.labelKey).toLowerCase().includes(q) ||
            t(`desc_${item.id}`).toLowerCase().includes(q)
        );
    }, [navItems, searchQuery, t]);

    return (
        <div className="space-y-8 mt-2">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{t('hub_heading')}</h2>
                    <p className="text-slate-400 mt-1">{t('hub_subtitle')}</p>
                </div>
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
                    <input
                        type="search"
                        placeholder={t('hub_search_placeholder')}
                        aria-label={t('hub_search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-700/60 text-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:border-emerald-500/60 focus:outline-none transition-colors placeholder:text-slate-400"
                    />
                </div>
            </div>

            {!searchQuery && <LiveStrip onNavigate={onNavigate} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {categories.map(category => {
                    const items = filteredItems.filter(item => item.category === category.id);
                    if (items.length === 0) return null;
                    return (
                        <section key={category.id} className="rounded-2xl border border-slate-700/60 bg-slate-900/40">
                            <h3 className="px-5 pt-4 pb-2 text-base font-semibold text-white">{category.title}</h3>
                            <ul className="pb-2">
                                {items.map(item => (
                                    <li key={item.id}>
                                        <button
                                            onClick={() => onNavigate(item.id)}
                                            className="group w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-slate-800/60 transition-colors"
                                        >
                                            <span className={`mt-0.5 shrink-0 ${CATEGORY_ACCENT[item.category]} [&>svg]:w-5 [&>svg]:h-5`}>{item.icon}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-baseline justify-between gap-3">
                                                    <span className="font-semibold text-slate-100 group-hover:text-white">{t(item.labelKey)}</span>
                                                    {metricsMap[item.id] && (
                                                        <span className="text-xs tabular-nums shrink-0" title={metricsMap[item.id].label}>{metricsMap[item.id].value}</span>
                                                    )}
                                                </span>
                                                <span className="block text-sm text-slate-400 leading-snug mt-0.5">{t(`desc_${item.id}`)}</span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    );
                })}
            </div>

            {filteredItems.length === 0 && (
                <p className="text-center py-12 text-slate-400">{t('hub_no_match')}</p>
            )}
        </div>
    );
}
