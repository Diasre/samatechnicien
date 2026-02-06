import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            // L'URL de redirection doit pointer vers la page de mise à jour du mot de passe
            // Assurez-vous que cette URL est autorisée dans les paramètres Supabase (Authentication -> URL Configuration -> Redirect URLs)
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            setMessage("Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            minHeight: '100vh', padding: '1rem', position: 'relative'
        }}>
            <Link to="/login" style={{ position: 'absolute', top: '20px', left: '20px', color: '#666', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Retour
            </Link>

            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex', padding: '1rem',
                        backgroundColor: 'rgba(24, 69, 165, 0.1)',
                        borderRadius: '50%', color: 'var(--primary-color)',
                        marginBottom: '1rem'
                    }}>
                        <Mail size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Mot de passe oublié ?</h2>
                    <p style={{ color: '#666' }}>Entrez votre email pour recevoir un lien de réinitialisation.</p>
                </div>

                {message && (
                    <div style={{
                        padding: '1rem', backgroundColor: '#d4edda',
                        color: '#155724', borderRadius: '8px',
                        marginBottom: '1.5rem', fontSize: '0.9rem'
                    }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '1rem', backgroundColor: '#f8d7da',
                        color: '#721c24', borderRadius: '8px',
                        marginBottom: '1.5rem', fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%', padding: '0.8rem', borderRadius: '8px',
                                border: '1px solid #ddd', fontSize: '1rem'
                            }}
                            placeholder="votre@email.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: 'bold' }}
                    >
                        {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
