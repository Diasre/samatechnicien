import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config';
import { Lock } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const performLogin = async (loginEmail, loginPin) => {
        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, password: loginPin })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Bienvenue ' + data.user.fullName + ' !');
                localStorage.setItem('user', JSON.stringify(data.user));

                if (data.user.role === 'admin') {
                    navigate('/dashboard');
                } else {
                    navigate('/');
                }
            } else {
                alert('Erreur: ' + (data.message || 'Identifiants incorrects'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erreur de connexion au serveur.');
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
                            {email.toLowerCase().trim() === 'diassecke@gmail.com' ? 'Mot de passe' : 'Code PIN (4 chiffres)'}
                        </label>
                        <input
                            type="password"
                            inputMode={email.toLowerCase().trim() === 'diassecke@gmail.com' ? 'text' : 'numeric'}
                            maxLength={email.toLowerCase().trim() === 'diassecke@gmail.com' ? undefined : 4}
                            value={password}
                            onChange={(e) => {
                                if (email.toLowerCase().trim() === 'diassecke@gmail.com') {
                                    setPassword(e.target.value);
                                } else {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 4) setPassword(val);
                                }
                            }}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                border: '1px solid #ddd', fontSize: '0.9rem', textAlign: 'center',
                                letterSpacing: email.toLowerCase().trim() === 'diassecke@gmail.com' ? '2px' : '8px',
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
