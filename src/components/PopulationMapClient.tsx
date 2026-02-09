'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { Download, Users, Baby, School, UserRound, Map as MapIcon, ChevronRight, X as CloseIcon } from 'lucide-react';

// Helper component to auto-zoom to GeoJSON data
function FitBounds({ data }: { data: any }) {
    const map = useMap();
    useEffect(() => {
        if (data && data.features && data.features.length > 0) {
            try {
                const geoJsonLayer = L.geoJSON(data);
                map.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20] });
            } catch (e) {
                console.error("Error fitting bounds", e);
            }
        }
    }, [data, map]);
    return null;
}

// Helper component to fly the map to a specific feature
function FlyToFeature({ selection }: { selection: any }) {
    const map = useMap();
    useEffect(() => {
        if (selection && selection.geometry && selection.shouldZoom) {
            try {
                const layer = L.geoJSON(selection);
                map.fitBounds(layer.getBounds(), {
                    padding: [100, 100],
                    maxZoom: 15,
                    animate: true,
                    duration: 1
                });
            } catch (e) {
                console.error("Error flying to feature", e);
            }
        }
    }, [selection, map]);
    return null;
}

const getDistrictName = (bezId: number | string) => {
    const districts: Record<string, string> = {
        '1': 'Mitte', '2': 'Friedrichshain-Kreuzberg', '3': 'Pankow', '4': 'Charlottenburg-Wilmersdorf',
        '5': 'Spandau', '6': 'Steglitz-Zehlendorf', '7': 'Tempelhof-Schöneberg', '8': 'Neukölln',
        '9': 'Treptow-Köpenick', '10': 'Marzahn-Hellersdorf', '11': 'Lichtenberg', '12': 'Reinickendorf'
    };
    return districts[String(bezId)] || `Bezirk ${bezId}`;
};

