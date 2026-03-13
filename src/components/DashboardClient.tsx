'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import DistrictSelector from '@/components/DistrictSelector';
import SubsidiesView from '@/components/SubsidiesView';
import BudgetExplorerView from '@/components/BudgetExplorerView';
import HistoricBudgetView from '@/components/HistoricBudgetView';
import TaxRevenueView from '@/components/TaxRevenueView';
import BicycleTheftMap from '@/components/BicycleTheftMapWrapper';
import PopulationMapWrapper from '@/components/PopulationMapWrapper';
import BusinessMapWrapper from '@/components/BusinessMapWrapper';
import WastewaterView from '@/components/WastewaterView';
import BadestellenWrapper from '@/components/BadestellenWrapper';
import TrafficView from '@/components/TrafficView';
import MarketsMapWrapper from '@/components/MarketsMapWrapper';
import BaustellenMapWrapper from '@/components/BaustellenMapWrapper';
import HubView from '@/components/HubView';
import { WastewaterRecord } from '@/lib/wastewater';
import { ChevronDown, BarChart3, Shield, Waves, PieChart, Users, Building2, Droplets, ShoppingBag, LayoutGrid } from 'lucide-react';

import { SubsidyMetrics } from '@/lib/subsidies-proxy';
import { SubsidyRecord } from '@/lib/parser';
import { TaxMetrics } from '@/lib/taxes';

import { useRouter } from 'next/navigation';
import { CardSkeleton, ChartSkeleton, SubsidiesListSkeleton, MapSkeleton } from '@/components/SkeletonCards';

interface DashboardClientProps {
    district: string;
    activeTab: 'hub' | 'budget' | 'subsidies' | 'theft' | 'demographics' | 'business' | 'taxes' | 'wastewater' | 'badestellen' | 'traffic' | 'markets' | 'baustellen';
    budgetMode: 'historic' | 'explorer';
    lastSync: string | null;
    districts: string[];
    // Data promises for streaming
    dataPromise: Promise<any>;
    timelinePromise: Promise<any[]>;
    topChaptersPromise: Promise<any[]>;
    subsidiesMetricsPromise: Promise<SubsidyMetrics>;
    subsidiesListPromise: Promise<SubsidyRecord[]>;
    taxMetricsPromise: Promise<TaxMetrics>;
    wastewaterDataPromise: Promise<WastewaterRecord[]>;
    theftCountPromise: Promise<number>;
}

// Local cache-enabled AsyncView implemented inside DashboardClient

type TabType = 'hub' | 'budget' | 'subsidies' | 'theft' | 'demographics' | 'business' | 'taxes' | 'wastewater' | 'badestellen' | 'traffic' | 'markets' | 'baustellen';

interface NavItem {
    id: TabType;
    labelKey: string;
    icon: React.ReactNode;
    category: 'finance' | 'infrastructure' | 'society';
    priority: number;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'subsidies', labelKey: 'tab_subsidies', icon: <BarChart3 className="w-3.5 h-3.5" />, category: 'finance', priority: 1 },
    { id: 'taxes', labelKey: 'tab_taxes', icon: <PieChart className="w-3.5 h-3.5" />, category: 'finance', priority: 2 },
    { id: 'budget', labelKey: 'tab_budget', icon: <BarChart3 className="w-3.5 h-3.5" />, category: 'finance', priority: 3 },
    { id: 'theft', labelKey: 'tab_theft', icon: <Shield className="w-3.5 h-3.5" />, category: 'society', priority: 4 },
    { id: 'demographics', labelKey: 'tab_demographics', icon: <Users className="w-3.5 h-3.5" />, category: 'society', priority: 5 },
    { id: 'badestellen', labelKey: 'tab_badestellen', icon: <Waves className="w-3.5 h-3.5" />, category: 'society', priority: 6 },
    { id: 'business', labelKey: 'tab_business', icon: <Building2 className="w-3.5 h-3.5" />, category: 'infrastructure', priority: 7 },
    { id: 'wastewater', labelKey: 'tab_wastewater', icon: <Droplets className="w-3.5 h-3.5" />, category: 'infrastructure', priority: 8 },
    { id: 'traffic', labelKey: 'tab_traffic', icon: <BarChart3 className="w-3.5 h-3.5" />, category: 'infrastructure', priority: 9 },
    { id: 'baustellen', labelKey: 'tab_baustellen', icon: <Shield className="w-3.5 h-3.5" />, category: 'infrastructure', priority: 10 },
    { id: 'markets', labelKey: 'tab_markets', icon: <ShoppingBag className="w-3.5 h-3.5" />, category: 'society', priority: 11 },
];

