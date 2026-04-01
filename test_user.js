import { supabase } from './src/supabaseClient.js';
async function test() {
    console.log("Checking user 776430900...");
    const { data, error } = await supabase.from('users').select('id, fullname, phone').eq('phone', '776430900');
    console.log("Result:", data, error);
}
test();
