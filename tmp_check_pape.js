
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evqnhbefabzsxxdwfrlm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW5oYmVmYWJ6c3h4ZHdmcmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDIyNjYsImV4cCI6MjA4NTcxODI2Nn0.cGTqdQJd85h-tX-s0v1-H7Km6pl1Zyz_OzupM5lzAjY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPapeInTable() {
    console.log('🔍 Recherche de Pape Seck dans la table users...');
    
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', '778599649')
        .single();

    if (error) {
        console.error('❌ Pape Seck est INTROUVABLE dans la table users:', error.message);
        
        // Let's try to find him in auth.users via metadata if possible
        console.log('🔍 Vérification de la session auth...');
    } else {
        console.log('✅ Pape Seck est présent !');
        console.log('📊 Infos trouvées:', data);
    }
}

checkPapeInTable();
