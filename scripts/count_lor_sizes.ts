import { supabase } from '../src/lib/supabase';

async function run() {
    const { data, error } = await supabase
        .from('businesses')
        .select('lor_id');

    if (error) {
        console.error(error);
        return;
    }

    const counts: Record<string, number> = {};
    data.forEach(item => {
        counts[item.lor_id] = (counts[item.lor_id] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    console.log('Top LORs by business count:');
    sorted.slice(0, 10).forEach(([id, count]) => {
        console.log(`LOR ${id}: ${count}`);
    });
}
run();
