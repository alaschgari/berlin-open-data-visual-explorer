
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ExpensesChartProps {
    data: {
        year: number;
        budget: number;
        actual: number;
    }[];
}

export function ExpensesChart({ data }: ExpensesChartProps) {
    return (
        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Budgetentwicklung über die Jahre</h3>
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
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => `€${(value / 1000000).toFixed(0)}M`} />
                        <Tooltip
                            formatter={(value: any) => [`€${(value || 0).toLocaleString()}`, '']}
                            labelStyle={{ color: '#333' }}
                        />
                        <Legend />
                        <Bar dataKey="budget" name="Ansatz (Plan)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual" name="Ist (Ausgaben)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
