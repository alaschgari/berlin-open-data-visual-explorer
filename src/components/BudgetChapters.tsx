'use client';

import React, { useState } from 'react';
import { getChapterDetails } from '@/lib/proxy';

interface Chapter {
    name: string;
    value: number;
}

interface Detail {
    title: string;
    budget: number;
    actual: number;
}

export default function BudgetChapters({ initialChapters, district }: { initialChapters: Chapter[], district: string }) {
    const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
    const [details, setDetails] = useState<Record<string, Detail[]>>({});
    const [loading, setLoading] = useState<string | null>(null);

    const toggleChapter = async (chapterName: string) => {
        if (expandedChapter === chapterName) {
            setExpandedChapter(null);
            return;
        }

        setExpandedChapter(chapterName);

        if (!details[chapterName]) {
            setLoading(chapterName);
            try {
                const data = await getChapterDetails(district, chapterName);
                setDetails(prev => ({ ...prev, [chapterName]: data }));
            } catch (err) {
                console.error('Error fetching chapter details:', err);
            } finally {
                setLoading(null);
            }
        }
    };

    return (
        <div className="space-y-6 flex-1 overflow-y-auto pr-2 max-h-[600px] custom-scrollbar">
            {initialChapters.map((chapter, i) => (
                <div key={i} className="group">
                    <button
                        onClick={() => toggleChapter(chapter.name)}
                        className="w-full text-left flex justify-between text-sm mb-2 hover:opacity-80 transition-opacity"
                    >
                        <span className="text-slate-400 truncate mr-2 font-medium">
                            {chapter.name.split(' ').length > 1
                                ? chapter.name.split(' ').slice(1).join(' ')
                                : chapter.name}
                        </span>
                        <span className="text-slate-100 font-bold whitespace-nowrap">
                            {((chapter.value || 0) / 1000000).toFixed(0)} Mio.
                        </span>
                    </button>
                    <div
                        className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden cursor-pointer"
                        onClick={() => toggleChapter(chapter.name)}
                    >
                        <div
                            style={{ width: `${initialChapters[0]?.value ? ((chapter.value || 0) / initialChapters[0].value) * 100 : 0}%` }}
                            className="bg-emerald-500 h-full group-hover:bg-emerald-400 transition-all rounded-full"
                        />
                    </div>

                    {expandedChapter === chapter.name && (
                        <div className="mt-4 pl-4 border-l-2 border-emerald-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            {loading === chapter.name ? (
                                <div className="text-[10px] text-slate-500 animate-pulse">Lade Details...</div>
                            ) : details[chapter.name]?.map((detail, idx) => (
                                <div key={idx} className="text-[10px]">
                                    <div className="flex justify-between text-slate-300 mb-1 leading-tight">
                                        <span className="truncate mr-2 opacity-80" title={detail.title}>{detail.title}</span>
                                        <span className="font-bold">{(detail.budget / 1000000).toLocaleString('de-DE', { maximumFractionDigits: 1 })}M</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-0.5 rounded-full">
                                        <div
                                            className="bg-blue-500/50 h-full rounded-full"
                                            style={{ width: `${chapter.value ? Math.min(100, (detail.budget / chapter.value) * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
