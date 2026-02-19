'use client';

import dynamic from 'next/dynamic';

const TrafficMap = dynamic(() => import('./TrafficMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium animate-pulse text-xs">Lade Karte...</p>
            </div>
        </div>
    ),
});

export default function TrafficMapWrapper(props: any) {
    return <TrafficMap {...props} />;
}