// Client-side persistent cache for resolved promises (module level singleton)
export const SESSION_CACHE: Record<string, any> = {};

// Internal component to resolve promises with Suspense and client-side caching
function AsyncView({ promise, cacheKey, children }: {
    promise: Promise<any>,
    cacheKey: string,
    children: (data: any) => React.ReactNode
}) {
    // If we already have the data in cache, render it immediately
    if (SESSION_CACHE[cacheKey]) {
        return <>{children(SESSION_CACHE[cacheKey])}</>;
    }

    return (
        <React.Suspense fallback={<ChartSkeleton />}>
            <AsyncViewInner
                promise={promise}
                cacheKey={cacheKey}
            >
                {children}
            </AsyncViewInner>
        </React.Suspense>
    );
}

function AsyncViewInner({ promise, cacheKey, children }: {
    promise: Promise<any>,
    cacheKey: string,
    children: (data: any) => React.ReactNode
}) {
    const data = React.use(promise);

    // Save to global cache once resolved
    SESSION_CACHE[cacheKey] = data;

    return <>{children(data)}</>;
}

export default function DashboardClient({
    district,
    activeTab,
    budgetMode,
    lastSync,
    districts,
    dataPromise,
    timelinePromise,
    topChaptersPromise,
    subsidiesMetricsPromise,
    subsidiesListPromise,
    taxMetricsPromise,
    wastewaterDataPromise,
    theftCountPromise
}: DashboardClientProps) {
    const router = useRouter();
    const { t } = useLanguage();
    const [isPending, startTransition] = React.useTransition();

    // Reset cache when district changes
    React.useEffect(() => {
        Object.keys(SESSION_CACHE).forEach(key => delete SESSION_CACHE[key]);
    }, [district]);

    return (
        <main className={`min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-[family-name:var(--font-geist-sans)] transition-opacity duration-300 ${isPending ? 'opacity-70' : 'opacity-100'}`} aria-label={t('brand_name')}>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Unified Premium Header */}
                <header className="relative z-[2000] flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-visible">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0" suppressHydrationWarning>
                            <svg className="w-7 h-7 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight leading-none mb-1.5">
                                {t('brand_name')}
                            </h1>
                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">{t('brand_sub')}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center justify-end">
                        <LanguageToggle />

                        <div className="h-8 w-px bg-slate-700/50 hidden sm:block"></div>

                        {activeTab !== 'hub' && (
                            <>
                                <button
                                    onClick={() => startTransition(() => {
                                        router.push(`/?tab=hub&district=${district}`);
                                    })}
                                    disabled={isPending}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all font-bold text-xs shadow-inner w-full sm:w-auto disabled:opacity-50"
                                    suppressHydrationWarning
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                    <span>{t('back_to_hub')}</span>
                                </button>
                                <div className="h-8 w-px bg-slate-700/50 hidden sm:block"></div>
                            </>
                        )}

                        <div className="w-full sm:w-auto">
                            <DistrictSelector currentDistrict={district} districts={districts} activeTab={activeTab} />
                        </div>
                    </div>
                </header>

                <div className="min-h-[600px]">
                    {
                        activeTab === 'budget' ? (
                            <div className="space-y-6">
                                {/* Sub-Tabs for Budget */}
                                <div className="flex gap-4 border-b border-slate-700/50 pb-4" role="tablist" aria-label={t('tab_budget')}>
                                    <button
                                        onClick={() => startTransition(() => {
                                            router.push(`/?tab=budget&district=${district}&budgetMode=explorer`);
                                        })}
                                        className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${budgetMode === 'explorer' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-white'}`}
                                        disabled={isPending}
                                    >
                                        {t('budget_mode_explorer')}
                                    </button>
                                    <button
                                        onClick={() => startTransition(() => {
                                            router.push(`/?tab=budget&district=${district}&budgetMode=historic`);
                                        })}
                                        className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${budgetMode === 'historic' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-white'}`}
                                        disabled={isPending}
                                    >
                                        {t('budget_mode_historic')}
                                    </button>
                                </div>

                                {budgetMode === 'explorer' ? (
                                    <BudgetExplorerView />
                                ) : (
                                    <AsyncView
                                        promise={Promise.all([dataPromise, timelinePromise, topChaptersPromise])}
                                        cacheKey={`budget-${district}`}
                                    >
                                        {([data, timeline, topChapters]) => (
                                            <HistoricBudgetView
                                                enrichedData={data}
                                                timeline={timeline}
                                                topChapters={topChapters.map((c: any) => ({ name: c.name, value: c.amount }))}
                                                district={district}
                                            />
                                        )}
                                    </AsyncView>
                                )}
                            </div>
                        ) : activeTab === 'subsidies' ? (
                            <AsyncView
                                promise={Promise.all([subsidiesMetricsPromise, subsidiesListPromise])}
                                cacheKey={`subsidies-${district}`}
                            >
                                {([metrics, list]) => (
                                    <SubsidiesView
                                        initialMetrics={metrics}
                                        initialList={list}
                                        district={district}
                                    />
                                )}
                            </AsyncView>
                        ) : activeTab === 'taxes' ? (
                            <AsyncView
                                promise={taxMetricsPromise}
                                cacheKey={`taxes-${district}`}
                            >
                                {(metrics) => <TaxRevenueView metrics={metrics} />}
                            </AsyncView>
                        ) : activeTab === 'theft' ? (
                            <BicycleTheftMap district={district} />
                        ) : activeTab === 'demographics' ? (
                            <PopulationMapWrapper district={district} />
                        ) : activeTab === 'business' ? (
                            <BusinessMapWrapper district={district} />
                        ) : activeTab === 'wastewater' ? (
                            <AsyncView
                                promise={wastewaterDataPromise}
                                cacheKey={`wastewater-${district}`}
                            >
                                {(data) => <WastewaterView data={data} />}
                            </AsyncView>
                        ) : activeTab === 'traffic' ? (
                            <TrafficView district={district} />
                        ) : activeTab === 'markets' ? (
                            <MarketsMapWrapper district={district} />
                        ) : activeTab === 'baustellen' ? (
                            <BaustellenMapWrapper district={district} />
                        ) : activeTab === 'badestellen' ? (
                            <BadestellenWrapper district={district} />
                        ) : (
                            <HubView
                                district={district}
                                navItems={NAV_ITEMS}
                                budgetVolumePromise={dataPromise}
                                subsidiesMetricsPromise={subsidiesMetricsPromise}
                                taxRevenuePromise={taxMetricsPromise}
                                theftCountPromise={theftCountPromise}
                                onNavigate={(tab) => startTransition(() => {
                                    router.push(`/?tab=${tab}&district=${district}`);
                                })}
                                isNavigating={isPending}
                            />
                        )
                    }
                </div>

                {/* Global Footer */}
                <footer className="pt-8 pb-4 text-center text-slate-500 text-xs font-medium">
                    {t('built_by')} <a href="https://github.com/alaschgari" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">@alaschgari</a>
                </footer>
            </div>
        </main>
    );
}
