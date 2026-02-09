
import { Users, Building, Briefcase } from 'lucide-react';

export default function DemoFeatures() {
    return (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Beneficiaries */}
            <div className="bg-white p-6 rounded-lg shadow border border-slate-200 opacity-90">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Users className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Zuwendungsempfänger</h3>
                </div>
                <ul className="space-y-3">
                    <li className="flex justify-between text-sm">
                        <span className="text-slate-600">Sportverein Berlin e.V.</span>
                        <span className="font-medium">€45.000</span>
                    </li>
                    <li className="flex justify-between text-sm">
                        <span className="text-slate-600">Kulturzentrum Kiez</span>
                        <span className="font-medium">€28.500</span>
                    </li>
                    <li className="flex justify-between text-sm">
                        <span className="text-slate-600">Jugendhilfe gGmbH</span>
                        <span className="font-medium">€120.000</span>
                    </li>
                </ul>
                <p className="mt-4 text-xs text-slate-500 italic">* Demo Data (No Open Data available)</p>
            </div>

            {/* Investments */}
            <div className="bg-white p-6 rounded-lg shadow border border-slate-200 opacity-90">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <Building className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Investitionsplanung</h3>
                </div>
                <div className="space-y-4">
                    <div className="border-l-2 border-green-500 pl-3">
                        <p className="text-sm font-medium text-slate-900">Sanierung Rathaus</p>
                        <p className="text-xs text-slate-500">2023-2025 • €4.5M Total</p>
                    </div>
                    <div className="border-l-2 border-blue-500 pl-3">
                        <p className="text-sm font-medium text-slate-900">Neubau Schule X</p>
                        <p className="text-xs text-slate-500">2024-2027 • €12.0M Total</p>
                    </div>
                </div>
                <p className="mt-4 text-xs text-slate-500 italic">* Demo Data (No Open Data available)</p>
            </div>

            {/* Personnel */}
            <div className="bg-white p-6 rounded-lg shadow border border-slate-200 opacity-90">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <Briefcase className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Stellenplan (VZÄ)</h3>
                </div>
                <div className="flex items-end gap-2 h-32 mt-2">
                    {[2020, 2021, 2022, 2023, 2024].map((y, i) => (
                        <div key={y} className="flex-1 flex flex-col items-center gap-1 group">
                            <div
                                className="w-full bg-purple-200 rounded-t-sm hover:bg-purple-300 transition-all relative"
                                style={{ height: `${40 + i * 10}%` }}
                            >
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {1400 + i * 50}
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-500">{y}</span>
                        </div>
                    ))}
                </div>
                <p className="mt-4 text-xs text-slate-500 italic">* Demo Data (No Open Data available)</p>
            </div>
        </div>
    );
}
