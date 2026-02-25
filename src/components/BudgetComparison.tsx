'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from 'lucide-react';

interface TreeNode {
    name: string;
    value: number;
}

import { useLanguage } from './LanguageContext';

interface TreeNode {
    name: string;
    value: number;
}

interface BudgetComparisonProps {
    node2026: TreeNode | null;
    node2027: TreeNode | null;
    selectedYear: string;
}

export default function BudgetComparison({ node2026, node2027, selectedYear }: BudgetComparisonProps) {
    const { t, language } = useLanguage();
    const locale = language === 'de' ? 'de-DE' : 'en-GB';

    if (!node2026 || !node2027) {
        return (
            <div className="bg-slate-800/20 border border-slate-700/50 rounded-2xl p-6 h-full flex items-center justify-center">
                <p className="text-slate-500 text-sm">{t('select_element_comparison')}</p>
            </div>
        );
    }

    const val26 = node2026.value;
    const val27 = node2027.value;
    const diff = val27 - val26;
    const percentDiff = val26 !== 0 ? (diff / val26) * 100 : 0;

    const formatCurrency = (val: number) => {
        if (val === undefined || val === null || isNaN(val)) return `0 ${t('euro')}`;
        if (Math.abs(val) >= 1e9) return `${(val / 1e9).toLocaleString(locale, { maximumFractionDigits: 2 })} ${t('mrd_euro')}`;
        if (Math.abs(val) >= 1e6) return `${(val / 1e6).toLocaleString(locale, { maximumFractionDigits: 2 })} ${t('mio_euro')}`;
        return `${val.toLocaleString(locale)} ${t('euro')}`;
    };

    const isIncrease = diff > 0;
    const isNeutral = diff === 0;

    return (
        <div className="bg-slate-800/20 border border-slate-700/50 rounded-2xl p-6 h-full flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <TrendingUp size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">{t('yoy_comparison')}</h3>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">2026</span>
                        <div className="text-lg font-mono text-slate-300">{formatCurrency(val26)}</div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">2027</span>
                        <div className="text-lg font-mono text-white">{formatCurrency(val27)}</div>
                    </div>
                </div>

                <div className={`p-4 rounded-xl border flex items-center justify-between ${isNeutral ? 'bg-slate-800/40 border-slate-700/50' :
                    isIncrease ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isNeutral ? 'bg-slate-700 text-slate-400' :
                            isIncrease ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                            {isNeutral ? <Minus size={16} /> : isIncrease ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                        <div>
                            <div className={`text-sm font-bold ${isNeutral ? 'text-slate-400' : isIncrease ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                {isNeutral ? t('unchanged') : isIncrease ? t('increase') : t('saving')}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{t('vs_prev_year')}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-base font-mono font-bold ${isNeutral ? 'text-slate-400' : isIncrease ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                            {isIncrease ? '+' : ''}{percentDiff.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">{formatCurrency(Math.abs(diff))}</div>
                    </div>
                </div>
            </div>

        </div>
    );
}
