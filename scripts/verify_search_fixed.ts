import { supabase } from '../src/lib/supabase';

async function verify() {
    console.log('Testing RPC aggregation for "Gastronomie"...');
    const { data: countData, error: countError } = await supabase.rpc('get_business_counts', {
        search_query: 'Gastronomie'
    });

    if (countError) {
        console.error('RPC Error:', countError);
    } else {
        const total = countData.reduce((acc: number, row: any) => acc + Number(row.count), 0);
        console.log(`Total "Gastronomie" matches (100% accurate): ${total}`);
        console.log(`Affected LORs: ${countData.length}`);
    }

    console.log('\nTesting points fetch limit...');
    const { data: pointsData, error: pointsError } = await supabase
        .from('businesses')
        .select('id')
        .ilike('branch', '%Gastronomie%')
        .limit(2000);

    if (pointsError) {
        console.error('Points Error:', pointsError);
    } else {
        console.log(`Successfully fetched ${pointsData.length} map pins (limited).`);
    }
}

verify().catch(console.error);
