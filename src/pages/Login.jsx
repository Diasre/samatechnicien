import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Lock, Eye, EyeOff, Mail, User, Phone, X, Delete, ChevronLeft } from 'lucide-react';

const Login = () => {
    const isMobile = window.innerWidth <= 768;
    const navigate = useNavigate();
    
    // State
    const [role, setRole] = useState('client');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.role === 'admin') {
                    navigate('/dashboard');
                } else if (parsedUser.role === 'technician') {
                    navigate('/expert-dashboard');
                } else {
                    navigate('/');
                }
            }
        } catch (e) {
            console.error('LocalStorage access denied:', e);
        }
    }, [navigate]);

    // Fonctions supprimées car PIN pad retiré

    const performLoginLogic = async () => {
        try {
            let userData = null;

                const phoneClean = phone.replace(/\s+/g, '').replace(/^\+221/, '').replace(/^\+/, '');
                
                if (phoneClean.length < 8) return alert("Veuillez entrer un numéro de téléphone valide.");
                if (password.length < 4) return alert("Veuillez entrer votre mot de passe.");

                // Recherche dans la table users par téléphone + mot de passe
                const { data: userRecords, error: findError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('phone', phoneClean)
                    .eq('password', password)
                    .limit(1);

                if (userRecords && userRecords.length > 0) {
                    userData = userRecords[0];
                } else {
                    // 🛡️ FALLBACK: Authentification Supabase par mail dummy ou email réel
                    const vEmail = `${phoneClean}@samatechnicien.dummy`;
                    const finalPassword = password.length === 4 ? password + "00" : password;
                    
                    const { data: authResult, error: mainErr } = await supabase.auth.signInWithPassword({
                        email: vEmail,
                        password: finalPassword
                    });

                    if (!authResult?.user) {
                        // On tente avec l'email si on en trouve un dans la base
                        const { data: dbUsers } = await supabase.from('users').select('email, id').eq('phone', phoneClean).limit(1);
                        const dbUser = dbUsers && dbUsers.length > 0 ? dbUsers[0] : null;
                        if (dbUser?.email) {
                            const { data: retry } = await supabase.auth.signInWithPassword({
                                email: dbUser.email,
                                password: finalPassword
                            });
                            userData = retry?.user ? (await supabase.from('users').select('*').eq('id', retry.user.id).limit(1)).data?.[0] : null;
                        }
                    } else if (authResult.user) {
                        const { data: syncData } = await supabase.from('users').select('*').eq('id', authResult.user.id).limit(1);
                        userData = syncData && syncData.length > 0 ? syncData[0] : null;
                    }
                }

                if (!userData) {
                    return alert("Identifiants incorrects. Vérifiez votre numéro ou votre mot de passe.");
                }

                // 🛡️ VÉRIFICATION STRICTE DU RÔLE
                if (userData.role !== role) {
                    const expectedRole = userData.role === 'technician' ? 'Technicien' : 'Client';
                    return alert(`Désolé, vous ne pouvez pas vous connecter en tant que ${role === 'technician' ? 'Technicien' : 'Client'}. Votre compte est enregistré en tant que ${expectedRole}. Veuillez changer d'onglet.`);
                }

            // Logic unifyied above

            if (userData.isblocked) return alert('Votre compte est bloqué.');

            const mappedUser = {
                ...userData,
                fullName: userData.fullname || userData.fullName,
                isBlocked: !!userData.isblocked,
                commentsEnabled: userData.commentsenabled !== 0
            };

            localStorage.setItem('user', JSON.stringify(mappedUser));
            
            if (mappedUser.role === 'admin') {
                navigate('/dashboard');
            } else if (mappedUser.role === 'technician') {
                navigate('/expert-dashboard');
            } else {
                navigate('/');
            }

        } catch (error) {
            console.error('Login error:', error);
            alert('Erreur lors de la connexion.');
        }
    };

    // Logique de connexion unifiée

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: `linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.6)), url('/light-bg.png')`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', color: '#1e293b', fontFamily: "'Outfit', sans-serif"
        }}>
            {/* Header Icon */}
            <div style={{ width: '60px', height: '60px', background: '#10b981', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', marginTop: '1rem', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' }}>
                <Lock size={30} strokeWidth={2.5} color="#fff" />
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '2rem', letterSpacing: '-1px', color: '#1e293b' }}>Connexion</h1>

            <div style={{ width: '100%', maxWidth: '380px' }}>
                
                {/* Role Switcher */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
                    <button 
                        onClick={() => setRole('client')}
                        style={{ flex: 1, padding: '0.8rem', borderRadius: '18px', border: `2px solid ${role === 'client' ? '#10b981' : 'rgba(255,255,255,0.8)'}`, background: role === 'client' ? '#10b981' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', color: role === 'client' ? '#fff' : '#1e293b', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.3s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                    >
                        <User size={18} /> Client
                    </button>
                    <button 
                        onClick={() => setRole('technician')}
                        style={{ flex: 1, padding: '0.8rem', borderRadius: '18px', border: `2px solid ${role === 'technician' ? '#10b981' : 'rgba(255,255,255,0.8)'}`, background: role === 'technician' ? '#10b981' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', color: role === 'technician' ? '#fff' : '#1e293b', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.3s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                    >
                        <Briefcase size={18} /> Technicien
                    </button>
                </div>

                <div style={{ animation: 'fadeIn 0.5s ease' }}>
                    <div style={{ position: 'relative', borderBottom: '2px solid #10b981', marginBottom: '2rem', paddingBottom: '0.8rem' }}>
                        <Phone size={20} style={{ position: 'absolute', left: '0', color: '#10b981' }} />
                        <input 
                            type="tel" value={phone} 
                            onChange={(e) => setPhone(e.target.value)}
                            style={{ width: '100%', paddingLeft: '2.5rem', background: 'transparent', border: 'none', color: '#1e293b', fontSize: '1.2rem', outline: 'none' }}
                            placeholder="77 000 00 00"
                        />
                    </div>

                    <div style={{ position: 'relative', borderBottom: '2px solid #10b981', marginBottom: '2.5rem', paddingBottom: '0.8rem' }}>
                        <Lock size={20} style={{ position: 'absolute', left: '0', color: '#10b981' }} />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            maxLength="4"
                            inputMode="numeric"
                            pattern="\d*"
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, ''); // Uniquement des chiffres
                                setPassword(val);
                            }}
                            style={{ width: '100%', paddingLeft: '2.5rem', background: 'transparent', border: 'none', color: '#1e293b', fontSize: '1.2rem', outline: 'none', letterSpacing: password ? '4px' : 'normal', fontWeight: '700' }}
                            placeholder="Code secret (4 chiffres)"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button 
                        onClick={performLoginLogic}
                        style={{ width: '100%', padding: '1.2rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}
                    >
                        Se connecter
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', marginBottom: '1rem', color: '#10b981' }}>Mot de passe oublié ?</p>
                    <p style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: '600' }}>
                        Pas encore de compte ? <Link to="/register" style={{ color: '#10b981', fontWeight: '900', textDecoration: 'none', borderBottom: '2px solid #10b981' }}>Inscription</Link>
                    </p>
                </div>

            </div>

            {/* Icons mapping needed for role switcher */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

// Generic briefcase icon since lucide might skip it in some builds
const Briefcase = ({ size, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
);

export default Login;
