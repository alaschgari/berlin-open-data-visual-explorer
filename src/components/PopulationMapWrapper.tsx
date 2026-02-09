'use client';

import dynamic from 'next/dynamic';

const PopulationMapClient = dynamic(() => import('./PopulationMapClient'), {
    ssr: false,
    loading: () => (
        <div className="h-[600px] flex items-center justify-center bg-slate-800/50 rounded-3xl border border-slate-700 animate-pulse">
            <div className="flex flex-col items-center gap-4">
                <span className="text-slate-500 font-medium">Lade Karte...</span>
            </div>
        </div>
    ),
});

export default function PopulationMapWrapper({ district }: { district: string }) {
    return <PopulationMapClient district={district} />;
}
