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
import { WastewaterRecord } from '@/lib/wastewater';
import { ChevronDown, BarChart3, Shield, Waves, PieChart, Users, Building2, Droplets, ShoppingBag } from 'lucide-react';

import { SubsidyMetrics } from '@/lib/subsidies-proxy';
import { SubsidyRecord } from '@/lib/parser';
import { TaxMetrics } from '@/lib/taxes';

interface DashboardClientProps {
    district: string;
    activeTab: 'budget' | 'subsidies' | 'theft' | 'demographics' | 'business' | 'taxes' | 'wastewater' | 'badestellen' | 'traffic' | 'markets';
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

type TabType = 'budget' | 'subsidies' | 'theft' | 'demographics' | 'business' | 'taxes' | 'wastewater' | 'badestellen' | 'traffic' | 'markets';

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
                            <div className="flex items-center gap-3">
                                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">{t('brand_sub')}</p>
                                {lastSync && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest whitespace-nowrap">
                                            {t('last_sync')}: {lastSync.toLocaleString(t('locale') === 'DE' ? 'de-DE' : 'en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <LanguageToggle />

                        <div className="h-8 w-px bg-slate-700/50 hidden sm:block"></div>

                        {/* Scalable Tab Switcher */}
                        <div className="flex items-center gap-2">
                            <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-700/50 flex shadow-inner max-w-[300px] md:max-w-none" role="tablist" aria-label={t('nav_more')}>
                                {NAV_ITEMS.filter(item => item.priority <= 4).map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/?tab=${item.id}&district=${district}`}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === item.id ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                                        role="tab"
                                        aria-selected={activeTab === item.id}
                                        aria-current={activeTab === item.id ? 'page' : undefined}
                                    >
                                        {item.icon}
                                        {t(item.labelKey)}
                                    </Link>
                                ))}
                            </div>

                            {/* Dropdown for More Items */}
                            <div className="relative group">
                                <button
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-xs font-bold ${NAV_ITEMS.some(item => item.id === activeTab && item.priority > 4) ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:text-white'}`}
                                    aria-haspopup="true"
                                    aria-label={t('nav_more')}
                                >
                                    <ChevronDown className="w-4 h-4" />
                                    <span>{t('nav_more')}</span>
                                </button>

                                {/* Premium Dropdown Menu */}
                                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl py-2 z-[9999] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right group-hover:scale-100 scale-95 p-2 space-y-1">
                                    {['society', 'infrastructure'].map((cat) => (
                                        <div key={cat} className="space-y-1">
                                            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                                                <span>{t(`cat_${cat}`)}</span>
                                                <div className="h-px flex-1 bg-slate-800 ml-3"></div>
                                            </div>
                                            {NAV_ITEMS.filter(item => item.category === cat && item.priority > 4).map((item) => (
                                                <Link
                                                    key={item.id}
                                                    href={`/?tab=${item.id}&district=${district}`}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === item.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                                                    role="menuitem"
                                                    aria-current={activeTab === item.id ? 'page' : undefined}
                                                >
                                                    <div className={`p-1.5 rounded-lg ${activeTab === item.id ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-400'}`}>
                                                        {item.icon}
                                                    </div>
                                                    {t(item.labelKey)}
                                                </Link>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-700/50 hidden sm:block"></div>

                        <DistrictSelector currentDistrict={district} districts={districts} activeTab={activeTab} />
                    </div>
                </header>

                {
                    activeTab === 'budget' ? (
                        <div className="space-y-6">
                            {/* Sub-Tabs for Budget */}
                            <div className="flex gap-4 border-b border-slate-700/50 pb-4" role="tablist" aria-label={t('tab_budget')}>
                                <Link
                                    href={`/?tab=budget&district=${district}&budgetMode=historic`}
                                    className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${budgetMode === 'historic' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-white'}`}
                                    role="tab"
                                    aria-selected={budgetMode === 'historic'}
                                >
                                    {t('budget_mode_historic')}
                                </Link>
                                <Link
                                    href={`/?tab=budget&district=${district}&budgetMode=explorer`}
                                    className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${budgetMode === 'explorer' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-white'}`}
                                    role="tab"
                                    aria-selected={budgetMode === 'explorer'}
                                >
                                    {t('budget_mode_explorer')}
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
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <PopulationMapWrapper district={district} />
                        </div>
                    ) : activeTab === 'business' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <BusinessMapWrapper district={district} />
                        </div>
                    ) : activeTab === 'wastewater' ? (
                        <WastewaterView data={wastewaterData} />
                    ) : activeTab === 'traffic' ? (
                        <TrafficView district={district} />
                    ) : activeTab === 'markets' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <MarketsMapWrapper district={district} />
                        </div>
                    ) : (
                        <BadestellenWrapper district={district} />
                    )
                }
            </div>
        </main>
    );
}
