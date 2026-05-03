import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, Lock, Phone, Eye, EyeOff, MapPin, CheckCircle2, Hammer, Search, Navigation } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [phoneError, setPhoneError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [gettingLocation, setGettingLocation] = useState(false);
    const [locationStatus, setLocationStatus] = useState('');

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
        specialty: 'Informaticien',
        otherSpecialty: '',
        city: '',
        district: '',
        username: '',
        latitude: null,
        longitude: null,
        image: null,
        acceptedTerms: false
    });

    const specialtiesList = [
        "Informaticien", "Soudeur", "Plombier", "Mecanicien Automobile", "Telephone", 
        "Frigo", "Macon", "Manoeuvre", "Camera Monteur", 
        "Aluminium", "Vigile", "Imprimante", "Réseau", "Décoration Intérieur", 
        "Agronome en protection des Végétaux", "Agriculture", "Vidéo Surveillance", "Maintenancier", "Autre"
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Validation helpers
    const getFullPhone = (p) => {
        let clean = p.trim().replace(/\s+/g, '');
        if (clean.startsWith('+')) return clean;
        const digits = clean.replace(/\D/g, '').replace(/^221/, '').replace(/^00/, '');
        return `+221${digits}`;
    };

    const isStep1Valid = formData.phone.trim().length >= 8 && formData.role;
    
    const isStep2Valid = (
        formData.fullName.trim().length >= 3 &&
        formData.city.trim().length >= 2 &&
        formData.password.length === 4 &&
        formData.acceptedTerms &&
        (formData.role === 'client' || (
            formData.role === 'technician' && 
            (formData.latitude && formData.longitude) &&
            (formData.specialty !== 'Autre' ? formData.specialty : formData.otherSpecialty.trim().length >= 2)
        ))
    );

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) setFormData({ ...formData, image: file });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        if (!formData.acceptedTerms) {
            return alert("Veuillez accepter les conditions générales pour continuer.");
        }
        
        setLoading(true);

        try {
            const fullPhone = getFullPhone(formData.phone);
            const phoneClean = fullPhone.replace(/\+/g, '').replace(/^221/, '');
            const finalEmail = `${phoneClean}@samatechnicien.dummy`;

            console.log('📡 Inscription directe...');

            // 1. Création de l'utilisateur dans Supabase Auth (ajout '00' pour contourner min 6 caractères)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                phone: fullPhone,
                password: formData.password + '00',
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: formData.role,
                        phone: phoneClean,
                        city: formData.city,
                        district: formData.district,
                        latitude: formData.latitude,
                        longitude: formData.longitude,
                        specialty: formData.role === 'technician' ? (formData.specialty === 'Autre' ? formData.otherSpecialty : formData.specialty) : null,
                        image: null,
                        email: finalEmail
                    }
                }
            });

            if (authError) throw authError;

            const authUser = authData?.user;

            if (authUser) {
                // 2. Création du profil public
                const profileData = {
                    id: authUser.id,
                    fullname: formData.fullName,
                    phone: phoneClean,
                    role: formData.role,
                    city: formData.city,
                    district: formData.district,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    password: formData.password,
                    email: finalEmail,
                    specialty: formData.role === 'technician' ? (formData.specialty === 'Autre' ? formData.otherSpecialty : formData.specialty) : null,
                    isblocked: 0,
                    commentsenabled: 1,
                    email_verified: true
                };

                const { error: dbError } = await supabase.from('users').upsert(profileData);
                if (dbError) throw dbError;

                // 3. Session locale
                localStorage.setItem('user', JSON.stringify({ ...profileData, fullName: profileData.fullname }));
                
                alert(`Bienvenue ! Votre compte est créé avec succès.`);
                navigate(formData.role === 'technician' ? '/expert-dashboard' : '/');
            }
        } catch (error) {
            console.error('❌ Erreur Inscription:', error);
            alert("Erreur lors de l'inscription : " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();
        alert("🔍 Tentative de vérification avec le numéro : " + getFullPhone(formData.phone));
        if (otpCode.length !== 6) return alert("Veuillez entrer le code à 6 chiffres.");

        setLoading(true);
        const fullPhone = getFullPhone(formData.phone);
        const phoneClean = fullPhone.replace(/\+/g, '').replace(/^221/, '');
        const finalEmail = `${phoneClean}@samatechnicien.dummy`;

        try {
            console.log('📡 Vérification du code SMS...');
            // 1. Vérification du SMS OTP
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                phone: fullPhone,
                token: otpCode,
                type: 'signup'
            });

            let userData = verifyData?.user;

            if (verifyError) {
                // Tenta avec type 'sms' si 'signup' échoue
                const { data: verifyData2, error: verifyError2 } = await supabase.auth.verifyOtp({
                    phone: fullPhone,
                    token: otpCode,
                    type: 'sms'
                });
                if (verifyError2) throw verifyError2;
                userData = verifyData2?.user;
            }

            // 2. Création/Maj du profil dans la table USERS
            if (userData) {
                alert("✅ Code validé ! Création de votre profil..."); 
                
                const profileData = {
                    id: userData.id,
                    full_name: formData.fullName, // Correction ici
                    phone: phoneClean,
                    role: formData.role,
                    city: formData.city,
                    district: formData.district,
                    username: phoneClean, 
                    password: formData.password,
                    email: finalEmail,
                    specialty: formData.role === 'technician' ? (formData.specialty === 'Autre' ? formData.otherSpecialty : formData.specialty) : null,
                    isblocked: 0,
                    commentsenabled: 1
                };

                const { error: dbError } = await supabase.from('users').upsert(profileData);
                if (dbError) throw dbError;
                
                alert("✅ Profil enregistré !");
                
                // Stockage local pour rester connecté
                localStorage.setItem('user', JSON.stringify({ ...profileData, fullName: profileData.full_name }));
                
                alert(`Félicitations ${formData.fullName} ! Votre compte est créé.`);
                navigate(formData.role === 'technician' ? '/expert-dashboard' : '/');
            }
        } catch (error) {
            console.error('❌ Erreur finale:', error);
            alert("Erreur: " + error.message);
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
                <div style={{ width: '40px', height: '6px', borderRadius: '10px', background: step >= 1 ? '#007bff' : 'rgba(255,255,255,0.3)' }} />
                <div style={{ width: '40px', height: '6px', borderRadius: '10px', background: step >= 2 ? '#007bff' : 'rgba(255,255,255,0.3)' }} />
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
                                    border: `2px solid ${formData.role === 'client' ? '#007bff' : 'rgba(255,255,255,0.2)'}`,
                                    background: formData.role === 'client' ? '#007bff' : 'rgba(255,255,255,0.1)',
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
                                    border: `2px solid ${formData.role === 'technician' ? '#007bff' : 'rgba(255,255,255,0.8)'}`,
                                    background: formData.role === 'technician' ? '#007bff' : 'rgba(255,255,255,0.7)',
                                    backdropFilter: 'blur(10px)', color: formData.role === 'technician' ? '#fff' : '#1e293b', cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                }}
                            >
                                <Hammer size={32} color={formData.role === 'technician' ? '#fff' : '#007bff'} />
                                <span style={{ fontWeight: '700', fontSize: '1rem', color: formData.role === 'technician' ? '#fff' : '#1e293b' }}>Technicien</span>
                            </button>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#007bff', background: '#fff', width: 'fit-content', padding: '2px 8px', borderRadius: '6px', transform: 'translateY(10px) translateX(15px)', zIndex: 1, position: 'relative', border: '1px solid #f1f5f9' }}>Téléphone</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <div style={{ position: 'absolute', left: '1rem', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', zIndex: 2 }}>
                                    <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>🇸🇳</span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px' }}><path d="m6 9 6 6 6-6"/></svg>
                                </div>
                                <input 
                                    type="tel" 
                                    name="phone" 
                                    value={formData.phone} 
                                    onChange={handleChange}
                                    style={{ 
                                        width: '100%', 
                                        padding: '1.2rem 1.2rem 1.2rem 4.5rem', 
                                        borderRadius: '20px', 
                                        border: '2px solid #007bff', 
                                        background: 'rgba(255,255,255,0.8)', 
                                        color: '#1e293b', 
                                        fontSize: '1.1rem', 
                                        outline: 'none', 
                                        backdropFilter: 'blur(10px)',
                                        fontWeight: '500',
                                        letterSpacing: '1px'
                                    }}
                                    placeholder="770000000"
                                />
                                <div style={{ position: 'absolute', right: '1rem', background: phoneError ? '#fee2e2' : '#007bff20', color: phoneError ? '#dc2626' : '#007bff', padding: '4px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800' }}>
                                    {phoneError ? '!' : 'Valide ✓'}
                                </div>
                            </div>
                            {phoneError && (
                                <div style={{
                                    color: '#dc2626', 
                                    fontSize: '0.8rem', 
                                    marginTop: '8px', 
                                    textAlign: 'center', 
                                    fontWeight: 'bold', 
                                    backgroundColor: '#fee2e2', 
                                    padding: '8px', 
                                    borderRadius: '12px',
                                    animation: 'fadeIn 0.3s ease'
                                }}>
                                    {phoneError}
                                </div>
                            )}
                        </div>

                        <button 
                            disabled={!isStep1Valid || loading}
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    setPhoneError('');
                                    const rawPhone = formData.phone.trim().replace(/\s+/g, '').replace(/\+221/, '').replace(/\+216/, '');
                                    
                                    const isValidPhone = /^\d{8,12}$/.test(rawPhone);

                                    if (!isValidPhone) {
                                        setPhoneError("Numéro invalide (min 8 chiffres)");
                                        setLoading(false);
                                        return;
                                    }

                                    const fullPhone = getFullPhone(formData.phone);
                                    const phoneClean = fullPhone.replace(/\+/g, '').replace(/^221/, '');
                                    const { data } = await supabase.from('users').select('id, role').eq('phone', phoneClean).maybeSingle();
                                    
                                    if (data) {
                                        const roleLabel = data.role === 'technician' ? 'Technicien' : 'Client';
                                        setPhoneError(`Ce numéro est déjà lié à un compte ${roleLabel}.`);
                                        setTimeout(() => navigate('/login'), 3000);
                                    } else {
                                        setStep(2);
                                    }
                                } catch (err) {
                                    console.error(err);
                                    setStep(2); // Fallback to allow retry in next step if error
                                }
                                setLoading(false);
                            }}
                            style={{ 
                                width: '100%', padding: '1.2rem', borderRadius: '22px', border: 'none', 
                                background: isStep1Valid ? '#007bff' : '#cbd5e1', 
                                color: '#fff', fontWeight: '900', fontSize: '1.2rem', 
                                cursor: isStep1Valid ? 'pointer' : 'not-allowed',
                                boxShadow: isStep1Valid ? '0 10px 20px rgba(0, 123, 255, 0.3)' : 'none',
                                transition: '0.3s'
                            }}
                        >
                            Continuer
                        </button>
                    </div>
                ) : step === 2 ? (
                    <div style={{ animation: 'fadeIn 0.4s ease' }}>
                        {/* Identité */}
                        <div style={{ marginBottom: '1.2rem' }}>
                             <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Nom Complet</label>
                             <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <User size={18} style={{ position: 'absolute', left: '1rem', color: '#007bff' }} />
                                <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} style={{ width: '100%', padding: '1rem 1rem 1rem 2.8rem', borderRadius: '20px', border: '2px solid #f1f5f9', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', color: '#1e293b', outline: 'none' }} placeholder="Moussa Diop" />
                             </div>
                        </div>

                        {/* Ville / Localisation */}
                        <div style={{ marginBottom: '1.2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>
                                {formData.role === 'technician' ? 'Localisation Expert' : 'Ma Ville'}
                            </label>

                            {formData.role === 'client' ? (
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: '1rem', color: '#007bff' }} />
                                    <input 
                                        type="text" name="city" required value={formData.city} onChange={handleChange} 
                                        style={{ width: '100%', padding: '1rem 1rem 1rem 2.8rem', borderRadius: '20px', border: '2px solid #f1f5f9', background: 'rgba(255,255,255,0.8)', color: '#1e293b', outline: 'none' }} 
                                        placeholder="Dakar" 
                                    />
                                </div>
                            ) : (
                                <div style={{ 
                                    background: 'rgba(255,255,255,0.8)', 
                                    border: `2px solid ${formData.latitude ? '#007bff' : '#f1f5f9'}`, 
                                    borderRadius: '24px', 
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ 
                                            width: '40px', height: '40px', borderRadius: '12px',
                                            background: formData.latitude ? '#007bff15' : '#f1f5f9',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: formData.latitude ? '#007bff' : '#64748b'
                                        }}>
                                            <MapPin size={22} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: formData.latitude ? '#007bff' : '#1e293b' }}>
                                                {locationStatus || (formData.latitude ? 'Position enregistrée ✓' : 'Position non définie')}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {formData.city && formData.district ? `${formData.district}, ${formData.city}` : 'Indiquez où vous travaillez'}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={gettingLocation}
                                        onClick={async () => {
                                            setGettingLocation(true);
                                            setLocationStatus('Recherche satellite...');
                                            try {
                                                const coordinates = await Geolocation.getCurrentPosition({
                                                    enableHighAccuracy: true
                                                });
                                                
                                                const lat = coordinates.coords.latitude;
                                                const lon = coordinates.coords.longitude;
                                                
                                                setFormData({ ...formData, latitude: lat, longitude: lon });
                                                setLocationStatus('Position trouvée !');

                                                // Tentative de reverse geocoding pour la ville/quartier
                                                try {
                                                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                                                    const addr = await res.json();
                                                    const city = addr.address.city || addr.address.town || addr.address.village || 'Dakar';
                                                    const district = addr.address.suburb || addr.address.neighbourhood || addr.address.road || 'Quartier';
                                                    
                                                    setFormData({
                                                        ...formData,
                                                        latitude: lat,
                                                        longitude: lon,
                                                        city: city,
                                                        district: district
                                                    });
                                                    setLocationStatus(`Situé à ${district}`);
                                                } catch (e) {
                                                    console.warn("Reverse geocoding failed", e);
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                alert("Impossible de récupérer la position. Assurez-vous d'avoir activé le GPS.");
                                                setLocationStatus('Erreur GPS');
                                            } finally {
                                                setGettingLocation(false);
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem',
                                            borderRadius: '15px',
                                            border: 'none',
                                            background: gettingLocation ? '#f1f5f9' : (formData.latitude ? '#007bff15' : '#007bff'),
                                            color: gettingLocation ? '#64748b' : (formData.latitude ? '#007bff' : '#fff'),
                                            fontWeight: '800',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        {gettingLocation ? (
                                            <>Sync en cours...</>
                                        ) : (
                                            <>
                                                <Navigation size={18} />
                                                {formData.latitude ? 'Actualiser ma position' : 'Géolocaliser mon atelier'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Métier (Techniciens Uniquement) */}
                        {formData.role === 'technician' && (
                            <>
                                <div style={{ marginBottom: '1.2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Votre Métier</label>
                                    
                                    {/* Barre de défilement horizontale */}
                                    <div style={{ 
                                        display: 'flex', 
                                        overflowX: 'auto', 
                                        gap: '12px', 
                                        padding: '5px 5px 15px 5px',
                                        msOverflowStyle: 'none',
                                        scrollbarWidth: 'none',
                                        WebkitOverflowScrolling: 'touch'
                                    }}>
                                        {specialtiesList.map(item => {
                                            const isSelected = formData.specialty === item;
                                            return (
                                                <div 
                                                    key={item}
                                                    onClick={() => setFormData({ ...formData, specialty: item })}
                                                    style={{
                                                        flexShrink: 0,
                                                        padding: '12px 20px',
                                                        borderRadius: '18px',
                                                        background: isSelected ? '#007bff' : '#fff',
                                                        color: isSelected ? '#fff' : '#1e293b',
                                                        border: `2px solid ${isSelected ? '#007bff' : '#f1f5f9'}`,
                                                        fontWeight: '700',
                                                        fontSize: '0.85rem',
                                                        cursor: 'pointer',
                                                        boxShadow: isSelected ? '0 8px 15px rgba(0, 123, 255, 0.2)' : '0 2px 4px rgba(0,0,0,0.02)',
                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}
                                                >
                                                    {isSelected && <CheckCircle2 size={16} />}
                                                    {item}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {formData.specialty === 'Autre' && (
                                    <div style={{ marginBottom: '1.2rem', animation: 'fadeIn 0.3s ease' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.85rem', color: '#007bff' }}>Précisez votre métier</label>
                                        <input 
                                            type="text" name="otherSpecialty" value={formData.otherSpecialty} onChange={handleChange} 
                                            style={{ width: '100%', padding: '1rem', borderRadius: '20px', border: '2px solid #007bff', background: '#fff', color: '#1e293b', outline: 'none' }} 
                                            placeholder="Ex: Menuisier, Électricien..." 
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        <div style={{ marginBottom: '1.2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#007bff' }}>Code secret (4 chiffres)</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', color: '#007bff' }} />
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
                                    style={{ width: '100%', padding: '1.2rem 1rem 1.2rem 2.8rem', borderRadius: '20px', border: '2px solid #007bff', background: 'rgba(255,255,255,0.8)', color: '#1e293b', outline: 'none', letterSpacing: formData.password ? '4px' : 'normal', fontWeight: '700' }} 
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
                                    border: `2.5px solid ${formData.acceptedTerms ? '#007bff' : '#cbd5e1'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: formData.acceptedTerms ? '#007bff' : 'rgba(255,255,255,0.5)',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    boxShadow: formData.acceptedTerms ? '0 4px 10px rgba(0, 123, 255, 0.2)' : 'none'
                                }}
                            >
                                {formData.acceptedTerms && <CheckCircle2 size={20} color="#fff" strokeWidth={3} />}
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', lineHeight: '1.4' }}>
                                J'accepte les <Link to="/terms#cgu" style={{ color: '#007bff', fontWeight: '700', textDecoration: 'none' }}>Conditions Générales</Link> et la <Link to="/terms#privacy" style={{ color: '#007bff', fontWeight: '700', textDecoration: 'none' }}>Politique de Confidentialité</Link>
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
                                disabled={loading || !isStep2Valid}
                                onClick={handleSubmit}
                                style={{ 
                                    flex: 2, padding: '1.2rem', borderRadius: '22px', border: 'none', 
                                    background: isStep2Valid ? '#007bff' : '#cbd5e1', 
                                    color: '#fff', fontWeight: '900', fontSize: '1.2rem', 
                                    cursor: isStep2Valid ? 'pointer' : 'not-allowed', 
                                    boxShadow: isStep2Valid ? '0 10px 20px rgba(0, 123, 255, 0.3)' : 'none',
                                    transition: '0.3s'
                                }}
                            >
                                {loading ? 'Création...' : "S'inscrire"}
                            </button>
                        </div>
                    </div>
                ) : null}

                <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
                    En vous inscrivant, vous acceptez nos <Link to="/terms" style={{ color: '#007bff', textDecoration: 'underline' }}>Conditions Générales</Link> et la <Link to="/terms" style={{ color: '#007bff', textDecoration: 'underline' }}>Politique de Confidentialité</Link>.
                </p>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '1.05rem', color: '#1e293b', fontWeight: '700' }}>
                    Déjà un compte ? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none', borderBottom: '2px solid #007bff', paddingBottom: '2px', marginLeft: '8px' }}>Connexion</Link>
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
