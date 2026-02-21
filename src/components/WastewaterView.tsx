'use client';

import React, { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area
} from 'recharts';
import { WastewaterRecord } from '@/lib/wastewater';

interface WastewaterViewProps {
    data: WastewaterRecord[];
}

interface MetricSummary {
    date: string;
    Durchfluss: number;
    Temperatur: number;
}

type PathogenType = 'Influenza A' | 'Influenza B' | 'RSV' | 'All';

export default function WastewaterView({ data }: WastewaterViewProps) {
    const [selectedPathogen, setSelectedPathogen] = useState<PathogenType>('All');
    const [selectedPlant, setSelectedPlant] = useState<string>('All');

    const plants = useMemo(() => Array.from(new Set(data.map(d => d.uww_name))), [data]);
    const pathogens: PathogenType[] = useMemo(() => ['Influenza A', 'Influenza B', 'RSV'], []);

    const viralData = useMemo(() => {
        const groupedByDate: Record<string, { date: string, values: Record<string, number>, count: Record<string, number> }> = {};

        data.forEach(record => {
            const date = record.datum;
            if (selectedPlant !== 'All' && record.uww_name !== selectedPlant) return;

            if (!groupedByDate[date]) {
                groupedByDate[date] = { date, values: {}, count: {} };
            }

            const key = record.erreger;
            if (!groupedByDate[date].values[key]) {
                groupedByDate[date].values[key] = 0;
                groupedByDate[date].count[key] = 0;
            }
            groupedByDate[date].values[key] += record.messwert;
            groupedByDate[date].count[key] += 1;
        });

        return Object.values(groupedByDate).map(d => {
            const processed: Record<string, string | number> = { date: d.date };
            pathogens.forEach(p => {
                if (p !== 'All' && d.count[p] > 0) {
                    processed[p] = parseFloat((d.values[p] / d.count[p]).toFixed(2));
                }
            });
            return processed;
        }).sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime());
    }, [data, selectedPlant, pathogens]);

    const metricsData = useMemo(() => {
        const tempGroup: Record<string, { date: string, plant: string, flow: number, temp: number }> = {};
        data.forEach(record => {
            const key = `${record.datum}-${record.uww_name}`;
            if (!tempGroup[key]) {
                tempGroup[key] = {
                    date: record.datum,
                    plant: record.uww_name,
                    flow: record.durchfluss,
                    temp: record.temperatur
                };
            }
        });

        const finalGroup: Record<string, { date: string, flow: number, temp: number, count: number }> = {};
        Object.values(tempGroup).forEach(record => {
            if (selectedPlant !== 'All' && record.plant !== selectedPlant) return;

            if (!finalGroup[record.date]) {
                finalGroup[record.date] = { date: record.date, flow: 0, temp: 0, count: 0 };
            }
            finalGroup[record.date].flow += record.flow;
            finalGroup[record.date].temp += record.temp;
            finalGroup[record.date].count += 1;
        });

        return Object.values(finalGroup).map((d): MetricSummary => ({
            date: d.date,
            Durchfluss: parseFloat((d.flow / d.count).toFixed(2)),
            Temperatur: parseFloat((d.temp / d.count).toFixed(2))
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [data, selectedPlant]);

    const colors: Record<string, string> = {
        'Influenza A': '#f43f5e', // rose-500
        'Influenza B': '#3b82f6', // blue-500
        'RSV': '#10b981',         // emerald-500
        'Durchfluss': '#8b5cf6',   // violet-500
        'Temperatur': '#f59e0b'    // amber-500
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm group hover:border-rose-500/50 transition-all">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Pathogene</h3>
                    <p className="text-3xl font-bold text-slate-100">3</p>
                    <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Influenza A, B, RSV</span>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm group hover:border-emerald-500/50 transition-all">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Klärwerke</h3>
                    <p className="text-3xl font-bold text-emerald-400">3</p>
                    <span className="text-[10px] text-slate-500 font-medium">Ruhleben, Schönerlinde, Waßmannsdorf</span>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm group hover:border-blue-500/50 transition-all">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Letzte Messung</h3>
                    <p className="text-3xl font-bold text-blue-400">
                        {viralData.length > 0 ? new Date(viralData[viralData.length - 1].date as string).toLocaleDateString('de-DE') : 'N/A'}
                    </p>
                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Aktuellster Stand</span>
                </div>
            </div>

            {/* Control Panel */}
            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl">
                <div className="flex flex-col gap-3 w-full lg:w-auto">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Fokus: Klärwerk wählen</span>
                    <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-700/50 shadow-inner overflow-x-auto custom-scrollbar">
                        {['All', ...plants].map((p) => (
                            <button
                                key={p}
                                onClick={() => setSelectedPlant(p)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedPlant === p ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                {p === 'All' ? 'Berlin Gesamt' : p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-10 w-px bg-slate-700/50 hidden lg:block"></div>

                <div className="flex flex-col gap-3 w-full lg:w-auto">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Analyse: Erreger filtern</span>
                    <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-700/50 shadow-inner overflow-x-auto custom-scrollbar">
                        {(['All', 'Influenza A', 'Influenza B', 'RSV'] as PathogenType[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setSelectedPathogen(p)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedPathogen === p ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trend Chart */}
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 shadow-inner">
                    <h2 className="text-xl font-bold text-slate-100 mb-2">Virenlast-Verlauf</h2>
                    <p className="text-slate-500 text-sm mb-8">Mittlere Konzentration (Kopien/ml)</p>

                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={viralData}>
                                <defs>
                                    {pathogens.map(p => (
                                        <linearGradient key={`grad-${p}`} id={`color${p.replace(' ', '')}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={colors[p]} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={colors[p]} stopOpacity={0} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    fontSize={11}
                                    tickMargin={10}
                                    tickFormatter={(str: string) => new Date(str).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={11}
                                    tickFormatter={(val: number) => val.toLocaleString('de-DE')}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}
                                    labelFormatter={(label: any) => new Date(label).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                {pathogens.map(p => (
                                    (selectedPathogen === 'All' || selectedPathogen === p) && (
                                        <Area
                                            key={p}
                                            type="monotone"
                                            dataKey={p}
                                            stroke={colors[p]}
                                            fillOpacity={1}
                                            fill={`url(#color${p.replace(' ', '')})`}
                                            strokeWidth={3}
                                            dot={{ r: 4, strokeWidth: 1, fill: colors[p] }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                            connectNulls={true}
                                        />
                                    )
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Metrics Chart */}
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 shadow-inner">
                    <h2 className="text-xl font-bold text-slate-100 mb-2">Abwasser-Parameter</h2>
                    <p className="text-slate-500 text-sm mb-8">Einfluss von Durchflussmenge und Temperatur</p>

                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metricsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    fontSize={11}
                                    tickMargin={10}
                                    tickFormatter={(str: string) => new Date(str).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}
                                />
                                <YAxis
                                    yAxisId="left"
                                    stroke={colors['Durchfluss']}
                                    fontSize={11}
                                    width={60}
                                    tickFormatter={(val: number) => `${(val / 1000000).toFixed(1)}M`}
                                    domain={[0, 'auto']}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke={colors['Temperatur']}
                                    fontSize={11}
                                    width={60}
                                    tickFormatter={(val: number) => `${val}°`}
                                    domain={[0, 40]}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                    labelFormatter={(label: any) => new Date(label).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    formatter={(value: any, name: any) => {
                                        if (name.includes('Durchfluss')) return [`${value.toLocaleString('de-DE')} Liter/Tag`, name];
                                        if (name.includes('Temp')) return [`${value} °C`, name];
                                        return [value, name];
                                    }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Line
                                    yAxisId="left"
                                    name="Durchfluss (Liter/Tag)"
                                    type="monotone"
                                    dataKey={(d: MetricSummary) => d.Durchfluss * 1000}
                                    stroke={colors['Durchfluss']}
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    connectNulls={true}
                                />
                                <Line
                                    yAxisId="right"
                                    name="Temp (°C)"
                                    type="monotone"
                                    dataKey="Temperatur"
                                    stroke={colors['Temperatur']}
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    connectNulls={true}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-1">Frühwarnsystem</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Das Abwassermonitoring (BEWAC) dient als wichtiger Indikator für das Infektionsgeschehen in Berlin.
                            Da Erreger oft Tage vor den ersten klinischen Symptomen im Abwasser nachweisbar sind, können Trends
                            frühzeitig erkannt werden. Die Durchflussmenge (z.B. bei Starkregen) kann die Konzentration beeinflussen.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
