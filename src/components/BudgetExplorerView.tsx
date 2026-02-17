'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import BudgetTreeExplorer from '@/components/BudgetTreeExplorer';
import BudgetExplanation from '@/components/BudgetExplanation';
import BudgetComparison from '@/components/BudgetComparison';


export default function BudgetExplorerView() {
    const [year, setYear] = useState('2026');
    const [data2026, setData2026] = useState(null);
    const [data2027, setData2027] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch('/api/budget?year=2026').then(res => res.json()),
            fetch('/api/budget?year=2027').then(res => res.json())
        ]).then(([d26, d27]) => {
            setData2026(d26);
            setData2027(d27);
            // Initialize with current year's root
            setSelectedNode(year === '2026' ? d26 : d27);
            setLoading(false);
        });
    }, []);

    // Helper to find the same node in the other year's data
    const findCorrespondingNode = (sourceNode, targetTree) => {
        if (!sourceNode || !targetTree) return null;
        if (sourceNode.name === targetTree.name) return targetTree;

        if (targetTree.children) {
            for (const child of targetTree.children) {
                const found = findCorrespondingNode(sourceNode, child);
                if (found) return found;
            }
        }
        return null;
    };

    const currentData = year === '2026' ? data2026 : data2027;
    const node2026 = year === '2026' ? selectedNode : findCorrespondingNode(selectedNode, data2026);
    const node2027 = year === '2027' ? selectedNode : findCorrespondingNode(selectedNode, data2027);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Year Switcher and Quick Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="bg-slate-900/60 p-1.5 rounded-2xl border border-slate-700/50 flex shadow-inner backdrop-blur-md">
                    <button
                        onClick={() => setYear('2026')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${year === '2026' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        Haushaltsplan 2026
                    </button>
                    <button
                        onClick={() => setYear('2027')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${year === '2027' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        Haushaltsplan 2027
                    </button>
                </div>

                {!loading && (
                    <div className="bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
                            Gesamtvolumen: {(currentData?.value / 1e9).toFixed(2)} Mrd. €
                        </span>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="h-[500px] flex flex-col items-center justify-center space-y-4 bg-slate-800/20 rounded-3xl border border-slate-700/50">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Lade Haushaltsdaten...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Tree Section */}
                    <div className="lg:col-span-8 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl group hover:border-emerald-500/30 transition-all duration-500 flex flex-col h-[700px]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></span>
                                    Budget-Hierarchie
                                </h2>
                                <p className="text-slate-500 text-xs mt-1">Interaktive Struktur der Berliner Haushaltsplanung</p>
                            </div>
                            <div className="px-3 py-1 bg-slate-900/80 rounded-full border border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                Click zum Ausklappen
                            </div>
                        </div>

                        <div className="flex-1 min-h-0">
                            <BudgetTreeExplorer
                                data={currentData}
                                onSelect={(node) => setSelectedNode(node)}
                            />
                        </div>
                    </div>

                    {/* Sidebar Analytics Section */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* 1. Comparison Card */}
                        <div className="h-[250px]">
                            <BudgetComparison
                                node2026={node2026}
                                node2027={node2027}
                                selectedYear={year}
                            />
                        </div>


                        {/* 3. Smart Explanation */}
                        <div className="flex-1 min-h-[150px]">
                            <BudgetExplanation node={selectedNode} year={year} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
