
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
        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
                    {subtext && <p className="text-sm text-slate-500 mt-1">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-600' : trend === 'down' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}
