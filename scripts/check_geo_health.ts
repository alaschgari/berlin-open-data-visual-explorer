import { supabase } from '../src/lib/supabase';

async function checkGeoHealth() {
    console.log('Checking geographic data health...');

    // Total count
    const { count: total, error: totalError } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Count with valid lat/lng (non-null and non-zero)
    const { count: valid, error: validError } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .neq('lat', 0)
        .neq('lng', 0);

    if (validError) throw validError;

    console.log(`Total records: ${total}`);
    console.log(`Valid coordinates: ${valid}`);
    console.log(`Missing/Zero coordinates: ${(total || 0) - (valid || 0)}`);
    console.log(`Coverage: ${((valid || 0) / (total || 1) * 100).toFixed(2)}%`);
}

checkGeoHealth().catch(console.error);
