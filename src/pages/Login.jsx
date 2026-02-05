import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { Lock } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const performLogin = async (loginEmail, loginPin) => {
        try {
            // Recherche de l'utilisateur par email (insensible à la casse)
            const { data: userData, error } = await supabase
                .from('users')
                .select('*')
                .ilike('email', loginEmail)
                .single();

            if (error || !userData) {
                alert('Erreur: Identifiants incorrects');
                return;
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
            let passwordValid = mappedUser.password === loginPin;

            // Admin Override (Hardcoded Security Bypass for specific admin email)
            if (loginEmail.toLowerCase() === 'diassecke@gmail.com' && loginPin === 'P@pepol123456') {
                passwordValid = true;
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

            alert('Bienvenue ' + mappedUser.fullName + ' !');

            if (mappedUser.role === 'admin') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Erreur de connexion.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        performLogin(email, password);
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
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
                    Pas de compte ? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none' }}>S'inscrire</Link>
                </p>
            </div>


        </div>
    );
};

export default Login;
