import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, Mail, Lock, Shield, Phone, Eye, EyeOff } from 'lucide-react';

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

        // Background generation for Mobile
        const finalEmail = isMobile ? `${formData.username.toLowerCase().trim()}@samatechnicien.dummy` : formData.email;
        const finalPassword = isMobile ? `PIN_${formData.pinCode}_SamaTech221` : formData.password;

        if (!isMobile) {
            if (formData.password !== formData.confirmPassword) {
                alert('Les mots de passe ne correspondent pas.');
                return;
            }
            const emailRegex = /^[a-zA-Z0-9._-]+@(gmail\.com|outlook\.com|yahoo\.com|yahoo\.fr|hotmail\.com|hotmail\.fr|icloud\.com)$/i;
            if (!emailRegex.test(formData.email)) {
                alert("Email invalide (Gmail, Outlook, Yahoo, Hotmail, iCloud requis)");
                return;
            }
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

            if (authError) {
                alert("Erreur: " + authError.message);
                return;
            }

            alert(isMobile ? `Bienvenue ${formData.fullName} ! Votre compte est prêt.` : "Inscription réussie ! Vérifiez vos emails.");
            navigate('/login');

        } catch (error) {
            console.error('Registration error:', error);
            alert('Erreur lors de l\'inscription.');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem', background: 'radial-gradient(circle at center, #1a4d2e 0%, #0c2b1a 100%)' }}>
            <div style={{ width: '100%', maxWidth: '440px', padding: '2rem 1.5rem', borderRadius: '35px', backgroundColor: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', margin: '2rem 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <div style={{ width: '60px', height: '60px', background: '#10b981', borderRadius: '18px', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <User size={30} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#111' }}>Créer un compte</h2>
                    <p style={{ color: '#666', fontSize: '0.85rem' }}>{isMobile ? 'Rejoignez-nous en 10 secondes' : 'Rejoignez la communauté'}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '0.8rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.8rem' }}>Nom Complet</label>
                        <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '2px solid #eef2f1', outline: 'none' }} placeholder="Moussa Diop" />
                    </div>

                    {!isMobile && (
                        <div style={{ marginBottom: '0.8rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.8rem' }}>Email</label>
                            <input type="email" name="email" required value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '2px solid #eef2f1', outline: 'none' }} placeholder="moussa@mail.com" />
                        </div>
                    )}

                    <div style={{ marginBottom: '0.8rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.8rem' }}>Téléphone</label>
                        <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '2px solid #eef2f1', outline: 'none' }} placeholder="+221 ..." />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.8rem' }}>Identifiant (@...)</label>
                            <input type="text" name="username" required value={formData.username} onChange={handleChange} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '2px solid #eef2f1', outline: 'none' }} placeholder="moussa221" />
                        </div>
                        <div style={{ width: '90px' }}>
                            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.8rem' }}>Code PIN</label>
                            <input type="text" maxLength="4" required value={formData.pinCode} onChange={(e) => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '').slice(0, 4) })} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '2px solid #eef2f1', outline: 'none', textAlign: 'center', letterSpacing: '3px' }} placeholder="1234" />
                        </div>
                    </div>

                    {!isMobile && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.8rem' }}>Mot de passe</label>
                                <input type="password" name="password" required value={formData.password} onChange={handleChange} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '2px solid #eef2f1', outline: 'none' }} placeholder="••••••••" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.8rem' }}>Confirmer</label>
                                <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '2px solid #eef2f1', outline: 'none' }} placeholder="••••••••" />
                            </div>
                        </div>
                    )}

                    {/* Location - Only for Technicians */}
                    {formData.role === 'technician' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.8rem' }}>Ville</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '2px solid #eef2f1', outline: 'none' }} placeholder="Dakar" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.8rem' }}>Quartier</label>
                                <input type="text" name="district" value={formData.district} onChange={handleChange} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '2px solid #eef2f1', outline: 'none' }} placeholder="Médina" />
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', fontSize: '0.8rem' }}>Je suis :</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['technician', 'client'].map(r => (
                                <button key={r} type="button" onClick={() => setFormData({ ...formData, role: r })} style={{ flex: 1, padding: '0.6rem', borderRadius: '12px', border: `2px solid ${formData.role === r ? '#10b981' : '#eef2f1'}`, background: formData.role === r ? '#f0fdf4' : '#fff', color: formData.role === r ? '#065f46' : '#666', fontWeight: 'bold', cursor: 'pointer' }}>
                                    {r === 'technician' ? 'Technicien' : 'Client'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {formData.role === 'technician' && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.8rem' }}>Spécialité</label>
                            <select name="specialty" value={formData.specialty} onChange={handleChange} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '2px solid #eef2f1', outline: 'none' }}>
                                <option value="Informatique">Informatique</option>
                                <option value="Reparateur telephone">Réparateur téléphone</option>
                                <option value="Mécanicien">Mécanicien</option>
                                <option value="Plombier">Plombier</option>
                                <option value="Menuisier">Menuisier</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                    )}

                    <button type="submit" style={{ width: '100%', padding: '1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 15px rgba(16, 185, 129, 0.3)' }}>
                        M'inscrire
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                    Déjà un compte ? <Link to="/login" style={{ color: '#10b981', fontWeight: 'bold', textDecoration: 'none' }}>Connexion</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
