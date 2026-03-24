
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evqnhbefabzsxxdwfrlm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW5oYmVmYWJ6c3h4ZHdmcmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDIyNjYsImV4cCI6MjA4NTcxODI2Nn0.cGTqdQJd85h-tX-s0v1-H7Km6pl1Zyz_OzupM5lzAjY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testForceInsert() {
    console.log('🚀 Test de FORÇAGE sur la table users...');
    
    const testId = 'test_' + Date.now();
    const { data, error } = await supabase
        .from('users')
        .insert([{
            id: testId,
            fullname: 'TEST AGENT AGV',
            phone: '000000000',
            role: 'technician',
            pin_code: '1234',
            city: 'Dakar',
            district: 'Plateau',
            isblocked: 0
        }]);

    if (error) {
        console.error('❌ ECHEC DU TEST:', error.message);
    } else {
        console.log('✅ REUSSITE DU TEST ! La base accepte les nouveaux techniciens.');
        console.log('📊 Indice : Si ce test réussit, c\'est ton mobile qui a besoin d\'être redémarré proprement.');
    }
}

testForceInsert();
