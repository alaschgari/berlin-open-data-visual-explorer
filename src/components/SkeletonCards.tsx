import React from 'react';

export const CardSkeleton = () => (
    <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl animate-pulse">
        <div className="h-6 w-1/3 bg-slate-700/50 rounded-lg mb-4" />
        <div className="h-24 bg-slate-700/30 rounded-2xl w-full" />
    </div>
);

export const ChartSkeleton = () => (
    <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl h-[400px] animate-pulse">
        <div className="h-6 w-1/4 bg-slate-700/50 rounded-lg mb-6" />
        <div className="flex items-end gap-2 h-[280px]">
            {Array.from({ length: 12 }).map((_, i) => (
                <div
                    key={i}
                    className="flex-1 bg-slate-700/30 rounded-t-lg"
                    style={{ height: `${Math.random() * 80 + 20}%` }}
                />
            ))}
        </div>
    </div>
);

export const MapSkeleton = () => (
    <div className="bg-slate-800/50 rounded-3xl border border-slate-700/50 h-[600px] relative overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-slate-900/40" />
        <div className="absolute top-6 left-6 h-8 w-48 bg-slate-700/50 rounded-xl" />
        <div className="absolute top-6 right-6 flex gap-2">
            <div className="h-8 w-24 bg-slate-700/50 rounded-xl" />
            <div className="h-8 w-24 bg-slate-700/50 rounded-xl" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-500/50 rounded-full animate-spin" />
        </div>
    </div>
);

export const SubsidiesListSkeleton = () => (
    <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30 animate-pulse">
                <div className="flex justify-between mb-2">
                    <div className="h-4 w-1/2 bg-slate-700/50 rounded" />
                    <div className="h-4 w-24 bg-slate-700/50 rounded" />
                </div>
                <div className="h-3 w-1/3 bg-slate-700/30 rounded" />
            </div>
        ))}
    </div>
);
