
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { parse } from 'papaparse';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '500');

    const districtId = searchParams.get('districtId');

    if (!query) {
        return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    try {
        const filePath = path.join(process.cwd(), 'data/raw', 'IHKBerlin_Gewerbedaten.csv');
        const fileStream = fs.createReadStream(filePath);

        const results: any[] = [];
        const lorCounts: Record<string, number> = {};
        const lowercaseQuery = query.toLowerCase();

        return new Promise<NextResponse>((resolve) => {
            parse(fileStream, {
                header: true,
                skipEmptyLines: true,
                step: (row) => {
                    const data: any = row.data;
                    const branch = (data.ihk_branch_desc || '').toLowerCase();

                    if (branch.includes(lowercaseQuery)) {
                        const lorId = data.planungsraum_id;
                        lorCounts[lorId] = (lorCounts[lorId] || 0) + 1;

                        // Check if we should add this point to results
                        // If districtId is provided, ONLY add points from that district
                        // If no districtId, add points until limit
                        const matchesDistrict = !districtId || (lorId && lorId.startsWith(districtId));

                        if (matchesDistrict && results.length < limit) {
                            results.push({
                                id: data.opendata_id,
                                lat: parseFloat(data.latitude),
                                lng: parseFloat(data.longitude),
                                branch: data.ihk_branch_desc,
                                employees: data.employees_range,
                                type: data.business_type,
                                age: data.business_age,
                                city: data.city,
                                postcode: data.postcode,
                                lorId: data.planungsraum_id
                            });
                        }
                    }
                },
                complete: () => {
                    resolve(NextResponse.json({
                        points: results,
                        lorCounts: lorCounts,
                        totalMatched: Object.values(lorCounts).reduce((a, b) => a + b, 0)
                    }));
                },
                error: (error: any) => {
                    console.error('Error searching businesses:', error);
                    resolve(NextResponse.json({ error: 'Failed to search businesses' }, { status: 500 }));
                }
            });
        });
    } catch (error) {
        console.error('Error reading business data:', error);
        return NextResponse.json({ error: 'Failed to load business data' }, { status: 500 });
    }
}
