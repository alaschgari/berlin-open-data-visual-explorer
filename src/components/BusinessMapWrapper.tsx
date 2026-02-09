
'use client';

import dynamic from 'next/dynamic';

const BusinessMapClient = dynamic(() => import('./BusinessMapClient'), {
    ssr: false,
    loading: () => (
        <div className="h-[600px] flex items-center justify-center bg-slate-800/50 rounded-3xl border border-slate-700">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium">Initialisiere Karte...</p>
            </div>
        </div>
    )
});

export default function BusinessMapWrapper({ district }: { district: string }) {
    return <BusinessMapClient district={district} />;
}
