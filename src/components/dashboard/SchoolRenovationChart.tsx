
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface SchoolData {
    district: string;
    backlog: number; // Mio €
    spending: number; // Mio € (Chapter 3701)
}

interface SchoolRenovationChartProps {
    data: SchoolData[];
    year: number;
}

export function SchoolRenovationChart({ data, year }: SchoolRenovationChartProps) {
    const yearLabel = year || 'Alle Jahre';
    return (
        <div className="bg-slate-900/50 rounded-2xl shadow-xl p-6 border border-slate-800">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Schulsanierung: Bedarf vs. Investition ({yearLabel})</h3>
            <p className="text-sm text-slate-500 mb-6">
                Vergleich des geschätzten Sanierungsstaus mit den tatsächlichen Ausgaben im Bereich Schulbau (Kapitel 3701).
            </p>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
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
                        <YAxis unit="M" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="spending" name={`Inv. Schulbau (${yearLabel})`} fill="#10b981" />
                        <Bar dataKey="backlog" name="Sanierungsstau (Geschätzt)" fill="#ef4444" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-right">
                Quelle: Senatsverwaltung (Schulbauoffensive) & Open Data (Kapitel 3701)
            </p>
        </div>
    );
}
