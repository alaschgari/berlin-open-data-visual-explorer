import { supabase } from '../src/lib/supabase';

async function checkStatus() {
    console.log('--- Supabase Tables Status Check ---');

    const tables = ['demographics', 'lor_data', 'business_data', 'markets', 'financial_records'];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`${table}: ❌ Error - ${error.message} (${error.code})`);
        } else {
            console.log(`${table}: ✅ OK - Count: ${count}`);
        }
    }
}

checkStatus().catch(console.error);
