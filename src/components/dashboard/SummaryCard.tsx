
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
    title: string;
    value: string;
    subtext?: string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
}

export function SummaryCard({ title, value, subtext, icon: Icon, trend }: SummaryCardProps) {
    return (
        <div className="bg-slate-900/50 rounded-2xl shadow-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-3xl font-bold text-slate-100 mt-2">{value}</p>
                    {subtext && <p className="text-sm text-slate-500 mt-1">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-full ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : trend === 'down' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}
