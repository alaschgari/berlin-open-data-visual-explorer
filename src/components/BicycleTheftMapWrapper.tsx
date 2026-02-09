'use client';

import dynamic from 'next/dynamic';

const BicycleTheftMap = dynamic(() => import('./BicycleTheftMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[600px] flex items-center justify-center bg-slate-800/50 rounded-3xl border border-slate-700/50 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium animate-pulse">Lade Karte...</p>
            </div>
        </div>
    ),
});

export default function BicycleTheftMapWrapper({ district }: { district?: string }) {
    return <BicycleTheftMap district={district} />;
}
