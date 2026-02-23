import { NextResponse } from 'next/server';

const API_KEY = process.env.TELRAAM_API_KEY || 'hqvwl9UGykatsZvxCRIMJ9oDO692JuPu4h7zbJrV'; // Fallback for demo
const BASE_URL = 'https://telraam-api.net/v1';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const segment_id = searchParams.get('segment_id');

    if (!segment_id) {
        return NextResponse.json({ error: 'Segment ID is required' }, { status: 400 });
    }

    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7); // Last 7 days

        // Format dates as YYYY-MM-DD HH:MM:SS (UTC)
        const formatTime = (date: Date) => date.toISOString().replace('T', ' ').split('.')[0];

        const response = await fetch(`${BASE_URL}/reports/traffic`, {
            method: 'POST',
            headers: {
                'X-Api-Key': API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                level: 'segments',
                format: 'per-hour',
                id: segment_id,
                time_start: formatTime(startDate),
                time_end: formatTime(endDate),
            }),
            next: { revalidate: 3600 } // 1 hour cache
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Telraam API Error:', errorText);
            throw new Error(`Telraam API responded with ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching traffic history:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
