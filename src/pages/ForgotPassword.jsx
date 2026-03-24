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
            <Link to="/login" style={{ position: 'absolute', top: '20px', left: '20px', color: '#666', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 'bold' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Retour
            </Link>

            <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', borderRadius: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex', padding: '1rem',
                        backgroundColor: '#10b98120',
                        borderRadius: '20px', color: '#10b981',
                        marginBottom: '1rem'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '0.5rem', color: '#1e293b', letterSpacing: '-0.5px' }}>Code oublié ?</h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.4' }}>Ne vous inquiétez pas, choisissez une option pour récupérer l'accès à votre compte.</p>
                </div>

                {/* OPTION 1: WhatsApp Support (Recommended) */}
                <div style={{ padding: '1.25rem', backgroundColor: '#e8f5e9', borderRadius: '20px', border: '1px solid #c8e6c9', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '0.5rem', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         Besoin d'aide immédiate ?
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#4caf50', marginBottom: '1rem', fontWeight: '500' }}>
                        Cliquez ici pour contacter le support technique via WhatsApp et réinitialiser votre compte en 2 minutes.
                    </p>
                    <a 
                        href={`https://wa.me/221778599649?text=${encodeURIComponent("Bonjour SamaTechnicien, j'ai oublié mon code secret. Pouvez-vous m'aider ? Mon numéro est : ")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ 
                            width: '100%', 
                            padding: '1rem', 
                            backgroundColor: '#25D366', 
                            color: 'white', 
                            fontWeight: 'bold', 
                            borderRadius: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            textDecoration: 'none'
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        Aide via WhatsApp
                    </a>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', color: '#cbd5e1' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>OU PAR EMAIL</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                </div>

                {message && (
                    <div style={{
                        padding: '1rem', backgroundColor: '#d1fae5',
                        color: '#065f46', borderRadius: '15px',
                        marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 'bold',
                        textAlign: 'center', border: '1px solid #10b981'
                    }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '1rem', backgroundColor: '#fef2f2',
                        color: '#991b1b', borderRadius: '15px',
                        marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 'bold',
                        textAlign: 'center', border: '1px solid #ef4444'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>Adresse Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '15px',
                                border: '2px solid #f1f5f9', fontSize: '1rem',
                                color: '#1e293b', outline: 'none', transition: 'all 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#10b981'}
                            onBlur={(e) => e.target.style.borderColor = '#f1f5f9'}
                            placeholder="votre@email.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn"
                        style={{ 
                            width: '100%', 
                            padding: '1.1rem', 
                            fontSize: '1.1rem', 
                            fontWeight: '900',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '15px',
                            cursor: 'pointer',
                            boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)'
                        }}
                    >
                        {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
