
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evqnhbefabzsxxdwfrlm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW5oYmVmYWJ6c3h4ZHdmcmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDIyNjYsImV4cCI6MjA4NTcxODI2Nn0.cGTqdQJd85h-tX-s0v1-H7Km6pl1Zyz_OzupM5lzAjY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPapeInTable() {
    console.log('🔍 Recherche FINALE de Pape Seck par son nom...');
    
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('fullname', '%Pape Seck%');

    if (error) {
        console.error('❌ Erreur:', error.message);
    } else {
        console.log('📊 Résultat de la recherche:', data);
    }
}

checkPapeInTable();
