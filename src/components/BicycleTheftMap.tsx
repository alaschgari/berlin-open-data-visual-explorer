'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, GeoJSON, Pane } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useDebounce } from '@/hooks/useDebounce';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';

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
  lat: number;
  lng: number;
  amount: number;
  date: string;
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

export default function BicycleTheftMap({ district }: { district?: string }) {
  const [data, setData] = useState<TheftData[]>([]);
  const [prevYearData, setPrevYearData] = useState<TheftData[]>([]);
  const [lorData, setLorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<keyof TheftData>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const itemsPerPage = 20;

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

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const fetchCurrent = async () => {
          const params = new URLSearchParams({
            start: debouncedStartDate,
            end: debouncedEndDate,
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
            ...(district && district !== 'Berlin' && district !== 'All' ? { district } : {})
          });
          const res = await fetch(`/api/bicycle-theft?${params.toString()}`);
          return res.ok ? res.json() : [];
        };

        const [current, prev] = await Promise.all([fetchCurrent(), fetchPrev()]);
        setData(current);
        setPrevYearData(prev);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
        setCurrentPage(1);
      }
    }

    fetchData();
  }, [debouncedStartDate, debouncedEndDate, district]);

  useEffect(() => {
    fetch('/data/berlin-lor-planungsraeume.geojson')
      .then(res => res.json())
      .then(data => setLorData(data))
      .catch(err => console.error('Error loading LOR data:', err));
  }, []);

  const sortedData = [...data].sort((a, b) => {
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

  const pieData = Object.entries(
    data.reduce((acc: Record<string, number>, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const deliktData = Object.entries(
    data.reduce((acc: Record<string, number>, curr) => {
      const delikt = curr.details || 'Unbekannt';
      acc[delikt] = (acc[delikt] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const districtStats = Object.entries(
    data.reduce((acc: Record<string, number>, curr) => {
      const prefix = curr.rawLor?.substring(0, 2);
      const districtName = prefix ? (LOR_PREFIX_TO_DISTRICT[prefix] || 'Unbekannt') : 'Unbekannt';
      acc[districtName] = (acc[districtName] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const lorStats = Object.entries(
    data.reduce((acc: Record<string, number>, curr) => {
      acc[curr.lor] = (acc[curr.lor] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

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

  data.forEach(theft => {
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

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate center of Berlin
  const center: [number, number] = [52.5200, 13.4050];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Fahrraddiebstahl Karte
              </h2>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900/50 rounded-full border border-slate-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Data</span>
              </div>
            </div>
            <p className="text-slate-400 mt-1 text-sm flex items-center gap-2">
              Visualisierung {district && district !== 'Berlin' ? `in ${district}` : 'in Berlin'}
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span className="text-slate-500 font-medium">({diffDays === 30 ? 'Letzte 30 Tage' : `${diffDays} Tage`})</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Actions */}
            <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700 shadow-inner">
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showHeatmap
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {showHeatmap ? 'Marker' : 'Heatmap'}
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>

            {/* Date Range */}
            <div className="flex items-center bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 shadow-inner gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-white text-xs outline-none focus:ring-0 cursor-pointer"
              />
              <span className="text-slate-600 font-bold">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-white text-xs outline-none focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-2 lg:ml-2">
              <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 shadow-inner min-w-[80px]">
                <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter block">Gesamt</span>
                <span className="text-sm font-bold text-white leading-none">{data.length.toLocaleString()}</span>
              </div>

              {prevYearData.length > 0 && (
                <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 shadow-inner min-w-[80px]">
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter block">vs. Vorjahr</span>
                  {(() => {
                    const diff = ((data.length - prevYearData.length) / prevYearData.length) * 100;
                    return (
                      <span className={`text-sm font-bold leading-none ${diff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                      </span>
                    );
                  })()}
                </div>
              )}

              <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-inner min-w-[80px]">
                <span className="text-[9px] text-emerald-500/50 uppercase font-black tracking-tighter block">Schaden</span>
                <span className="text-sm font-bold text-emerald-400 leading-none">
                  {(() => {
                    const totalAmount = data.reduce((acc, curr) => acc + curr.amount, 0);
                    return totalAmount >= 1000
                      ? `${Math.round(totalAmount / 1000).toLocaleString('de-DE')}k €`
                      : `${totalAmount.toLocaleString('de-DE')} €`;
                  })()}
                </span>
              </div>
            </div>
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
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {lorData && (
            <GeoJSON
              data={lorData}
              style={{
                color: '#64748b',
                weight: 1,
                fillOpacity: 0.1,
                fillColor: 'transparent'
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
          {/* Heatmap Layer or Markers */}
          {showHeatmap ? (
            <Pane name="heatmap" style={{ zIndex: 500 }}>
              {data.map((theft) => (
                <CircleMarker
                  key={`heat-${theft.id}`}
                  center={[theft.lat, theft.lng]}
                  radius={25}
                  pathOptions={{
                    color: 'transparent',
                    fillColor: '#f43f5e',
                    fillOpacity: 0.05,
                    weight: 0
                  }}
                  interactive={false}
                />
              ))}
              {/* Core of the heat */}
              {data.map((theft) => (
                <CircleMarker
                  key={`core-${theft.id}`}
                  center={[theft.lat, theft.lng]}
                  radius={10}
                  pathOptions={{
                    color: 'transparent',
                    fillColor: '#fbbf24',
                    fillOpacity: 0.1,
                    weight: 0
                  }}
                  interactive={false}
                />
              ))}
            </Pane>
          ) : (
            <Pane name="markers" style={{ zIndex: 600 }}>
              {data.map((theft) => (
                <CircleMarker
                  key={theft.id}
                  center={[theft.lat, theft.lng]}
                  radius={6}
                  pathOptions={{
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.8,
                    weight: 1
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold text-slate-900 text-sm mb-2">{theft.type}</h3>
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Datum:</span>
                          <span className="font-medium">{new Date(theft.date).toLocaleDateString('de-DE')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Schaden:</span>
                          <span className="font-medium text-emerald-600">{theft.amount} €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Art:</span>
                          <span className="font-medium truncate max-w-[120px]" title={theft.details}>{theft.details}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>LOR:</span>
                          <span className="font-medium">{theft.lor}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </Pane>
          )}
        </MapContainer>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <p>Datenquelle: Polizei Berlin / Open Data Berlin</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Diebstahlort</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full border border-slate-500"></span>
          <span>LOR (Planungsräume)</span>
        </div>
      </div>

      {/* Statistics Section (Districts or Top 10 LORs) */}
      <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6">
          {(!district || district === 'Berlin' || district === 'All')
            ? 'Diebstähle nach Bezirken'
            : `Top 10 LORs in ${district}`}
        </h3>
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
                itemStyle={{ color: (!district || district === 'Berlin' || district === 'All') ? '#10b981' : '#3b82f6' }}
              />
              <Bar
                dataKey="count"
                fill={(!district || district === 'Berlin' || district === 'All') ? "#10b981" : "#3b82f6"}
                radius={[0, 4, 4, 0]}
                label={{ position: 'right', fill: '#94a3b8', fontSize: 10 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bicycle Type Pie Chart */}
        <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">Verteilung der Fahrradtypen</h3>
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
          <h3 className="text-xl font-bold text-white mb-6">Verteilung der Delikte</h3>
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
          <h3 className="text-xl font-bold text-white mb-6">Diebstähle nach Wochentag</h3>
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
          <h3 className="text-xl font-bold text-white mb-6">Durchschn. Schaden pro Tag</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={damageTrendData}>
                <defs>
                  <linearGradient id="colorDamage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickCount={10} />
                <YAxis stroke="#94a3b8" fontSize={12} unit=" €" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorDamage)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Theft List Table */}
      <div className="bg-slate-800/50 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-xl font-bold text-white">Details der Diebstähle</h3>
          <p className="text-xs text-slate-500 mt-1">Liste aller gefilterten Fälle</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/30">
                {[
                  { key: 'date', label: 'Datum' },
                  { key: 'type', label: 'Fahrradtyp' },
                  { key: 'amount', label: 'Schaden' },
                  { key: 'lor', label: 'Bezirk / LOR' },
                  { key: 'details', label: 'Delikt' }
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
                      {new Date(theft.date).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 text-slate-100">
                      <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-semibold">
                        {theft.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      {theft.amount.toLocaleString('de-DE')} €
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
                    Keine Daten für diesen Zeitraum gefunden.
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
              Zeige <span className="text-slate-300">{(currentPage - 1) * itemsPerPage + 1}</span> bis <span className="text-slate-300">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> von <span className="text-slate-300">{sortedData.length}</span> Diebstählen
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Zurück
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
                Weiter
              </button>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
