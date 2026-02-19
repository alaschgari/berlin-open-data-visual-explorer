'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet icon issues
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TrafficMapProps {
    district: string;
    data: any;
    isKeyMissing?: boolean;
    highlightedSegmentId?: number | null;
}

export default function TrafficMap({ district, data, isKeyMissing, highlightedSegmentId }: TrafficMapProps) {
    const [segments, setSegments] = useState<any[]>([]);
    const [map, setMap] = useState<L.Map | null>(null);

    useEffect(() => {
        if (data && data.features) {
            setSegments(data.features);
        }
    }, [data]);

    // Effect to zoom to highlighted segment
    useEffect(() => {
        if (highlightedSegmentId && map && segments.length > 0) {
            const segment = segments.find(s => s.properties.segment_id === highlightedSegmentId);
            if (segment) {
                // Create a Leaflet GeoJSON layer to get bounds
                const geoJsonLayer = L.geoJSON(segment.geometry);
                const bounds = geoJsonLayer.getBounds();
                map.flyToBounds(bounds, {
                    padding: [50, 50],
                    maxZoom: 15,
                    duration: 1.5
                });
            }
        }
    }, [highlightedSegmentId, map, segments]);

    const center: [number, number] = [52.5200, 13.4050];

    const getSegmentStyle = (feature: any) => {
        const isHighlighted = highlightedSegmentId === feature.properties.segment_id;

        return {
            color: isHighlighted ? '#6366f1' : '#94a3b8', // Indigo if highlighted, else Slate-400 (Neutral)
            weight: isHighlighted ? 8 : 4,
            opacity: isHighlighted ? 1 : 0.6,
            dashArray: isHighlighted ? undefined : undefined
        };
    };

    return (
        <MapContainer
            center={center}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
            ref={setMap}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {segments.map((segment: any) => {
                const geometry = segment.geometry;
                const props = segment.properties;
                const isHighlighted = highlightedSegmentId === props.segment_id;

                // Handle MultiLineString (standard for Telraam)
                if (geometry.type === 'MultiLineString') {
                    return (
                        <Polyline
                            key={props.segment_id}
                            positions={geometry.coordinates.map((line: any[]) =>
                                line.map((coord: any[]) => [coord[1], coord[0]])
                            )}
                            pathOptions={getSegmentStyle(segment)}
                            eventHandlers={{
                                click: (e) => {
                                    e.target.openPopup();
                                }
                            }}
                        >
                            <Popup autoPan={false}>
                                <div className="p-2 min-w-[150px]">
                                    <h4 className="font-bold text-slate-900 mb-1">
                                        Segment #{props.segment_id}
                                        {isHighlighted && <span className="ml-2 text-xs text-indigo-600 bg-indigo-100 px-1 rounded">HOTSPOT</span>}
                                    </h4>
                                    <div className="space-y-1 text-xs text-slate-600">
                                        <div className="flex justify-between">
                                            <span>🚗 Cars:</span>
                                            <span className="font-mono font-bold">{Math.round(props.car)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>🚲 Bikes:</span>
                                            <span className="font-mono font-bold">{Math.round(props.bike)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>🚶 Peds:</span>
                                            <span className="font-mono font-bold">{Math.round(props.pedestrian)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>🚛 Heavy:</span>
                                            <span className="font-mono font-bold">{Math.round(props.heavy)}</span>
                                        </div>
                                        <div className="flex justify-between mt-2 pt-2 border-t border-slate-200">
                                            <span>🏎️ Speed (v85):</span>
                                            <span className="font-mono font-bold text-rose-500">{Math.round(props.v85)} km/h</span>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Polyline>
                    );
                }

                // Handle LineString (fallback)
                if (geometry.type === 'LineString') {
                    const positions = geometry.coordinates.map((c: any) => [c[1], c[0]]);
                    return (
                        <Polyline
                            key={props.segment_id}
                            positions={positions}
                            pathOptions={getSegmentStyle(segment)}
                        >
                            <Popup>
                                <div className="p-2">
                                    <h4 className="font-bold text-slate-900">Segment #{props.segment_id}</h4>
                                </div>
                            </Popup>
                        </Polyline>
                    );
                }
                return null;
            })}
        </MapContainer>
    );
}
