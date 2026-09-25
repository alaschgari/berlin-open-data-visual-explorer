import Papa from 'papaparse';

/** Pure transforms from source payloads to database rows. No I/O, so they are unit-testable. */

export interface GeoJsonFeature {
    id?: string | number;
    type?: string;
    geometry: unknown;
    properties?: Record<string, unknown> | null;
}

export interface GeoJsonFeatureCollection {
    type?: string;
    features?: GeoJsonFeature[];
}

export interface GeoRow {
    id: string;
    geometry: unknown;
    properties: Record<string, unknown> | null;
}

export interface MarketRow extends GeoRow {
    title: string | null;
}

export interface SubsidyRow {
    id: string;
    recipient: string;
    provider: string;
    type: string;
    year: number;
    address: string;
    area: string;
    purpose: string;
    amount: number;
}

function featureId(feature: GeoJsonFeature, fallback: string): string {
    const propId = feature.properties?.id;
    if (feature.id !== undefined && feature.id !== null && feature.id !== '') return String(feature.id);
    if (typeof propId === 'string' || typeof propId === 'number') return String(propId);
    return fallback;
}

/** Drops duplicate ids (keeps the first) so a bulk insert cannot fail on the primary key. */
function uniqueById<T extends { id: string }>(rows: T[]): T[] {
    const seen = new Set<string>();
    return rows.filter(row => (seen.has(row.id) ? false : (seen.add(row.id), true)));
}

/** Shape of a subsidy as returned to the UI. */
export type SubsidyRecord = SubsidyRow;

export function geoJsonToRows(collection: GeoJsonFeatureCollection, idPrefix: string): GeoRow[] {
    const features = collection.features ?? [];
    return uniqueById(features
        .filter(f => f.geometry)
        .map((f, idx) => ({
            id: featureId(f, `${idPrefix}_${idx}`),
            geometry: f.geometry,
            properties: f.properties ?? null,
        })));
}

export function marketsToRows(collection: GeoJsonFeatureCollection): MarketRow[] {
    return geoJsonToRows(collection, 'market').map(row => {
        const title = row.properties?.title;
        return { ...row, title: typeof title === 'string' ? title : null };
    });
}

/** Parses a German amount like "1.234,56 €" into a number. */
export function parseGermanAmount(value: string | undefined): number {
    if (!value) return 0;
    const cleaned = value.replace(/[^-0-9,.]/g, '');
    // Dots are thousand separators, comma is the decimal separator
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const amount = parseFloat(normalized);
    return Number.isFinite(amount) ? amount : 0;
}

/**
 * Parses the Zuwendungsdatenbank CSV export.
 * Columns: id;name;geber;art;jahr;anschrift;politikbereich;zweck;betrag;empfaengerid
 */
export function parseSubsidiesCsv(csv: string): SubsidyRow[] {
    const { data } = Papa.parse<string[]>(csv.replace(/^﻿/, ''), {
        delimiter: ';',
        skipEmptyLines: true,
    });

    const rows = data.slice(1)
        .filter(cols => cols.length >= 9 && cols[0])
        .map(cols => ({
            id: cols[0].trim(),
            recipient: cols[1] ?? '',
            provider: cols[2] ?? '',
            type: cols[3] ?? '',
            year: parseInt(cols[4], 10) || 0,
            address: cols[5] ?? '',
            area: cols[6] ?? '',
            purpose: cols[7] ?? '',
            amount: parseGermanAmount(cols[8]),
        }));

    return uniqueById(rows);
}

/**
 * Refuses to replace a table when the new dataset is suspiciously small,
 * e.g. because the source returned an error page or a truncated file.
 */
export function checkReplaceIsSafe(newCount: number, existingCount: number, minRatio = 0.5): { ok: true } | { ok: false; reason: string } {
    if (newCount === 0) return { ok: false, reason: 'source returned no rows' };
    if (existingCount > 0 && newCount < existingCount * minRatio) {
        return { ok: false, reason: `source returned ${newCount} rows, existing table has ${existingCount} (below ${minRatio * 100}%)` };
    }
    return { ok: true };
}
