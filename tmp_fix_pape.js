
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evqnhbefabzsxxdwfrlm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW5oYmVmYWJ6c3h4ZHdmcmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDIyNjYsImV4cCI6MjA4NTcxODI2Nn0.cGTqdQJd85h-tX-s0v1-H7Km6pl1Zyz_OzupM5lzAjY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPapePin() {
    console.log('🚀 Tentative de réparation de Pape Seck...');
    
    // 1. Connexion comme Pape
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
        email: 'pape@samatechnicien.dummy',
        password: 'PIN_1303_SamaTech221'
    });

    if (authError) {
        console.error('❌ Erreur de connexion auth:', authError.message);
        return;
    }

    console.log('✅ Connexion auth réussie ! ID:', auth.user.id);

    // 2. Mise à jour de son profil dans la table users
    const { error: updateError } = await supabase
        .from('users')
        .update({ 
            pin_code: '1303', 
            username: 'pape',
            fullname: 'Pape Seck', // re-ensure just in case
            role: 'technician'
        })
        .eq('id', auth.user.id);

    if (updateError) {
        console.error('❌ Erreur de mise à jour:', updateError.message);
    } else {
        console.log('✅ Pape Seck est RÉPARÉ ! Son PIN 1303 est maintenant actif.');
        console.log('📱 Il peut se connecter sur ton iPhone dès maintenant.');
    }
}

fixPapePin();
