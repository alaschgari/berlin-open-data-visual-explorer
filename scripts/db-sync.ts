/**
 * Refreshes database tables from official Berlin open data sources.
 *
 * Usage: pnpm db:sync [markets|disabled-parking|subsidies ...]   (default: all jobs)
 *        pnpm db:sync --dry-run                                   (fetch and validate only)
 *
 * Each job fetches the source, validates it and replaces the table in a single
 * transaction, so a failed run never leaves a table half-empty.
 */
import { existsSync } from 'fs';
import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { count, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import * as schema from '../src/db/schema';
import { getLatestResourceUrl } from '../src/lib/ckan';
import { CKAN_PACKAGES } from '../src/lib/constants';
import {
    checkReplaceIsSafe,
    geoJsonToRows,
    marketsToRows,
    parseSubsidiesCsv,
    type GeoJsonFeatureCollection,
} from '../src/lib/sync/transform';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');

type Db = PostgresJsDatabase<typeof schema>;

const ALLOWED_HOSTS = new Set(['www.berlin.de', 'berlin.de', 'gdi.berlin.de']);
const INSERT_CHUNK_SIZE = 1000;

/** Only follow CKAN resource URLs that point at an official Berlin host. */
async function resolveUrl(packageId: string, format: string, fallback: string): Promise<string> {
    const candidate = await getLatestResourceUrl(packageId, format).catch(() => null);
    if (!candidate) return fallback;
    try {
        return ALLOWED_HOSTS.has(new URL(candidate).hostname) ? candidate : fallback;
    } catch {
        return fallback;
    }
}

async function fetchOk(url: string): Promise<Response> {
    const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response;
}

async function replaceTable<T extends PgTable>(db: Db, table: T, rows: T['$inferInsert'][], name: string, dryRun: boolean) {
    const [{ value: existing }] = await db.select({ value: count() }).from(table as PgTable);
    const safety = checkReplaceIsSafe(rows.length, existing);
    if (!safety.ok) throw new Error(`${name}: refusing to replace table, ${safety.reason}`);

    if (dryRun) {
        console.log(`${name}: dry run, would replace ${existing} rows with ${rows.length}`);
        return;
    }

    await db.transaction(async (tx) => {
        await tx.delete(table);
        for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
            await tx.insert(table).values(rows.slice(i, i + INSERT_CHUNK_SIZE));
        }
    });
    console.log(`${name}: replaced ${existing} rows with ${rows.length}`);
}

const jobs: Record<string, (db: Db, dryRun: boolean) => Promise<void>> = {
    async markets(db, dryRun) {
        const url = await resolveUrl(CKAN_PACKAGES.MARKETS, 'GeoJSON',
            'https://www.berlin.de/sen/web/service/maerkte-feste/wochen-troedelmaerkte/index.php/index/all.geojson?q=');
        const geojson = await (await fetchOk(url)).json() as GeoJsonFeatureCollection;
        await replaceTable(db, schema.markets, marketsToRows(geojson), 'markets', dryRun);
    },

    async 'disabled-parking'(db, dryRun) {
        const url = 'https://gdi.berlin.de/services/wfs/behindertenparkplaetze?service=wfs&version=2.0.0&request=GetFeature&typeNames=behindertenparkplaetze:bpark&outputFormat=application/json';
        const geojson = await (await fetchOk(url)).json() as GeoJsonFeatureCollection;
        await replaceTable(db, schema.disabledParkingSpaces, geoJsonToRows(geojson, 'parking'), 'disabled-parking', dryRun);
    },

    async subsidies(db, dryRun) {
        const url = await resolveUrl(CKAN_PACKAGES.SUBSIDIES, 'CSV',
            'https://www.berlin.de/sen/finanzen/service/zuwendungsdatenbank/index.php/index/all.csv?q=');
        const csv = await (await fetchOk(url)).text();
        const now = new Date();
        const rows = parseSubsidiesCsv(csv).map(row => ({ ...row, created_at: now }));
        await replaceTable(db, schema.subsidies, rows, 'subsidies', dryRun);
    },
};

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const requested = args.filter(a => !a.startsWith('--'));
    const selected = requested.length > 0 ? requested : Object.keys(jobs);

    const unknown = selected.filter(name => !jobs[name]);
    if (unknown.length > 0) {
        console.error(`Unknown job(s): ${unknown.join(', ')}. Available: ${Object.keys(jobs).join(', ')}`);
        process.exit(1);
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    const client = postgres(databaseUrl, { max: 1, ssl: 'require' });
    const db = drizzle(client, { schema });
    await db.execute(sql`select 1`);

    const failed: string[] = [];
    for (const name of selected) {
        console.log(`\n--- ${name} ---`);
        try {
            await jobs[name](db, dryRun);
        } catch (error) {
            console.error(`${name} failed:`, error instanceof Error ? error.message : error);
            failed.push(name);
        }
    }

    await client.end();

    if (failed.length > 0) {
        console.error(`\nFailed jobs: ${failed.join(', ')}`);
        process.exit(1);
    }
    console.log('\nAll jobs completed.');
}

main();
