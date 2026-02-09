'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ComposedChart } from 'recharts';

interface RoadConditionData {
    district: string;
    condition: number; // 1-5
    spending: number; // Mio €
}

interface RoadConditionChartProps {
    data: RoadConditionData[];
    year: number;
}

export function RoadConditionChart({ data, year }: RoadConditionChartProps) {
    const yearLabel = year || 'Alle Jahre';

    return (
        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Infrastruktur: Straßenzustand vs. Tiefbau ({yearLabel})</h3>
            <p className="text-sm text-slate-500 mb-6">
                Durchschnittsnote (1=Sehr gut, 5=Mangelhaft) im Vergleich zu Ausgaben im Tiefbau (Kapitel 3800).
            </p>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="district" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                        <YAxis yAxisId="left" unit="M" orientation="right" />
                        <YAxis yAxisId="right" domain={[1, 5]} orientation="left" label={{ value: 'Note', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="spending" name={`Inv. Tiefbau (${yearLabel})`} fill="#0ea5e9" barSize={20} />
                        <Bar yAxisId="right" dataKey="condition" name="Zustandsnote (Ø)" fill="#eab308" barSize={20} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-right">
                Quelle: FIS Broker (Mittelwerte) & Open Data (Kapitel 3800)
            </p>
        </div>
    );
}
