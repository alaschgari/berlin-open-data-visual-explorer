'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, GeoJSON, Pane, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useDebounce } from '@/hooks/useDebounce';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { useLanguage } from './LanguageContext';

// Fix for Leaflet icon issues in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TheftData {
  id: string;
  category: 'bicycle' | 'car';
  lat: number;
  lng: number;
  amount: number;
  date: string;
  hour: number;
  registeredDate: string | null;
  type: string;
  lor: string;
  rawLor?: string;
  details?: string;
}

const BERLIN_DISTRICTS = [
  'Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf',
  'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln',
  'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'
];

const LOR_PREFIX_TO_DISTRICT: Record<string, string> = {
  '01': 'Mitte',
  '02': 'Friedrichshain-Kreuzberg',
  '03': 'Pankow',
  '04': 'Charlottenburg-Wilmersdorf',
  '05': 'Spandau',
  '06': 'Steglitz-Zehlendorf',
  '07': 'Tempelhof-Schöneberg',
  '08': 'Neukölln',
  '09': 'Treptow-Köpenick',
  '10': 'Marzahn-Hellersdorf',
  '11': 'Lichtenberg',
  '12': 'Reinickendorf'
};

import { districtCoordinates } from '@/lib/district-coords';

function MapViewHandler({ district, selectedLorCoord }: { district?: string, selectedLorCoord?: { lat: number, lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedLorCoord) {
      map.setView([selectedLorCoord.lat, selectedLorCoord.lng], 15);
      return;
    }

    if (!district || district === 'Berlin' || district === 'All') {
      map.setView([52.5200, 13.4050], 11);
      return;
    }

    // Find district prefix
    const prefix = Object.entries(LOR_PREFIX_TO_DISTRICT).find(([_, name]) => name === district)?.[0];
    if (prefix && districtCoordinates[prefix]) {
      const coords = districtCoordinates[prefix];
      map.setView([coords.lat, coords.lng], 13);
    }
  }, [district, map]);

  return null;
}

