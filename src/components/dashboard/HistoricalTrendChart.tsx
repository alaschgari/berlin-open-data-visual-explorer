
'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistoricalDataPoint {
    year: number;
    budget: number;
    actual: number;
}

interface HistoricalTrendChartProps {
    data: HistoricalDataPoint[];
}

export function HistoricalTrendChart({ data }: HistoricalTrendChartProps) {
    return (
        <div className="bg-slate-900/50 rounded-2xl shadow-xl p-6 border border-slate-800">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Langzeittrend (2010 - Heute)</h3>
            <p className="text-sm text-slate-500 mb-6">
                Entwicklung des Berliner Haushalts über die letzten 15 Jahre (inkl. historischer Daten aus PDF-Berichten).
            </p>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis unit="M" tickFormatter={(value) => `€${(value / 1000).toFixed(0)} Mrd.`} />
                        <Tooltip formatter={(value: any) => [`€${(value || 0).toLocaleString()} Mio.`, '']} />
                        <Area type="monotone" dataKey="actual" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Ist-Ausgaben" />
                        <Area type="monotone" dataKey="budget" stackId="2" stroke="#8884d8" fill="#8884d8" name="Budget (Ansatz)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
