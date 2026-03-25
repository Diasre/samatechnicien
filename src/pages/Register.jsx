import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, Lock, Phone, Eye, EyeOff, MapPin, CheckCircle2, Hammer, Search } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 or 2
    const [showPassword, setShowPassword] = useState(false);
    const isMobile = window.innerWidth <= 768;

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                navigate(parsedUser.role === 'admin' ? '/dashboard' : '/');
            }
        } catch (e) {
            console.error('LocalStorage access denied:', e);
        }
    }, [navigate]);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        role: 'technician',
        specialty: 'Informatique',
        otherSpecialty: '',
        city: '',
        district: '',
        username: '',
        image: null,
        acceptedTerms: false
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) setFormData({ ...formData, image: file });
    };

    const [otpCode, setOtpCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        if (!formData.acceptedTerms) {
            return alert("Veuillez accepter les conditions générales pour continuer.");
        }
        
        console.log('🚀 Lancement de l\'inscription...');
        setLoading(true);

        try {
            // 🛡️ UNIFICATION: Nettoyage et formatage pour Twilio (+221 obligatoire)
            const phoneClean = formData.phone.replace(/\D/g, '').replace(/^221/, '').replace(/^00/, '');
            const fullPhone = `+221${phoneClean}`;
            const finalEmail = `${phoneClean}@samatechnicien.dummy`;
            const finalPassword = formData.password.length === 4 ? formData.password + "00" : formData.password;

            console.log('📱 Téléphone formaté:', fullPhone);

            // 1. UPLOAD IMAGE (si technicien)
            let imageUrl = null;
            if (formData.role === 'technician' && formData.image) {
                console.log('📸 Envoi de l\'image...');
                const fileExt = formData.image.name.split('.').pop();
                const fileName = `avatars/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { data: uploadData } = await supabase.storage.from('produits').upload(fileName, formData.image);
                if (uploadData) {
                    const { data: publicUrlData } = supabase.storage.from('produits').getPublicUrl(fileName);
                    imageUrl = publicUrlData.publicUrl;
                }
            }

            console.log('📡 Appel à Supabase Auth pour OTP...');
            // 2. INSCRIPTION DOUBLE (Téléphone pour Twilio + Email pour la DB)
            const { error: authError } = await supabase.auth.signUp({
                phone: fullPhone,
                email: finalEmail,
                password: finalPassword,
                options: {
                    data: {
                        full_name: formData.fullName,
                        email: finalEmail,
                        phone: phoneClean,
                        role: formData.role,
                        city: formData.city,
                        district: formData.district,
                        username: phoneClean,
                        password: formData.password,
                        image: imageUrl,
                        specialty: formData.role === 'technician' ? (formData.specialty === 'Autre' ? formData.otherSpecialty : formData.specialty) : null
                    }
                }
            });

            if (authError) {
                console.error('❌ Erreur Supabase:', authError.message);
                setLoading(false);
                return alert("Erreur Supabase: " + authError.message);
            }

            console.log('✅ SMS envoyé avec succès !');
            // Passage à l'étape du code SMS
            setStep(3);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error('💥 Crash de l\'inscription:', error);
            alert('Erreur critique : ' + (error.message || 'Problème de connexion'));
        }
    };

    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();
        if (otpCode.length !== 6) return alert("Veuillez entrer le code à 6 chiffres.");

        setLoading(true);
        const phoneClean = formData.phone.replace(/\D/g, '').replace(/^221/, '').replace(/^00/, '');
        const fullPhone = `+221${phoneClean}`;

        try {
            // 1. Vérification du SMS OTP
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                phone: fullPhone,
                token: otpCode,
                type: 'signup'
            });

            if (verifyError) throw verifyError;

            // 2. Synchronisation finale avec la table users
            if (verifyData?.user) {
                const profileData = {
                    id: verifyData.user.id,
                    fullname: formData.fullName,
                    phone: phoneClean,
                    role: formData.role,
                    city: formData.city,
                    district: formData.district,
                    username: phoneClean, 
                    password: formData.password,
                    email: `${phoneClean}@samatechnicien.dummy`,
                    specialty: formData.role === 'technician' ? (formData.specialty === 'Autre' ? formData.otherSpecialty : formData.specialty) : null,
                    image: verifyData.user.user_metadata.image,
                    isblocked: 0,
                    commentsenabled: 1
                };

                await supabase.from('users').upsert(profileData, { onConflict: 'id' });
                
                // Stockage local
                localStorage.setItem('user', JSON.stringify({ ...profileData, fullName: profileData.fullname }));
                
                alert(`Bienvenue ${formData.fullName} ! Votre compte est validé.`);
                navigate(formData.role === 'technician' ? '/expert-dashboard' : '/');
            }
        } catch (error) {
            alert("Code incorrect ou expiré : " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: `linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.6)), url('/light-bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '1.5rem',
            color: '#1e293b',
            fontFamily: "'Outfit', sans-serif"
        }}>
            {/* Steps Progress */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem', marginTop: '1rem' }}>
                <div style={{ width: '40px', height: '6px', borderRadius: '10px', background: step >= 1 ? '#10b981' : 'rgba(255,255,255,0.3)' }} />
                <div style={{ width: '40px', height: '6px', borderRadius: '10px', background: step >= 2 ? '#10b981' : 'rgba(255,255,255,0.3)' }} />
            </div>

            <div style={{ width: '100%', maxWidth: '440px' }}>
                <h1 style={{ fontSize: '2.4rem', fontWeight: '900', marginBottom: '0.2rem', letterSpacing: '-1px', color: '#1e293b' }}>Inscription</h1>
                <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '2rem', fontWeight: '500' }}>Créez votre compte SamaTechnicien</p>

                {step === 1 ? (
                    <div style={{ animation: 'fadeIn 0.4s ease' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', color: '#1e293b' }}>Je souhaite...</h3>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                            {/* Role Client */}
                            <button 
                                onClick={() => setFormData({ ...formData, role: 'client' })}
                                style={{ 
                                    flex: 1, height: '140px', borderRadius: '25px', 
                                    border: `2px solid ${formData.role === 'client' ? '#10b981' : 'rgba(255,255,255,0.2)'}`,
                                    background: formData.role === 'client' ? '#10b981' : 'rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(10px)', color: '#fff', cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <Search size={32} />
                                <span style={{ fontWeight: '700', fontSize: '1rem', color: formData.role === 'client' ? '#fff' : '#1e293b' }}>Client</span>
                            </button>

                            {/* Role Technicien */}
                            <button 
                                onClick={() => setFormData({ ...formData, role: 'technician' })}
                                style={{ 
                                    flex: 1, height: '140px', borderRadius: '25px', 
                                    border: `2px solid ${formData.role === 'technician' ? '#10b981' : 'rgba(255,255,255,0.8)'}`,
                                    background: formData.role === 'technician' ? '#10b981' : 'rgba(255,255,255,0.7)',
                                    backdropFilter: 'blur(10px)', color: formData.role === 'technician' ? '#fff' : '#1e293b', cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                }}
                            >
                                <Hammer size={32} color={formData.role === 'technician' ? '#fff' : '#10b981'} />
                                <span style={{ fontWeight: '700', fontSize: '1rem', color: formData.role === 'technician' ? '#fff' : '#1e293b' }}>Technicien</span>
                            </button>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#10b981', background: '#fff', width: 'fit-content', padding: '2px 8px', borderRadius: '6px', transform: 'translateY(10px) translateX(15px)', zIndex: 1, position: 'relative', border: '1px solid #f1f5f9' }}>Téléphone</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Phone size={20} style={{ position: 'absolute', left: '1.2rem', color: '#10b981' }} />
                                <input 
                                    type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                    style={{ width: '100%', padding: '1.2rem 1.2rem 1.2rem 3.2rem', borderRadius: '20px', border: '2px solid #10b981', background: 'rgba(255,255,255,0.8)', color: '#1e293b', fontSize: '1.1rem', outline: 'none', backdropFilter: 'blur(10px)' }}
                                    placeholder="+221 77 000 00 00"
                                />
                                <div style={{ position: 'absolute', right: '1rem', background: '#10b98120', color: '#10b981', padding: '4px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800' }}>Valide ✓</div>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                if (formData.phone.length < 8) return alert("Veuillez entrer un numéro valide.");
                                setStep(2);
                            }}
                            style={{ 
                                width: '100%', padding: '1.2rem', borderRadius: '22px', border: 'none', 
                                background: '#10b981', color: '#fff', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer',
                                boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            Continuer
                        </button>
                    </div>
                ) : step === 2 ? (
                    <div style={{ animation: 'fadeIn 0.4s ease' }}>
                        <div style={{ marginBottom: '1.2rem' }}>
                             <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Nom Complet</label>
                             <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <User size={18} style={{ position: 'absolute', left: '1rem', color: '#10b981' }} />
                                <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} style={{ width: '100%', padding: '1rem 1rem 1rem 2.8rem', borderRadius: '20px', border: '2px solid #f1f5f9', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', color: '#1e293b', outline: 'none' }} placeholder="Moussa Diop" />
                             </div>
                        </div>

                        {formData.role === 'technician' && (
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Ville</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} style={{ width: '100%', padding: '1rem', borderRadius: '20px', border: '2px solid #f1f5f9', background: 'rgba(255,255,255,0.8)', color: '#1e293b', outline: 'none' }} placeholder="Dakar" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Quartier</label>
                                    <input type="text" name="district" value={formData.district} onChange={handleChange} style={{ width: '100%', padding: '1rem', borderRadius: '20px', border: '2px solid #f1f5f9', background: 'rgba(255,255,255,0.8)', color: '#1e293b', outline: 'none' }} placeholder="Parcelles" />
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: '1.2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#10b981' }}>Code secret (4 chiffres)</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', color: '#10b981' }} />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    required
                                    maxLength="4"
                                    inputMode="numeric"
                                    pattern="\d*"
                                    value={formData.password} 
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, ''); // Uniquement des chiffres
                                        setFormData({ ...formData, password: val });
                                    }} 
                                    style={{ width: '100%', padding: '1.2rem 1rem 1.2rem 2.8rem', borderRadius: '20px', border: '2px solid #10b981', background: 'rgba(255,255,255,0.8)', color: '#1e293b', outline: 'none', letterSpacing: formData.password ? '4px' : 'normal', fontWeight: '700' }} 
                                    placeholder="Ex: 1234" 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '1.5rem' }}>
                            <div 
                                onClick={() => setFormData({ ...formData, acceptedTerms: !formData.acceptedTerms })}
                                style={{ 
                                    width: '30px', height: '30px', borderRadius: '10px', 
                                    border: `2.5px solid ${formData.acceptedTerms ? '#10b981' : '#cbd5e1'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: formData.acceptedTerms ? '#10b981' : 'rgba(255,255,255,0.5)',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    boxShadow: formData.acceptedTerms ? '0 4px 10px rgba(16, 185, 129, 0.2)' : 'none'
                                }}
                            >
                                {formData.acceptedTerms && <CheckCircle2 size={20} color="#fff" strokeWidth={3} />}
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', lineHeight: '1.4' }}>
                                J'accepte les <Link to="/terms#cgu" style={{ color: '#10b981', fontWeight: '700', textDecoration: 'none' }}>Conditions Générales</Link> et la <Link to="/terms#privacy" style={{ color: '#10b981', fontWeight: '700', textDecoration: 'none' }}>Politique de Confidentialité</Link>
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '1.5rem' }}>
                            <button 
                                onClick={() => setStep(1)}
                                style={{ flex: 1, padding: '1.2rem', borderRadius: '22px', border: '2px solid #f1f5f9', background: '#fff', color: '#64748b', fontWeight: '700', cursor: 'pointer' }}
                            >
                                Retour
                            </button>
                            <button 
                                disabled={loading}
                                onClick={handleSubmit}
                                style={{ flex: 2, padding: '1.2rem', borderRadius: '22px', border: 'none', background: '#10b981', color: '#fff', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' }}
                            >
                                {loading ? 'Envoi...' : 'Terminer'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ animation: 'fadeIn 0.4s ease' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#3b82f620', borderRadius: '20px', color: '#3b82f6', marginBottom: '1rem' }}>
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>Vérifiez vos messages</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Un code à 6 chiffres a été envoyé au <b>+221 {formData.phone}</b></p>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#1e293b', textAlign: 'center' }}>Code de confirmation</label>
                            <input 
                                type="text" maxLength="6" inputMode="numeric" value={otpCode} 
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                style={{ width: '100%', padding: '1.2rem', borderRadius: '20px', border: '2px solid #10b981', background: '#f8fafc', color: '#10b981', fontSize: '2rem', textAlign: 'center', fontWeight: '900', letterSpacing: '8px', outline: 'none' }} 
                                placeholder="000000"
                            />
                        </div>

                        <button 
                            disabled={loading}
                            onClick={handleVerifyOtp}
                            style={{ 
                                width: '100%', padding: '1.2rem', borderRadius: '22px', border: 'none', 
                                background: '#10b981', color: '#fff', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer',
                                boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            {loading ? 'Vérification...' : 'Valider mon compte'}
                        </button>

                        <button 
                            onClick={() => setStep(2)}
                            style={{ width: '100%', background: 'none', border: 'none', color: '#64748b', marginTop: '1.5rem', cursor: 'pointer', fontWeight: '600' }}
                        >
                            Retour / Modifier les infos
                        </button>
                    </div>
                )}

                <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
                    En vous inscrivant, vous acceptez nos <span style={{ color: '#10b981', textDecoration: 'underline' }}>Conditions Générales</span> et la <span style={{ color: '#10b981', textDecoration: 'underline' }}>Politique de Confidentialité</span>.
                </p>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '1.05rem', color: '#1e293b', fontWeight: '700' }}>
                    Déjà un compte ? <Link to="/login" style={{ color: '#10b981', textDecoration: 'none', borderBottom: '2px solid #10b981', paddingBottom: '2px', marginLeft: '8px' }}>Connexion</Link>
                </p>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Register;
