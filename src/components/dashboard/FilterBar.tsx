
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface FilterBarProps {
    years: number[];
    districts: string[];
    metricType?: string;
}

export function FilterBar({ years, districts }: FilterBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value && value !== 'All') {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        router.push('?' + createQueryString('year', e.target.value));
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        router.push('?' + createQueryString('district', e.target.value));
    };

    const handleMetricChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        router.push('?' + createQueryString('metric', e.target.value));
    };

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const search = formData.get('search') as string;
        router.push('?' + createQueryString('search', search));
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
            <div>
                <label htmlFor="metric-select" className="block text-sm font-medium text-slate-700 mb-1">Ansicht</label>
                <select
                    id="metric-select"
                    className="block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm border"
                    defaultValue={searchParams.get('metric') || 'nominal'}
                    onChange={handleMetricChange}
                >
                    <option value="nominal">Nominal (€)</option>
                    <option value="inflationAdjusted">Inflationsbereinigt (2024 €)</option>
                    <option value="perCapita">Pro Kopf (€)</option>
                </select>
            </div>
            <div>
                <label htmlFor="district-select" className="block text-sm font-medium text-slate-700 mb-1">Bezirk</label>
                <select
                    id="district-select"
                    className="block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm border"
                    defaultValue={searchParams.get('district') || 'All'}
                    onChange={handleDistrictChange}
                >
                    <option value="All">Alle Bezirke</option>
                    {districts.map((district) => (
                        <option key={district} value={district}>
                            {district}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="year-select" className="block text-sm font-medium text-slate-700 mb-1">Jahr</label>
                <select
                    id="year-select"
                    className="block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm border"
                    defaultValue={searchParams.get('year') || ''}
                    onChange={handleYearChange}
                >
                    <option value="">Alle Jahre</option>
                    {years.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex-1">
                <label htmlFor="search-input" className="block text-sm font-medium text-slate-700 mb-1">Suchbegriffe</label>
                <div className="relative">
                    <input
                        type="text"
                        name="search"
                        id="search-input"
                        className="block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-base border focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        placeholder="Nach Haushaltstiteln suchen..."
                        defaultValue={searchParams.get('search') || ''}
                    />
                    <button type="submit" className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                        Suchen
                    </button>
                </div>
            </form>
        </div>
    );
}
