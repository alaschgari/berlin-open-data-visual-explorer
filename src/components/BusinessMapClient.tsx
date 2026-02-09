'use client';

import { useMemo, useEffect, useState, useCallback, Fragment, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, CircleMarker, Tooltip, Pane, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, PieChart, Pie } from 'recharts';
import { Download, Briefcase, Building2, Store, Factory, PlusCircle, Map as MapIcon, ChevronRight, X as CloseIcon, Info, Users, Calendar, MapPin, Search, Filter, ArrowUp, ArrowDown, ListTree, ChevronDown, BarChart3, TrendingUp, Zap, Scale, Copy, Crosshair } from 'lucide-react';

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

const getDistrictName = (bezId: number | string) => {
    const districts: Record<string, string> = {
        '1': 'Mitte', '2': 'Friedrichshain-Kreuzberg', '3': 'Pankow', '4': 'Charlottenburg-Wilmersdorf',
        '5': 'Spandau', '6': 'Steglitz-Zehlendorf', '7': 'Tempelhof-Schöneberg', '8': 'Neukölln',
        '9': 'Treptow-Köpenick', '10': 'Marzahn-Hellersdorf', '11': 'Lichtenberg', '12': 'Reinickendorf'
    };
    return districts[String(bezId)] || `Bezirk ${bezId}`;
};

const getDistrictId = (name: string) => {
    const districts: Record<string, string> = {
        'Mitte': '01', 'Friedrichshain-Kreuzberg': '02', 'Pankow': '03', 'Charlottenburg-Wilmersdorf': '04',
        'Spandau': '05', 'Steglitz-Zehlendorf': '06', 'Tempelhof-Schöneberg': '07', 'Neukölln': '08',
        'Treptow-Köpenick': '09', 'Marzahn-Hellersdorf': '10', 'Lichtenberg': '11', 'Reinickendorf': '12'
    };
    return districts[name];
};

