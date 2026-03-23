import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, Mail, Lock, Shield, Phone, Eye, EyeOff, MapPin, Briefcase, ChevronRight, CheckCircle2, Hammer, Search } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 or 2
    const [showPassword, setShowPassword] = useState(false);
    const isMobile = window.innerWidth <= 768;

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            navigate(parsedUser.role === 'admin' ? '/dashboard' : '/');
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
        pinCode: '',
        image: null
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) setFormData({ ...formData, image: file });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const finalEmail = isMobile ? `${formData.username.toLowerCase().trim()}@samatechnicien.dummy` : formData.email;
        const finalPassword = isMobile ? `PIN_${formData.pinCode}_SamaTech221` : formData.password;

        try {
            let imageUrl = null;
            if (formData.role === 'technician' && formData.image) {
                const fileExt = formData.image.name.split('.').pop();
                const fileName = `avatars/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { data: uploadData } = await supabase.storage.from('produits').upload(fileName, formData.image);
                if (uploadData) {
                    const { data: publicUrlData } = supabase.storage.from('produits').getPublicUrl(fileName);
                    imageUrl = publicUrlData.publicUrl;
                }
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: finalEmail,
                password: finalPassword,
                options: {
                    data: {
                        full_name: formData.fullName,
                        phone: formData.phone,
                        role: formData.role,
                        city: formData.city,
                        district: formData.district,
                        username: formData.username.toLowerCase().trim(),
                        pin_code: formData.pinCode,
                        image: imageUrl,
                        specialty: formData.role === 'technician' ? (formData.specialty === 'Autre' ? formData.otherSpecialty : formData.specialty) : null
                    }
                }
            });

            if (authError) return alert("Erreur: " + authError.message);
            alert(isMobile ? `Bienvenue ${formData.fullName} !` : "Inscription réussie !");
            navigate('/login');
        } catch (error) {
            console.error('Registration error:', error);
            alert('Erreur lors de l\'inscription.');
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
                ) : (
                    /* Step 2 */
                    <div style={{ animation: 'fadeIn 0.4s ease' }}>
                        <div style={{ marginBottom: '1.2rem' }}>
                             <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Nom Complet</label>
                             <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <User size={18} style={{ position: 'absolute', left: '1rem', color: '#10b981' }} />
                                <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} style={{ width: '100%', padding: '1rem 1rem 1rem 2.8rem', borderRadius: '20px', border: '2px solid #f1f5f9', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', color: '#1e293b', outline: 'none' }} placeholder="Moussa Diop" />
                             </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Identifiant</label>
                                <input type="text" name="username" required value={formData.username} onChange={handleChange} style={{ width: '100%', padding: '1rem', borderRadius: '20px', border: '2px solid #f1f5f9', background: 'rgba(255,255,255,0.8)', color: '#1e293b', outline: 'none' }} placeholder="@moussa" />
                            </div>
                            <div style={{ width: '100px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>PIN</label>
                                <input type="text" maxLength="4" required value={formData.pinCode} onChange={(e) => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '').slice(0, 4) })} style={{ width: '100%', padding: '1rem', borderRadius: '20px', border: '2px solid #f1f5f9', background: 'rgba(255,255,255,0.8)', color: '#1e293b', outline: 'none', textAlign: 'center', fontWeight: '900', letterSpacing: '4px' }} placeholder="0000" />
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

                        {!isMobile && (
                            <div style={{ marginBottom: '1.2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '1rem', borderRadius: '20px', border: '2px solid #f1f5f9', background: 'rgba(255,255,255,0.8)', color: '#1e293b', outline: 'none' }} placeholder="votre@mail.com" />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '15px', marginTop: '1.5rem' }}>
                            <button 
                                onClick={() => setStep(1)}
                                style={{ flex: 1, padding: '1.2rem', borderRadius: '22px', border: '2px solid #f1f5f9', background: '#fff', color: '#64748b', fontWeight: '700', cursor: 'pointer' }}
                            >
                                Retour
                            </button>
                            <button 
                                onClick={handleSubmit}
                                style={{ flex: 2, padding: '1.2rem', borderRadius: '22px', border: 'none', background: '#10b981', color: '#fff', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' }}
                            >
                                Terminer
                            </button>
                        </div>
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
