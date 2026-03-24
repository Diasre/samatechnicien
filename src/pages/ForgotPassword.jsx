import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail } from 'lucide-react';

const ForgotPassword = () => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [validationToken, setValidationToken] = useState('');
    const [newPin, setNewPin] = useState('');
    const [step, setStep] = useState(1); // 1: Phone, 2: Token + New PIN

    const handleCheckAccount = async (e) => {
        if (e) e.preventDefault();
        if (!phone || phone.length < 5) return setError("Veuillez entrer un numéro valide.");
        
        setLoading(true);
        setError(null);

        try {
            const phoneClean = phone.replace(/\D/g, '').replace(/^221/, '').replace(/^00/, '');
            const { data, error: dbError } = await supabase.from('users').select('*').or(`phone.eq.${phoneClean},phone.ilike.%${phoneClean}%`).limit(1);

            if (dbError) throw new Error("Erreur base de données.");

            if (data && data.length > 0) {
                setUserInfo(data[0]);
                setStep(2);
                setMessage("Compte trouvé ! Veuillez maintenant saisir le Code de Validation reçu sur WhatsApp.");
            } else {
                setError(`Aucun compte n'a été trouvé pour le numéro ${phoneClean}.`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!validationToken || !newPin) return setError("Remplissez tous les champs.");
        if (newPin.length !== 4) return setError("Le nouveau code PIN doit faire 4 chiffres.");

        setLoading(true);
        setError(null);

        try {
            // APPEL RPC SÉCURISÉ : On vérifie le TOKEN d'abord
            const { data: success, error: rpcError } = await supabase.rpc('reset_password_with_token', { 
                p_phone: userInfo.phone, 
                p_token: validationToken,
                p_new_password: newPin
            });

            if (rpcError) throw new Error("Erreur technique de validation.");

            if (success) {
                setMessage("Félicitations ! Votre code PIN a été mis à jour avec succès.");
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError("Code de Validation incorrect ! Veuillez redemander un code à l'administrateur.");
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
                    <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#805ad520', borderRadius: '20px', color: '#805ad5', marginBottom: '1rem' }}>
                        <Lock size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '0.5rem', color: '#1e293b', letterSpacing: '-0.5px' }}>{step === 1 ? "Récupération" : "Validation"}</h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.4' }}>
                        {step === 1 ? "Saisissez votre numéro pour initier la récupération." : "Entrez le code reçu par WhatsApp pour changer votre PIN."}
                    </p>
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

                {step === 1 ? (
                    <form onSubmit={handleCheckAccount}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>Numéro de Téléphone</label>
                            <input
                                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                                style={{ width: '100%', padding: '1rem', borderRadius: '15px', border: '2px solid #f1f5f9', fontSize: '1rem', color: '#1e293b', outline: 'none' }}
                                placeholder="77 000 00 00" required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn" style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', fontWeight: '900', backgroundColor: '#805ad5', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer' }}>
                            {loading ? 'Vérification...' : 'Continuer'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '700', color: '#1e293b', fontSize: '0.85rem' }}>Code de Validation WhatsApp</label>
                            <input
                                type="text" value={validationToken} onChange={(e) => setValidationToken(e.target.value)}
                                style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '2px solid #f1f5f9', fontSize: '1rem', textAlign: 'center', fontWeight: '900', letterSpacing: '4px' }}
                                placeholder="----" required
                            />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '700', color: '#1e293b', fontSize: '0.85rem' }}>Nouveau Code PIN (4 chiffres)</label>
                            <input
                                type="password" maxLength="4" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '2px solid #f1f5f9', fontSize: '1rem', textAlign: 'center', fontWeight: '900', letterSpacing: '4px' }}
                                placeholder="****" required
                            />
                        </div>
                        
                        <a 
                            href={`https://wa.me/221778599649?text=${encodeURIComponent(`Bonjour SamaTechnicien, je suis ${userInfo.fullname} (${userInfo.phone}). Merci de me donner mon code de validation pour mon compte.`)}`}
                            target="_blank" rel="noopener noreferrer" 
                            style={{ display: 'block', textAlign: 'center', color: '#25D366', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1.5rem' }}
                        >
                            Obtenir mon code sur WhatsApp →
                        </a>

                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '1.1rem', backgroundColor: '#10b981', color: 'white', fontWeight: '900', borderRadius: '15px', border: 'none', cursor: 'pointer' }}>
                            {loading ? 'Mise à jour...' : 'Mettre à jour mon PIN'}
                        </button>
                        
                        <button onClick={() => setStep(1)} style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', marginTop: '1rem', cursor: 'pointer' }}>
                            Annuler et changer de numéro
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
