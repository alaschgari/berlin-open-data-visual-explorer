import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../src/db/schema';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Neon Setup
const databaseUrl = process.env.DATABASE_URL!;
const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

async function migrateTable(tableName: string, drizzleTable: any, transform?: (row: any) => any) {
    console.log(`\nMigrating table: ${tableName}...`);
    
    const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error(`Error counting ${tableName}:`, countError);
        return;
    }

    const total = count || 0;
    console.log(`Total records to migrate: ${total}`);

    const CHUNK_SIZE = 1000;
    for (let i = 0; i < total; i += CHUNK_SIZE) {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .range(i, i + CHUNK_SIZE - 1);

        if (error) {
            console.error(`Error fetching chunk ${i}-${i + CHUNK_SIZE}:`, error);
            continue;
        }

        if (data && data.length > 0) {
            const transformedData = data.map(row => {
                const cleanedRow = transform ? transform(row) : { ...row };
                if (cleanedRow.created_at) cleanedRow.created_at = new Date(cleanedRow.created_at);
                return cleanedRow;
            });
            
            try {
                await db.insert(drizzleTable).values(transformedData).onConflictDoNothing();
                process.stdout.write(`\rMigrated ${Math.min(i + data.length, total)}/${total}`);
            } catch (insertError) {
                console.error(`\nError inserting batch ${i}:`, insertError);
            }
        }
    }
    console.log('\nDone.');
}

async function main() {
    console.log('Starting Master Migration from Supabase to Neon...');

    // 1. Setup Postgres Function for Business Search
    try {
        await sql`
            CREATE OR REPLACE FUNCTION get_business_counts(search_query text, district_filter text DEFAULT NULL)
            RETURNS TABLE (lor_id text, count bigint) AS $$
            BEGIN
                RETURN QUERY
                SELECT b.lor_id, COUNT(*) as count
                FROM businesses b
                WHERE b.branch ILIKE '%' || search_query || '%'
                  AND (district_filter IS NULL OR b.lor_id LIKE district_filter || '%')
                GROUP BY b.lor_id;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
        `;
    } catch (e) { console.warn('Function error:', e); }

    // 2. Migrate Core Tables
    await migrateTable('subsidies', schema.subsidies);
    await migrateTable('financial_records', schema.financialRecords);
    await migrateTable('businesses', schema.businesses);
    
    // 3. Migrate Metadata Tables
    await migrateTable('business_by_lor', schema.businessByLor);
    await migrateTable('demographics', schema.demographics, (row) => {
        // Demographics has many columns, but we can store them in 'data' jsonb as well
        // Drizzle schema has some defined, let's map them
        return {
            zeit: row.ZEIT,
            raumid: row.RAUMID,
            bez: row.BEZ,
            pgr: row.PGR,
            bzr: row.BZR,
            plr: row.PLR,
            bezpgr: row.BEZPGR,
            e_e: row.E_E,
            e_em: row.E_EM,
            e_ew: row.E_EW,
            data: row // Store full row in JSONB too
        };
    });
    
    await migrateTable('lor_data', schema.lorData, (row) => ({
        id: row.plr_id || row.properties?.PLR_ID || 'unknown',
        geometry: row.geometry,
        properties: row.properties
    }));
    
    await migrateTable('markets', schema.markets);

    console.log('\nAll Migrations Complete! 🎉');
}

main().catch(console.error);
