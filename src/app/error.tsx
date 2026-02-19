'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl p-8 text-center backdrop-blur-sm">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                    Etwas ist schiefgelaufen
                </h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Die Daten konnten nicht geladen werden. Bitte versuchen Sie es erneut.
                </p>
                {error.digest && (
                    <p className="text-slate-500 text-xs mb-4 font-mono">
                        Fehler-ID: {error.digest}
                    </p>
                )}
                <button
                    onClick={reset}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer"
                >
                    Erneut versuchen
                </button>
            </div>
        </div>
    );
}
