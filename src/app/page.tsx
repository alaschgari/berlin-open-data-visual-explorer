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

  // Data pre-fetching (SSR)
  const data = await getDistrictMetrics(district);
  const rawTimeline = await getTimelineData(district);
  const topChapters = await getTopChapters(district);
  const enrichedData = (district === 'Berlin' || district === 'All') ? await enrichMetricsWithHistory(data) : data;

  const timeline = await Promise.all(rawTimeline.map(async (item: Record<string, any>) => {
    return (district === 'Berlin' || district === 'All') ? await enrichMetricsWithHistory(item) : item;
  }));

  const initialSubsidiesMetrics = await getSubsidiesMetrics(district);
  const initialSubsidiesList = await searchSubsidies('', district);
  const taxMetrics = await getTaxMetrics();
  const lastSync = await getLastSyncTime();
  const wastewaterData = await getWastewaterData();

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
      enrichedData={enrichedData}
      timeline={timeline}
      topChapters={topChapters.map(c => ({ name: c.name, value: c.amount }))}
      initialSubsidiesMetrics={initialSubsidiesMetrics}
      initialSubsidiesList={initialSubsidiesList}
      taxMetrics={taxMetrics}
      wastewaterData={wastewaterData}
    />
  );
}
