'use client';

import React from 'react';
import { useLanguage } from './LanguageContext';

export default function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-700/50 flex shadow-inner">
            <button
                onClick={() => setLanguage('de')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === 'de' ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
                DE
            </button>
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === 'en' ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
                EN
            </button>
        </div>
    );
}