export default function PopulationMapClient({ district }: { district: string }) {
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
    const [demographicsData, setDemographicsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [featureCount, setFeatureCount] = useState<number>(0);
    const [selectedTheme, setSelectedTheme] = useState<'total' | 'density' | 'kita' | 'school' | 'seniors' | 'women_ratio'>('total');
    const [selectedFeature, setSelectedFeature] = useState<any>(null);
    const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);

    const getPopData = useCallback((plrId: string) => {
        return demographicsData.find(d => {
            const id = String(d.RAUMID).padStart(8, '0');
            return id === plrId;
        });
    }, [demographicsData]);

    const getPopulation = useCallback((plrId: string) => {
        const entry = demographicsData.find(d => {
            const id = String(d.RAUMID).padStart(8, '0');
            return id === plrId;
        });
        return entry ? Number(entry.E_E) : 0;
    }, [demographicsData]);

    const filteredGeoJson = useMemo(() => {
        if (!geoJsonData) return null;
        if (!district || district === 'Berlin' || district === 'All') return geoJsonData;

        const filteredFeatures = geoJsonData.features.filter((f: any) => {
            const data = demographicsData.find(d => String(d.RAUMID).padStart(8, '0') === f.properties.PLR_ID);
            return data && getDistrictName(data.BEZ) === district;
        });

        return { ...geoJsonData, features: filteredFeatures };
    }, [geoJsonData, demographicsData, district]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [geoRes, demoRes] = await Promise.all([
                    fetch('/api/lor'),
                    fetch('/api/demographics')
                ]);

                const geoJson = await geoRes.json();
                const demographics = await demoRes.json();

                setGeoJsonData(geoJson);
                setDemographicsData(demographics);
                if (geoJson && geoJson.features) {
                    setFeatureCount(geoJson.features.length);
                }
            } catch (e) {
                console.error("Failed to fetch map data", e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const getMetricValue = useCallback((feature: any, theme: string) => {
        const plrId = feature.properties.PLR_ID;
        const data = demographicsData.find(d => String(d.RAUMID).padStart(8, '0') === plrId);
        if (!data) return 0;

        if (district && district !== 'Berlin' && district !== 'All') {
            const dName = getDistrictName(data.BEZ);
            if (dName !== district) return 0;
        }

        switch (theme) {
            case 'density':
                const areaKm2 = feature.properties.GROESSE_M2 / 1000000;
                return areaKm2 > 0 ? data.E_E / areaKm2 : 0;
            case 'kita': return data.E_E1U6;
            case 'school': return data.E_E6U15;
            case 'seniors': return (Number(data.E_E65U80) || 0) + (Number(data.E_E80U110) || 0);
            case 'women_ratio': return data.E_E > 0 ? (data.E_EW / data.E_E) * 100 : 0;
            default: return data.E_E;
        }
    }, [demographicsData, district]);

    const getThemeColor = useCallback((val: number, theme: string) => {
        if (val === 0) return '#1e293b';

        const scales: Record<string, { thresholds: number[], colors: string[] }> = {
            total: {
                thresholds: [1000, 3000, 5000, 8000, 12000],
                colors: ['#fef3c7', '#fde68a', '#fbbf24', '#f59e0b', '#d97706', '#92400e']
            },
            density: {
                thresholds: [2000, 5000, 10000, 15000, 25000],
                colors: ['#ecfdf5', '#a7f3d0', '#34d399', '#10b981', '#059669', '#064e3b']
            },
            kita: {
                thresholds: [100, 300, 500, 800, 1200],
                colors: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0284c7', '#075985']
            },
            school: {
                thresholds: [200, 500, 800, 1200, 1800],
                colors: ['#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#5b21b6']
            },
            seniors: {
                thresholds: [500, 1000, 1500, 2000, 2500],
                colors: ['#fff7ed', '#ffedd5', '#fed7aa', '#fb923c', '#ea580c', '#9a3412']
            },
            women_ratio: {
                thresholds: [48, 49.5, 50.5, 51.5, 53],
                colors: ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f472b6', '#db2777', '#831843']
            }
        };

        const scale = scales[theme] || scales.total;
        for (let i = scale.thresholds.length - 1; i >= 0; i--) {
            if (val >= scale.thresholds[i]) return scale.colors[i + 1];
        }
        return scale.colors[0];
    }, []);

    const style = useCallback((feature: any) => {
        const val = getMetricValue(feature, selectedTheme);
        return {
            fillColor: getThemeColor(val, selectedTheme),
            weight: 1,
            opacity: 1,
            color: '#334155',
            fillOpacity: 0.8
        };
    }, [getMetricValue, getThemeColor, selectedTheme]);

    if (loading) return (
        <div className="h-[600px] flex items-center justify-center bg-slate-800/50 rounded-3xl border border-slate-700">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium">Lade Kartendaten...</p>
            </div>
        </div>
    );

    if (!geoJsonData) return <div className="h-[600px] flex items-center justify-center text-rose-400 bg-slate-800/50 rounded-3xl border border-slate-700">Fehler beim Laden der Karte</div>;

    const onEachFeature = (feature: any, layer: L.Layer) => {
        const pop = getPopulation(feature.properties.PLR_ID);
        const data = getPopData(feature.properties.PLR_ID);
        const districtName = data ? getDistrictName(data.BEZ) : 'Unbekannt';

        // Visibility check based on district
        if (district && district !== 'Berlin' && district !== 'All') {
            if (districtName !== district) {
                (layer as any).setStyle({ opacity: 0, fillOpacity: 0, interactive: false });
                return;
            }
        }

        // Create tooltip content string
        const tooltipContent = `
      <div style="font-family: sans-serif; padding: 4px;">
        <div style="display: flex; justify-between; align-items: center; margin-bottom: 4px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">
            <h3 style="font-weight: bold; margin: 0;">${feature.properties.PLR_NAME}</h3>
            <span style="font-size: 9px; color: #64748b; margin-left: 8px; text-transform: uppercase;">${districtName}</span>
        </div>
        <div style="display: grid; grid-template-columns: auto auto; gap: 8px; font-size: 12px;">
          <span style="color: #64748b;">Einwohner:</span>
          <span style="font-weight: bold; text-align: right;">${pop ? pop.toLocaleString('de-DE') : 'N/A'}</span>
          <span style="color: #64748b;">Männer:</span>
          <span style="font-weight: bold; text-align: right;">${data && data.E_EM != null ? Number(data.E_EM).toLocaleString('de-DE') : '-'}</span>
          <span style="color: #64748b;">Frauen:</span>
          <span style="font-weight: bold; text-align: right;">${data && data.E_EW != null ? Number(data.E_EW).toLocaleString('de-DE') : '-'}</span>
          <span style="color: #64748b;">ID:</span>
          <span style="text-align: right; font-family: monospace;">${feature.properties.PLR_ID}</span>
        </div>
      </div>
    `;

        layer.bindTooltip(tooltipContent, {
            sticky: true,
            direction: 'top',
            opacity: 0.95,
            className: 'custom-leaflet-tooltip' // We would need global css for this to style purely
        });

        layer.on({
            mouseover: (e: any) => {
                const l = e.target;
                l.setStyle({
                    weight: 2,
                    color: '#fff',
                    fillOpacity: 0.9
                });
                l.bringToFront();
            },
            mouseout: (e: any) => {
                const l = e.target;
                l.setStyle({
                    weight: 1,
                    color: '#334155',
                    fillOpacity: 0.8
                });
            },
            click: (e: any) => {
                const data = getPopData(feature.properties.PLR_ID);
                setSelectedFeature({
                    ...feature,
                    demographics: data,
                    shouldZoom: false // Disable zoom on map click
                });
                setIsSidepanelOpen(true);
            }
        });
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Name", "Total", "Density (pers/km2)", "Kita (1-6)", "School (6-15)", "Seniors (65+)", "Women %"];
        const rows = geoJsonData.features.map((f: any) => {
            const data = getPopData(f.properties.PLR_ID);
            const density = f.properties.GROESSE_M2 > 0 ? (data?.E_E || 0) / (f.properties.GROESSE_M2 / 1000000) : 0;
            const seniors = (Number(data?.E_E65U80) || 0) + (Number(data?.E_E80U110) || 0);
            const womenPct = data?.E_E > 0 ? (data.E_EW / data.E_E) * 100 : 0;

            return [
                f.properties.PLR_ID,
                f.properties.PLR_NAME,
                data?.E_E || 0,
                density.toFixed(1),
                data?.E_E1U6 || 0,
                data?.E_E6U15 || 0,
                seniors,
                womenPct.toFixed(1)
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(";") + "\n"
            + rows.map((e: any) => e.join(";")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "berlin_demographics_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Demografische Analyse</h2>
                        <p className="text-[10px] text-slate-500 font-medium">Visualisierung der Berliner Planungsräume (LOR)</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Stand: 31.12.2024
                    </span>
                    <span className="hidden sm:inline-block opacity-50">Quelle: Amt für Statistik Berlin-Brandenburg (EWR)</span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-[720px]">
                <div className="flex-1 bg-slate-800/50 p-1 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl relative group">
                    <MapContainer
                        center={[52.5200, 13.4050]}
                        zoom={11}
                        style={{ height: '100%', width: '100%', borderRadius: '1.5rem', background: '#0f172a' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        {filteredGeoJson && <FitBounds data={filteredGeoJson} />}
                        {selectedFeature && <FlyToFeature selection={selectedFeature} />}
                        {filteredGeoJson && (
                            <GeoJSON
                                key={`${selectedTheme}-${district}-${demographicsData.length}`}
                                data={filteredGeoJson}
                                style={style}
                                onEachFeature={onEachFeature}
                            />
                        )}
                    </MapContainer>

                    {/* Theme Selector Toolbar */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl z-[1000]">
                        {[
                            { id: 'total', icon: Users, label: 'Einwohner' },
                            { id: 'density', icon: MapIcon, label: 'Dichte' },
                            { id: 'kita', icon: Baby, label: 'Kita' },
                            { id: 'school', icon: School, label: 'Schule' },
                            { id: 'seniors', icon: UserRound, label: 'Senioren' },
                            { id: 'women_ratio', icon: UserRound, label: 'Frauen %' },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTheme(t.id as any)}
                                title={t.label}
                                className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${selectedTheme === t.id ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                <t.icon className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-tight hidden md:inline">{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Status & Export */}
                    <div className="absolute bottom-6 left-6 flex items-center gap-3 z-[1000]">
                        <div className="bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-700 backdrop-blur-md text-[10px] text-slate-400 font-bold uppercase tracking-widest shadow-xl">
                            {featureCount} Planungsräume geladen
                        </div>
                        <button
                            onClick={handleExportCSV}
                            className="bg-slate-900/90 p-2 rounded-xl border border-slate-700 backdrop-blur-md text-slate-400 hover:text-white transition-all shadow-xl flex items-center gap-2 group"
                        >
                            <Download className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest overflow-hidden max-w-0 group-hover:max-w-[100px] transition-all duration-300">CSV Export</span>
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="absolute bottom-6 right-6 bg-slate-900/90 p-4 rounded-xl border border-slate-700 backdrop-blur-md shadow-xl z-[1000] min-w-[140px]">
                        <h4 className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em] border-b border-slate-800 pb-2">
                            {selectedTheme === 'total' ? 'Einwohner' :
                                selectedTheme === 'density' ? 'Pers. / km²' :
                                    selectedTheme === 'kita' ? 'Kita-Alter' :
                                        selectedTheme === 'school' ? 'Schulalter' :
                                            selectedTheme === 'seniors' ? '65+ Jahre' : 'Frauenanteil %'}
                        </h4>
                        <div className="space-y-2.5">
                            {(() => {
                                const getLegend = () => {
                                    switch (selectedTheme) {
                                        case 'density': return ['< 2.000', '2.000 - 5.000', '5.000 - 10.000', '10.000 - 15.000', '15.000 - 25.000', '> 25.000'];
                                        case 'kita': return ['< 100', '100 - 300', '300 - 500', '500 - 800', '800 - 1200', '> 1200'];
                                        case 'women_ratio': return ['< 48%', '48% - 49.5%', '49.5% - 50.5%', '50.5% - 51.5%', '51.5% - 53%', '> 53%'];
                                        default: return ['Sehr gering', 'Gering', 'Normal', 'Erhöht', 'Hoch', 'Sehr hoch'];
                                    }
                                };
                                const labels = getLegend();
                                const colors = ['#fef3c7', '#fde68a', '#fbbf24', '#f59e0b', '#d97706', '#92400e']; // Dynamic colors below

                                // Mocking scales for legend quickly - better would be mapping scales object
                                const scaleColors = {
                                    total: ['#fef3c7', '#fde68a', '#fbbf24', '#f59e0b', '#d97706', '#92400e'],
                                    density: ['#ecfdf5', '#a7f3d0', '#34d399', '#10b981', '#059669', '#064e3b'],
                                    kita: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0284c7', '#075985'],
                                    school: ['#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#5b21b6'],
                                    seniors: ['#fff7ed', '#ffedd5', '#fed7aa', '#fb923c', '#ea580c', '#9a3412'],
                                    women_ratio: ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f472b6', '#db2777', '#831843']
                                }[selectedTheme as keyof typeof scaleColors] || scaleColors.total;

                                return labels.map((label, i) => (
                                    <div key={i} className="flex items-center gap-3 group/item">
                                        <span className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-white/10" style={{ backgroundColor: scaleColors[i] }}></span>
                                        <span className="text-[9px] font-bold text-slate-400 group-hover/item:text-slate-200 transition-colors uppercase tracking-wider">{label}</span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>

                {/* Interactive Sidebar */}
                <div className={`w-full lg:w-96 bg-slate-900/50 rounded-3xl border border-slate-700/50 backdrop-blur-xl flex flex-col transition-all duration-500 overflow-hidden shadow-2xl ${isSidepanelOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 lg:translate-x-0 lg:opacity-50'}`}>
                    {selectedFeature ? (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="p-6 border-b border-slate-700/50 flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 block">
                                        {getDistrictName(selectedFeature.demographics?.BEZ || '')} • Planungsraum
                                    </span>
                                    <h2 className="text-xl font-bold text-white leading-tight">{selectedFeature.properties.PLR_NAME}</h2>
                                    <p className="text-xs text-slate-500 font-mono mt-1">ID: {selectedFeature.properties.PLR_ID}</p>
                                </div>
                                <button onClick={() => setIsSidepanelOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all">
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                {/* Key Metrics */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bevölkerung</p>
                                        <p className="text-2xl font-bold text-white">{(selectedFeature.demographics?.E_E || 0).toLocaleString('de-DE')}</p>
                                    </div>
                                    <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Dichte</p>
                                        <p className="text-2xl font-bold text-emerald-400">
                                            {Math.round((selectedFeature.demographics?.E_E || 0) / (selectedFeature.properties.GROESSE_M2 / 1000000)).toLocaleString('de-DE')}
                                            <span className="text-[10px] ml-1 text-slate-500">/km²</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Age Distribution Chart */}
                                <div>
                                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ChevronRight className="w-3 h-3 text-emerald-500" />
                                        Altersstruktur
                                    </h3>
                                    <div className="h-48 w-full mt-4">
                                        {(() => {
                                            const d = selectedFeature.demographics;
                                            if (!d) return null;
                                            const chartData = [
                                                { name: '0-6', val: d.E_E1U6, color: '#38bdf8' },
                                                { name: '6-15', val: d.E_E6U15, color: '#818cf8' },
                                                { name: '15-25', val: d.E_E15U18 + d.E_E18U25, color: '#c084fc' },
                                                { name: '25-55', val: d.E_E25U55, color: '#f472b6' },
                                                { name: '55-65', val: d.E_E55U65, color: '#fb923c' },
                                                { name: '65+', val: d.E_E65U80 + d.E_E80U110, color: '#fb7185' }
                                            ];
                                            return (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                                        <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }} />
                                                        <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                                                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Gender Distribution */}
                                <div>
                                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ChevronRight className="w-3 h-3 text-emerald-500" />
                                        Geschlechterverteilung
                                    </h3>
                                    {selectedFeature.demographics && (
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                                <span className="text-pink-400">Frauen {Math.round((selectedFeature.demographics.E_EW / selectedFeature.demographics.E_E) * 100)}%</span>
                                                <span className="text-blue-400">Männer {Math.round((selectedFeature.demographics.E_EM / selectedFeature.demographics.E_E) * 100)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-800 rounded-full flex overflow-hidden">
                                                <div style={{ width: `${(selectedFeature.demographics.E_EW / selectedFeature.demographics.E_E) * 100}%` }} className="h-full bg-pink-500 shadow-lg shadow-pink-500/20"></div>
                                                <div style={{ width: `${(selectedFeature.demographics.E_EM / selectedFeature.demographics.E_E) * 100}%` }} className="h-full bg-blue-500 shadow-lg shadow-blue-500/20"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 mt-auto border-t border-slate-700/50 bg-slate-800/20">
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                    Quelle: Einwohnerregister Berlin (EWR) am 31.12.2024. Geodaten: ODIS Berlin 2021.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-white/5">
                                <Users className="w-8 h-8 text-slate-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-300">Wähle einen Bezirk</h3>
                            <p className="text-sm text-slate-500 mt-2 leading-relaxed">Klicke auf die Karte, um detaillierte demografische Analysen für einen Kiez zu erhalten.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Ranking Table Section */}
            <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-emerald-500" />
                            Top 10 Planungsräume
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">
                            Sortiert nach {
                                selectedTheme === 'total' ? 'Einwohnerzahl' :
                                    selectedTheme === 'density' ? 'Bevölkerungsdichte' :
                                        selectedTheme === 'kita' ? 'Kita-Alter (1-6)' :
                                            selectedTheme === 'school' ? 'Schulalter (6-15)' :
                                                selectedTheme === 'seniors' ? 'Senioren (65+)' : 'Frauenanteil'
                            }
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <th className="px-4 py-2">Rang</th>
                                <th className="px-4 py-2">Kiez / Planungsraum</th>
                                <th className="px-4 py-2 text-right">Wert</th>
                                <th className="px-4 py-2 w-32">Visualisierung</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {(() => {
                                if (!filteredGeoJson || !demographicsData.length) return null;

                                const rankedData = filteredGeoJson.features.map((f: any) => ({
                                    id: f.properties.PLR_ID,
                                    name: f.properties.PLR_NAME,
                                    val: getMetricValue(f, selectedTheme)
                                }))
                                    .sort((a: any, b: any) => b.val - a.val)
                                    .slice(0, 10);

                                const maxVal = rankedData[0]?.val || 1;

                                return rankedData.map((item: any, index: number) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => {
                                            const feature = geoJsonData.features.find((f: any) => f.properties.PLR_ID === item.id);
                                            const data = getPopData(item.id);
                                            setSelectedFeature({
                                                ...feature,
                                                demographics: data,
                                                shouldZoom: true // Enable zoom on table click
                                            });
                                            setIsSidepanelOpen(true);
                                        }}
                                        className="group cursor-pointer"
                                    >
                                        <td className="bg-slate-900/40 rounded-l-xl px-4 py-3 font-mono text-[10px] text-slate-500 group-hover:text-emerald-500 transition-colors">
                                            #{index + 1}
                                        </td>
                                        <td className="bg-slate-900/40 px-4 py-3 font-bold text-slate-200 group-hover:text-white transition-colors">
                                            <div className="flex flex-col">
                                                <span>{item.name}</span>
                                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">
                                                    {getDistrictName(getPopData(item.id)?.BEZ || '')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="bg-slate-900/40 px-4 py-3 text-right font-mono font-bold text-emerald-400">
                                            {selectedTheme === 'women_ratio' ? `${item.val.toFixed(1)}%` : Math.round(item.val).toLocaleString('de-DE')}
                                            <span className="text-[10px] ml-1 text-slate-500 font-normal">
                                                {selectedTheme === 'density' ? '/km²' : ''}
                                            </span>
                                        </td>
                                        <td className="bg-slate-900/40 rounded-r-xl px-4 py-3">
                                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    style={{ width: `${(item.val / maxVal) * 100}%` }}
                                                    className={`h-full transition-all duration-1000 ${selectedTheme === 'kita' ? 'bg-sky-500' :
                                                        selectedTheme === 'school' ? 'bg-indigo-500' :
                                                            selectedTheme === 'seniors' ? 'bg-orange-500' :
                                                                selectedTheme === 'women_ratio' ? 'bg-pink-500' : 'bg-emerald-500'
                                                        }`}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>© 2024 Land Berlin</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span>Daten: Einwohnerregister (EWR)</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span>Geometrie: LOR 2021 (WGS84)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium italic">
                        Hinweis: Die Daten spiegeln den amtlichen Stand zum Jahresende 2024 wider.
                    </p>
                </div>
            </div>
        </div>
    );
}

