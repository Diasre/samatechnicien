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

    const handleCheckAccount = async (e) => {
        if (e) e.preventDefault();
        if (!phone || phone.length < 5) return setError("Veuillez entrer un numéro valide.");
        
        setLoading(true);
        setError(null);
        setUserInfo(null);

        try {
            // Nettoyage complet : que les chiffres !
            const phoneClean = phone.replace(/\D/g, '').replace(/^221/, '').replace(/^00/, '');
            console.log("Vérification pour :", phoneClean);
            
            // On cherche l'utilisateur par téléphone
            const { data, error: dbError } = await supabase
                .from('users')
                .select('fullname, phone, role')
                .eq('phone', phoneClean)
                .limit(1);

            if (dbError) {
                console.error("Détails de l'erreur DB:", dbError);
                throw new Error("L'accès à la base de données est limité. Veuillez réessayer.");
            }

            if (data && data.length > 0) {
                setUserInfo(data[0]);
                setMessage(`Compte trouvé pour ${data[0].fullname}.`);
            } else {
                setError(`Désolé, aucun professionnel n'a été trouvé pour le numéro ${phoneClean}. Veuillez vérifier la saisie.`);
            }
        } catch (err) {
            setError(err.message || "Une erreur est survenue lors de la vérification.");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailReset = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });
            if (error) throw error;
            setMessage("Lien de réinitialisation envoyé à votre adresse email.");
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
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.4' }}>Entrez votre numéro pour recevoir de l'aide sur WhatsApp.</p>
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

                {!userInfo ? (
                    <form onSubmit={handleCheckAccount}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>Votre Numéro de Téléphone</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '15px',
                                    border: '2px solid #f1f5f9', fontSize: '1rem',
                                    color: '#1e293b', outline: 'none'
                                }}
                                placeholder="77 000 00 00"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn"
                            style={{ 
                                width: '100%', padding: '1.1rem', fontSize: '1.1rem', fontWeight: '900',
                                backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer'
                            }}
                        >
                            {loading ? 'Vérification...' : 'Vérifier mon compte'}
                        </button>
                    </form>
                ) : (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ padding: '1.5rem', backgroundColor: '#e8f5e9', borderRadius: '25px', border: '2px solid #c8e6c9', marginBottom: '1.5rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.9rem', color: '#2e7d32', marginBottom: '1rem', fontWeight: '600' }}>
                                Bonjour <strong>{userInfo.fullname}</strong> ! Cliquez ci-dessous pour m'envoyer votre nouveau code secret par WhatsApp :
                            </p>
                            
                            {/* Generation d'un code PIN aleatoire */}
                            {(() => {
                                if (!window.generatedPIN) window.generatedPIN = Math.floor(1000 + Math.random() * 9000);
                                return (
                                    <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#10b981', background: 'white', display: 'inline-block', padding: '0.5rem 1.5rem', borderRadius: '15px', marginBottom: '1.5rem', letterSpacing: '8px' }}>
                                        {window.generatedPIN}
                                    </div>
                                );
                            })()}

                            <a 
                                href={`https://wa.me/221778599649?text=${encodeURIComponent(`Bonjour SamaTechnicien, je suis ${userInfo.fullname} (${userInfo.phone}). Merci de réinitialiser mon compte avec ce nouveau code PIN : ${window.generatedPIN}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn"
                                style={{ 
                                    width: '100%', padding: '1.1rem', backgroundColor: '#25D366', color: 'white', fontWeight: '900', borderRadius: '18px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textDecoration: 'none', boxShadow: '0 8px 15px rgba(37, 211, 102, 0.2)'
                                }}
                            >
                                Envoyer mon code par WhatsApp
                            </a>
                        </div>
                        <button 
                            onClick={() => { window.generatedPIN = null; setUserInfo(null); }}
                            style={{ width: '100%', background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '700' }}
                        >
                            Changer le numéro
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '2rem 0 1.5rem', color: '#cbd5e1' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>OU PAR EMAIL</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                </div>

                <form onSubmit={handleEmailReset}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '15px',
                                border: '2px solid #f1f5f9', fontSize: '0.9rem', outline: 'none'
                            }}
                            placeholder="votre@email.com"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Réinitialiser par email
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
