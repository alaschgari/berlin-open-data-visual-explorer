'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
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
import DisabledParkingMapWrapper from '@/components/DisabledParkingMapWrapper';
import WaermeplanungMapWrapper from '@/components/WaermeplanungMapWrapper';
import AirQualityWrapper from '@/components/AirQualityWrapper';
import NoiseMapWrapper from '@/components/NoiseMapWrapper';
import EducationMapWrapper from '@/components/EducationMapWrapper';
import HubView from '@/components/HubView';
import ModuleSwitcher from '@/components/ModuleSwitcher';
import { WastewaterRecord } from '@/lib/wastewater';
import { ChevronDown, BarChart3, Shield, Waves, PieChart, Users, Building2, Droplets, ShoppingBag, LayoutGrid, Accessibility, Flame, Wind, Volume2, GraduationCap } from 'lucide-react';

import type { SubsidyMetrics } from '@/lib/subsidies-proxy';
import type { SubsidyRecord } from '@/lib/sync/transform';
import { TaxMetrics } from '@/lib/taxes';

import { useRouter } from 'next/navigation';
import { CardSkeleton, ChartSkeleton, SubsidiesListSkeleton, MapSkeleton } from '@/components/SkeletonCards';

interface DashboardClientProps {
    district: string;
    activeTab: 'hub' | 'budget' | 'subsidies' | 'theft' | 'demographics' | 'business' | 'taxes' | 'wastewater' | 'badestellen' | 'traffic' | 'markets' | 'baustellen' | 'disabled_parking' | 'waermeplanung' | 'air_quality' | 'noise' | 'education';
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

type TabType = 'hub' | 'budget' | 'subsidies' | 'theft' | 'demographics' | 'business' | 'taxes' | 'wastewater' | 'badestellen' | 'traffic' | 'markets' | 'baustellen' | 'disabled_parking' | 'waermeplanung' | 'air_quality' | 'noise' | 'education';

interface NavItem {
    id: TabType;
    labelKey: string;
    icon: React.ReactNode;
    category: 'finance' | 'infrastructure' | 'society';
    priority: number;
}

// Modules whose data is city-wide or has its own district filter; the header selector would do nothing there
const TABS_WITHOUT_DISTRICT = new Set(['wastewater', 'air_quality', 'noise', 'education']);

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
    { id: 'waermeplanung', labelKey: 'tab_waermeplanung', icon: <Flame className="w-3.5 h-3.5" />, category: 'infrastructure', priority: 11 },
    { id: 'markets', labelKey: 'tab_markets', icon: <ShoppingBag className="w-3.5 h-3.5" />, category: 'society', priority: 12 },
    { id: 'disabled_parking', labelKey: 'tab_disabled_parking', icon: <Accessibility className="w-3.5 h-3.5" />, category: 'society', priority: 13 },
    { id: 'air_quality', labelKey: 'tab_air_quality', icon: <Wind className="w-3.5 h-3.5" />, category: 'society', priority: 14 },
    { id: 'noise', labelKey: 'tab_noise', icon: <Volume2 className="w-3.5 h-3.5" />, category: 'society', priority: 15 },
    { id: 'education', labelKey: 'tab_education', icon: <GraduationCap className="w-3.5 h-3.5" />, category: 'society', priority: 16 },
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

    const navigate = (tab: string) => startTransition(() => {
        router.push(tab === 'hub' ? `/?district=${district}` : `/?tab=${tab}&district=${district}`);
    });

    return (
        <main className={`min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-[family-name:var(--font-geist-sans)] transition-opacity duration-300 ${isPending ? 'opacity-70' : 'opacity-100'}`} aria-label={t('brand_name')}>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Shared Navigation Header */}
                <Header
                    showDistrictSelector={TABS_WITHOUT_DISTRICT.has(activeTab) ? undefined : (
                        <DistrictSelector currentDistrict={district} districts={districts} activeTab={activeTab} />
                    )}
                />

                {activeTab !== 'hub' && (
                    <ModuleSwitcher items={NAV_ITEMS} activeTab={activeTab} onNavigate={navigate} />
                )}

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
                                        className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${budgetMode === 'explorer' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 hover:text-white'}`}
                                        disabled={isPending}
                                    >
                                        {t('budget_mode_explorer')}
                                    </button>
                                    <button
                                        onClick={() => startTransition(() => {
                                            router.push(`/?tab=budget&district=${district}&budgetMode=historic`);
                                        })}
                                        className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${budgetMode === 'historic' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 hover:text-white'}`}
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
                        ) : activeTab === 'waermeplanung' ? (
                            <WaermeplanungMapWrapper district={district} />
                        ) : activeTab === 'badestellen' ? (
                            <BadestellenWrapper district={district} />
                        ) : activeTab === 'disabled_parking' ? (
                            <DisabledParkingMapWrapper district={district} />
                        ) : activeTab === 'air_quality' ? (
                            <AirQualityWrapper />
                        ) : activeTab === 'noise' ? (
                            <NoiseMapWrapper />
                        ) : activeTab === 'education' ? (
                            <EducationMapWrapper />
                        ) : (
                            <HubView
                                district={district}
                                navItems={NAV_ITEMS}
                                budgetVolumePromise={dataPromise}
                                subsidiesMetricsPromise={subsidiesMetricsPromise}
                                taxRevenuePromise={taxMetricsPromise}
                                theftCountPromise={theftCountPromise}
                                onNavigate={navigate}
                                isNavigating={isPending}
                            />
                        )
                    }
                </div>

                {/* Global Footer */}
                <footer className="pt-8 pb-4 text-center text-slate-400 text-xs font-medium">
                    {t('built_by')} <a href="https://github.com/alaschgari" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">@alaschgari</a>
                </footer>
            </div>
        </main>
    );
}
