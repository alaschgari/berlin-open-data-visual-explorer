/**
 * Refreshes database tables from official Berlin open data sources.
 *
 * Usage: pnpm db:sync [markets|disabled-parking|subsidies|demographics ...]   (default: all jobs)
 *        pnpm db:sync --dry-run                                   (fetch and validate only)
 *
 * Each job fetches the source, validates it and replaces the table in a single
 * transaction, so a failed run never leaves a table half-empty.
 *
 * DEMOGRAPHICS_CSV_URL overrides the resident register CSV (EWR_L21_<date>E_Matrix.csv),
 * e.g. when a newer reporting date is published. DEMOGRAPHICS_CSV_FILE reads a local copy instead.
 */
import { existsSync, readFileSync } from 'fs';
import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { count, sql, type SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import * as schema from '../src/db/schema';
import { getLatestResourceUrl, searchCkanResources } from '../src/lib/ckan';
import { CKAN_PACKAGES } from '../src/lib/constants';
import {
    checkReplaceIsSafe,
    geoJsonToRows,
    marketsToRows,
    MIN_DEMOGRAPHICS_ROWS,
    parseDemographicsCsv,
    parseSubsidiesCsv,
    type GeoJsonFeatureCollection,
} from '../src/lib/sync/transform';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');

type Db = PostgresJsDatabase<typeof schema>;

const ALLOWED_HOSTS = new Set(['www.berlin.de', 'berlin.de', 'gdi.berlin.de', 'www.statistik-berlin-brandenburg.de', 'download.statistik-berlin-brandenburg.de']);
const DEFAULT_DEMOGRAPHICS_URL = 'https://www.statistik-berlin-brandenburg.de/opendata/EWR_L21_202412E_Matrix.csv';
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

function assertAllowedHost(url: string) {
    const host = new URL(url).hostname;
    if (!ALLOWED_HOSTS.has(host)) throw new Error(`Host not allowed: ${host}`);
}

/** The newest resident register matrix (EWR_L21_<yyyymm>E_Matrix.csv) listed in the CKAN registry. */
async function findDemographicsUrl(): Promise<string | null> {
    const pattern = /EWR_L21_(\d{6})E_Matrix\.csv$/i;
    const candidates = (await searchCkanResources('EWR_L21 Einwohnerregister Planungsräume'))
        .map(r => ({ url: r.url, date: r.url.match(pattern)?.[1] }))
        .filter((c): c is { url: string; date: string } => !!c.date && isAllowedHost(c.url))
        .sort((a, b) => b.date.localeCompare(a.date));
    return candidates[0]?.url ?? null;
}

/** The markets GeoJSON from the CKAN registry, searched by title because the package id changed. */
async function findMarketsUrl(): Promise<string | null> {
    const resource = (await searchCkanResources('Wochen- und Trödelmärkte'))
        .find(r => /geo\s*json|json/i.test(r.format) && isAllowedHost(r.url));
    return resource?.url ?? null;
}

function isAllowedHost(url: string): boolean {
    try {
        return ALLOWED_HOSTS.has(new URL(url).hostname);
    } catch {
        return false;
    }
}

async function fetchOk(url: string): Promise<Response> {
    const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response;
}

/** `prepare` runs inside the transaction before the delete, e.g. for schema fixes. */
async function replaceTable<T extends PgTable>(db: Db, table: T, rows: T['$inferInsert'][], name: string, dryRun: boolean, prepare?: SQL) {
    const [{ value: existing }] = await db.select({ value: count() }).from(table as PgTable);
    const safety = checkReplaceIsSafe(rows.length, existing);
    if (!safety.ok) throw new Error(`${name}: refusing to replace table, ${safety.reason}`);

    if (dryRun) {
        console.log(`${name}: dry run, would replace ${existing} rows with ${rows.length}`);
        return;
    }

    await db.transaction(async (tx) => {
        if (prepare) await tx.execute(prepare);
        await tx.delete(table);
        for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
            await tx.insert(table).values(rows.slice(i, i + INSERT_CHUNK_SIZE));
        }
    });
    console.log(`${name}: replaced ${existing} rows with ${rows.length}`);
}

const jobs: Record<string, (db: Db, dryRun: boolean) => Promise<void>> = {
    async markets(db, dryRun) {
        const url = await findMarketsUrl() ?? await resolveUrl(CKAN_PACKAGES.MARKETS, 'GeoJSON',
            'https://www.berlin.de/sen/web/service/maerkte-feste/wochen-troedelmaerkte/index.php/index/all.geojson?q=');
        console.log(`markets: fetching ${url}`);
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

    async demographics(db, dryRun) {
        let csv: string;
        if (process.env.DEMOGRAPHICS_CSV_FILE) {
            console.log(`demographics: reading ${process.env.DEMOGRAPHICS_CSV_FILE}`);
            csv = readFileSync(process.env.DEMOGRAPHICS_CSV_FILE, 'utf8');
        } else {
            const url = process.env.DEMOGRAPHICS_CSV_URL || await findDemographicsUrl() || DEFAULT_DEMOGRAPHICS_URL;
            assertAllowedHost(url);
            console.log(`demographics: fetching ${url}`);
            csv = await (await fetchOk(url)).text();
            if (/^\s*</.test(csv)) {
                throw new Error(`demographics: ${url} returned an HTML page instead of CSV; pass the direct CSV link via DEMOGRAPHICS_CSV_URL`);
            }
        }
        const rows = parseDemographicsCsv(csv);
        if (rows.length < MIN_DEMOGRAPHICS_ROWS) {
            // Show the start of the file so format changes can be diagnosed from the log
            console.error(`demographics: file starts with:\n${csv.slice(0, 600)}`);
            throw new Error(`demographics: only ${rows.length} planning areas parsed, expected at least ${MIN_DEMOGRAPHICS_ROWS}`);
        }

        // The table was created with `zeit` as primary key, which is the same for every
        // planning area, so only one row survived. Move the key to `raumid` (idempotent).
        const fixPrimaryKey = sql`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_index i
                    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                    WHERE i.indrelid = 'demographics'::regclass AND i.indisprimary AND a.attname = 'raumid'
                ) THEN
                    ALTER TABLE demographics DROP CONSTRAINT IF EXISTS demographics_pkey;
                    DELETE FROM demographics;
                    ALTER TABLE demographics ALTER COLUMN raumid SET NOT NULL;
                    ALTER TABLE demographics ADD PRIMARY KEY (raumid);
                END IF;
            END $$;`;

        await replaceTable(db, schema.demographics, rows, 'demographics', dryRun, fixPrimaryKey);
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

    const isLocal = ['localhost', '127.0.0.1'].includes(new URL(databaseUrl).hostname);
    const client = postgres(databaseUrl, { max: 1, ssl: isLocal ? false : 'require' });
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
