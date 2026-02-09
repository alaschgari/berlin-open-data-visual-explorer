
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { parse } from 'papaparse';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lorId = searchParams.get('lorId');

    if (!lorId) {
        return NextResponse.json({ error: 'lorId is required' }, { status: 400 });
    }

    try {
        const filePath = path.join(process.cwd(), 'data/raw', 'IHKBerlin_Gewerbedaten.csv');
        const fileStream = fs.createReadStream(filePath);

        const results: any[] = [];

        return new Promise((resolve) => {
            parse(fileStream, {
                header: true,
                skipEmptyLines: true,
                step: (row) => {
                    const data: any = row.data;
                    if (data.planungsraum_id === lorId) {
                        results.push({
                            id: data.opendata_id,
                            city: data.city,
                            postcode: data.postcode,
                            employees: data.employees_range,
                            branch: data.ihk_branch_desc || '',
                            type: data.business_type,
                            age: data.business_age,
                            planungsraum: data.Planungsraum,
                            lat: parseFloat(data.latitude),
                            lng: parseFloat(data.longitude)
                        });
                    }
                },
                complete: () => {
                    resolve(NextResponse.json(results));
                },
                error: (error: any) => {
                    console.error('Error parsing business details:', error);
                    resolve(NextResponse.json({ error: 'Failed to parse business details' }, { status: 500 }));
                }
            });
        });
    } catch (error) {
        console.error('Error reading business details:', error);
        return NextResponse.json({ error: 'Failed to load business details' }, { status: 500 });
    }
}
