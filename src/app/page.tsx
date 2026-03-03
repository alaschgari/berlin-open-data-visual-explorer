import React from 'react';
import { getDistrictMetrics, getTopChapters, getTimelineData, enrichMetricsWithHistory, getLastSyncTime } from '@/lib/proxy';
import { getSubsidiesMetrics, searchSubsidies } from '@/lib/subsidies-proxy';
import { getTaxMetrics } from '@/lib/taxes';
import { getWastewaterData } from '@/lib/wastewater';
import DashboardClient from '@/components/DashboardClient';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ district?: string, tab?: string, budgetMode?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const district = resolvedSearchParams.district || 'Berlin';
  const activeTab = (resolvedSearchParams.tab || 'hub') as 'hub' | 'budget' | 'subsidies' | 'theft' | 'demographics' | 'business' | 'taxes' | 'wastewater' | 'badestellen' | 'traffic' | 'markets';
  const budgetMode = (resolvedSearchParams.budgetMode || 'explorer') as 'historic' | 'explorer';

  // SSR Core Data (fast or critical)
  const isHub = activeTab === 'hub';
  const lastSync = isHub ? null : await getLastSyncTime();

  // Budget Promises
  let districtDataPromise: Promise<any> | undefined = undefined;
  let timelinePromise: Promise<any[]> | undefined = undefined;
  let topChaptersPromise: Promise<any[]> | undefined = undefined;

  if (activeTab === 'budget') {
    districtDataPromise = getDistrictMetrics(district);
    timelinePromise = getTimelineData(district).then(async (rawTimeline) => {
      return Promise.all(rawTimeline.map(async (item: Record<string, any>) => {
        return (district === 'Berlin' || district === 'All') ? enrichMetricsWithHistory(item) : item;
      }));
    });
    topChaptersPromise = getTopChapters(district);
  }

  // Subsidies Promises
  let initialSubsidiesMetricsPromise: Promise<any> | undefined = undefined;
  let initialSubsidiesListPromise: Promise<any[]> | undefined = undefined;

  if (activeTab === 'subsidies') {
    initialSubsidiesMetricsPromise = getSubsidiesMetrics(district);
    initialSubsidiesListPromise = searchSubsidies('', district);
  }

  // Taxes Promise
  let taxMetricsPromise: Promise<any> | undefined = undefined;
  if (activeTab === 'taxes') {
    taxMetricsPromise = getTaxMetrics();
  }

  // Others
  const wastewaterDataPromise = activeTab === 'wastewater' ? getWastewaterData() : undefined;
  const theftCountPromise = undefined; // No theft count on hub as requested for zero-data

  const districts = [
    'Berlin', 'Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf',
    'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln',
    'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'
  ];

  return (
    <DashboardClient
      district={district}
      activeTab={activeTab}
      budgetMode={budgetMode}
      lastSync={lastSync}
      districts={districts}
      // Pass promises for streaming
      dataPromise={districtDataPromise as any}
      timelinePromise={timelinePromise as any}
      topChaptersPromise={topChaptersPromise as any}
      subsidiesMetricsPromise={initialSubsidiesMetricsPromise as any}
      subsidiesListPromise={initialSubsidiesListPromise as any}
      taxMetricsPromise={taxMetricsPromise as any}
      wastewaterDataPromise={wastewaterDataPromise as any}
      theftCountPromise={theftCountPromise as any}
    />
  );
}
