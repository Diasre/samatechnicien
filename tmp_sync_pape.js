
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evqnhbefabzsxxdwfrlm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW5oYmVmYWJ6c3h4ZHdmcmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDIyNjYsImV4cCI6MjA4NTcxODI2Nn0.cGTqdQJd85h-tX-s0v1-H7Km6pl1Zyz_OzupM5lzAjY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncPapeToTable() {
    console.log('🚀 Synchronisation de Pape Seck vers la table users...');
    
    const username = 'pape';
    const email = `${username}@samatechnicien.dummy`;

    const { data, error } = await supabase
        .from('users')
        .insert([
            {
                fullname: 'Pape Seck',
                phone: '778599649',
                role: 'technician',
                city: 'Dakar',
                district: 'Mbao',
                username: username,
                pin_code: '1303',
                email: email,
                specialty: 'Informatique',
                isblocked: 0, // Integer 0 instead of false
                commentsenabled: 1 // Integer 1
            }
        ]);

    if (error) {
        console.error('❌ Erreur lors de la synchronisation:', error.message);
    } else {
        console.log('✅ Pape Seck est maintenant synchronisé dans la table users !');
        console.log('📱 Il peut désormais se connecter sur mobile.');
    }
}

syncPapeToTable();