export default function BusinessMapClient({ district }: { district: string }) {
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
    const [businessData, setBusinessData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTheme, setSelectedTheme] = useState<'total' | 'gastro' | 'tech' | 'retail'>('total');
    const [selectedFeature, setSelectedFeature] = useState<any>(null);
    const [compareFeature, setCompareFeature] = useState<any>(null);
    const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [businessDetails, setBusinessDetails] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [chartFilter, setChartFilter] = useState<string | null>(null);

    // Global Branch Search & POV State
    const [globalBranchSearch, setGlobalBranchSearch] = useState('');
    const [searchResult, setSearchResult] = useState<{ points: any[], lorCounts: Record<string, number>, totalMatched: number } | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isPointMode, setIsPointMode] = useState(false);

    // Table state
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'age', direction: 'desc' });
    const [filterType, setFilterType] = useState('all');
    const [groupBy, setGroupBy] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const currentLorId = useRef<string | null>(null);

    const scales = useMemo<Record<string, { thresholds: number[], colors: string[] }>>(() => ({
        total: {
            thresholds: [50, 200, 500, 1000, 2000],
            colors: ['#fef3c7', '#fde68a', '#fbbf24', '#f59e0b', '#d97706', '#92400e']
        },
        gastro: {
            thresholds: [5, 20, 50, 100, 200],
            colors: ['#fff1f2', '#fecdd3', '#fda4af', '#fb7185', '#e11d48', '#9f1239']
        },
        tech: {
            thresholds: [5, 20, 50, 100, 200],
            colors: ['#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0284c7']
        },
        retail: {
            thresholds: [10, 50, 100, 250, 500],
            colors: ['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#7c3aed']
        }
    }), []);

    useEffect(() => {
        async function fetchData() {
            try {
                const [geoRes, bizRes] = await Promise.all([
                    fetch('/api/lor'),
                    fetch('/api/business')
                ]);

                const geoJson = await geoRes.json();
                const business = await bizRes.json();

                setGeoJsonData(geoJson);
                setBusinessData(business);
            } catch (e) {
                console.error("Failed to fetch business map data", e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedFeature) {
            const lorId = selectedFeature.properties.PLR_ID;
            const isNewDistrict = currentLorId.current !== lorId;

            // Check if we need to refetch because coordinates are missing
            const needsRefetch = isPointMode && businessDetails.length > 0 && typeof businessDetails[0].lat === 'undefined';

            if (isNewDistrict || needsRefetch) {
                const fetchDetails = async () => {
                    setLoadingDetails(true);
                    // Only clear if it's a new district request to visually indicate change, 
                    // but if it's just a refetch for coords, keep old data to avoid flicker
                    if (isNewDistrict) {
                        setBusinessDetails([]);
                        currentLorId.current = lorId;
                    }

                    try {
                        const res = await fetch(`/api/business/details?lorId=${lorId}`);
                        const data = await res.json();
                        setBusinessDetails(data);
                    } catch (e) {
                        console.error("Failed to fetch business details", e);
                    } finally {
                        setLoadingDetails(false);
                    }
                };
                fetchDetails();
            }
        }
    }, [selectedFeature, isPointMode]);

    useEffect(() => {
        const query = (globalBranchSearch || '').trim();
        if (query.length === 0) {
            setSearchResult(null);
            return;
        }

        const delayDebounceSelector = setTimeout(async () => {
            setIsSearching(true);
            try {
                const districtId = district && district !== 'Berlin' && district !== 'All' ? getDistrictId(district) : '';
                const searchUrl = `/api/business/search?q=${encodeURIComponent(globalBranchSearch)}${districtId ? `&districtId=${districtId}` : ''}`;
                const res = await fetch(searchUrl);
                const data = await res.json();
                setSearchResult(data);
            } catch (e) {
                console.error("Search failed", e);
            } finally {
                setIsSearching(false);
            }
        }, 600);

        return () => clearTimeout(delayDebounceSelector);
    }, [globalBranchSearch]);

    const processedBusinesses = useMemo(() => {
        let listData = businessDetails;
        if (listData.length === 0 && searchResult && searchResult.points) {
            let points = searchResult.points;

            // Filter by district if one is selected
            if (district && district !== 'Berlin' && district !== 'All') {
                points = points.filter((p: any) => {
                    if (!p.lorId) return false;
                    const districtIdStr = p.lorId.substring(0, 2);
                    const normalizedId = districtIdStr.startsWith('0') ? districtIdStr.substring(1) : districtIdStr;
                    return getDistrictName(normalizedId) === district;
                });
            }

            listData = points;
        }
        let filtered = [...listData];

        // Search filter
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(b =>
                b.branch.toLowerCase().includes(lowSearch) ||
                b.postcode.includes(lowSearch) ||
                b.type.toLowerCase().includes(lowSearch)
            );
        }

        // Type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(b => b.type === filterType);
        }

        // Theme Filter (Gastro, Tech, Retail)
        if (selectedTheme !== 'total') {
            if (selectedTheme === 'gastro') {
                filtered = filtered.filter(b =>
                    b.branch.includes('Gastronomie') ||
                    b.branch.includes('Gastgewerbe') ||
                    b.branch.includes('Beherbergung')
                );
            } else if (selectedTheme === 'tech') {
                filtered = filtered.filter(b =>
                    b.branch.includes('Informationstechnologie') ||
                    b.branch.includes('Information und Kommunikation') ||
                    b.branch.includes('Software') ||
                    b.branch.includes('Datenverarbeitung')
                );
            } else if (selectedTheme === 'retail') {
                filtered = filtered.filter(b =>
                    b.branch.includes('Einzelhandel') ||
                    b.branch.includes('Großhandel')
                );
            }
        }

        // Global Branch Filter (from Map Explorer)
        if (globalBranchSearch) {
            const lowGlobal = globalBranchSearch.toLowerCase().trim();
            if (lowGlobal.length > 0) {
                filtered = filtered.filter(b =>
                    b.branch.toLowerCase().includes(lowGlobal)
                );
            }
        }

        // Chart filter (e.g. from clicking sidebar)
        if (chartFilter) {
            filtered = filtered.filter(b => b.branch.includes(chartFilter) || b.employees === chartFilter);
        }

        // Sorting
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                if (sortConfig.key === 'age') {
                    aVal = aVal || 0;
                    bVal = bVal || 0;
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [businessDetails, searchTerm, sortConfig, filterType, chartFilter, globalBranchSearch, selectedTheme, district, searchResult]);

    const stats = useMemo(() => {
        if (!businessDetails.length) return null;

        const ages = businessDetails.map(b => b.age).filter(a => a !== null);
        const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;
        const startups = businessDetails.filter(b => (b.age || 0) < 3 && (b.branch.includes('IT') || b.branch.includes('Software') || b.branch.includes('Information'))).length;

        return {
            avgAge: avgAge.toFixed(1),
            stability: avgAge > 15 ? 'Hoch' : avgAge > 8 ? 'Mittel' : 'Niedrig',
            startupDensity: (startups / businessDetails.length * 100).toFixed(1),
            isStartupHub: startups > 5 && (startups / businessDetails.length) > 0.05
        };
    }, [businessDetails]);

    const exportToCSV = () => {
        const headers = ["Postleitzahl", "Branche", "Mitarbeiter", "Gewerbeart", "Alter"];
        const rows = processedBusinesses.map(b => [
            b.postcode,
            `"${b.branch}"`,
            b.employees,
            `"${b.type}"`,
            b.age
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Gewerbe_${selectedFeature.properties.PLR_NAME.replace(/\s+/g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const groupedBusinesses = useMemo(() => {
        if (!groupBy) return null;

        const groups: Record<string, any[]> = {};
        processedBusinesses.forEach(b => {
            const val = b[groupBy] || 'Unbekannt';
            if (!groups[val]) groups[val] = [];
            groups[val].push(b);
        });

        return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    }, [processedBusinesses, groupBy]);

    const toggleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'desc' };
        });
    };

    const toggleGroup = (groupKey: string) => {
        setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
    };

    const filteredGeoJson = useMemo(() => {
        if (!geoJsonData || !businessData) return null;
        if (!district || district === 'Berlin' || district === 'All') return geoJsonData;

        // Note: LOR geometry doesn't have district info directly in properties for all versions, 
        // we might need to join it or use a heuristic. 
        // In this project, lor_planungsraeume_2021 usually has PLR_ID where first 2 digits are district.
        const filteredFeatures = geoJsonData.features.filter((f: any) => {
            const districtId = f.properties.PLR_ID.substring(0, 2);
            // Removing leading zero for mapping if necessary
            const id = districtId.startsWith('0') ? districtId.substring(1) : districtId;
            return getDistrictName(id) === district;
        });

        return { ...geoJsonData, features: filteredFeatures };
    }, [geoJsonData, businessData, district]);

    const getMetricValue = useCallback((feature: any, theme: string) => {
        const plrId = String(feature.properties.PLR_ID);

        const data = businessData?.byLor[plrId];
        if (!data) return 0;

        switch (theme) {
            case 'gastro':
                return (data.branches['Gastronomie'] || 0) + (data.branches['Gastgewerbe'] || 0) + (data.branches['Beherbergung'] || 0);
            case 'tech':
                return (data.branches['Erbringung von Dienstleistungen der Informationstechnologie'] || 0) + (data.branches['Information und Kommunikation'] || 0);
            case 'retail':
                return (data.branches['Einzelhandel'] || 0) + (data.branches['Großhandel'] || 0);
            default: return data.count;
        }
    }, [businessData]);

    const getThemeColor = useCallback((val: number, theme: string) => {
        if (val === 0) return '#1e293b';

        const scale = scales[theme] || scales.total;
        for (let i = scale.thresholds.length - 1; i >= 0; i--) {
            if (val >= scale.thresholds[i]) return scale.colors[i + 1];
        }
        return scale.colors[0];
    }, [scales]);

    const style = useCallback((feature: any) => {
        const val = getMetricValue(feature, selectedTheme);
        return {
            fillColor: getThemeColor(val, selectedTheme),
            weight: 1,
            opacity: 1,
            color: '#334155',
            fillOpacity: 0.3
        };
    }, [getMetricValue, getThemeColor, selectedTheme]);


    const onEachFeature = useCallback((feature: any, layer: L.Layer) => {
        const plrId = String(feature.properties.PLR_ID);
        const data = businessData?.byLor[plrId];

        // Use search result count if active, otherwise total count
        const count = searchResult
            ? (searchResult.lorCounts[plrId] || 0)
            : (data?.count || 0);

        const districtId = plrId.substring(0, 2);
        const districtName = getDistrictName(districtId.startsWith('0') ? districtId.substring(1) : districtId);

        const tooltipContent = `
            <div style="font-family: sans-serif; padding: 4px;">
                <div style="display: flex; justify-between; align-items: center; margin-bottom: 4px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">
                    <h3 style="font-weight: bold; margin: 0; color: #1e293b;">${feature.properties.PLR_NAME}</h3>
                    <span style="font-size: 9px; color: #64748b; margin-left: 8px; text-transform: uppercase;">${districtName}</span>
                </div>
                <div style="display: grid; grid-template-columns: auto auto; gap: 8px; font-size: 12px; color: #334155;">
                    <span style="color: #64748b;">${searchResult ? 'Treffer:' : 'Gewerbe:'}</span>
                    <span style="font-weight: bold; text-align: right;">${count.toLocaleString('de-DE')}</span>
                    ${!searchResult ? `
                    <span style="color: #64748b;">Top Branche:</span>
                    <span style="font-weight: bold; text-align: right; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${data ? Object.entries(data.branches).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '-' : '-'}
                    </span>
                    ` : ''}
                </div>
            </div>
        `;

        if (isPointMode) {
            // Simplified tooltip for POI mode
            const simpleContent = `
                <div style="font-family: sans-serif; padding: 2px 4px; font-weight: bold; font-size: 11px; color: #1e293b;">
                    ${feature.properties.PLR_NAME} <span style="font-weight: normal; opacity: 0.7;">(${districtName})</span>
                </div>
            `;
            layer.bindTooltip(simpleContent, { sticky: true, direction: 'top', opacity: 0.9, className: 'simple-tooltip' });
        } else {
            layer.bindTooltip(tooltipContent, { sticky: true, direction: 'top', opacity: 0.95 });
        }

        layer.on({
            mouseover: (e: any) => {
                const l = e.target;
                l.setStyle({
                    weight: 3,
                    color: '#fff'
                });
                l.bringToFront();
            },
            mouseout: (e: any) => {
                const l = e.target;
                l.setStyle({
                    weight: 1,
                    color: '#334155'
                });
            },
            click: (e: any) => {
                if (isCompareMode && selectedFeature) {
                    setCompareFeature({
                        ...feature,
                        business: businessData?.byLor[plrId]
                    });
                } else {
                    setSelectedFeature({
                        ...feature,
                        business: businessData?.byLor[plrId]
                    });
                    setCompareFeature(null);
                    setIsSidepanelOpen(true);
                }
            }
        });
    }, [businessData, isCompareMode, selectedFeature, searchResult, isPointMode]);

    if (loading) return (
        <div className="h-[600px] flex items-center justify-center bg-slate-800/50 rounded-3xl border border-slate-700">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium">Verarbeite Gewerbedaten...</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                        <Briefcase className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Gewerbe-Analyse</h2>
                        <p className="text-[10px] text-slate-500 font-medium">IHK Berlin Unternehmensdaten nach Planungsräumen</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Stand: {new Date().toLocaleDateString('de-DE')}
                    </span>
                    <span className="hidden sm:inline-block opacity-50">Quelle: IHK Berlin (Open Data)</span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-[720px]">
                <div className="flex-1 bg-slate-800/50 p-1 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl relative">
                    <MapContainer
                        center={[52.5200, 13.4050]}
                        zoom={11}
                        style={{ height: '100%', width: '100%', borderRadius: '1.5rem', background: '#0f172a' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <FitBounds data={filteredGeoJson} />
                        {filteredGeoJson && (
                            <GeoJSON
                                key={`${selectedTheme}-${district}-${businessData ? 'ready' : 'loading'}-${globalBranchSearch}-${searchResult ? 'results' : 'no-results'}`}
                                data={filteredGeoJson}
                                style={style}
                                onEachFeature={onEachFeature}
                            />
                        )}

                        {isPointMode && (
                            <Pane name="pois" style={{ zIndex: 600 }}>
                                {selectedFeature ? (
                                    processedBusinesses.map((b: any, i) => (
                                        b.lat && b.lng ? (
                                            <CircleMarker
                                                key={`kiez-point-${i}`}
                                                center={[b.lat, b.lng]}
                                                radius={3}
                                                fillColor="#ffffff"
                                                color="#ffffff"
                                                weight={1}
                                                fillOpacity={1}
                                                className="drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                                            >
                                                <Tooltip sticky>
                                                    <div className="text-xs font-bold">{b.branch}</div>
                                                    <div className="text-[10px] opacity-70">{b.employees}</div>
                                                </Tooltip>
                                                <Popup>
                                                    <div className="text-slate-900 text-xs font-sans p-1 min-w-[200px]">
                                                        <h3 className="font-bold mb-2 text-sm border-b pb-1 border-slate-200 leading-tight">{b.branch}</h3>
                                                        <div className="grid grid-cols-[16px_1fr] gap-x-2 gap-y-1.5 items-start">
                                                            <Users className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                                                            <span>{b.employees || 'Keine Angabe'}</span>

                                                            <Building2 className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                                                            <span className="leading-tight">{b.type || 'Keine Angabe'}</span>

                                                            <Calendar className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                                                            <span>{b.age ? `${b.age} Jahre alt` : 'Keine Angabe'}</span>

                                                            <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                                                            <span>{b.postcode} {b.city || 'Berlin'}</span>
                                                        </div>
                                                    </div>
                                                </Popup>
                                            </CircleMarker>
                                        ) : null
                                    ))
                                ) : (
                                    searchResult && searchResult.points
                                        .filter((p: any) => {
                                            if (!district || district === 'Berlin' || district === 'All') return true;
                                            if (!p.lorId) return false;
                                            const districtIdStr = p.lorId.substring(0, 2);
                                            const normalizedId = districtIdStr.startsWith('0') ? districtIdStr.substring(1) : districtIdStr;
                                            return getDistrictName(normalizedId) === district;
                                        })
                                        .map((p: any, i: number) => (
                                            <CircleMarker
                                                key={`point-${i}`}
                                                center={[p.lat, p.lng]}
                                                radius={4}
                                                fillColor="#ffffff"
                                                color="#ffffff"
                                                weight={1}
                                                fillOpacity={1}
                                                className="drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                                            >
                                                <Tooltip sticky>{p.branch}</Tooltip>
                                                <Popup>
                                                    <div className="text-slate-900 text-xs font-sans p-1 min-w-[200px]">
                                                        <h3 className="font-bold mb-2 text-sm border-b pb-1 border-slate-200 leading-tight">{p.branch}</h3>
                                                        <div className="grid grid-cols-[16px_1fr] gap-x-2 gap-y-1.5 items-start">
                                                            <Users className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                                                            <span>{p.employees || 'Keine Angabe'}</span>

                                                            <Building2 className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                                                            <span className="leading-tight">{p.type || 'Keine Angabe'}</span>

                                                            <Calendar className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                                                            <span>{p.age ? `${p.age} Jahre alt` : 'Keine Angabe'}</span>

                                                            <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                                                            <span>{p.postcode} {p.city || 'Berlin'}</span>
                                                        </div>
                                                    </div>
                                                </Popup>
                                            </CircleMarker>
                                        ))
                                )}
                            </Pane>
                        )}
                    </MapContainer>

                    {/* Theme Selector Toolbar */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl z-[1000] w-[90%] md:w-auto overflow-x-auto no-scrollbar">
                        <div className="flex gap-1 border-r border-slate-700 pr-2 mr-1 shrink-0">
                            {[
                                { id: 'total', icon: Building2, label: 'Alle' },
                                { id: 'gastro', icon: Store, label: 'Gastro' },
                                { id: 'tech', icon: Factory, label: 'Tech' },
                                { id: 'retail', icon: PlusCircle, label: 'Handel' },
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTheme(t.id as any)}
                                    title={t.label}
                                    className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${selectedTheme === t.id ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                >
                                    <t.icon className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight hidden md:inline">{t.label}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setIsCompareMode(!isCompareMode);
                                if (!isCompareMode) setCompareFeature(null);
                            }}
                            className={`p-2.5 rounded-xl transition-all flex items-center gap-2 border ${isCompareMode ? 'bg-emerald-500 border-emerald-500 text-slate-900 shadow-lg' : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white'}`}
                        >
                            <Scale className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-tight hidden sm:inline">Vergleich</span>
                        </button>

                        <div className="h-6 w-[1px] bg-slate-700 mx-1" />

                        {/* Branch Search Bar */}
                        <div className="flex items-center gap-2 px-2 min-w-[180px] md:min-w-[240px]">
                            <div className="relative w-full">
                                <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isSearching ? 'text-emerald-500 animate-pulse' : 'text-slate-500'}`} />
                                <input
                                    type="text"
                                    placeholder="Branchen-Explorer (z.B. IT, Kinos...)"
                                    className="bg-slate-800/50 border border-slate-700 rounded-xl py-2 pl-9 pr-8 text-[10px] text-white w-full focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                                    value={globalBranchSearch}
                                    onChange={(e) => setGlobalBranchSearch(e.target.value)}
                                />
                                {globalBranchSearch && (
                                    <button
                                        onClick={() => setGlobalBranchSearch('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded-md"
                                    >
                                        <CloseIcon className="w-3 h-3 text-slate-500" />
                                    </button>
                                )}
                            </div>

                            {(searchResult || selectedFeature) && (
                                <button
                                    onClick={() => setIsPointMode(!isPointMode)}
                                    className={`p-2 rounded-xl border transition-all ${isPointMode ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-800 border-white/5 text-slate-400'}`}
                                    title="POI Modus (Punkte)"
                                >
                                    <MapPin className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Map Legend */}
                    <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-2xl z-[1000] min-w-[160px]">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">
                            {searchResult ? 'Trefferanzahl' : 'Anzahl Gewerbe'}
                        </h4>
                        <div className="flex flex-col gap-1.5">
                            {(() => {
                                if (searchResult) {
                                    const items = [
                                        { label: '> 50', color: '#f43f5e' },
                                        { label: '21 - 50', color: '#fb7185' },
                                        { label: '11 - 20', color: '#fda4af' },
                                        { label: '6 - 10', color: '#fecdd3' },
                                        { label: '1 - 5', color: '#fff1f2' },
                                        { label: '0', color: '#1e293b' } // Changed to match base color for 0
                                    ];
                                    return items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-[10px] font-medium text-slate-300">{item.label}</span>
                                        </div>
                                    ));
                                } else {
                                    const scale = scales[selectedTheme] || scales.total;
                                    // Colors are [0..threshold0], [threshold0..threshold1], ...
                                    // Thresholds: [t0, t1, t2, t3, t4]
                                    // Colors: [c0, c1, c2, c3, c4, c5]
                                    // c0: < t0
                                    // c1: >= t0 && < t1
                                    // c5: >= t4

                                    // We want to display high to low
                                    const items = [];
                                    items.push({ label: `> ${scale.thresholds[4]}`, color: scale.colors[5] });
                                    items.push({ label: `${scale.thresholds[3]} - ${scale.thresholds[4]}`, color: scale.colors[4] });
                                    items.push({ label: `${scale.thresholds[2]} - ${scale.thresholds[3]}`, color: scale.colors[3] });
                                    items.push({ label: `${scale.thresholds[1]} - ${scale.thresholds[2]}`, color: scale.colors[2] });
                                    items.push({ label: `${scale.thresholds[0]} - ${scale.thresholds[1]}`, color: scale.colors[1] });
                                    items.push({ label: `< ${scale.thresholds[0]}`, color: scale.colors[0] });

                                    return items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-md border border-white/10" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-[10px] font-medium text-slate-300">{item.label}</span>
                                        </div>
                                    ));
                                }
                            })()}
                        </div>
                    </div>
                </div>

                <div className={`w-full lg:w-96 bg-slate-900/50 rounded-3xl border border-slate-700/50 backdrop-blur-xl flex flex-col transition-all duration-500 overflow-hidden shadow-2xl ${isSidepanelOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 lg:translate-x-0 lg:opacity-50'}`}>
                    {selectedFeature ? (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="p-6 border-b border-slate-700/50 flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 block">
                                        Kiez-Analyse • Gewerbe
                                    </span>
                                    <h2 className="text-xl font-bold text-white leading-tight">{selectedFeature.properties.PLR_NAME}</h2>
                                    <p className="text-xs text-slate-500 font-mono mt-1">ID: {selectedFeature.properties.PLR_ID}</p>
                                </div>
                                <button onClick={() => setIsSidepanelOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all">
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
                                        <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <TrendingUp className="w-16 h-16 text-white" />
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Stabilitäts-Score</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-2xl font-bold text-white">{stats?.stability || '-'}</p>
                                            <span className="text-[10px] text-slate-500 font-medium">({stats?.avgAge} J.)</span>
                                        </div>
                                    </div>
                                    <div className={`p-4 rounded-2xl border relative overflow-hidden group transition-all ${stats?.isStartupHub ? 'bg-emerald-500/10 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-slate-800/40 border-white/5'}`}>
                                        <div className="absolute -right-2 -bottom-2 opacity-10">
                                            <Zap className={`w-16 h-16 ${stats?.isStartupHub ? 'text-emerald-500' : 'text-slate-600'}`} />
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Startup-Hub</p>
                                            {stats?.isStartupHub && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <p className={`text-2xl font-bold ${stats?.isStartupHub ? 'text-emerald-400' : 'text-slate-400'}`}>{stats?.isStartupHub ? 'Ja' : 'Nein'}</p>
                                            <span className="text-[10px] text-slate-500 font-medium">{stats?.startupDensity}% IT</span>
                                        </div>
                                    </div>
                                </div>

                                {compareFeature && (
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 animate-in zoom-in-95 duration-300">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-amber-500/20 rounded">
                                                    <Scale className="w-3 h-3 text-amber-500" />
                                                </div>
                                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Benchmark vs. {compareFeature.properties.PLR_NAME}</p>
                                            </div>
                                            <button onClick={() => setCompareFeature(null)} className="text-amber-500/50 hover:text-amber-500">
                                                <CloseIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Betriebe', val1: selectedFeature.business?.count || 0, val2: compareFeature.business?.count || 0 },
                                                { label: 'Gastro', val1: (selectedFeature.business?.branches['Gastronomie'] || 0), val2: (compareFeature.business?.branches['Gastronomie'] || 0) },
                                                { label: 'Ø Alter', val1: parseFloat(stats?.avgAge || '0'), val2: 12.5 } // Placeholder for 2nd age
                                            ].map((row, i) => (
                                                <div key={i} className="flex flex-col gap-1">
                                                    <div className="flex justify-between text-[10px] items-center">
                                                        <span className="text-slate-400 font-medium">{row.label}</span>
                                                        <div className="flex gap-3">
                                                            <span className="text-white font-bold">{row.val1}</span>
                                                            <span className="text-amber-500 opacity-50 font-bold">{row.val2}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-1 bg-slate-800 rounded-full flex overflow-hidden">
                                                        <div style={{ width: `${(row.val1 / (row.val1 + row.val2)) * 100}%` }} className="h-full bg-amber-500" />
                                                        <div style={{ width: `${(row.val2 / (row.val1 + row.val2)) * 100}%` }} className="h-full bg-slate-600" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                            <ChevronRight className="w-3 h-3 text-amber-500" />
                                            Marktreife (Mitarbeiter)
                                        </h3>
                                        {chartFilter && (
                                            <button onClick={() => setChartFilter(null)} className="text-[8px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                Reset Filter
                                            </button>
                                        )}
                                    </div>
                                    <div className="h-48 w-full group cursor-pointer">
                                        {(() => {
                                            const ranges = selectedFeature.business?.employeeRanges || {};
                                            const chartData = Object.entries(ranges).map(([name, val]: [string, any]) => ({ name, val }))
                                                .sort((a, b) => b.val - a.val)
                                                .slice(0, 5);

                                            return (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} onClick={(data) => data && setChartFilter(data.activeLabel || null)}>
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} />
                                                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }} />
                                                        <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                                                            {chartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={chartFilter === entry.name ? '#fbbf24' : '#f59e0b'} fillOpacity={chartFilter && chartFilter !== entry.name ? 0.3 : 1} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ChevronRight className="w-3 h-3 text-amber-500" />
                                        Top Branchen
                                    </h3>
                                    <div className="space-y-3">
                                        {Object.entries(selectedFeature.business?.branches || {})
                                            .sort((a: any, b: any) => b[1] - a[1])
                                            .slice(0, 5)
                                            .map(([name, val]: [string, any], i) => (
                                                <div key={i} className="flex items-center gap-2 group/row">
                                                    <div
                                                        onClick={() => setChartFilter(chartFilter === name ? null : name)}
                                                        className={`flex-1 space-y-1 cursor-pointer group/item transition-all ${chartFilter && chartFilter !== name ? 'opacity-30 grayscale' : 'opacity-100'}`}
                                                    >
                                                        <div className="flex justify-between text-[10px] font-bold">
                                                            <span className="text-slate-400 truncate max-w-[180px] group-hover/item:text-white transition-colors">{name}</span>
                                                            <span className="text-white">{val}</span>
                                                        </div>
                                                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                style={{ width: `${(val / selectedFeature.business.count) * 100}%` }}
                                                                className={`h-full transition-all ${chartFilter === name ? 'bg-amber-400' : 'bg-amber-500'}`}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setGlobalBranchSearch(name);
                                                        }}
                                                        className="p-1.5 bg-slate-800 rounded-lg text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all border border-transparent hover:border-emerald-500/20 opacity-0 group-hover/row:opacity-100"
                                                        title="Auf ganzer Karte anzeigen"
                                                    >
                                                        <Crosshair className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-white/5">
                                <Briefcase className="w-8 h-8 text-slate-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-300">Gewerbedaten erkunden</h3>
                            <p className="text-sm text-slate-500 mt-2 leading-relaxed">Klicke auf die Karte, um die wirtschaftliche Struktur eines Kiezes zu analysieren.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detailed Table Section */}
            {/* Detailed Table Section */}
            {(selectedFeature || (searchResult && searchResult.points)) && (
                <div className="bg-slate-900/50 rounded-3xl border border-slate-700/50 backdrop-blur-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6">
                    {/* Header & Main Controls */}
                    <div className="p-6 border-b border-slate-700/50 space-y-4 bg-slate-800/20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <Info className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gewerbe-Verzeichnis</h3>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                        {selectedFeature
                                            ? `Unternehmen in ${selectedFeature.properties.PLR_NAME}`
                                            : `Suchergebnisse für "${globalBranchSearch}"${(district && district !== 'Berlin' && district !== 'All') ? ` in ${district}` : ''}`
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                    {processedBusinesses.length} Treffer
                                </span>
                                {selectedFeature ? (
                                    businessDetails.length > processedBusinesses.length && (
                                        <span className="text-[10px] font-bold text-slate-500">
                                            von {businessDetails.length}
                                        </span>
                                    )
                                ) : (
                                    searchResult && searchResult.totalMatched > processedBusinesses.length && (
                                        <span className="text-[10px] font-bold text-slate-500">
                                            von {searchResult.totalMatched} (Gesamt)
                                        </span>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Search and Filters Row */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <div className="relative flex-1 min-w-[240px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Suche nach Branche, PLZ oder Typ..."
                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <select
                                        className="bg-slate-900/80 border border-slate-700 rounded-xl py-2 pl-10 pr-8 text-xs text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                    >
                                        <option value="all">Alle Typen</option>
                                        <option value="Kleingewerbetreibender">Kleingewerbe</option>
                                        <option value="im Handelsregister eingetragen">HR-Eintrag</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                </div>

                                <div className="relative">
                                    <ListTree className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <select
                                        className={`bg-slate-900/80 border rounded-xl py-2 pl-10 pr-8 text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer transition-all ${groupBy ? 'border-emerald-500 text-white font-bold' : 'border-slate-700 text-slate-400'}`}
                                        value={groupBy || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setGroupBy(val === '' ? null : val);
                                            setExpandedGroups({});
                                        }}
                                    >
                                        <option value="">Keine Gruppierung</option>
                                        <option value="branch">Nach Branche</option>
                                        <option value="postcode">Nach PLZ</option>
                                        <option value="type">Nach Gewerbeart</option>
                                        <option value="employees">Nach Mitarbeiterzahl</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                </div>

                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-white/5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-all uppercase tracking-tight"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Export</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-800/40 border-b border-slate-700/50 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('postcode')}>
                                        <div className="flex items-center gap-2">
                                            Postleitzahl
                                            {sortConfig?.key === 'postcode' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">Planungsraum</th>
                                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('branch')}>
                                        <div className="flex items-center gap-2">
                                            Branche
                                            {sortConfig?.key === 'branch' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">Mitarbeiter</th>
                                    <th className="px-6 py-4">Gewerbeart</th>
                                    <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('age')}>
                                        <div className="flex items-center justify-end gap-2">
                                            Alter
                                            {sortConfig?.key === 'age' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {loadingDetails ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="px-6 py-4">
                                                <div className="h-4 bg-slate-800 rounded w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : groupBy && groupedBusinesses ? (
                                    groupedBusinesses.map(([groupKey, items], i) => (
                                        <Fragment key={groupKey}>
                                            <tr
                                                key={`group-${i}`}
                                                className="bg-slate-800/40 cursor-pointer hover:bg-slate-800/60 transition-colors border-l-4 border-l-emerald-500"
                                                onClick={() => toggleGroup(groupKey)}
                                            >
                                                <td colSpan={6} className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <ChevronRight className={`w-4 h-4 text-emerald-500 transition-transform ${expandedGroups[groupKey] ? 'rotate-90' : ''}`} />
                                                        <span className="text-sm font-bold text-white italic opacity-60 mr-1">
                                                            {groupBy === 'branch' ? 'Branche' : groupBy === 'postcode' ? 'PLZ' : groupBy === 'type' ? 'Typ' : 'Größe'}:
                                                        </span>
                                                        <span className="text-sm font-bold text-white">{groupKey}</span>
                                                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] text-emerald-400 border border-emerald-500/20 ml-auto">
                                                            {items.length} Unternehmen
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedGroups[groupKey] && items.map((biz, j) => (
                                                <BusinessRow key={`${i}-${j}`} biz={biz} isGrouped />
                                            ))}
                                        </Fragment>
                                    ))
                                ) : processedBusinesses.length > 0 ? (
                                    processedBusinesses.slice(0, 100).map((biz, i) => (
                                        <BusinessRow key={i} biz={biz} />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm italic">
                                            Keine passenden Einträge gefunden.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {!groupBy && processedBusinesses.length > 100 && (
                        <div className="p-4 bg-slate-800/20 border-t border-slate-700/50 text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                Zeige die ersten 100 von {processedBusinesses.length} Treffern • Benutze die Suche zum Eingrenzen
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function BusinessRow({ biz, isGrouped }: { biz: any, isGrouped?: boolean }) {
    return (
        <tr className={`hover:bg-slate-800/30 transition-colors group ${isGrouped ? 'bg-slate-900/40' : ''}`}>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white">{biz.postcode}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="text-xs text-slate-400 block max-w-[120px] truncate" title={biz.planungsraum}>
                    {biz.planungsraum}
                </span>
            </td>
            <td className="px-6 py-4">
                <span className="text-sm text-slate-300 group-hover:text-white block max-w-md truncate" title={biz.branch}>
                    {biz.branch}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-amber-500/70" />
                    <span className="text-xs font-bold text-amber-400/90">{biz.employees}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-tight border border-white/5">
                    {biz.type}
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-mono text-slate-400 group-hover:text-slate-200">{biz.age ?? '-'}</span>
                </div>
            </td>
        </tr>
    );
}
