
'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

interface CorrelationData {
    district: string;
    spendingPerCapita: number;
    unemploymentRate: number;
}

interface SocialCorrelationChartProps {
    data: CorrelationData[];
    year: number;
}

export function SocialCorrelationChart({ data, year }: SocialCorrelationChartProps) {
    const yearLabel = year || 'Alle Jahre';

    return (
        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Korrelation: Budget vs. Arbeitslosigkeit ({yearLabel})</h3>
            <p className="text-sm text-slate-500 mb-6">
                Gibt ein Bezirk mehr Geld aus, wo der soziale Bedarf (gemessen an Arbeitslosigkeit) höher ist?
            </p>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                        margin={{
                            top: 20,
                            right: 20,
                            bottom: 20,
                            left: 20,
                        }}
                    >
                        <CartesianGrid />
                        <XAxis type="number" dataKey="unemploymentRate" name="Arbeitslosenquote" unit="%" label={{ value: 'Arbeitslosenquote (%)', position: 'bottom', offset: 0 }} />
                        <YAxis type="number" dataKey="spendingPerCapita" name="Ausgaben pro Kopf" unit="€" label={{ value: 'Ausgaben pro Kopf (€)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white p-2 border border-slate-200 shadow rounded">
                                        <p className="font-bold">{data.district}</p>
                                        <p>Arbeitslosigkeit: {data.unemploymentRate}%</p>
                                        <p>Ausgaben ({yearLabel}): €{data.spendingPerCapita}</p>
                                    </div>
                                );
                            }
                            return null;
                        }} />
                        <Scatter name="Bezirke" data={data} fill="#8884d8">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.spendingPerCapita > 4000 ? "#82ca9d" : "#8884d8"} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
