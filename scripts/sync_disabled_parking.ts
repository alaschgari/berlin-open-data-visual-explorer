import dotenv from 'dotenv';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL!;
if (!databaseUrl) {
    console.error('DATABASE_URL is not defined in .env.local');
    process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

async function syncDisabledParking() {
    console.log('Fetching Behindertenparkplätze data from WFS...');
    
    // WFS endpoint demanding GeoJSON (application/json)
    const url = 'https://gdi.berlin.de/services/wfs/behindertenparkplaetze?service=wfs&version=2.0.0&request=GetFeature&typeNames=behindertenparkplaetze:bpark&outputFormat=application/json';
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        
        const geojson: any = await response.json();
        const features = geojson.features || [];
        console.log(`Fetched ${features.length} parking spaces.`);
        
        if (features.length === 0) {
            console.log('No features found to import.');
            return;
        }

        // Parse and prepare records
        const records = features.map((feature: any, idx: number) => {
            const id = feature.id || `parking_${idx}`;
            return {
                id: String(id),
                geometry: feature.geometry,
                properties: feature.properties,
            };
        });

        console.log('Clearing existing records from disabled_parking_spaces...');
        await db.delete(schema.disabledParkingSpaces);

        console.log('Inserting new records into database...');
        // Insert in chunks of 500
        const CHUNK_SIZE = 500;
        for (let i = 0; i < records.length; i += CHUNK_SIZE) {
            const chunk = records.slice(i, i + CHUNK_SIZE);
            await db.insert(schema.disabledParkingSpaces).values(chunk);
            console.log(`Inserted chunk ${i / CHUNK_SIZE + 1} (${chunk.length} items)...`);
        }

        console.log('Sync completed successfully!');
    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

syncDisabledParking();