export default function BicycleTheftMap({ district }: { district?: string }) {
  const { t, language } = useLanguage();
  const [data, setData] = useState<TheftData[]>([]);
  const [prevYearData, setPrevYearData] = useState<TheftData[]>([]);
  const [lorData, setLorData] = useState<any>(null);
  const [lorCentroids, setLorCentroids] = useState<Record<string, { lat: number, lng: number, name: string }>>({});
  const [selectedLorCoord, setSelectedLorCoord] = useState<{ lat: number, lng: number } | null>(null);
  const [hoveredLorId, setHoveredLorId] = useState<string | null>(null);
  const [selectedLorId, setSelectedLorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<keyof TheftData>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const [theftType, setTheftType] = useState<'bicycle' | 'car' | 'both'>('bicycle');
  const itemsPerPage = 20;

  const locale = language === 'de' ? 'de-DE' : 'en-GB';

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const diffDays = Math.ceil(Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;


  const debouncedStartDate = useDebounce(startDate, 500);
  const debouncedEndDate = useDebounce(endDate, 500);

  // Set loading to true immediately when dates change, before debounce finishes
  useEffect(() => {
    if (startDate !== debouncedStartDate || endDate !== debouncedEndDate) {
      setLoading(true);
    }
  }, [startDate, endDate, debouncedStartDate, debouncedEndDate]);

  // Instant Filtering Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const itemDate = new Date(item.date);
      const sDate = new Date(debouncedStartDate);
      const eDate = new Date(debouncedEndDate);
      eDate.setHours(23, 59, 59, 999);

      const inDateRange = itemDate >= sDate && itemDate <= eDate;
      if (!inDateRange) return false;

      return true;
    });
  }, [data, debouncedStartDate, debouncedEndDate, district]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const fetchCurrent = async () => {
          const params = new URLSearchParams({
            start: debouncedStartDate,
            end: debouncedEndDate,
            type: theftType,
            ...(district && district !== 'Berlin' && district !== 'All' ? { district } : {})
          });
          const res = await fetch(`/api/bicycle-theft?${params.toString()}`);
          return res.ok ? res.json() : [];
        };

        const fetchPrev = async () => {
          const dStart = new Date(debouncedStartDate);
          const dEnd = new Date(debouncedEndDate);
          dStart.setFullYear(dStart.getFullYear() - 1);
          dEnd.setFullYear(dEnd.getFullYear() - 1);

          const params = new URLSearchParams({
            start: dStart.toISOString().split('T')[0],
            end: dEnd.toISOString().split('T')[0],
            type: theftType,
            ...(district && district !== 'Berlin' && district !== 'All' ? { district } : {})
          });
          const res = await fetch(`/api/bicycle-theft?${params.toString()}`);
          return res.ok ? res.json() : [];
        };

        const current = await fetchCurrent();
        
        // Safety check: ensure the data matches the current theftType toggle
        if (current.length > 0 && current[0].category !== theftType && theftType !== 'both') {
          console.warn('Fetched data category mismatch, ignoring stale response');
          return;
        }

        setData(current);
        setLoading(false);

        // Fetch previous year data in the background
        const prev = await fetchPrev();
        setPrevYearData(prev);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      } finally {
        setCurrentPage(1);
      }
    }

    fetchData();
  }, [debouncedStartDate, debouncedEndDate, district, theftType]);



  useEffect(() => {
    fetch('/data/berlin-lor-planungsraeume.geojson')
      .then(res => res.json())
      .then(data => setLorData(data))
      .catch(err => console.error('Error loading LOR data:', err));

    // Load LOR centroids for coordinate lookup
    fetch('/api/bicycle-theft/lor-centroids')
      .then(res => res.json())
      .then(data => setLorCentroids(data))
      .catch(err => console.error('Error loading LOR centroids:', err));
  }, []);

  // Reset LOR zoom when district changes
  useEffect(() => {
    setSelectedLorCoord(null);
    setSelectedLorId(null);
  }, [district]);

  // Note: All stats now use filteredData for instant parallel updates
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue === undefined || bValue === undefined) return 0;

    if (sortKey === 'date') {
      const aDate = new Date(aValue as string).getTime();
      const bDate = new Date(bValue as string).getTime();
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    return sortDirection === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const handleSort = (key: keyof TheftData) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const handleExport = () => {
    if (data.length === 0) return;
    const headers = ['Datum', 'Typ', 'Schaden', 'LOR', 'LOR_Details', 'Delikt'];
    const csvRows = [
      headers.join(','),
      ...data.map(t => [
        t.date,
        `"${t.type}"`,
        t.amount,
        `"${t.lor}"`,
        `"${t.rawLor}"`,
        `"${t.details}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fahrraddiebstahl_berlin_${startDate}_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pieData = useMemo(() => {
    const counts = filteredData.reduce((acc: Record<string, number>, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});

    const sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length <= 10) return sorted;

    const top10 = sorted.slice(0, 10);
    const others = sorted.slice(10).reduce((sum, item) => sum + item.value, 0);
    return [...top10, { name: 'Sonstige', value: others }];
  }, [filteredData]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#94a3b8', '#64748b', '#475569', '#334155'];

  const deliktData = useMemo(() => {
    const counts = filteredData.reduce((acc: Record<string, number>, curr) => {
      const delikt = curr.details || 'Unbekannt';
      acc[delikt] = (acc[delikt] || 0) + 1;
      return acc;
    }, {});

    const sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length <= 10) return sorted;

    const top10 = sorted.slice(0, 10);
    const others = sorted.slice(10).reduce((sum, item) => sum + item.value, 0);
    return [...top10, { name: 'Sonstige', value: others }];
  }, [filteredData]);

  const districtStats = useMemo(() => {
    const counts = filteredData.reduce((acc: Record<string, number>, curr) => {
      const prefix = curr.rawLor?.substring(0, 2);
      const districtName = prefix ? (LOR_PREFIX_TO_DISTRICT[prefix] || 'Unbekannt') : 'Unbekannt';
      acc[districtName] = (acc[districtName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, id: name }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const lorStats = useMemo(() => {
    const statsMap = filteredData.reduce((acc: Record<string, { name: string, count: number, id: string }>, curr) => {
      const name = curr.lor;
      if (!acc[name]) {
        acc[name] = { name, count: 0, id: curr.rawLor || '' };
      }
      acc[name].count++;
      return acc;
    }, {});

    return Object.values(statsMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredData]);

  const weekdayData = [
    { name: 'Mo', count: 0 },
    { name: 'Di', count: 0 },
    { name: 'Mi', count: 0 },
    { name: 'Do', count: 0 },
    { name: 'Fr', count: 0 },
    { name: 'Sa', count: 0 },
    { name: 'So', count: 0 },
  ];

  const damageTrendData: { date: string, amount: number }[] = [];
  const damageByDay: Record<string, { total: number, count: number }> = {};

  filteredData.forEach(theft => {
    const d = new Date(theft.date);
    const dayIndex = (d.getDay() + 6) % 7; // Monday is 0
    weekdayData[dayIndex].count++;

    const dateStr = theft.date;
    if (!damageByDay[dateStr]) damageByDay[dateStr] = { total: 0, count: 0 };
    damageByDay[dateStr].total += theft.amount;
    damageByDay[dateStr].count++;
  });

  Object.entries(damageByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, stats]) => {
      damageTrendData.push({
        date: new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        amount: Math.round(stats.total / stats.count)
      });
    });

  // Comparative trend data
  const trendComparisonData = useMemo(() => {
    const days: Record<string, { bike: number, car: number }> = {};
    filteredData.forEach(t => {
      const date = t.date.split('T')[0];
      if (!days[date]) days[date] = { bike: 0, car: 0 };
      if (t.category === 'bicycle') days[date].bike++;
      else days[date].car++;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date: new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        bike: counts.bike,
        car: counts.car
      }));
  }, [filteredData]);

  // Security Risk Profile Calculation
  const riskProfile = useMemo(() => {
    if (!filteredData.length) return null;
    const bikeCount = filteredData.filter(t => t.category === 'bicycle').length;
    const carCount = filteredData.filter(t => t.category === 'car').length;

    // Normalize based on Berlin averages (placeholder logic for demonstration)
    const bikeScore = Math.min(10, (bikeCount / (diffDays * 5)) * 10);
    const carScore = Math.min(10, (carCount / (diffDays * 2)) * 10);

    return {
      bikeRisk: bikeScore,
      carRisk: carScore,
      overallRisk: (bikeScore + carScore) / 2
    };
  }, [filteredData, diffDays]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Determine data status (latest registration date)
  const dataStatus = useMemo(() => {
    if (!data || data.length === 0) return null;
    const latestDateStr = data.reduce((max, curr) => {
      if (!curr.registeredDate) return max;
      return curr.registeredDate > max ? curr.registeredDate : max;
    }, '0000-00-00');

    if (latestDateStr === '0000-00-00') return null;
    const d = new Date(latestDateStr);
    return d.toLocaleDateString('de-DE');
  }, [data]);

  // Calculate center of Berlin
  const center: [number, number] = [52.5200, 13.4050];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-2xl space-y-8">
        {/* Top Row: Title and Main Selectors */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                {t('theft_title')}
              </h2>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">Live</span>
              </div>
              {dataStatus && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-slate-900/50 rounded-full border border-slate-700/50">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t('last_sync')}: {dataStatus}</span>
                </div>
              )}
            </div>
            <p className="text-slate-400 mt-1.5 text-xs font-medium flex items-center gap-2">
              {t('theft_subtitle')}
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span className="text-slate-500 italic opacity-80">({diffDays} {language === 'de' ? 'Tage' : 'Days'})</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Switcher with Icons */}
            <div className="flex items-center bg-slate-900/60 p-1 rounded-2xl border border-slate-700/50 shadow-inner">
              <button
                onClick={() => setTheftType('bicycle')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${theftType === 'bicycle' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
              >
                <span>🚲</span>
                {language === 'de' ? 'Fahrrad' : 'Bicycle'}
              </button>
              <button
                onClick={() => setTheftType('car')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${theftType === 'car' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
              >
                <span>🚗</span>
                {language === 'de' ? 'Kfz' : 'Car'}
              </button>
              <button
                onClick={() => setTheftType('both')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${theftType === 'both' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
              >
                <span>📊</span>
                {language === 'de' ? 'Beide' : 'Both'}
              </button>
            </div>

            {/* Date Range Group */}
            <div className="flex items-center bg-slate-900/60 p-1 rounded-2xl border border-slate-700/50 shadow-inner group">
              <div className="flex items-center px-2 py-1.5 gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer focus:text-emerald-400 transition-colors"
                />
                <span className="text-slate-600 font-black">─</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer focus:text-emerald-400 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Analytics & Global Actions */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-6 items-center pt-2 border-t border-slate-700/30">
          <div className="flex flex-wrap items-center gap-4">
            {/* Metric Blocks */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-700/50 flex flex-col min-w-[140px]">
                <div className="flex justify-between items-start mb-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Vorfälle</span>
                </div>
                <span className="text-lg font-black text-white leading-none">{filteredData.length.toLocaleString()}</span>
                <span className="text-[9px] text-slate-600 font-bold mt-1.5 tabular-nums">
                  {new Date(debouncedStartDate).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} - {new Date(debouncedEndDate).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </span>
              </div>

              {prevYearData.length > 0 && (
                <div className="bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-700/50 flex flex-col min-w-[140px]">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">vs. Vorjahr</span>
                  {(() => {
                    const diff = prevYearData.length > 0 ? ((filteredData.length - prevYearData.length) / prevYearData.length) * 100 : 0;
                    const prevStart = new Date(debouncedStartDate);
                    const prevEnd = new Date(debouncedEndDate);
                    prevStart.setFullYear(prevStart.getFullYear() - 1);
                    prevEnd.setFullYear(prevEnd.getFullYear() - 1);

                    return (
                      <>
                        <span className={`text-lg font-black leading-none ${diff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {diff > 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}%
                        </span>
                        <span className="text-[9px] text-slate-600 font-bold mt-1.5 tabular-nums">
                          {prevStart.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} - {prevEnd.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </span>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-700/50 flex flex-col min-w-[110px]">
                <span className={`text-[10px] uppercase font-black tracking-widest mb-0.5 ${theftType === 'car' ? 'text-rose-400/70' : theftType === 'bicycle' ? 'text-emerald-400/70' : 'text-blue-400/70'}`}>Schadenssumme</span>
                <span className={`text-lg font-black leading-none ${theftType === 'car' ? 'text-rose-400' : theftType === 'bicycle' ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {(() => {
                    const totalAmount = filteredData.reduce((acc, curr) => acc + curr.amount, 0);
                    return totalAmount >= 1000
                      ? `${(totalAmount / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })}k €`
                      : `${totalAmount.toLocaleString('de-DE')} €`;
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Group */}
          <div className="flex items-center bg-slate-900/60 p-1 rounded-2xl border border-slate-700/50 shadow-inner h-fit">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${showHeatmap
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {showHeatmap ? 'Marker' : 'Heatmap'}
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-700/50 relative z-0">
        {loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm rounded-2xl transition-all duration-300">
            <div className="flex flex-col items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-700 shadow-2xl">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white font-medium text-sm">Aktualisiere Karte...</p>
            </div>
          </div>
        )}
        <MapContainer
          center={center}
          zoom={11}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
          aria-label={language === 'de' ? 'Karte der Diebstähle' : 'Theft locations map'}
        >
          <MapViewHandler district={district} selectedLorCoord={selectedLorCoord} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {lorData && (
            <GeoJSON
              key={`lor-layer-${selectedLorId}-${hoveredLorId}`}
              data={lorData}
              style={(feature) => {
                const id = feature?.properties?.SCHLUESSEL;
                const isSelected = id === selectedLorId;
                const isHovered = id === hoveredLorId;
                
                if (isSelected) {
                  return {
                    color: '#fbbf24',
                    weight: 4,
                    fillOpacity: 0.4,
                    fillColor: '#fbbf24',
                  };
                }
                
                return {
                  color: isHovered ? '#fff' : '#64748b',
                  weight: isHovered ? 3 : 1,
                  fillOpacity: isHovered ? 0.3 : 0.1,
                  fillColor: isHovered ? '#fff' : 'transparent',
                };
              }}
              onEachFeature={(feature, layer) => {
                if (feature.properties && feature.properties.PLR_NAME) {
                  layer.bindTooltip(feature.properties.PLR_NAME, {
                    direction: 'center',
                    className: 'lor-tooltip'
                  });
                }
              }}
            />
          )}
          {/* Heatmap Layer - Rendered behind markers */}
          {showHeatmap && (
            <Pane name="heatmap" style={{ zIndex: 500 }}>
              {filteredData.map((theft) => (
                <CircleMarker
                  key={`heat-${theft.id}`}
                  center={[theft.lat, theft.lng]}
                  radius={25}
                  pathOptions={{
                    color: 'transparent',
                    fillColor: theft.category === 'bicycle' ? '#10b981' : '#f43f5e',
                    fillOpacity: 0.1,
                    weight: 0
                  }}
                  interactive={false}
                />
              ))}
              {filteredData.map((theft) => (
                <CircleMarker
                  key={`core-${theft.id}`}
                  center={[theft.lat, theft.lng]}
                  radius={10}
                  pathOptions={{
                    color: 'transparent',
                    fillColor: theft.category === 'bicycle' ? '#fbbf24' : '#ef4444',
                    fillOpacity: 0.2,
                    weight: 0
                  }}
                  interactive={false}
                />
              ))}
            </Pane>
          )}

          {/* Markers Layer - Always visible and interactive */}
          <Pane name="markers" style={{ zIndex: 600 }}>
            {filteredData.map((theft) => (
              <CircleMarker
                key={theft.id}
                center={[theft.lat, theft.lng]}
                radius={6}
                pathOptions={{
                  color: theft.category === 'bicycle' ? '#10b981' : '#f43f5e',
                  fillColor: theft.category === 'bicycle' ? '#10b981' : '#f43f5e',
                  fillOpacity: showHeatmap ? 0.4 : 0.8, // Slightly more transparent when heatmap is on
                  weight: 1
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-3 min-w-[220px]">
                    <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                      <span>{theft.category === 'bicycle' ? '🚲' : '🚗'}</span>
                      {theft.category === 'bicycle' ? t('theft_type_bicycle') : t('theft_type_car')}
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
                        <span className="text-slate-400">{t('theft_time')}:</span>
                        <span className="font-bold text-slate-200">
                          {new Date(theft.date).toLocaleDateString(locale)} • {String(theft.hour ?? 0).padStart(2, '0')}:00
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
                        <span className="text-slate-400">{t('amount_label')}:</span>
                        <span className="font-black text-emerald-400">{theft.amount.toLocaleString(locale)} €</span>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
                        <span className="text-slate-400">{t('theft_type_label')}:</span>
                        <span className="font-bold text-slate-200 truncate max-w-[140px]" title={theft.type}>{theft.type}</span>
                      </div>
                      <div className="flex justify-between gap-4 items-start">
                        <span className="text-slate-400 shrink-0">{t('theft_detail_label')}:</span>
                        <span className="font-bold text-slate-200 text-right line-clamp-2 leading-relaxed" title={theft.details}>{theft.details}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </Pane>
        </MapContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-6">
          <p>{language === 'de' ? 'Datenquelle' : 'Data Source'}: Polizei Berlin / Open Data Berlin</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{language === 'de' ? 'Fahrrad' : 'Bicycle'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>{language === 'de' ? 'Kfz' : 'Car'}</span>
          </div>
        </div>

        {riskProfile && (
          <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-2xl border border-white/5">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-tighter text-slate-500 font-bold">{t('theft_risk_level')} ({language === 'de' ? 'Fahrrad' : 'Bike'})</span>
              <span className={`text-sm font-black ${riskProfile.bikeRisk > 7 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {riskProfile.bikeRisk.toFixed(1)}/10
              </span>
            </div>
            <div className="w-px h-6 bg-slate-700"></div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-tighter text-slate-500 font-bold">{t('theft_risk_level')} ({language === 'de' ? 'Kfz' : 'Car'})</span>
              <span className={`text-sm font-black ${riskProfile.carRisk > 7 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {riskProfile.carRisk.toFixed(1)}/10
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Section (Districts or Top 10 LORs) */}
      <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6">
          {(!district || district === 'Berlin' || district === 'All')
            ? `${language === 'de' ? 'Diebstähle nach Bezirken' : 'Thefts by District'} (${theftType === 'bicycle' ? (language === 'de' ? 'Fahrrad' : 'Bike') : theftType === 'car' ? (language === 'de' ? 'Kfz' : 'Car') : (language === 'de' ? 'Gesamt' : 'Total')})`
            : `Top 10 LORs in ${district}`}
        </h3>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center bg-slate-900/20 rounded-2xl border border-dashed border-slate-700">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">{language === 'de' ? 'Daten werden geladen...' : 'Loading data...'}</span>
            </div>
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(!district || district === 'Berlin' || district === 'All') ? districtStats : lorStats}
                layout="vertical"
                margin={{ left: 40, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={150} />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{
                    color: theftType === 'car' ? '#fb7185' : theftType === 'bicycle' ? '#10b981' : '#3b82f6'
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={theftType === 'car' ? "#f43f5e" : theftType === 'bicycle' ? "#10b981" : "#3b82f6"}
                  radius={[0, 4, 4, 0]}
                  label={{ position: 'right', fill: '#94a3b8', fontSize: 10 }}
                  onMouseEnter={(data) => {
                    if (data && data.id) {
                      setHoveredLorId(data.id);
                    }
                  }}
                  onMouseLeave={() => setHoveredLorId(null)}
                  onClick={(data: any) => {
                    // Handle both direct data (from Bar) and payload (from BarChart/Tooltip)
                    const item = data?.activePayload ? data.activePayload[0].payload : data;
                    if (!item) return;

                    const id = item.id;
                    const name = item.name;

                    // Toggle selection
                    if (selectedLorId === id) {
                      setSelectedLorId(null);
                      setSelectedLorCoord(null);
                      return;
                    }

                    setSelectedLorId(id || null);

                    // Try lookup by ID first
                    let centroid = id ? lorCentroids[id] : null;

                    // Fallback to name search
                    if (!centroid && name) {
                      centroid = Object.values(lorCentroids).find(c => c.name === name) || null;
                    }

                    if (centroid) {
                      setSelectedLorCoord({ lat: centroid.lat, lng: centroid.lng });
                      setTimeout(() => {
                        document.querySelector('.leaflet-container')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {((!district || district === 'Berlin' || district === 'All') ? districtStats : lorStats).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.id === selectedLorId ? "#fbbf24" : (theftType === 'car' ? "#f43f5e" : theftType === 'bicycle' ? "#10b981" : "#3b82f6")}
                      stroke={entry.id === selectedLorId ? "#fff" : "none"}
                      strokeWidth={entry.id === selectedLorId ? 1 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Pie Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bicycle Type Pie Chart */}
        <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">
            {theftType === 'car' ? (language === 'de' ? 'Entwendete Gegenstände' : 'Stolen Items') : theftType === 'bicycle' ? (language === 'de' ? 'Verteilung der Fahrradtypen' : 'Bicycle Type Distribution') : (language === 'de' ? 'Verteilung der Typen' : 'Type Distribution')}
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.1)" />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  layout="horizontal"
                  formatter={(value) => <span className="text-slate-300 text-[10px] font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crime Type Pie Chart */}
        <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">{language === 'de' ? 'Verteilung der Delikte' : 'Crime Distribution'}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deliktData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deliktData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} stroke="rgba(255,255,255,0.1)" />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  layout="horizontal"
                  formatter={(value) => <span className="text-slate-300 text-[10px] font-medium whitespace-nowrap">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekday & Damage Trend Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">{language === 'de' ? 'Diebstähle nach Wochentag' : 'Thefts by Weekday'}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">{language === 'de' ? 'Trendvergleich (Diebstähle)' : 'Trend Comparison (Thefts)'}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendComparisonData}>
                <defs>
                  <linearGradient id="colorBike" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickCount={10} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="bike" name="Fahrrad" stroke="#10b981" fillOpacity={1} fill="url(#colorBike)" strokeWidth={3} />
                <Area type="monotone" dataKey="car" name="Kfz" stroke="#f43f5e" fillOpacity={1} fill="url(#colorCar)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Theft List Table */}
      <div className="bg-slate-800/50 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-xl font-bold text-white">{language === 'de' ? 'Details der Diebstähle' : 'Theft Details'}</h3>
          <p className="text-xs text-slate-500 mt-1">{language === 'de' ? 'Liste aller gefilterten Fälle' : 'List of all filtered cases'}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/30">
                {[
                  { key: 'date', label: language === 'de' ? 'Datum' : 'Date' },
                  { key: 'type', label: theftType === 'bicycle' ? (language === 'de' ? 'Fahrradtyp' : 'Bicycle Type') : (language === 'de' ? 'Gegenstand' : 'Item') },
                  { key: 'amount', label: language === 'de' ? 'Schaden' : 'Damage' },
                  { key: 'lor', label: language === 'de' ? 'Bezirk / LOR' : 'District / LOR' },
                  { key: 'details', label: language === 'de' ? 'Delikt' : 'Crime' }
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key as keyof TheftData)}
                    className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      <span className="text-slate-600">
                        {sortKey === col.key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {paginatedData.length > 0 ? (
                paginatedData.map((theft) => (
                  <tr
                    key={theft.id}
                    className="hover:bg-slate-700/20 transition-colors group"
                  >
                    <td className="px-6 py-4 text-slate-300 font-medium whitespace-nowrap">
                      {new Date(theft.date).toLocaleDateString(locale)}
                      <span className="text-[10px] text-slate-500 block uppercase tracking-tighter font-bold">
                        {language === 'de' ? 'Tatzeit' : 'Time'}: {String(theft.hour ?? 0).padStart(2, '0')}:00 {language === 'de' ? 'Uhr' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-100">
                      <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-semibold">
                        {theft.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-bold ${theft.category === 'bicycle' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {theft.amount.toLocaleString(locale)} €
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="flex flex-col">
                        <span>{theft.lor}</span>
                        <span className="text-[10px] text-slate-500">{theft.rawLor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 truncate max-w-[200px]" title={theft.details}>
                      {theft.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                    {language === 'de' ? 'Keine Daten für diesen Zeitraum gefunden.' : 'No data found for this period.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 font-medium">
              {language === 'de' ? 'Zeige' : 'Showing'} <span className="text-slate-300">{(currentPage - 1) * itemsPerPage + 1}</span> {language === 'de' ? 'bis' : 'to'} <span className="text-slate-300">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> {language === 'de' ? 'von' : 'of'} <span className="text-slate-300">{sortedData.length}</span> {language === 'de' ? 'Diebstählen' : 'Thefts'}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {language === 'de' ? 'Zurück' : 'Back'}
              </button>

              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {language === 'de' ? 'Weiter' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
