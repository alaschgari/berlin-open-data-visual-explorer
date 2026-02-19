export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
                </div>
                <p className="text-slate-400 text-sm font-medium">
                    Daten werden geladen …
                </p>
            </div>
        </div>
    );
}
