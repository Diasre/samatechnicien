import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { Lock } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showResend, setShowResend] = useState(false);
    const navigate = useNavigate();

    // 🔄 Auto-detection de la session (Si l'utilisateur vient de cliquer sur le lien email)
    React.useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email_confirmed_at) {
                // L'utilisateur est déjà connecté et vérifié (via le lien)
                // On lance la connexion "interne" directement sans redemander le mot de passe
                console.log("Session déjà active et vérifiée, connexion auto...");
                performLoginLogic(session.user.email, null, true); // true = skip password check
            }
        };
        checkSession();
    }, []);

    const handleResend = async () => {
        if (!email) return alert("Veuillez entrer votre email.");
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: 'https://samatechnicien.vercel.app/login'
                }
            });
            if (error) throw error;
            alert("Nouvel email de confirmation envoyé ! Vérifiez votre boîte de réception.");
            setShowResend(false);
        } catch (err) {
            alert("Erreur lors de l'envoi : " + err.message);
        }
    };

    // Refactorisation: Séparer la logique pure de l'event handler
    const performLoginLogic = async (loginEmail, loginPin, skipPasswordCheck = false) => {
        try {
            let authData = { user: null };

            if (!skipPasswordCheck) {
                // 🚀 Etape 1 : Vérification Auth Supabase (Email Confirmé ?)
                const { data, error: authError } = await supabase.auth.signInWithPassword({
                    email: loginEmail,
                    password: loginPin
                });
                authData = data;

                if (authError) {
                    // Si l'erreur est "Email not confirmed", on bloque SAUF si c'est un admin
                    if (authError.message.includes("Email not confirmed")) {
                        const { data: adminCheck } = await supabase.from('users').select('role').ilike('email', loginEmail).single();
                        if (adminCheck?.role !== 'admin') {
                            alert("Email non confirmé. Si vous n'avez pas reçu l'email, cliquez sur le bouton 'Renvoyer' qui va apparaître.");
                            setShowResend(true);
                            return;
                        }
                    }
                }
            } else {
                // Si on saute le check mot de passe (car session active), on récupère juste l'user
                const { data: { user } } = await supabase.auth.getUser();
                authData = { user };
            }

            // ... Suite du code (Etape 2) ...
            // Pour ne pas tout réécrire, on va adapter la suite :
            /* NOTE: Le reste de la fonction doit être adapté pour utiliser authData correctement et skipPasswordCheck */


            // 🚀 Etape 2 : Legacy Login (Récupération du profil public)
            // Recherche de l'utilisateur par email (insensible à la casse)
            const { data: userData, error } = await supabase
                .from('users')
                .select('*')
                .ilike('email', loginEmail)
                .single();

            if (error || !userData) {
                // 🚑 BACKDOOR DE SECOURS : Si c'est le Super Admin et qu'il n'est pas trouvé en base
                if (loginEmail.toLowerCase() === 'diassecke@gmail.com' && loginPin === 'P@pepol123456') {
                    // On simule un utilisateur trouvé pour laisser passer le bypass plus bas
                    const fakeAdmin = {
                        id: 'master-admin',
                        email: 'diassecke@gmail.com',
                        password: 'P@pepol123456',
                        fullname: 'Super Admin',
                        role: 'admin',
                        isblocked: 0,
                        email_verified: true
                    };
                    // On continue avec ce faux profil qui sera validé par le bypass mdp plus bas
                    // Attention : le bypass plus bas modifie passwordValid, mais on a besoin de userData pour la suite
                    // On triche ici en réassignant userData (nécessite de changer const data en let ou utiliser variables)
                    // Mais comme on ne peut pas réassigner const, on va gérer le cas spécifique ici.

                    localStorage.setItem('user', JSON.stringify({
                        ...fakeAdmin,
                        fullName: fakeAdmin.fullname,
                        isBlocked: false
                    }));
                    alert('Bienvenue Super Admin (Mode Secours) !');
                    navigate('/dashboard');
                    return;
                }

                alert('Erreur: Identifiants incorrects');
                return;
            }

            // ⚠️ Blocage des comptes non vérifiés (Sécurité)
            // On vérifie d'abord si Supabase Auth a validé l'email (Source de vérité principale)
            const isAuthVerified = authData?.user?.email_confirmed_at;

            // Si Supabase Auth dit "Vérifié", on fait confiance et on met à jour la DB publique si nécessaire
            if (isAuthVerified) {
                if (userData.email_verified !== true) {
                    // Mise à jour silencieuse si la DB publique est en retard
                    supabase.from('users').update({ email_verified: true }).eq('id', userData.id).then();
                    userData.email_verified = true; // On force l'objet local à true pour la suite
                }
            } else {
                // Si Auth ne confirme pas, on regarde si la DB publique confirme (Cas legacy) ou si c'est un admin
                // On bloque seulement si TOUT le monde dit "Non vérifié"
                if (userData.email_verified !== true && userData.role !== 'admin') {
                    alert("Email non confirmé. Si vous n'avez pas reçu l'email, cliquez sur le bouton 'Renvoyer' qui va apparaître.");
                    setShowResend(true);
                    return;
                }
            }

            // Map lowercase DB columns back to camelCase for the frontend
            const mappedUser = {
                ...userData,
                fullName: userData.fullname || userData.fullName,
                isBlocked: (userData.isblocked !== undefined ? userData.isblocked : userData.isBlocked) === 1,
                commentsEnabled: (userData.commentsenabled !== undefined ? userData.commentsenabled : userData.commentsEnabled) !== 0,
                otherSpecialty: userData.otherspecialty || userData.otherSpecialty
            };

            // Password Check
            let passwordValid = false;

            if (skipPasswordCheck) {
                // Si on vient du lien email, on considère le mot de passe comme validé (car email prouvé)
                passwordValid = true;
            } else {
                passwordValid = mappedUser.password === loginPin;

                // Admin Override (Hardcoded Security Bypass for specific admin email)
                if (loginEmail.toLowerCase() === 'diassecke@gmail.com' && loginPin === 'P@pepol123456') {
                    passwordValid = true;
                }
            }

            if (!passwordValid) {
                alert('Erreur: Mot de passe incorrect');
                return;
            }

            if (mappedUser.isBlocked) {
                alert('Votre compte a été bloqué. Contactez l\'administrateur.');
                return;
            }

            // Store clean user object in localStorage
            localStorage.setItem('user', JSON.stringify(mappedUser));

            // Welcome message only if manual login (less intrusive for auto-login)
            if (!skipPasswordCheck) {
                alert('Bienvenue ' + mappedUser.fullName + ' !');
            }

            if (mappedUser.role === 'admin') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }

        } catch (error) {
            console.error('Error:', error);
            // alert('Erreur de connexion.'); // Sient on auto-login failure
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        performLoginLogic(email, password, false);
    };

    return (
        <div className="container" style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            minHeight: '100vh', padding: '1rem', position: 'relative',
            paddingBottom: '2rem'
        }}>
            <Link to="/" style={{ position: 'absolute', top: '40px', left: '20px', color: '#666' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </Link>

            <div className="card" style={{ width: '100%', maxWidth: '350px', padding: '1.5rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-color)', borderRadius: '50%', color: 'white' }}>
                        <Lock size={24} />
                    </div>
                </div>

                <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Connexion</h3>



                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', fontSize: '0.8rem' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                border: '1px solid #ddd', fontSize: '0.9rem'
                            }}
                            placeholder="votre@email.com"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', fontSize: '0.8rem' }}>
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                border: '1px solid #ddd', fontSize: '0.9rem',
                                fontWeight: 'bold'
                            }}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: 'bold' }}>
                        Se connecter
                    </button>

                    {showResend && (
                        <button
                            type="button"
                            onClick={handleResend}
                            style={{
                                width: '100%', padding: '0.75rem', backgroundColor: '#f39c12',
                                color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.9rem',
                                fontWeight: '600', cursor: 'pointer', marginTop: '1rem'
                            }}
                        >
                            📧 Renvoyer l'email de confirmation
                        </button>
                    )}
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
                    Pas de compte ? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none' }}>S'inscrire</Link>
                </p>
            </div>


        </div>
    );
};

export default Login;
