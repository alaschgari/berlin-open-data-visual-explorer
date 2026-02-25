import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('business_by_lor')
            .select('*');

        if (error) {
            console.error('Error fetching business data:', error);
            return NextResponse.json({ error: 'Failed to load business data' }, { status: 500 });
        }

        // Convert back to the expected format
        const byLor: Record<string, any> = {};
        data.forEach(row => {
            byLor[row.lor_id] = row.data;
        });

        return NextResponse.json({ byLor });
    } catch (error) {
        console.error('Error fetching business data:', error);
        return NextResponse.json({ error: 'Failed to load business data' }, { status: 500 });
    }
}
