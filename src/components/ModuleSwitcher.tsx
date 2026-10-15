'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import type { NavItem } from './HubView';

const CATEGORY_ORDER: NavItem['category'][] = ['society', 'infrastructure', 'finance'];

/** Jumps between modules without returning to the overview. */
export default function ModuleSwitcher({ items, activeTab, onNavigate }: {
    items: NavItem[];
    activeTab: string;
    onNavigate: (tab: string) => void;
}) {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const active = items.find(i => i.id === activeTab);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent | KeyboardEvent) => {
            if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', close);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', close);
        };
    }, [open]);

    const go = (tab: string) => {
        setOpen(false);
        onNavigate(tab);
    };

    return (
        <nav ref={ref} aria-label={t('module_nav')} className="relative flex items-center gap-2 text-sm">
            <button onClick={() => go('hub')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors">
                <LayoutGrid className="w-4 h-4" />{t('module_overview')}
            </button>
            <span className="text-slate-600" aria-hidden="true">/</span>
            <div>
                <button
                    onClick={() => setOpen(o => !o)}
                    aria-expanded={open}
                    aria-haspopup="true"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-white bg-slate-800/60 border border-slate-700/60 hover:border-slate-500 transition-colors"
                >
                    <span className="text-emerald-400 [&>svg]:w-4 [&>svg]:h-4">{active?.icon}</span>
                    {active ? t(active.labelKey) : ''}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                    <div className="absolute left-0 right-0 sm:right-auto top-full mt-2 z-[2100] sm:w-[40rem] max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40 p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {CATEGORY_ORDER.map(category => (
                            <div key={category}>
                                <p className="px-2 pb-1 text-xs font-semibold text-slate-400">{t(`cat_${category}`)}</p>
                                <ul>
                                    {items.filter(i => i.category === category).map(item => (
                                        <li key={item.id}>
                                            <button
                                                onClick={() => go(item.id)}
                                                aria-current={item.id === activeTab ? 'page' : undefined}
                                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${item.id === activeTab ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-200 hover:bg-slate-800'}`}
                                            >
                                                <span className="text-slate-400 [&>svg]:w-4 [&>svg]:h-4">{item.icon}</span>
                                                {t(item.labelKey)}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
}
