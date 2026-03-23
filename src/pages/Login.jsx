import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Lock, Eye, EyeOff, Mail, User } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [pinCode, setPinCode] = useState('');
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'pin'
    const [showPassword, setShowPassword] = useState(false);
    const [showResend, setShowResend] = useState(false);
    const navigate = useNavigate();

    const performLoginLogic = async (loginId, loginCredential, isPinLogin = false) => {
        try {
            let authData = { user: null };
            let userData = null;

            if (isPinLogin) {
                // 🔐 LOGIN PAR CODE PIN
                const { data, error: pinError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('username', loginId.toLowerCase().trim())
                    .eq('pin_code', loginCredential)
                    .single();

                if (pinError || !data) {
                    alert("Identifiant ou Code PIN incorrect.");
                    return;
                }
                userData = data;
            } else {
                // 🚀 LOGIN CLASSIQUE (Email + Password)
                const { data, error: authError } = await supabase.auth.signInWithPassword({
                    email: loginId,
                    password: loginCredential
                });
                authData = data;

                if (authError) {
                    if (authError.message.includes("Email not confirmed")) {
                        alert("Email non confirmé. Vérifiez votre boîte de réception.");
                        setShowResend(true);
                        return;
                    }
                    // Continue to legacy check...
                }

                const { data: dbUser, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .ilike('email', loginId)
                    .single();
                
                if (userError || !dbUser) {
                    alert("Identifiants incorrects.");
                    return;
                }
                userData = dbUser;
            }

            if (userData.isblocked) {
                alert('Votre compte est bloqué.');
                return;
            }

            // Normalisation pour le frontend
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

    const handleResend = async () => {
        if (!email) return alert("Entrez votre email.");
        const { error } = await supabase.auth.resend({ type: 'signup', email });
        if (error) alert(error.message);
        else alert("Email envoyé !");
    };

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem',
            background: 'radial-gradient(circle at center, #1a4d2e 0%, #0c2b1a 100%)'
        }}>
            <div style={{
                width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', borderRadius: '35px',
                backgroundColor: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ width: '70px', height: '70px', background: '#10b981', borderRadius: '20px', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Lock size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#111' }}>Connexion</h2>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Choisissez votre mode d'accès</p>
                </div>

                {/* Toggle */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '15px' }}>
                    <button onClick={() => setLoginMethod('email')} style={{ flex: 1, padding: '0.6rem', borderRadius: '12px', border: 'none', cursor: 'pointer', background: loginMethod === 'email' ? '#fff' : 'transparent', color: loginMethod === 'email' ? '#10b981' : '#64748b', fontWeight: 'bold' }}>
                        Email
                    </button>
                    <button onClick={() => setLoginMethod('pin')} style={{ flex: 1, padding: '0.6rem', borderRadius: '12px', border: 'none', cursor: 'pointer', background: loginMethod === 'pin' ? '#fff' : 'transparent', color: loginMethod === 'pin' ? '#10b981' : '#64748b', fontWeight: 'bold' }}>
                        Code PIN
                    </button>
                </div>

                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (loginMethod === 'email') performLoginLogic(email, password, false);
                    else performLoginLogic(username, pinCode, true);
                }}>
                    {loginMethod === 'email' ? (
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>Email</label>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '15px', border: '2px solid #eef2f1', outline: 'none' }} placeholder="moussa@mail.com" />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>Mot de passe</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '15px', border: '2px solid #eef2f1', outline: 'none' }} placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8' }}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>Identifiant mobile (@...)</label>
                                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '15px', border: '2px solid #eef2f1', outline: 'none' }} placeholder="ex: moussa221" />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>Code PIN (4 chiffres)</label>
                                <input type="password" maxLength="4" required value={pinCode} onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))} style={{ width: '100%', padding: '0.8rem', borderRadius: '15px', border: '2px solid #eef2f1', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '10px', outline: 'none' }} placeholder="XXXX" />
                            </div>
                        </>
                    )}

                    <button type="submit" style={{ width: '100%', padding: '1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 15px rgba(16, 185, 129, 0.3)' }}>
                        Se connecter
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
                    Pas de compte ? <Link to="/register" style={{ color: '#10b981', fontWeight: 'bold', textDecoration: 'none' }}>S'inscrire</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
