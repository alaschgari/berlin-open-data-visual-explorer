'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area } from 'recharts';
import { Loader2, AlertCircle, Calendar, Clock, BarChart3, Info } from 'lucide-react';

interface TrafficHistoryChartProps {
    segmentId: number | null;
}

type ViewMode = '24h' | '7d';

export default function TrafficHistoryChart({ segmentId }: TrafficHistoryChartProps) {
    const { t } = useLanguage();
    const [originalData, setOriginalData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('7d'); // Default to 7 days daily view

    useEffect(() => {
        if (!segmentId) return;

        async function fetchHistory() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/traffic/history?segment_id=${segmentId}`);
                if (!res.ok) throw new Error('Failed to fetch history');

                const json = await res.json();
                if (json.report && Array.isArray(json.report)) {
                    // Normalize data
                    const processed = json.report.map((item: any) => ({
                        dateObj: new Date(item.date),
                        fullDate: item.date,
                        v85: item.v85,
                        car: item.car,
                        bike: item.bike,
                        pedestrian: item.pedestrian,
                        heavy: item.heavy
                    }));

                    // Sort by date ascending
                    processed.sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime());
                    setOriginalData(processed);
                } else {
                    setOriginalData([]);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load history data');
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [segmentId]);

    const displayData = useMemo(() => {
        if (originalData.length === 0) return [];
        const locale = t('locale') === 'DE' ? 'de-DE' : 'en-US';

        if (viewMode === '24h') {
            // Take last 24 entries (hours)
            const sliced = originalData.slice(-24);
            return sliced.map(item => ({
                ...item,
                date: item.dateObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
                car: Math.round(item.car || 0),
                bike: Math.round(item.bike || 0),
                pedestrian: Math.round(item.pedestrian || 0),
                heavy: Math.round(item.heavy || 0),
                v85: Math.round(item.v85 || 0)
            }));
        } else {
            // Aggregate by Day (7d view)
            const grouped = originalData.reduce((acc: any, item: any) => {
                // Short format: "16.02."
                const dayKey = item.dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                // Full date for tooltip
                const fullDate = item.dateObj.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

                if (!acc[dayKey]) {
                    acc[dayKey] = {
                        date: dayKey,
                        fullDate: fullDate, // Store full date for tooltip
                        v85_sum: 0,
                        v85_count: 0,
                        car: 0,
                        bike: 0,
                        pedestrian: 0,
                        heavy: 0,
                        count: 0
                    };
                }

                // Sum volumes
                acc[dayKey].car += item.car || 0;
                acc[dayKey].bike += item.bike || 0;
                acc[dayKey].pedestrian += item.pedestrian || 0;
                acc[dayKey].heavy += item.heavy || 0;

                // Track speed for average
                if (item.v85) {
                    acc[dayKey].v85_sum += item.v85;
                    acc[dayKey].v85_count += 1;
                }

                return acc;
            }, {});

            return Object.values(grouped).map((group: any) => ({
                ...group,
                car: Math.round(group.car),
                bike: Math.round(group.bike),
                pedestrian: Math.round(group.pedestrian),
                heavy: Math.round(group.heavy),
                v85: group.v85_count > 0 ? Math.round(group.v85_sum / group.v85_count) : 0
            }));
        }
    }, [originalData, viewMode]);

    if (!segmentId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 border border-dashed border-slate-700 rounded-xl">
                <Calendar className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">{t('traffic_select_segment')}</p>
            </div>
        );
    }

    if (loading) return <div className="h-full flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...</div>;
    if (error) return <div className="h-full flex items-center justify-center text-rose-400"><AlertCircle className="w-5 h-5 mr-2" /> {error}</div>;
    if (originalData.length === 0) return <div className="h-full flex items-center justify-center text-slate-400">No data available.</div>;

    return (
        <div className="w-full h-full flex flex-col">
            {/* Controls */}
            <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-slate-900/30 px-2 py-1 rounded-md border border-slate-800/50">
                    <Info className="w-3 h-3 text-amber-500/70" />
                    <span>{t('traffic_night_gap')}</span>
                </div>

                <div className="bg-slate-900/50 p-1 rounded-lg border border-slate-700/50 flex gap-1">
                    <button
                        onClick={() => setViewMode('24h')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${viewMode === '24h' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Clock className="w-3 h-3" /> 24h
                    </button>
                    <button
                        onClick={() => setViewMode('7d')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${viewMode === '7d' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <BarChart3 className="w-3 h-3" /> 7 Days
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            interval={viewMode === '24h' ? 2 : 0} // Show every 3rd tick for 24h, all for 7d
                        />
                        <YAxis
                            yAxisId="left"
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            label={{ value: t('traffic_vol'), angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fill: '#f43f5e', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            unit=" km/h"
                            domain={[0, 'auto']}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />

                        <Bar yAxisId="left" dataKey="car" name={t('traffic_cars')} stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} />
                        <Bar yAxisId="left" dataKey="heavy" name={t('traffic_heavy')} stackId="a" fill="#a855f7" />
                        <Bar yAxisId="left" dataKey="bike" name={t('traffic_bikes')} stackId="a" fill="#14b8a6" />
                        <Bar yAxisId="left" dataKey="pedestrian" name={t('traffic_peds')} stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />

                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="v85"
                            name={t('traffic_v85')}
                            stroke="#f43f5e"
                            strokeWidth={2}
                            fill="url(#colorSpeed)"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
