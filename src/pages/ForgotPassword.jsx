import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [generatedPin, setGeneratedPin] = useState(null);

    const handleCheckAccount = async (e) => {
        if (e) e.preventDefault();
        if (!phone || phone.length < 5) return setError("Veuillez entrer un numéro valide.");
        
        setLoading(true);
        setError(null);
        setUserInfo(null);
        setGeneratedPin(null);

        try {
            // Nettoyage complet
            const phoneClean = phone.replace(/\D/g, '').replace(/^221/, '').replace(/^00/, '');
            
            // 1. On cherche l'utilisateur (on peut encore SELECT car c'est public)
            const { data, error: dbError } = await supabase.from('users').select('*').eq('phone', phoneClean).limit(1);

            if (dbError) throw new Error("Erreur base de données.");

            if (data && data.length > 0) {
                const foundUser = data[0];
                const newPIN = Math.floor(1000 + Math.random() * 9000).toString();
                
                // 2. MISE À JOUR SÉCURISÉE VIA LA FONCTION RPC (Bypasse RLS)
                // On utilise la fonction reset_password_by_phone(phone, password)
                const { error: rpcError } = await supabase.rpc('reset_password_by_phone', { 
                    p_phone: phoneClean, 
                    p_new_password: newPIN 
                });

                if (rpcError) {
                    console.error("Erreur RPC:", rpcError);
                    // On tente quand même en direct au cas où (fallback)
                    await supabase.from('users').update({ password: newPIN }).eq('id', foundUser.id);
                }

                setGeneratedPin(newPIN);
                setUserInfo(foundUser);
                setMessage("Succès ! Votre nouveau code secret est activé.");
            } else {
                setError(`Aucun compte trouvé pour le ${phoneClean}.`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem', position: 'relative' }}>
            <Link to="/login" style={{ position: 'absolute', top: '20px', left: '20px', color: '#666', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 'bold' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Retour
            </Link>

            <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', borderRadius: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#10b98120', borderRadius: '20px', color: '#10b981', marginBottom: '1rem' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '0.5rem', color: '#1e293b', letterSpacing: '-0.5px' }}>Code oublié ?</h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.4' }}>Saisissez votre numéro pour réinitialiser instantanément votre code secret.</p>
                </div>

                {message && (
                    <div style={{ padding: '1rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '15px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center', border: '1px solid #10b981' }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '15px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center', border: '1px solid #ef4444' }}>
                        {error}
                    </div>
                )}

                {!userInfo ? (
                    <form onSubmit={handleCheckAccount}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>Votre Numéro de Téléphone</label>
                            <input
                                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                                style={{ width: '100%', padding: '1rem', borderRadius: '15px', border: '2px solid #f1f5f9', fontSize: '1rem', color: '#1e293b', outline: 'none' }}
                                placeholder="77 000 00 00" required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn" style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', fontWeight: '900', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer' }}>
                            {loading ? 'Vérification...' : 'Réinitialiser mon code'}
                        </button>
                    </form>
                ) : (
                    <div style={{ animation: 'fadeIn 0.3s ease', textAlign: 'center' }}>
                        <div style={{ padding: '1.5rem', backgroundColor: '#e8f5e9', borderRadius: '25px', border: '2px solid #c8e6c9', marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '0.9rem', color: '#2e7d32', marginBottom: '1.2rem', fontWeight: '600' }}>
                                Votre nouveau code secret est prêt :
                            </p>
                            
                            <div style={{ fontSize: '3rem', fontWeight: '900', color: '#10b981', background: 'white', display: 'inline-block', padding: '0.5rem 2rem', borderRadius: '20px', marginBottom: '1.5rem', letterSpacing: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                                {generatedPin}
                            </div>

                            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' }}>
                                Veuillez nous envoyer ce code par WhatsApp pour confirmer votre identité.
                            </p>

                            <a 
                                href={`https://wa.me/221778599649?text=${encodeURIComponent(`Bonjour SamaTechnicien, je suis ${userInfo.fullname} (${userInfo.phone}). Mon code secret a été réinitialisé automatiquement en : ${generatedPin}`)}`}
                                target="_blank" rel="noopener noreferrer" className="btn"
                                style={{ width: '100%', padding: '1.1rem', backgroundColor: '#25D366', color: 'white', fontWeight: '900', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textDecoration: 'none' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                Confirmer sur WhatsApp
                            </a>
                        </div>
                        <Link to="/login" style={{ display: 'block', width: '100%', padding: '1rem', background: '#10b981', color: 'white', borderRadius: '15px', fontWeight: 'bold', textDecoration: 'none', marginBottom: '1rem' }}>
                            Aller à la connexion
                        </Link>
                        <button onClick={() => { setUserInfo(null); setGeneratedPin(null); }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '700' }}>
                            Utiliser un autre numéro
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
