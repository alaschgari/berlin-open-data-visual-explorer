
import { supabase } from '../src/lib/supabase';

async function checkStatus() {
    console.log('--- Database Status Check ---');

    console.log('\nFinancial Records per Year (Exact Counts):');
    const targetYears = [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027];

    for (const year of targetYears) {
        const { count, error } = await supabase
            .from('financial_records')
            .select('*', { count: 'exact', head: true })
            .eq('year', year);

        if (error) {
            console.error(`Error for year ${year}:`, error);
        } else if (count && count > 0) {
            console.log(`${year}: ${count} records`);
        }
    }

    console.log('\nSubsidies count:');
    const { count, error: subError } = await supabase
        .from('subsidies')
        .select('*', { count: 'exact', head: true });

    if (subError) {
        console.error('Error fetching subsidies:', subError);
    } else {
        console.log(`Total subsidies: ${count}`);
    }

    // Check for title column existence by trying to select it
    console.log('\nChecking for title column:');
    const { error: columnError } = await supabase
        .from('financial_records')
        .select('title')
        .limit(1);

    if (columnError) {
        console.log('❌ title column seems to be missing or inaccessible:', columnError.message);
    } else {
        console.log('✅ title column exists.');
    }
}

checkStatus();
