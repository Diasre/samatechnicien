import { supabase } from './src/supabaseClient.js';

async function check() {
    const { data: cols, error: err } = await supabase.from('products').select('*').limit(1);
    if (err) {
        console.error(err);
        return;
    }
    console.log("Columns:", cols ? Object.keys(cols[0]) : "No data");
}
check();
