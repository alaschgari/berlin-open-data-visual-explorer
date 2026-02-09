
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

// Mock data for initial implementation - in real app would fetch from API
const DISTRICTS = [
    "Berlin", "Charlottenburg-Wilmersdorf", "Friedrichshain-Kreuzberg",
    "Lichtenberg", "Marzahn-Hellersdorf", "Mitte", "Neukölln",
    "Pankow", "Reinickendorf", "Spandau", "Steglitz-Zehlendorf",
    "Tempelhof-Schöneberg", "Treptow-Köpenick"
];

export default function ComparePage() {
    const [district1, setDistrict1] = useState('Mitte');
    const [district2, setDistrict2] = useState('Friedrichshain-Kreuzberg');

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                            Bezirk-Vergleich
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Selectors */}
                <div className="bg-white p-6 rounded-lg shadow border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Bezirk 1</label>
                        <select
                            value={district1}
                            onChange={(e) => setDistrict1(e.target.value)}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        >
                            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div className="hidden md:flex justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow border border-slate-100 z-10">
                        <span className="text-sm font-bold text-slate-400">VS</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Bezirk 2</label>
                        <select
                            value={district2}
                            onChange={(e) => setDistrict2(e.target.value)}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        >
                            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                {/* Comparison Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* District 1 Data */}
                    <div className="bg-white p-6 rounded-lg shadow border border-t-4 border-t-indigo-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">{district1}</h2>

                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Total Budget (2023)</p>
                                <p className="text-3xl font-bold text-slate-900">€912M</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Pro Kopf (Est.)</p>
                                <p className="text-xl font-semibold text-slate-700">€2,450</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Top Expense</p>
                                <p className="text-base font-medium text-slate-800">Soziales / Grundsicherung</p>
                            </div>
                        </div>
                    </div>

                    {/* District 2 Data */}
                    <div className="bg-white p-6 rounded-lg shadow border border-t-4 border-t-emerald-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">{district2}</h2>

                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Total Budget (2023)</p>
                                <p className="text-3xl font-bold text-slate-900">€765M</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Pro Kopf (Est.)</p>
                                <p className="text-xl font-semibold text-slate-700">€2,610</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Top Expense</p>
                                <p className="text-base font-medium text-slate-800">Jugend / Kita</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-slate-500 text-sm">
                    <p>Comparison data is simplified for demonstration purposes.</p>
                </div>
            </main>
        </div>
    );
}
