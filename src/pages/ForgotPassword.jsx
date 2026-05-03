import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, ArrowLeft, Phone, ShieldCheck, Smartphone, CheckCircle, Smartphone as PhoneIcon } from 'lucide-react';

const ForgotPassword = () => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [smsCode, setSmsCode] = useState('');
    const [newPin, setNewPin] = useState('');
    const [step, setStep] = useState(1); // 1: Phone, 2: SMS Verification + New PIN

    const navigate = useNavigate(); // Added navigate hook

    const handleSendOTP = async (e) => {
        if (e) e.preventDefault();
        if (!phone || phone.length < 5) return setError("Veuillez entrer un numéro valide.");
        
        setLoading(true);
        setError(null);

        try {
            // Nettoyage et formatage pour Twilio (+221 obligatoire)
            const phoneClean = phone.replace(/\D/g, '').replace(/^221/, '').replace(/^00/, '');
            const fullPhone = `+221${phoneClean}`;
            
            // 1. Vérification DNS (Compte existe-t-il ?)
            const { data, error: dbError } = await supabase.from('users').select('*').eq('phone', phoneClean).limit(1);
            if (dbError) throw new Error("Erreur base de données.");
            if (!data || data.length === 0) throw new Error("Aucun compte trouvé pour ce numéro.");

            setUserInfo(data[0]);

            // 2. ENVOI AUTOMATIQUE PAR SMS (Via Twilio paramétré dans Supabase)
            const { error: otpError } = await supabase.auth.signInWithOtp({
                phone: fullPhone,
            });

            if (otpError) throw new Error("Échec de l'envoi du SMS. Vérifiez vos crédits Twilio.");

            setStep(2);
            setMessage(`Un SMS avec un code de vérification a été envoyé au ${fullPhone}.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndReset = async (e) => {
        if (e) e.preventDefault();
        if (!smsCode || !newPin) return setError("Saisissez le code SMS et votre nouveau PIN.");
        if (newPin.length !== 4) return setError("Le PIN doit faire 4 chiffres.");

        setLoading(true);
        setError(null);

        try {
            const fullPhone = `+221${userInfo.phone}`;

            // 1. Vérification du code SMS reçu (OTP)
            const { error: verifyError } = await supabase.auth.verifyOtp({
                phone: fullPhone,
                token: smsCode,
                type: 'sms'
            });

            if (verifyError) throw new Error("Code SMS incorrect ou expiré.");

            // 2. Mise à jour du PIN dans notre table users
            const { error: updateError } = await supabase
                .from('users')
                .update({ password: newPin })
                .eq('id', userInfo.id);

            if (updateError) throw new Error("Erreur de mise à jour du profil.");

            setMessage("Succès ! Votre code PIN a été changé. Redirection...");
            setTimeout(() => navigate('/login'), 2500);
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
                    <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#3b82f620', borderRadius: '20px', color: '#3b82f6', marginBottom: '1rem' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '0.5rem', color: '#1e293b', letterSpacing: '-0.5px' }}>Oublié ? SMS</h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.4' }}>
                        {step === 1 ? "Entrez votre numéro pour recevoir un code par SMS." : "Entrez le code SMS reçu pour changer votre PIN."}
                    </p>
                </div>

                {message && (
                    <div style={{ padding: '1rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '15px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center', border: '1px solid #007bff' }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '15px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center', border: '1px solid #ef4444' }}>
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSendOTP}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>Numéro de téléphone</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '15px', border: '2px solid #f1f5f9', fontWeight: 'bold' }}>+221</div>
                                <input
                                    type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                                    style={{ flex: 1, padding: '1rem', borderRadius: '15px', border: '2px solid #f1f5f9', fontSize: '1rem', color: '#1e293b', outline: 'none' }}
                                    placeholder="77 000 00 00" required
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn" style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', fontWeight: '900', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', boxShadow: '0 10px 15px rgba(59, 130, 246, 0.2)' }}>
                            {loading ? 'Connexion à Twilio...' : 'Recevoir le Code SMS'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyAndReset}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '700', color: '#1e293b', fontSize: '0.85rem' }}>Code de Vérification (6 chiffres)</label>
                            <input
                                type="text" maxLength="6" value={smsCode} onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                                style={{ width: '100%', padding: '1rem', borderRadius: '15px', border: '2px solid #f1f5f9', fontSize: '1.5rem', textAlign: 'center', fontWeight: '900', letterSpacing: '8px' }}
                                placeholder="------" required
                            />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '700', color: '#1e293b', fontSize: '0.85rem' }}>Nouveau PIN souhaité (4 chiffres)</label>
                            <input
                                type="password" maxLength="4" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                style={{ width: '100%', padding: '1rem', borderRadius: '15px', border: '2px solid #f1f5f9', fontSize: '1rem', textAlign: 'center', fontWeight: '900', letterSpacing: '4px' }}
                                placeholder="****" required
                            />
                        </div>
                        
                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '1.1rem', backgroundColor: '#007bff', color: 'white', fontWeight: '900', borderRadius: '15px', border: 'none', cursor: 'pointer' }}>
                            {loading ? 'Validation en cours...' : 'Changer mon PIN'}
                        </button>
                        
                        <button onClick={() => setStep(1)} type="button" style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', marginTop: '1rem', cursor: 'pointer' }}>
                            Annuler et changer de numéro
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
