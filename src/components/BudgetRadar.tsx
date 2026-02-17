'use client';

import React from 'react';
import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

export default function BudgetRadar({ data, year }) {
    // Aggregate data for functional radar
    // For demonstration, we'll map the Einzelpläne to the radar
    const radarData = data?.children?.slice(0, 7).map(child => ({
        subject: child.name.length > 20 ? child.name.substring(0, 17) + '...' : child.name,
        A: child.value / 1e6, // Value in Millions
        fullMark: 15000,
    })) || [];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar
                    name="Budget (Mio. €)"
                    dataKey="A"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fill="#0d9488"
                    fillOpacity={0.3}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#teal-400' }}
                />
            </RadarChart>
        </ResponsiveContainer>
    );
}
