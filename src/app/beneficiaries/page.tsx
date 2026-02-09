
'use client';

import { useState } from 'react';
import { MOCK_BENEFICIARIES } from '@/lib/beneficiaries-data';
import { Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BeneficiariesPage() {
    const [search, setSearch] = useState('');
    const [districtFilter, setDistrictFilter] = useState('All');

    const filtered = MOCK_BENEFICIARIES.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.purpose.toLowerCase().includes(search.toLowerCase());
        const matchesDistrict = districtFilter === 'All' || b.district === districtFilter;
        return matchesSearch && matchesDistrict;
    });

    const districts = Array.from(new Set(MOCK_BENEFICIARIES.map(b => b.district))).sort();

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900">
                            Zuwendungsempfänger (Transparenz)
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Bar */}
                <div className="bg-white p-4 rounded-lg shadow border border-slate-200 mb-6 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Empfänger oder Verwendungszweck suchen..."
                            className="pl-10 w-full rounded-md border-slate-300 py-2 border focus:ring-indigo-500 focus:border-indigo-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="rounded-md border-slate-300 py-2 pl-3 pr-10 border"
                        value={districtFilter}
                        onChange={(e) => setDistrictFilter(e.target.value)}
                    >
                        <option value="All">Alle Bezirke</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Empfänger</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Zweck</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bezirk</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Betrag</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filtered.map((b) => (
                                <tr key={b.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{b.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{b.purpose}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{b.district}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right font-mono">
                                        €{b.amount.toLocaleString('de-DE')}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        Keine Einträge gefunden.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <p className="mt-4 text-xs text-slate-500 text-center">
                    * Dies ist ein Demo-Datensatz. Die echte Zuwendungsdatenbank bietet aktuell keine offene API.
                </p>
            </main>
        </div>
    );
}
