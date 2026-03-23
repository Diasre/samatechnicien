import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, Mail, Lock, Shield, Phone, Eye, EyeOff, MapPin, Briefcase, ChevronRight } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        confirmPassword: '',
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
        e.preventDefault();
        const finalEmail = isMobile ? `${formData.username.toLowerCase().trim()}@samatechnicien.dummy` : formData.email;
        const finalPassword = isMobile ? `PIN_${formData.pinCode}_SamaTech221` : formData.password;

        if (!isMobile) {
            if (formData.password !== formData.confirmPassword) return alert('Les mots de passe ne correspondent pas.');
        }

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

    const InputField = ({ icon: Icon, label, ...props }) => (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '700', fontSize: '0.85rem', color: '#1e293b', marginLeft: '4px' }}>{label}</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Icon size={18} style={{ position: 'absolute', left: '1rem', color: '#64748b' }} />
                <input {...props} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '20px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s' }} 
                       onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.background = '#fff'; }}
                       onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.background = '#f8fafc'; }} />
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem', background: '#0c2b1a' }}>
            {/* Soft decorative circles */}
            <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, #10b98120 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, #f59e0b10 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 1.75rem', borderRadius: '40px', backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', margin: '2rem 0', position: 'relative' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ padding: '4px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', width: '70px', height: '70px', borderRadius: '24px', margin: '0 auto 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' }}>
                        <User size={35} strokeWidth={2.5} />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px' }}>Rejoignez-nous</h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: '500' }}>{isMobile ? 'Création de compte instantanée' : 'Démarrez votre aventure aujourd\'hui'}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <InputField icon={User} label="Nom Complet" type="text" name="fullName" required value={formData.fullName} onChange={handleChange} placeholder="Moussa Diop" />

                    {!isMobile && <InputField icon={Mail} label="Email" type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="moussa@mail.com" />}

                    <InputField icon={Phone} label="Téléphone" type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="+221 ..." />

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <InputField icon={Briefcase} label="Identifiant" type="text" name="username" required value={formData.username} onChange={handleChange} placeholder="moussa221" />
                        </div>
                        <div style={{ width: '100px' }}>
                             <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '700', fontSize: '0.85rem', color: '#1e293b' }}>PIN</label>
                             <input type="text" maxLength="4" required value={formData.pinCode} onChange={(e) => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '').slice(0, 4) })} style={{ width: '100%', padding: '0.85rem', borderRadius: '20px', border: '2px solid #f1f5f9', background: '#f8fafc', outline: 'none', textAlign: 'center', fontWeight: '900', fontSize: '1.2rem', letterSpacing: '2px' }} placeholder="0000" />
                        </div>
                    </div>

                    {!isMobile && (
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div style={{ flex: 1 }}>
                                <InputField icon={Lock} label="Mot de passe" type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <InputField icon={Shield} label="Confirmation" type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" />
                            </div>
                        </div>
                    )}

                    {formData.role === 'technician' && (
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <InputField icon={MapPin} label="Ville" type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Dakar" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <InputField icon={MapPin} label="Quartier" type="text" name="district" value={formData.district} onChange={handleChange} placeholder="Médina" />
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '700', fontSize: '0.85rem', color: '#1e293b' }}>Votre profil :</label>
                        <div style={{ display: 'flex', gap: '0.75rem', background: '#f1f5f9', padding: '6px', borderRadius: '20px' }}>
                            {['technician', 'client'].map(r => (
                                <button key={r} type="button" onClick={() => setFormData({ ...formData, role: r })} 
                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '15px', border: 'none', cursor: 'pointer', background: formData.role === r ? '#fff' : 'transparent', color: formData.role === r ? '#10b981' : '#64748b', fontWeight: '800', fontSize: '0.85rem', boxShadow: formData.role === r ? '0 4px 10px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.3s' }}>
                                    {r === 'technician' ? 'Technicien' : 'Client'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {formData.role === 'technician' && (
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.85rem' }}>Spécialité</label>
                            <select name="specialty" value={formData.specialty} onChange={handleChange} style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '20px', border: '2px solid #f1f5f9', background: '#f8fafc', outline: 'none', cursor: 'pointer', fontWeight: '600' }}>
                                <option value="Informatique">Informatique</option>
                                <option value="Reparateur telephone">Réparateur téléphone</option>
                                <option value="Mécanicien">Mécanicien</option>
                                <option value="Plombier">Plombier</option>
                                <option value="Autre">Autre</option>
                            </select>
                            {formData.specialty === 'Autre' && (
                                <input type="text" name="otherSpecialty" required value={formData.otherSpecialty} onChange={handleChange} style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '20px', border: '2px solid #10b981', background: '#fff', outline: 'none', marginTop: '0.75rem' }} placeholder="Ex: Électricien, Carreleur..." />
                            )}
                        </div>
                    )}

                    <button type="submit" style={{ width: '100%', padding: '1.1rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '22px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'transform 0.2s' }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                        Créer mon compte
                        <ChevronRight size={20} />
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.95rem', color: '#64748b', fontWeight: '600' }}>
                    Déjà inscrit ? <Link to="/login" style={{ color: '#10b981', fontWeight: '900', textDecoration: 'none', marginLeft: '5px' }}>Connexion</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
