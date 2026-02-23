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
import HubView from '@/components/HubView';
import { WastewaterRecord } from '@/lib/wastewater';
import { ChevronDown, BarChart3, Shield, Waves, PieChart, Users, Building2, Droplets, ShoppingBag, LayoutGrid } from 'lucide-react';

import { SubsidyMetrics } from '@/lib/subsidies-proxy';
import { SubsidyRecord } from '@/lib/parser';
import { TaxMetrics } from '@/lib/taxes';

interface DashboardClientProps {
    district: string;
    activeTab: 'hub' | 'budget' | 'subsidies' | 'theft' | 'demographics' | 'business' | 'taxes' | 'wastewater' | 'badestellen' | 'traffic' | 'markets';
    budgetMode: 'historic' | 'explorer';
    lastSync: Date | null;
    districts: string[];
    // Pre-fetched data
    enrichedData: {
        budget: number;
        actual: number;
        diff: number;
        isEstimated?: boolean;
    };
    timeline: Array<{
        year: number;
        budget: number;
        actual: number;
        isEstimated?: boolean;
    }>;
    topChapters: Array<{
        name: string;
        value: number;
        color?: string;
    }>;
    initialSubsidiesMetrics: SubsidyMetrics;
    initialSubsidiesList: SubsidyRecord[];
    taxMetrics: TaxMetrics;
    wastewaterData: WastewaterRecord[];
}

type TabType = 'hub' | 'budget' | 'subsidies' | 'theft' | 'demographics' | 'business' | 'taxes' | 'wastewater' | 'badestellen' | 'traffic' | 'markets';

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
    { id: 'markets', labelKey: 'tab_markets', icon: <ShoppingBag className="w-3.5 h-3.5" />, category: 'society', priority: 10 },
];

export default function DashboardClient({
    district,
    activeTab,
    budgetMode,
    lastSync,
    districts,
    enrichedData,
    timeline,
    topChapters,
    initialSubsidiesMetrics,
    initialSubsidiesList,
    taxMetrics,
    wastewaterData
}: DashboardClientProps) {
    const { t } = useLanguage();

    return (
        <main className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-[family-name:var(--font-geist-sans)]" aria-label={t('brand_name')}>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Unified Premium Header */}
                <header className="relative z-[2000] flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-visible">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
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
                                <Link
                                    href={`/?tab=hub&district=${district}`}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all font-bold text-xs shadow-inner w-full sm:w-auto"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                    <span>{t('back_to_hub')}</span>
                                </Link>
                                <div className="h-8 w-px bg-slate-700/50 hidden sm:block"></div>
                            </>
                        )}

                        <div className="w-full sm:w-auto">
                            <DistrictSelector currentDistrict={district} districts={districts} activeTab={activeTab} />
                        </div>
                    </div>
                </header>

                {
                    activeTab === 'budget' ? (
                        <div className="space-y-6">
                            {/* Sub-Tabs for Budget */}
                            <div className="flex gap-4 border-b border-slate-700/50 pb-4" role="tablist" aria-label={t('tab_budget')}>
                                <Link
                                    href={`/?tab=budget&district=${district}&budgetMode=explorer`}
                                    className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${budgetMode === 'explorer' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-white'}`}
                                    role="tab"
                                    aria-selected={budgetMode === 'explorer'}
                                >
                                    {t('budget_mode_explorer')}
                                </Link>
                                <Link
                                    href={`/?tab=budget&district=${district}&budgetMode=historic`}
                                    className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${budgetMode === 'historic' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-white'}`}
                                    role="tab"
                                    aria-selected={budgetMode === 'historic'}
                                >
                                    {t('budget_mode_historic')}
                                </Link>
                            </div>

                            {budgetMode === 'explorer' ? (
                                <BudgetExplorerView />
                            ) : (
                                <HistoricBudgetView
                                    enrichedData={enrichedData}
                                    timeline={timeline}
                                    topChapters={topChapters}
                                    district={district}
                                />
                            )}
                        </div>
                    ) : activeTab === 'subsidies' ? (
                        <SubsidiesView
                            initialMetrics={initialSubsidiesMetrics}
                            initialList={initialSubsidiesList}
                            district={district}
                        />
                    ) : activeTab === 'taxes' ? (
                        <TaxRevenueView metrics={taxMetrics} />
                    ) : activeTab === 'theft' ? (
                        <BicycleTheftMap district={district} />
                    ) : activeTab === 'demographics' ? (
                        <PopulationMapWrapper district={district} />
                    ) : activeTab === 'business' ? (
                        <BusinessMapWrapper district={district} />
                    ) : activeTab === 'wastewater' ? (
                        <WastewaterView data={wastewaterData} />
                    ) : activeTab === 'traffic' ? (
                        <TrafficView district={district} />
                    ) : activeTab === 'markets' ? (
                        <MarketsMapWrapper district={district} />
                    ) : activeTab === 'badestellen' ? (
                        <BadestellenWrapper district={district} />
                    ) : (
                        <HubView
                            district={district}
                            navItems={NAV_ITEMS}
                            budgetVolume={enrichedData?.budget}
                            subsidiesCount={initialSubsidiesMetrics?.totalCount}
                            taxRevenue={taxMetrics?.totalMonthly}
                        />
                    )
                }
            </div>
        </main>
    );
}
