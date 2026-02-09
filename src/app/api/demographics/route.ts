import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import Papa from 'papaparse';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'data', 'raw', 'EWR_L21_202412E_Matrix.csv');
        const fileContents = await fs.readFile(filePath, 'utf8');

        const { data } = Papa.parse(fileContents, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true, // Automatically convert numbers
            delimiter: ';', // Explicitly set for German CSV
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading demographics CSV:', error);
        return NextResponse.json({ error: 'Failed to load demographics data' }, { status: 500 });
    }
}
