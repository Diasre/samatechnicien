
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evqnhbefabzsxxdwfrlm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW5oYmVmYWJ6c3h4ZHdmcmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDIyNjYsImV4cCI6MjA4NTcxODI2Nn0.cGTqdQJd85h-tX-s0v1-H7Km6pl1Zyz_OzupM5lzAjY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findMissingUser() {
    console.log('🔍 Recherche de n\'importe quel utilisateur créé aujourd\'hui...');
    
    // On cherche les utilisateurs les plus récents
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❌ Erreur:', error.message);
    } else {
        console.log('📊 Les 10 plus récents:', data);
    }
}

findMissingUser();
