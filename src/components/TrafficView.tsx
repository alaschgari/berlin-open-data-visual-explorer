'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from './LanguageContext';
import TrafficMapWrapper from './TrafficMapWrapper';
import TrafficTable from './TrafficTable';
import TrafficHistoryChart from './TrafficHistoryChart';
import { BarChart3, Info, TrendingUp, Users, ShieldAlert, Clock, CalendarDays } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getDistrictFromCoordinates } from '../lib/traffic';

interface TrafficViewProps {
    district: string;
}

export default function TrafficView({ district }: TrafficViewProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [trafficData, setTrafficData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isKeyMissing, setIsKeyMissing] = useState(false);
    const [highlightedSegmentId, setHighlightedSegmentId] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setIsKeyMissing(false);

            try {
                const response = await fetch(`/api/traffic?district=${district}&type=snapshot`);

                if (response.status === 401) {
                    setIsKeyMissing(true);
                    setLoading(false);
                    return;
                }

                if (!response.ok) throw new Error('Failed to fetch snapshot');
                const data = await response.json();

                // Enrich data with computed district
                if (data.features) {
                    data.features = data.features.map((f: any) => {
                        let lat, lng;
                        // Handle MultiLineString (take first point of first line)
                        if (f.geometry.type === 'MultiLineString') {
                            const firstPoint = f.geometry.coordinates[0][0];
                            lng = firstPoint[0];
                            lat = firstPoint[1];
                        }
                        // Handle LineString (take first point)
                        else if (f.geometry.type === 'LineString') {
                            const firstPoint = f.geometry.coordinates[0];
                            lng = firstPoint[0];
                            lat = firstPoint[1];
                        }

                        if (lat && lng) {
                            f.properties.district = getDistrictFromCoordinates(lat, lng);
                        } else {
                            f.properties.district = 'Unknown';
                        }
                        return f;
                    });
                }

                setTrafficData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [district]);

    // Prepare chart data
    const chartData = React.useMemo(() => {
        if (!trafficData?.features) return [];
        const totals = trafficData.features.reduce((acc: any, curr: any) => ({
            car: acc.car + (curr.properties.car || 0),
            bike: acc.bike + (curr.properties.bike || 0),
            pedestrian: acc.pedestrian + (curr.properties.pedestrian || 0),
            heavy: acc.heavy + (curr.properties.heavy || 0)
        }), { car: 0, bike: 0, pedestrian: 0, heavy: 0 });

        return [
            { name: t('traffic_peds'), value: Math.round(totals.pedestrian) },
            { name: t('traffic_bikes'), value: Math.round(totals.bike) },
            { name: t('traffic_cars'), value: Math.round(totals.car) },
            { name: t('traffic_heavy'), value: Math.round(totals.heavy) }
        ];
    }, [trafficData, t]);

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Card */}
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                {t('traffic_title')}
                            </h2>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900/50 rounded-full border border-slate-700/50">
                                <span className={`w-1.5 h-1.5 rounded-full ${trafficData?.features?.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'} `}></span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {trafficData?.features?.length > 0 ? t('traffic_live_api') : t('traffic_no_data')}
                                </span>
                            </div>
                        </div>
                        <p className="text-slate-400 mt-1 text-sm">
                            {t('traffic_subtitle')}
                        </p>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-col lg:items-end gap-1 text-xs text-slate-500 font-mono">
                        {trafficData?.features?.[0]?.properties?.date && (
                            <div className="flex items-center gap-2">
                                <span className="text-slate-600">{t('traffic_time_range')}:</span>
                                <span className="text-emerald-400">
                                    {(() => {
                                        const date = new Date(trafficData.features[0].properties.date);
                                        const endDate = new Date(date.getTime() + 60 * 60 * 1000); // Add 1 hour
                                        return `${date.toLocaleString(t('locale') === 'DE' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString(t('locale') === 'DE' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' })} ${t('locale') === 'DE' ? 'Uhr' : ''}`;
                                    })()}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="text-slate-600">{t('traffic_source')}:</span>
                            <a
                                href="https://telraam.net"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                            >
                                Telraam.net
                                <TrendingUp className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Section */}
                <div className="lg:col-span-2 bg-slate-800/50 rounded-3xl border border-slate-700/50 overflow-hidden relative min-h-[500px] shadow-xl">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-700 shadow-2xl">
                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-white font-medium text-sm">{t('traffic_loading')}</p>
                            </div>
                        </div>
                    )}

                    {isKeyMissing && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
                            <div className="max-w-md w-full bg-slate-900 border border-slate-700/50 rounded-2xl p-8 shadow-2xl text-center">
                                <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">API Key Required</h3>
                                <p className="text-slate-400 mb-6">
                                    Access to Telraam traffic data requires a valid API Key.
                                    Real data cannot be displayed without it.
                                </p>
                                <div className="bg-slate-950 p-4 rounded-lg text-left mb-6 border border-slate-800">
                                    <p className="text-xs text-slate-500 font-mono mb-2">Add to .env.local:</p>
                                    <code className="text-sm text-emerald-400 font-mono block overflow-x-auto">
                                        TELRAAM_API_KEY=your_key_here
                                    </code>
                                </div>
                                <a
                                    href="https://telraam.net/en/register"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-xl transition-all"
                                >
                                    Get Free API Key
                                </a>
                            </div>
                        </div>
                    )}

                    <TrafficMapWrapper
                        district={district}
                        data={trafficData}
                        isKeyMissing={isKeyMissing}
                        highlightedSegmentId={highlightedSegmentId}
                        onSegmentSelect={setHighlightedSegmentId}
                    />
                </div>

                {/* Data Insights Section */}
                <div className="space-y-6">
                    {/* Modal Split Card */}
                    <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-sm">
                        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-400" />
                            {t('traffic_modal_split')}
                        </h3>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Segment History Card */}
                    <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-sm h-[400px] flex flex-col">
                        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-emerald-400" />
                            {highlightedSegmentId ? `${t('traffic_history_title')}${highlightedSegmentId}` : t('traffic_history_default')}
                        </h3>
                        <div className="flex-1 min-h-0">
                            <TrafficHistoryChart segmentId={highlightedSegmentId} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Traffic Segment Table */}
            {trafficData?.features && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    <TrafficTable
                        features={trafficData.features}
                        highlightedId={highlightedSegmentId}
                        onHighlight={setHighlightedSegmentId}
                    />
                </div>
            )}
        </div>
    );
}
