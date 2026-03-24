
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evqnhbefabzsxxdwfrlm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW5oYmVmYWJ6c3h4ZHdmcmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDIyNjYsImV4cCI6MjA4NTcxODI2Nn0.cGTqdQJd85h-tX-s0v1-H7Km6pl1Zyz_OzupM5lzAjY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function registerPapeProperly() {
    console.log('🚀 Tentative d\'inscription COMPLÈTE de Pape Seck...');
    
    const username = 'pape';
    const email = `${username}@samatechnicien.dummy`;
    const password = `PIN_1303_SamaTech221`;

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: 'Pape Seck',
                phone: '778599649',
                role: 'technician',
                city: 'Dakar',
                district: 'Mbao',
                username: username,
                pin_code: '1303',
                specialty: 'Informatique'
            }
        }
    });

    if (error) {
        console.error('❌ Erreur lors de l\'inscription:', error.message);
    } else {
        console.log('✅ Inscription auth réussie !');
        console.log('📱 Vérifie maintenant si Pape peut se connecter sur ton iPhone.');
    }
}

registerPapeProperly();
