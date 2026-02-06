import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Lock } from 'lucide-react';

const UpdatePassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Vérifier si l'utilisateur est bien authentifié (ce qui arrive après avoir cliqué sur le lien magic)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Si pas de session, rediriger vers login (le lien a peut-être expiré)
                navigate('/login');
            }
        };
        checkSession();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        if (password.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            alert("Mot de passe mis à jour avec succès ! Vous allez être redirigé vers la connexion.");
            await supabase.auth.signOut(); // Déconnecter pour qu'il se reconnecte avec le nouveau mdp
            navigate('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            minHeight: '100vh', padding: '1rem'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex', padding: '1rem',
                        backgroundColor: 'rgba(24, 69, 165, 0.1)',
                        borderRadius: '50%', color: 'var(--primary-color)',
                        marginBottom: '1rem'
                    }}>
                        <Lock size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Nouveau mot de passe</h2>
                    <p style={{ color: '#666' }}>Entrez votre nouveau mot de passe ci-dessous.</p>
                </div>

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
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nouveau mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '0.8rem', borderRadius: '8px',
                                border: '1px solid #ddd', fontSize: '1rem'
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Confirmer le mot de passe</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '0.8rem', borderRadius: '8px',
                                border: '1px solid #ddd', fontSize: '1rem'
                            }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: 'bold' }}
                    >
                        {loading ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UpdatePassword;
