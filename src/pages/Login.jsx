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
    const [pin, setPin] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginMethod, setLoginMethod] = useState(isMobile ? 'pin' : 'email');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            navigate(parsedUser.role === 'admin' ? '/dashboard' : '/');
        }
    }, [navigate]);

    const handleNumberClick = (num) => {
        if (pin.length < 4) setPin(prev => prev + num);
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const performLoginLogic = async () => {
        try {
            let userData = null;

            if (loginMethod === 'pin') {
                // 🔐 LOGIN PAR TÉLÉPHONE + PIN
                const { data, error: pinError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('phone', phone.trim())
                    .eq('pin_code', pin)
                    .eq('role', role)
                    .single();

                if (pinError || !data) {
                    return alert("Téléphone ou Code PIN incorrect pour ce profil.");
                }
                userData = data;
            } else {
                // 🚀 LOGIN CLASSIQUE
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (authError) return alert(authError.message);

                const { data: dbUser } = await supabase.from('users').select('*').ilike('email', email).single();
                userData = dbUser;
            }

            if (userData.isblocked) return alert('Votre compte est bloqué.');

            const mappedUser = {
                ...userData,
                fullName: userData.fullname || userData.fullName,
                isBlocked: !!userData.isblocked,
                commentsEnabled: userData.commentsenabled !== 0
            };

            localStorage.setItem('user', JSON.stringify(mappedUser));
            navigate(mappedUser.role === 'admin' ? '/dashboard' : '/');

        } catch (error) {
            console.error('Login error:', error);
            alert('Erreur lors de la connexion.');
        }
    };

    // Auto-login on 4th PIN digit
    useEffect(() => {
        if (pin.length === 4 && loginMethod === 'pin' && phone.length >= 8) {
            performLoginLogic();
        }
    }, [pin]);

    const PinButton = ({ num }) => (
        <button 
            type="button"
            onClick={() => handleNumberClick(num)}
            style={{ 
                width: '65px', height: '65px', borderRadius: '50%', border: '2px solid #f1f5f9', 
                background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', color: '#1e293b', 
                fontSize: '1.5rem', fontWeight: '800', cursor: 'pointer', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}
            onMouseDown={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#fff'; }}
            onMouseUp={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; e.currentTarget.style.color = '#1e293b'; }}
        >
            {num}
        </button>
    );

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
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

                {isMobile ? (
                    /* Mobile PIN Login */
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ position: 'relative', borderBottom: '2px solid #10b981', marginBottom: '2.5rem', paddingBottom: '0.8rem' }}>
                            <Phone size={20} style={{ position: 'absolute', left: '0', color: '#10b981' }} />
                            <input 
                                type="tel" value={phone} 
                                onChange={(e) => setPhone(e.target.value)}
                                style={{ width: '100%', paddingLeft: '2.5rem', background: 'transparent', border: 'none', color: '#1e293b', fontSize: '1.2rem', outline: 'none' }}
                                placeholder="Téléphone"
                            />
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '1rem', color: '#64748b' }}>Code PIN</p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #10b981', background: pin.length > i ? '#10b981' : 'transparent', transition: 'all 0.2s' }} />
                                ))}
                            </div>
                        </div>

                        {/* PIN Pad */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', placeItems: 'center', marginBottom: '2rem' }}>
                            {[1, 7, 5, 0, 6, 9, 4, 3, 8, 2].map(num => (
                                <PinButton key={num} num={num} />
                            ))}
                            <div /> {/* Placeholder for alignment matching Jobalma layout */}
                            <button 
                                onClick={handleDelete}
                                style={{ width: '65px', height: '65px', borderRadius: '50%', border: 'none', background: 'transparent', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <Delete size={28} />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Desktop Email Login */
                    <form onSubmit={(e) => { e.preventDefault(); performLoginLogic(); }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#1e293b' }}>Email</label>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '15px', border: '2px solid #f1f5f9', outline: 'none', background: '#fff', color: '#333' }} placeholder="votre@mail.com" />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#1e293b' }}>Mot de passe</label>
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '15px', border: '2px solid #f1f5f9', outline: 'none', background: '#fff', color: '#333' }} placeholder="••••••••" />
                        </div>
                        <button type="submit" style={{ width: '100%', padding: '1.2rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer' }}>
                            Se connecter
                        </button>
                    </form>
                )}

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
