import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const revalidate = 86400; // 24 hours

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('demographics')
            .select('*');

        if (error) {
            console.error('Supabase error fetching demographics:', error);
            return NextResponse.json({ error: 'Failed to fetch demographics from database' }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'No demographics data found' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching demographics:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
