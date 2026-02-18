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

interface DashboardClientProps {
    district: string;
    activeTab: 'budget' | 'subsidies' | 'theft' | 'demographics' | 'business' | 'taxes';
    budgetMode: 'historic' | 'explorer';
    lastSync: Date | null;
    districts: string[];
    // Pre-fetched data
    enrichedData: any;
    timeline: any[];
    topChapters: any[];
    initialSubsidiesMetrics: any;
    initialSubsidiesList: any[];
    taxMetrics: any;
}

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
    taxMetrics
}: DashboardClientProps) {
    const { t } = useLanguage();

    return (
        <main className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-[family-name:var(--font-geist-sans)]">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Unified Premium Header */}
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-2xl">
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

                        {/* Tab Switcher */}
                        <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-700/50 flex shadow-inner">
                            <Link
                                href={`/?tab=subsidies&district=${district}`}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'subsidies' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                {t('tab_subsidies')}
                            </Link>
                            <Link
                                href={`/?tab=taxes&district=${district}`}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'taxes' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                {t('tab_taxes')}
                            </Link>
                            <Link
                                href={`/?tab=theft&district=${district}`}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'theft' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                {t('tab_theft')}
                            </Link>
                            <Link
                                href={`/?tab=budget&district=${district}`}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'budget' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                {t('tab_budget')}
                            </Link>
                            <Link
                                href={`/?tab=demographics&district=${district}`}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'demographics' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                {t('tab_demographics')}
                            </Link>
                            <Link
                                href={`/?tab=business&district=${district}`}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'business' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                {t('tab_business')}
                            </Link>
                        </div>

                        <div className="h-8 w-px bg-slate-700/50 hidden sm:block"></div>

                        <DistrictSelector currentDistrict={district} districts={districts} activeTab={activeTab} />
                    </div>
                </header>

                {
                    activeTab === 'budget' ? (
                        <div className="space-y-6">
                            {/* Sub-Tabs for Budget */}
                            <div className="flex gap-4 border-b border-slate-700/50 pb-4">
                                <Link
                                    href={`/?tab=budget&district=${district}&budgetMode=historic`}
                                    className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${budgetMode === 'historic' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {t('budget_mode_historic')}
                                </Link>
                                <Link
                                    href={`/?tab=budget&district=${district}&budgetMode=explorer`}
                                    className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${budgetMode === 'explorer' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-white'}`}
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
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <BusinessMapWrapper district={district} />
                        </div>
                    )
                }
            </div>
        </main>
    );
}
