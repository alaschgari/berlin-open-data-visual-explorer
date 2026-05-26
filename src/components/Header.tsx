'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { LayoutGrid, BarChart3, ArrowRightLeft, ShieldAlert } from 'lucide-react';

interface HeaderProps {
    showDistrictSelector?: React.ReactNode;
}

export default function Header({ showDistrictSelector }: HeaderProps) {
    const pathname = usePathname();
    const { t } = useLanguage();

    const navItems = [
        { href: '/', labelKey: 'nav_dashboard', icon: <LayoutGrid className="w-4 h-4" /> },
        { href: '/compare', labelKey: 'nav_compare', icon: <ArrowRightLeft className="w-4 h-4" /> },
        { href: '/beneficiaries', labelKey: 'nav_beneficiaries', icon: <ShieldAlert className="w-4 h-4" /> },
    ];

    return (
        <header className="relative z-[2000] flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-visible">
            {/* Left side: Logo */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                    <svg className="w-7 h-7 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight leading-none mb-1.5">
                        {t('brand_name')}
                    </h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">{t('brand_sub')}</p>
                </div>
            </div>

            {/* Middle: Navigation Links */}
            <nav className="flex flex-wrap items-center bg-slate-900/60 p-1 rounded-2xl border border-slate-700/50 shadow-inner">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                isActive
                                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                        >
                            {item.icon}
                            <span>{t(item.labelKey)}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Right side: Language & Selectors */}
            <div className="flex flex-wrap gap-3 items-center justify-end">
                <LanguageToggle />

                <div className="h-8 w-px bg-slate-700/50 hidden sm:block"></div>

                {showDistrictSelector && (
                    <div className="w-full sm:w-auto">
                        {showDistrictSelector}
                    </div>
                )}
            </div>
        </header>
    );
}
