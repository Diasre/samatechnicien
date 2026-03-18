import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { User, Mail, Lock, Shield, Phone, Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role === 'admin') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }
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
        image: null // Store the file object, not the URL yet
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('Les mots de passe ne correspondent pas.');
            return;
        }

        // Validation de l'email
        // Validation de l'email (Gmail/Outlook/Yahoo/Hotmail/iCloud)
        const emailRegex = /^[a-zA-Z0-9._-]+@(gmail\.com|outlook\.com|yahoo\.com|yahoo\.fr|hotmail\.com|hotmail\.fr|icloud\.com)$/i;
        if (!emailRegex.test(formData.email)) {
            alert("Donner une email valide (Gmail, Outlook, Yahoo, Hotmail, iCloud)");
            return;
        }

        // Vérifier si l'email existe déjà
        try {
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', formData.email)
                .single();

            if (existingUser) {
                alert("Cet adresse email est déjà utilisée par un autre compte.");
                return;
            }
        } catch (err) {
            // Ignore error
        }

        // Politique de sécurité du mot de passe
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            alert('Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.');
            return;
        }

        try {
            const payload = {
                fullname: formData.fullName,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                role: formData.role,
                city: formData.city,
                district: formData.district,
                specialty: formData.role === 'technician'
                    ? (formData.specialty === 'Autre' ? formData.otherSpecialty : formData.specialty)
                    : null,
                verification_code: null,
                email_verified: false
            };

            try {
                let imageUrl = null;
                if (formData.role === 'technician' && formData.image) {
                    try {
                        const fileExt = formData.image.name.split('.').pop();
                        const fileName = `avatars/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                        const { error: uploadError, data: uploadData } = await supabase.storage
                            .from('produits') // Using 'produits' bucket as it is public
                            .upload(fileName, formData.image);

                        if (uploadError) {
                            console.error("Image upload failed:", uploadError);
                            // Continue registration without image if upload fails
                        } else {
                            const { data: publicUrlData } = supabase.storage.from('produits').getPublicUrl(fileName);
                            imageUrl = publicUrlData.publicUrl;
                        }
                    } catch (imgErr) {
                        console.error("Image processing error:", imgErr);
                    }
                }

                // On délègue TOUT à Supabase Auth. Le Trigger SQL s'occupera de créer le profil public.
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName,
                            phone: formData.phone,
                            role: formData.role,
                            city: formData.city,      // Ajouté pour le Trigger
                            district: formData.district, // Ajouté pour le Trigger
                            image: imageUrl, // Pass current image URL
                            specialty: formData.role === 'technician'
                                ? (formData.specialty === 'Autre' ? formData.otherSpecialty : formData.specialty)
                                : null
                        }
                    }
                });

                if (authError) {
                    console.error("Erreur Auth:", authError);
                    alert("Erreur lors de l'inscription : " + authError.message);
                    return;
                }

                if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
                    alert("Ce compte existe déjà. Veuillez vous connecter.");
                    navigate('/login');
                } else {
                    // Succès !
                    alert(`Inscription réussie !\n\n✉️ UN EMAIL DE CONFIRMATION A ÉTÉ ENVOYÉ À : ${formData.email}\n\nVeuillez cliquer sur le lien dans l'email pour activer votre compte.`);
                    navigate('/login');
                }

            } catch (err) {
                console.error("Erreur technique Auth:", err);
                alert('Erreur technique : ' + err.message);
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Erreur lors de l\'inscription.');
        }
    };

    const handleVerifyParams = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('users')
                .select('verification_code, verification_expires_at, verification_attempts')
                .eq('id', userId)
                .single();

            if (error || !data) {
                alert("Utilisateur non trouvé.");
                return;
            }

            // 1. Vérifier le nombre de tentatives
            if (data.verification_attempts >= 3) {
                alert("Trop de tentatives incorrectes. Veuillez recommencer l'inscription ou contacter le support.");
                // Optionnel : Supprimer le compte temporaire ou le bloquer
                return;
            }

            // 2. Vérifier l'expiration
            if (new Date() > new Date(data.verification_expires_at)) {
                alert("Le code a expiré (validité 5 minutes). Veuillez recommencer.");
                return;
            }

            // 3. Vérifier le code
            if (data.verification_code === verificationCode) {
                // Code Valid! Activate account
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        email_verified: true,
                        verification_code: null,
                        verification_expires_at: null,
                        verification_attempts: 0
                    })
                    .eq('id', userId);

                if (updateError) {
                    alert("Erreur lors de l'activation.");
                } else {
                    alert("Compte vérifié avec succès ! Vous pouvez maintenant vous connecter.");
                    navigate('/login');
                }
            } else {
                // Incrémenter les tentatives échouées
                await supabase
                    .from('users')
                    .update({ verification_attempts: (data.verification_attempts || 0) + 1 })
                    .eq('id', userId);

                alert(`Code incorrect. Tentative ${(data.verification_attempts || 0) + 1}/3.`);
            }
        } catch (err) {
            console.error(err);
            alert("Erreur technique lors de la vérification.");
        }
    };

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            minHeight: '100vh', padding: '1rem',
            background: 'radial-gradient(circle at center, #1a4d2e 0%, #0c2b1a 100%)',
            position: 'relative', overflow: 'hidden'
        }}>
            {/* Background Pattern Icons (Simulated with CSS) */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30l10-10m0 0l-5-5m5 5l5 5' stroke='%23ffffff10' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
                opacity: 0.3
            }}></div>

            <Link to="/" style={{ position: 'absolute', top: '2rem', left: '2rem', color: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </Link>

            <div className="card" style={{
                width: '100%', maxWidth: '450px', padding: '2rem 1.5rem', border: 'none',
                borderRadius: '40px', backgroundColor: '#fdfdfd', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative', zIndex: 1, margin: '2rem 0'
            }}>
                {/* Green User Icon Box */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <div style={{
                        width: '70px', height: '70px', backgroundColor: '#10b981', borderRadius: '22px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)',
                        transform: 'rotate(-2deg)'
                    }}>
                        <User size={32} strokeWidth={2.5} />
                    </div>
                </div>

                {/* Logo Section */}
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
                        <span style={{ color: '#065f46' }}>sama</span>
                        <span style={{ color: '#f59e0b' }}>technicien</span>
                        <span style={{ color: '#065f46' }}>.com</span>
                    </div>
                </div>

                <h2 style={{
                    textAlign: 'center', marginBottom: '0.4rem', fontSize: '2rem',
                    fontWeight: '900', color: '#111', fontFamily: "'Outfit', sans-serif",
                    letterSpacing: '-1px'
                }}>
                    Créer un compte
                </h2>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Rejoignez la communauté des techniciens
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Nom complet */}
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '600', color: '#333', fontSize: '0.85rem' }}>
                            Nom Complet
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            required
                            value={formData.fullName}
                            onChange={handleChange}
                            style={{
                                width: '100%', padding: '0.75rem 1rem', borderRadius: '15px',
                                border: '2px solid #eef2f1', backgroundColor: '#fcfdfd', fontSize: '0.9rem',
                                outline: 'none', transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#10b981'}
                            onBlur={(e) => e.target.style.borderColor = '#eef2f1'}
                            placeholder="Moussa Diop"
                        />
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '600', color: '#333', fontSize: '0.85rem' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            style={{
                                width: '100%', padding: '0.75rem 1rem', borderRadius: '15px',
                                border: '2px solid #eef2f1', backgroundColor: '#fcfdfd', fontSize: '0.9rem',
                                outline: 'none', transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#10b981'}
                            onBlur={(e) => e.target.style.borderColor = '#eef2f1'}
                            placeholder="moussa@exemple.com"
                        />
                    </div>

                    {/* Téléphone */}
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '600', color: '#333', fontSize: '0.85rem' }}>
                            Téléphone
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            style={{
                                width: '100%', padding: '0.75rem 1rem', borderRadius: '15px',
                                border: '2px solid #eef2f1', backgroundColor: '#fcfdfd', fontSize: '0.9rem',
                                outline: 'none', transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#10b981'}
                            onBlur={(e) => e.target.style.borderColor = '#eef2f1'}
                            placeholder="+221 77 000 00 00"
                        />
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '600', color: '#333', fontSize: '0.85rem' }}>
                            Mot de passe (8 car. min)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                style={{
                                    width: '100%', padding: '0.75rem 3rem 0.75rem 1rem', borderRadius: '15px',
                                    border: '2px solid #eef2f1', backgroundColor: '#fcfdfd', fontSize: '0.9rem',
                                    outline: 'none', transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                onBlur={(e) => e.target.style.borderColor = '#eef2f1'}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '600', color: '#333', fontSize: '0.85rem' }}>
                            Confirmer Mot de passe
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                style={{
                                    width: '100%', padding: '0.75rem 3rem 0.75rem 1rem', borderRadius: '15px',
                                    border: '2px solid #eef2f1', backgroundColor: '#fcfdfd', fontSize: '0.9rem',
                                    outline: 'none', transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                onBlur={(e) => e.target.style.borderColor = '#eef2f1'}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{
                                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'
                                }}
                            >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Location */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '600', color: '#333', fontSize: '0.8rem' }}>Ville</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Dakar"
                                style={{
                                    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '12px',
                                    border: '2px solid #eef2f1', backgroundColor: '#fcfdfd', fontSize: '0.85rem', outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                onBlur={(e) => e.target.style.borderColor = '#eef2f1'}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '600', color: '#333', fontSize: '0.8rem' }}>Quartier</label>
                            <input
                                type="text"
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                placeholder="Plateau"
                                style={{
                                    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '12px',
                                    border: '2px solid #eef2f1', backgroundColor: '#fcfdfd', fontSize: '0.85rem', outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                onBlur={(e) => e.target.style.borderColor = '#eef2f1'}
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#333', fontSize: '0.85rem' }}>
                            Je suis :
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <label style={{
                                flex: 1, cursor: 'pointer', padding: '0.6rem',
                                border: `2px solid ${formData.role === 'technician' ? '#10b981' : '#eef2f1'}`,
                                borderRadius: '15px', textAlign: 'center',
                                backgroundColor: formData.role === 'technician' ? '#f0fdf4' : '#fcfdfd',
                                fontSize: '0.85rem', transition: 'all 0.3s ease'
                            }}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="technician"
                                    checked={formData.role === 'technician'}
                                    onChange={handleChange}
                                    style={{ display: 'none' }}
                                />
                                <span style={{ fontWeight: '600', color: formData.role === 'technician' ? '#065f46' : '#666' }}>Technicien</span>
                            </label>

                            <label style={{
                                flex: 1, cursor: 'pointer', padding: '0.6rem',
                                border: `2px solid ${formData.role === 'client' ? '#10b981' : '#eef2f1'}`,
                                borderRadius: '15px', textAlign: 'center',
                                backgroundColor: formData.role === 'client' ? '#f0fdf4' : '#fcfdfd',
                                fontSize: '0.85rem', transition: 'all 0.3s ease'
                            }}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="client"
                                    checked={formData.role === 'client'}
                                    onChange={handleChange}
                                    style={{ display: 'none' }}
                                />
                                <span style={{ fontWeight: '600', color: formData.role === 'client' ? '#065f46' : '#666' }}>Client</span>
                            </label>
                        </div>
                    </div>

                    {/* Specialty Select - Only for Technicians */}
                    {formData.role === 'technician' && (
                        <div style={{ marginBottom: '0.75rem' }}>
                             <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '600', color: '#333', fontSize: '0.8rem' }}>Spécialité</label>
                            <select
                                name="specialty"
                                value={formData.specialty}
                                onChange={handleChange}
                                style={{
                                    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '12px',
                                    border: '2px solid #eef2f1', backgroundColor: '#fcfdfd', fontSize: '0.85rem', outline: 'none'
                                }}
                            >
                                <option value="Informatique">Informatique</option>
                                <option value="Reparateur telephone">Reparateur telephone</option>
                                <option value="Reparateur imprimante">Reparateur imprimante</option>
                                <option value="Réseaux">Réseaux</option>
                                <option value="Maintenancier">Maintenancier</option>
                                <option value="Mécanicien">Mécanicien</option>
                                <option value="Maçon">Maçon</option>
                                <option value="Plombier">Plombier</option>
                                <option value="Menuisier">Menuisier</option>
                                <option value="Sérigraphie">Sérigraphie</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                    )}

                    {/* Image Upload */}
                    {formData.role === 'technician' && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '600', color: '#333', fontSize: '0.8rem' }}>Photo de profil (Optionnel)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{
                                    width: '100%', padding: '0.5rem', borderRadius: '12px',
                                    border: '2px solid #eef2f1', backgroundColor: '#fcfdfd', fontSize: '0.8rem'
                                }}
                            />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{
                        width: '100%', padding: '1rem', borderRadius: '18px',
                        fontSize: '1rem', fontWeight: 'bold', backgroundColor: '#059669',
                        boxShadow: '0 8px 16px rgba(5, 150, 105, 0.3)', marginTop: '0.5rem'
                    }}>
                        M'inscrire
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>
                    En vous inscrivant, vous acceptez nos <Link to="/terms" style={{ color: '#10b981' }}>Conditions Générales</Link> et la <Link to="/terms" style={{ color: '#10b981' }}>Politique de Confidentialité</Link>.
                </p>

                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#444' }}>
                    Compte existant ? <Link to="/login" style={{ color: '#059669', fontWeight: 'bold', textDecoration: 'none' }}>Se connecter</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
