import React from 'react';
import { getDistrictMetrics, getTopChapters, getTimelineData, enrichMetricsWithHistory, getLastSyncTime } from '@/lib/proxy';
import SubsidiesView from '@/components/SubsidiesView';
import DistrictSelector from '@/components/DistrictSelector';
import { getSubsidiesMetrics, searchSubsidies } from '@/lib/subsidies-proxy';
import Link from 'next/link';
import BicycleTheftMap from '@/components/BicycleTheftMapWrapper';
import { getPopulation } from '@/lib/demographics';
import BudgetChapters from '@/components/BudgetChapters';
import PopulationMapWrapper from '@/components/PopulationMapWrapper';
import BusinessMapWrapper from '@/components/BusinessMapWrapper';
import { getTaxMetrics } from '@/lib/taxes';
import TaxRevenueView from '@/components/TaxRevenueView';

export default async function Dashboard({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedSearchParams = await searchParams;
  const district = resolvedSearchParams.district || 'Berlin';
  const activeTab = (resolvedSearchParams.tab || 'subsidies') as 'budget' | 'subsidies' | 'theft' | 'demographics' | 'business' | 'taxes';

  // Data for budget tab
  const data = await getDistrictMetrics(district);
  const rawTimeline = await getTimelineData(district);
  const topChapters = await getTopChapters(district);
  const enrichedData = (district === 'Berlin' || district === 'All') ? await enrichMetricsWithHistory(data) : data;

  // Pre-process timeline for SSR
  const timeline = await Promise.all(rawTimeline.map(async (item) => {
    return (district === 'Berlin' || district === 'All') ? await enrichMetricsWithHistory(item) : item;
  }));

  const maxBudget = Math.max(...timeline.map(t => t.budget), 1);

  // Initial data for subsidies tab
  const initialSubsidiesMetrics = await getSubsidiesMetrics(district);
  const initialSubsidiesList = await searchSubsidies('', district);

  // Data for taxes tab
  const taxMetrics = await getTaxMetrics();

  const lastSync = await getLastSyncTime();

  const districts = [
    'Berlin', 'Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf',
    'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln',
    'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'
  ];

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
                BERLIN OPEN DATA
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Public Services Analytics</p>
                {lastSync && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest whitespace-nowrap">
                      {lastSync.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Tab Switcher */}
            <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-700/50 flex shadow-inner">
              <Link
                href={`/?tab=subsidies&district=${district}`}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'subsidies' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Subventionen
              </Link>
              <Link
                href={`/?tab=taxes&district=${district}`}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'taxes' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Steuern
              </Link>
              <Link
                href={`/?tab=theft&district=${district}`}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'theft' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Diebstahl
              </Link>
              <Link
                href={`/?tab=budget&district=${district}`}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'budget' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Haushalt
              </Link>
              <Link
                href={`/?tab=demographics&district=${district}`}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'demographics' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Demografie
              </Link>
              <Link
                href={`/?tab=business&district=${district}`}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'business' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Gewerbe
              </Link>
            </div>

            <div className="h-8 w-px bg-slate-700/50 hidden sm:block"></div>

            <DistrictSelector currentDistrict={district} districts={districts} activeTab={activeTab} />
          </div>
        </header>

        {
          activeTab === 'budget' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm group hover:border-emerald-500/50 transition-all">
                  <h3 className="text-slate-400 text-sm font-medium mb-1">Budget (Geplant)</h3>
                  <p className="text-3xl font-bold text-slate-100">{(enrichedData.budget / 1000000000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mrd. €</p>
                  {enrichedData.isEstimated && <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Historisch angereichert</span>}
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                  <h3 className="text-slate-400 text-sm font-medium mb-1">Ist-Ausgaben</h3>
                  <p className="text-3xl font-bold text-emerald-400">{(enrichedData.actual / 1000000000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mrd. €</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                  <h3 className="text-slate-400 text-sm font-medium mb-1">Differenz</h3>
                  <p className={`text-3xl font-bold ${enrichedData.diff >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                    {enrichedData.diff >= 0 ? '+' : ''}{(enrichedData.diff / 1000000000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mrd. €
                  </p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                  <h3 className="text-slate-400 text-sm font-medium mb-1">Nutzung</h3>
                  <p className="text-3xl font-bold text-slate-100">
                    {enrichedData.budget > 0 ? ((enrichedData.actual / enrichedData.budget) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm group hover:border-blue-500/50 transition-all">
                  <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Budget pro Kopf</h3>
                  <p className="text-3xl font-bold text-blue-400">
                    {Math.round(enrichedData.budget / getPopulation(district)).toLocaleString('de-DE')} €
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">Bei {getPopulation(district).toLocaleString('de-DE')} Einwohnern</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timeline Chart */}
                <div className="lg:col-span-2 bg-slate-800/50 p-8 rounded-3xl border border-white/5 shadow-inner">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-bold text-slate-100">Budgetentwicklung</h2>
                      <p className="text-slate-500 text-sm">Vergleich Planung vs. tatsächliche Ausgaben</p>
                    </div>
                  </div>
                  <div className="h-[300px] flex items-end gap-2 px-4">
                    {timeline.map((item, i) => {
                      const budgetHeight = (item.budget / maxBudget) * 100;
                      const actualHeight = (item.actual / maxBudget) * 100;

                      return (
                        <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                          <div className="w-full flex justify-center gap-1 h-full items-end pb-8">
                            <div
                              style={{ height: `${budgetHeight}%` }}
                              className="w-1/2 bg-slate-700 group-hover:bg-slate-600 transition-all rounded-t-sm shadow-lg"
                            />
                            <div
                              style={{ height: `${actualHeight}%` }}
                              className={`w-1/2 ${item.isEstimated ? 'bg-emerald-500/50' : 'bg-emerald-500'} group-hover:brightness-110 transition-all rounded-t-sm shadow-lg`}
                            />
                          </div>
                          <div className="absolute bottom-0 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                            {item.year.toString().slice(-2)}
                          </div>

                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-700 p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-2xl min-w-[120px]">
                            <p className="text-[10px] text-slate-500 font-bold mb-1">{item.year}</p>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400 text-[10px]">Soll:</span>
                              <span className="text-white text-[10px] font-bold">{(item.budget / 1000).toFixed(1)} Mrd. €</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400 text-[10px]">Ist:</span>
                              <span className="text-emerald-400 text-[10px] font-bold">{(item.actual / 1000).toFixed(1)} Mrd. €</span>
                            </div>
                            {item.isEstimated && (
                              <p className="text-[8px] text-emerald-500 border-t border-slate-800 mt-2 pt-1 font-bold">HISTORISCHE DATEN</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sidebar: Top Chapters */}
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-white/5 flex flex-col shadow-inner">
                  <h2 className="text-xl font-bold text-slate-100 mb-6 font-[family-name:var(--font-geist-sans)]">Top Bereiche</h2>
                  <BudgetChapters initialChapters={topChapters} district={district} />
                  <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Basierend auf Ansatz 2024/25</p>
                  </div>
                </div>
              </div>
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
      </div >
    </main >
  );
}
