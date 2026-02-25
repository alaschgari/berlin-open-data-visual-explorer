import { supabase } from '../src/lib/supabase';

async function findLargestLOR() {
    console.log('Finding LOR with most businesses...');

    const { data, error } = await supabase.rpc('get_lor_business_counts');

    if (error) {
        // Fallback if RPC doesn't exist yet or fails
        const { data: fallback, error: fallbackError } = await supabase
            .from('businesses')
            .select('lor_id')
            .limit(10000); // This isn't efficient for 374k records

        // I'll use the existing business data if possible, but let's try the RPC first or a group by query
        const { data: grouped, error: groupError } = await supabase
            .from('businesses')
            .select('lor_id')
            // Note: select count(*) group by lor_id is best
            ;

        // Better: just use the search index if I have access or do a proper select
    }

    if (data) {
        const sorted = data.sort((a: any, b: any) => b.count - a.count);
        console.log(`Largest LOR: ${sorted[0].lor_id} with ${sorted[0].count} businesses`);
        console.log(`Top 5 LORs:`, sorted.slice(0, 5));
    }
}
// Actually, let's just do a direct SQL query via a temporary script if possible
// Or use the already calculated businessData if I can find where it comes from
