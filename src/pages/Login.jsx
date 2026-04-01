import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Lock, Eye, EyeOff, User, Phone, QrCode, Smartphone, Download, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { isWeb, isNative } from '../utils/platform';
import logo from '../assets/logo.png';

const Login = () => {
    const navigate = useNavigate();
    
    // States communs
    const [role, setRole] = useState('client');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // States Mobile
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // States Web (QR Scan)
    const [sessionId, setSessionId] = useState('');
    const [sessionStatus, setSessionStatus] = useState('pending'); // 'pending', 'scanning', 'confirmed', 'error'

    // 🌐 LOGIQUE WEB (Génération du QR Code et attente du scan)
    const [qrError, setQrError] = useState('');

    const sessionIdRef = React.useRef(sessionId);
    useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

    useEffect(() => {
        let subscription = null;
        let pollingInterval = null;

        const setupQRLogin = async () => {
            try {
                setLoading(true);
                setSessionStatus('pending');
                setQrError('');
                
                // 1. On crée une nouvelle session (Action de base, doit normalement passer)
                const { data, error } = await supabase
                    .from('web_login_sessions')
                    .insert([{ status: 'pending' }])
                    .select()
                    .single();

                if (error) {
                    setQrError(`Erreur: ${error.message}`);
                    setSessionStatus('error');
                    return;
                }

                if (data) {
                    setSessionId(data.id);
                    sessionIdRef.current = data.id;
                    
                    // 2. TENTATIVE DE TEMPS RÉEL (Isolation contre SecurityError)
                    try {
                        subscription = supabase
                            .channel(`session-${data.id}`)
                            .on('postgres_changes', { 
                                event: 'UPDATE', 
                                schema: 'public', 
                                table: 'web_login_sessions',
                                filter: `id=eq.${data.id}` 
                            }, (payload) => {
                                const updated = payload.new;
                                if (updated.status === 'scanning') {
                                    setSessionStatus('scanning');
                                } else if (updated.status === 'confirmed' && updated.user_id) {
                                    setSessionStatus('confirmed');
                                    loginViaQR(updated.user_id);
                                }
                            })
                            .subscribe((status) => {
                                console.log("📡 Statut Realtime:", status);
                            });
                    } catch (subErr) {
                        console.warn("⚠️ Le navigateur bloque le temps réel (SecurityError), on bascule sur le Polling seul.", subErr);
                    }

                    // 3. SYSTÈME DE SECOURS (POLLING - TOUJOURS ACTIF)
                    pollingInterval = setInterval(async () => {
                        const currentId = sessionIdRef.current;
                        if (!currentId || sessionStatus === 'confirmed') return;

                        const { data: remoteData } = await supabase
                            .from('web_login_sessions')
                            .select('status, user_id')
                            .eq('id', currentId)
                            .maybeSingle();

                        if (remoteData && remoteData.status === 'confirmed' && remoteData.user_id) {
                            console.log("✅ Connexion détectée via Polling !");
                            clearInterval(pollingInterval);
                            setSessionStatus('confirmed');
                            loginViaQR(remoteData.user_id);
                        }
                    }, 3000);
                }
            } catch (err) {
                console.error('💥 Échec QR:', err);
                setQrError(`Erreur Génétique: ${err.name} - ${err.message}`);
                setSessionStatus('error');
            } finally {
                setLoading(false);
            }
        };

        if (isWeb) {
            setupQRLogin();
        }

        return () => {
            if (pollingInterval) clearInterval(pollingInterval);
            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, [isWeb]);

    const loginViaQR = async (userId) => {
        setLoading(true);
        try {
            console.log("🧩 Synchronisation forcée pour ID:", userId);
            
            // 1. On récupère toutes les informations utilisateur
            const { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            
            if (fetchError) throw fetchError;

            if (userData) {
                console.log("✅ Utilisateur identifié !");
                setSessionStatus('confirmed');

                // 2. Préparation du profil pour le stockage local
                const mappedUser = { 
                    ...userData, 
                    fullName: userData.fullname || userData.full_name || userData.fullName || "Utilisateur",
                    role: userData.role || 'client'
                };

                // 3. Stockage des informations
                localStorage.setItem('user', JSON.stringify(mappedUser));

                // 4. Redirection forcée (Hard Reload) vers le bon dashboard
                setTimeout(() => {
                    if (mappedUser.role === 'admin') window.location.href = '/dashboard';
                    else if (mappedUser.role === 'technician') window.location.href = '/expert-dashboard';
                    else window.location.href = '/';
                }, 1000);
            } else {
                setQrError("Profil introuvable en base. Veuillez réessayer.");
                setSessionStatus('error');
            }
        } catch (e) {
            console.error("💥 Erreur login QR:", e);
            setQrError(`Erreur: ${e.message}`);
            setSessionStatus('error');
        } finally {
            setLoading(false);
        }
    };

    // 📱 LOGIQUE MOBILE (Connexion Classique)
    const performLoginLogic = async () => {
        if (loading) return;
        if (!phone.trim() || !password.trim()) {
            setErrorMsg("⚠️ Numéro et code secret requis.");
            return;
        }

        setErrorMsg('');
        setLoading(true);
        
        try {
            await supabase.auth.signOut({ scope: 'local' });
            localStorage.clear();

            let digits = phone.trim().replace(/\D/g, '');
            if (digits.startsWith('221') && digits.length > 9) digits = digits.substring(3);
            const fullPhone = `+221${digits}`;

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                phone: fullPhone,
                password: password.trim() + '00'
            });

            if (authError) {
                alert("❌ Téléphone ou Code secret incorrect.");
                setLoading(false);
                return;
            }

            loginViaQR(authData.user.id);

        } catch (err) {
            setErrorMsg(`⚠️ ${err.message}`);
            setLoading(false);
        }
    };

    // --- 📱 RENDU MOBILE BROWSER (Forcer le téléchargement) ---
    const isMobileBrowser = !isNative && window.innerWidth <= 768;

    if (isMobileBrowser) {
        return (
            <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}>
                <div style={{ width: '100px', height: '100px', background: '#ecfdf5', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                    <Download size={50} color="#10b981" />
                </div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e293b', marginBottom: '1rem' }}>Utilisez l'application SamaTechnicien</h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '3rem', maxWidth: '300px' }}>
                    Pour une sécurité optimale, la connexion sur mobile se fait uniquement via notre application officielle.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '300px' }}>
                    <button style={{ padding: '1.2rem', borderRadius: '20px', background: '#1e293b', color: '#fff', border: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', cursor: 'pointer' }}>
                        <Smartphone size={20} /> Télécharger sur Android
                    </button>
                    <button style={{ padding: '1.2rem', borderRadius: '20px', background: '#f1f5f9', color: '#1e293b', border: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
                        iOS (Bientôt disponible)
                    </button>
                </div>

                <div style={{ marginTop: '4rem' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Déjà sur l'application ?</p>
                    <button onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: '700', marginTop: '5px' }}>Rafraîchir la page</button>
                </div>
            </div>
        );
    }

    // --- 💻 RENDU WEB DESKTOP (Scanner le code QR) ---
    if (isWeb) {
        return (
            <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: "'Outfit', sans-serif" }}>
                <div style={{ maxWidth: '900px', width: '100%', display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', gap: '30px', background: '#fff', padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
                    
                    {/* Colonne de gauche : Instructions */}
                    <div style={{ textAlign: 'left' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1e293b', marginBottom: '20px', letterSpacing: '-1px' }}>Connectez-vous avec votre smartphone</h1>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginTop: '40px' }}>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#10b981' }}>1</div>
                                <p style={{ fontSize: '1.1rem', color: '#64748b' }}>Ouvrez l'application <b>SamaTechnicien</b> sur votre téléphone.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#10b981' }}>2</div>
                                <p style={{ fontSize: '1.1rem', color: '#64748b' }}>Allez sur votre profil et appuyez sur <br/><b style={{ color: '#10b981' }}>Connecter PC</b>.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#10b981' }}>3</div>
                                <p style={{ fontSize: '1.1rem', color: '#64748b' }}>Scannez ce code QR pour une connexion instantanée.</p>
                            </div>
                        </div>

                        <div style={{ marginTop: '50px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '10px' }}>L'application mobile est plus rapide et plus sûre.</p>
                        </div>
                    </div>

                    {/* Colonne de droite : QR Code */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '24px', padding: '40px', border: '2px dashed #e2e8f0' }}>
                        {sessionStatus === 'confirmed' ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
                                    <CheckCircle2 size={60} color="#10b981" />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Connexion réussie !</h3>
                                <p style={{ color: '#64748b' }}>Préparation de votre tableau de bord...</p>
                            </div>
                        ) : sessionStatus === 'error' ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
                                    <Smartphone size={60} color="#ef4444" />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ef4444' }}>Erreur de connexion</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>{qrError || "Impossible de générer le code QR. Vérifiez votre connexion."}</p>
                                <button 
                                    onClick={() => window.location.reload()} 
                                    style={{ padding: '0.8rem 1.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '800', cursor: 'pointer' }}
                                >
                                    Réessayer
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={{ position: 'relative', padding: '15px', background: '#fff', borderRadius: '25px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}>
                                    {sessionId ? (
                                        <QRCodeSVG 
                                            value={sessionId} 
                                            size={260} 
                                            level="H" 
                                            includeMargin={true}
                                            imageSettings={{
                                                src: logo,
                                                x: undefined,
                                                y: undefined,
                                                height: 50,
                                                width: 50,
                                                excavate: true,
                                            }}
                                        />
                                    ) : (
                                        <div style={{ width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <Loader2 className="animate-spin" size={40} color="#10b981" />
                                                <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#64748b' }}>Génération...</p>
                                            </div>
                                        </div>
                                    )}
                                    {sessionStatus === 'scanning' && (
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '25px' }}>
                                            <Loader2 className="animate-spin" size={50} color="#10b981" />
                                            <p style={{ marginTop: '15px', fontWeight: '800', color: '#1e293b' }}>Scan validé...</p>
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: '25px', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem' }}>
                                    <Loader2 size={14} className="animate-spin" />
                                    En attente du scan de votre téléphone...
                                </div>
                                
                                <div style={{ marginTop: '25px', padding: '10px 20px', background: '#f1f5f9', borderRadius: '12px' }}>
                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700', color: '#1e293b' }}>Confidentialité garantie 🔒</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- 📱 RENDU MOBILE APP NATIVE (Formulaire classique de ton image) ---
    return (
        <div style={{ minHeight: '100vh', background: `linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.6)), url('/light-bg.png')`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>
            <div style={{ width: '60px', height: '60px', background: '#10b981', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' }}>
                <Lock size={30} strokeWidth={2.5} color="#fff" />
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '2rem', letterSpacing: '-1px' }}>Connexion</h1>

            <div style={{ width: '100%', maxWidth: '380px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
                    <button onClick={() => setRole('client')} style={{ flex: 1, padding: '0.8rem', borderRadius: '18px', border: `2px solid ${role === 'client' ? '#10b981' : 'transparent'}`, background: role === 'client' ? '#10b981' : '#fff', color: role === 'client' ? '#fff' : '#1e293b', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>Client</button>
                    <button onClick={() => setRole('technician')} style={{ flex: 1, padding: '0.8rem', borderRadius: '18px', border: `2px solid ${role === 'technician' ? '#10b981' : 'transparent'}`, background: role === 'technician' ? '#10b981' : '#fff', color: role === 'technician' ? '#fff' : '#1e293b', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>Technicien</button>
                </div>

                <div style={{ position: 'relative', borderBottom: '2px solid #10b981', marginBottom: '2rem', paddingBottom: '0.8rem', display: 'flex', alignItems: 'center' }}>
                    <Phone size={20} style={{ position: 'absolute', left: '0', color: '#10b981' }} />
                    <span style={{ position: 'absolute', left: '2rem', fontWeight: '900', fontSize: '1.2rem' }}>+221</span>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', paddingLeft: '5.5rem', background: 'transparent', border: 'none', fontSize: '1.2rem', outline: 'none', fontWeight: '700' }} placeholder="77 000 00 00" />
                </div>

                <div style={{ position: 'relative', borderBottom: '2px solid #10b981', marginBottom: '2.5rem', paddingBottom: '0.8rem' }}>
                    <Lock size={20} style={{ position: 'relative', top: '10px', color: '#10b981' }} />
                    <input type={showPassword ? "text" : "password"} value={password} maxLength="4" onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', paddingLeft: '2.5rem', background: 'transparent', border: 'none', fontSize: '1.2rem', outline: 'none', fontWeight: '700', letterSpacing: password ? '4px' : 'normal' }} placeholder="Code secret" />
                    <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 0, top: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>

                <button onClick={performLoginLogic} disabled={loading} style={{ width: '100%', padding: '1.2rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}>
                    {loading ? 'Connexion en cours...' : 'Se connecter'}
                </button>
            </div>
        </div>
    );
};

export default Login;
