'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface DistrictSelectorProps {
    currentDistrict: string;
    districts: string[];
    activeTab: string;
}

import { useLanguage } from './LanguageContext';

interface DistrictSelectorProps {
    currentDistrict: string;
    districts: string[];
    activeTab: string;
}

export default function DistrictSelector({ currentDistrict, districts, activeTab }: DistrictSelectorProps) {
    const router = useRouter();
    const { t } = useLanguage();
    const [isPending, startTransition] = React.useTransition();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDistrict = e.target.value;
        startTransition(() => {
            router.push(`/?tab=${activeTab}&district=${newDistrict}`);
        });
    };

    return (
        <div className={`relative group w-full sm:w-72 transition-opacity duration-200 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <select
                value={currentDistrict}
                onChange={handleChange}
                aria-label={t('district_selector') || 'District selector'}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-4 pr-10 py-3 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer transition-all hover:bg-slate-900"
            >
                {districts.map(d => (
                    <option key={d} value={d}>{d === 'Berlin' ? t('all_districts') : d}</option>
                ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
        </div>
    );
}
