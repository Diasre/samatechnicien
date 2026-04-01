import React, { useState, useEffect } from 'react';
import { User, Lock, Save, ArrowLeft, QrCode, Camera, LogOut, Power, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { isNative, isAndroid } from '../utils/platform';
import { Html5Qrcode } from "html5-qrcode";

const ProfileSettings = () => {
    const navigate = useNavigate();
    const localUser = JSON.parse(localStorage.getItem('user'));
    const [user, setUser] = useState(localUser);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        currentPassword: '',
        password: '',
        confirmPassword: '',
        // Technician specific fields
        specialty: '',
        city: '',
        district: '',
        skills: '',
        description: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const [qrData, setQrData] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!localUser?.id) return;

            try {
                // 0. VÉRIFICATION D'IDENTITÉ SUPABASE (Crucial pour la sécurité RLS)
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser && authUser.id !== localUser.id) {
                    console.log("🔄 Décalage d'identité détecté dans ProfileSettings!");
                    const correctedUser = { ...localUser, id: authUser.id };
                    localStorage.setItem('user', JSON.stringify(correctedUser));
                    await supabase.rpc('fix_my_id', { new_id: authUser.id, user_phone: localUser.phone });
                    localUser.id = authUser.id; 
                }

                let { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', localUser.id)
                    .maybeSingle();

                // 🛡️ RÉPARATION SILENCIEUSE DES ANCIENS COMPTES (ex: ID "104")
                if (error || !data) {
                    console.log("🔍 Profil non trouvé dans ProfileSettings, tentative par téléphone...");
                    const { data: userByPhone } = await supabase.from('users').select('*').eq('phone', localUser.phone).maybeSingle();
                    
                    if (userByPhone && userByPhone.id !== localUser.id) {
                        console.log("🛠️ Réparation d'ID détectée...");
                        await supabase.rpc('fix_my_id', { new_id: localUser.id, user_phone: localUser.phone });
                        const { data: fixedUser } = await supabase.from('users').select('*').eq('id', localUser.id).single();
                        if (fixedUser) data = fixedUser;
                    }
                }

                if (data) {
                    setUser(data);
                    setFormData(prev => ({
                        ...prev,
                        fullName: data.fullname || data.full_name || data.fullName || '',
                        email: data.email,
                        phone: data.phone || '',
                        specialty: data.specialty || '',
                        city: data.city || '',
                        district: data.district || '',
                        skills: data.skills || '',
                        description: data.description || ''
                    }));
                    setPreviewImage(data.image);
                }
            } catch (error) {
                console.error("Error loading user:", error);
            }
        };

        fetchUserData();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const uploadProfileImage = async (userId) => {
        if (!imageFile) return null;

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `avatars/${userId}_${Date.now()}.${fileExt}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('products') // Reuse products bucket for simplicity
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('products').getPublicUrl(fileName);
            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            return null;
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            alert("Les mots de passe ne correspondent pas.");
            return;
        }

        // Validation Email (Masquée ou auto-gérée)

        // Politique de sécurité du mot de passe (Code PIN 4 chiffres)
        if (formData.password) {
            if (formData.password.length !== 4 || !/^\d{4}$/.test(formData.password)) {
                alert('Le nouveau code secret doit contenir exactement 4 chiffres.');
                setIsSaving(false);
                return;
            }
        }

        setIsSaving(true);
        try {
            // 1. Verify Authentication (Optional for Legacy users)
            const { data: { user: authUser } } = await supabase.auth.getUser();
            
            // Detect correct column name for generic 'fullName'
            const nameColumn = Object.keys(user).find(k => ['fullname', 'full_name', 'fullName'].includes(k)) || 'fullname';

            // 2. Upload Image
            let imageUrl = user.image;
            if (imageFile) {
                const url = await uploadProfileImage(user.id);
                if (url) imageUrl = url;
            }

            // 3. Update User Profile (Public Table)
            // Ensure we only send defined fields AND only if they changed (to avoid unique constraint issues)
            const updates = {};
            if (formData.fullName && formData.fullName !== user[nameColumn]) updates[nameColumn] = formData.fullName;
            if (formData.email && formData.email !== user.email) updates.email = formData.email;
            if (formData.phone !== user.phone) updates.phone = formData.phone;
            if (imageUrl && imageUrl !== user.image) updates.image = imageUrl;

            // Technician specific fields
            if (user.role === 'technician') {
                if (formData.specialty !== undefined && formData.specialty !== user.specialty) updates.specialty = formData.specialty;
                if (formData.city !== undefined && formData.city !== user.city) updates.city = formData.city;
                if (formData.district !== undefined && formData.district !== user.district) updates.district = formData.district;
                if (formData.skills !== undefined && formData.skills !== user.skills) updates.skills = formData.skills;
                if (formData.description !== undefined && formData.description !== user.description) updates.description = formData.description;
            }

            // Mise à jour de la colonne password pour rester synchronisé avec Auth
            if (formData.password) {
                updates.password = formData.password;
            }

            // If nothing changed, stop here
            if (Object.keys(updates).length === 0 && !formData.password) {
                alert("Aucune modification détectée.");
                setIsSaving(false);
                return;
            }

            // TRY 1: Direct Update
            let updateSuccess = false;

            const { data: updateData, error: profileError } = await supabase
                .from('users')
                .update(updates)
                .eq('id', (authUser?.id || user.id).toString()) 
                .select();

            if (!profileError && updateData && updateData.length > 0) {
                updateSuccess = true;
            } else {
                console.warn("Direct update failed or returned no data (RLS blocking?). Trying RPC...", profileError);
            }

            if (!updateSuccess) {
                const p_id = (authUser?.id || user.id).toString();
                const rpcParams = {
                    p_id,
                    p_fullname: formData.fullName || null,
                    p_phone: formData.phone || null,
                    p_city: formData.city || null,
                    p_district: formData.district || null,
                    p_skills: formData.skills || null,
                    p_specialty: formData.specialty || null,
                    p_description: formData.description || null,
                    p_image: imageUrl || null,
                    p_email: formData.email || null
                };

                const { data: updatedData, error: rpcError } = await supabase.rpc('update_profile_v4', rpcParams);

                if (rpcError) {
                    console.error("RPC v4 error:", rpcError);
                    throw rpcError;
                }
                
                if (updatedData && updatedData.length > 0) {
                   updateSuccess = true;
                } else {
                   console.error("RPC v4 returned no data.");
                }
            }

            // 4. Update Password (Supabase Auth if possible)
            if (formData.password && authUser) {
                const { error: authError } = await supabase.auth.updateUser({
                    password: formData.password + "00"
                });
                if (authError) console.warn("Auth password update failed (legacy account?):", authError.message);
            }

            // 5. Déconnexion automatique si le mot de passe a été changé
            if (formData.password) {
                localStorage.removeItem('user');
                await supabase.auth.signOut();
                alert("Profil et mot de passe mis à jour ! Veuillez vous reconnecter avec votre nouveau code.");
                window.location.href = '/login';
                return;
            }

            alert("Profil mis à jour avec succès !");

            // Update local storage
            const updatedLocalUser = { ...user, ...updates };
            localStorage.setItem('user', JSON.stringify(updatedLocalUser));
            setUser(updatedLocalUser);

            // Clear password fields
            setFormData(prev => ({ ...prev, currentPassword: '', password: '', confirmPassword: '' }));

            // Force reload if needed
            if (updates.role && updates.role !== user.role) {
                window.location.reload();
            }

        } catch (error) {
            console.error(error);
            // Handle specific "duplicate key" error
            if (error.message.includes("users_email_key")) {
                alert("Erreur: Cet email est déjà utilisé par un autre compte.");
            } else {
                alert("Erreur lors de la mise à jour: " + error.message);
            }
        }
        setIsSaving(false);
    };

    const generateLoginQR = () => {
        // Use current session data
        const data = {
            type: 'SAMATECH_LOGIN',
            email: user.email,
            id: user.id
        };
        setQrData(JSON.stringify(data));
        setShowQRModal(true);
    };

    // 📸 LOGIQUE DE SCAN (Pour connecter un ordinateur)
    const startScanner = async () => {
        setIsScanning(true);
        setScanError(null);
        
        setTimeout(() => {
            const html5QrCode = new Html5Qrcode("reader");
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            html5QrCode.start(
                { facingMode: "environment" }, 
                config,
                async (decodedText) => {
                    // ✅ CODE SCANNÉ !
                    try {
                        await html5QrCode.stop();
                        setIsScanning(false);
                        
                        // Dire à Supabase que cet ordinateur est maintenant autorisé
                        const { error: syncError } = await supabase
                            .from('web_login_sessions')
                            .update({ 
                                user_id: user.id, 
                                status: 'confirmed' 
                            })
                            .eq('id', decodedText);

                        if (syncError) throw syncError;
                        alert("✅ Succès ! Votre ordinateur est maintenant connecté.");
                    } catch (err) {
                        console.error("Erreur sync QR:", err);
                        alert("❌ Erreur de synchronisation. Réessayez.");
                    }
                },
                (errorMessage) => {
                    // On ignore les erreurs de scan continu
                }
            ).catch(err => {
                setScanError("Accès caméra refusé ou impossible.");
                setIsScanning(false);
            });
        }, 300);
    };



    const handleQuitTechnicianMode = async () => {
        if (!window.confirm("⚠️ Voulez-vous vraiment quitter le mode Technicien ? Vous ne serez plus visible dans la liste des experts et vos services seront suspendus.")) {
            return;
        }

        setIsSaving(true);
        try {
            // 1. Mise à jour du rôle en base de données
            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    role: 'client', 
                    availability: 'unavailable' // On marque comme indisponible par défaut
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            alert("Vous êtes maintenant redescendu au rôle de Client avec succès.");

            // 2. Mise à jour du LocalStorage
            const updatedUser = { ...user, role: 'client', availability: 'unavailable' };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // 3. Redirection vers l'accueil (car le dashboard expert ne sera plus accessible)
            window.location.href = '/';

        } catch (error) {
            console.error("Error quitting technician mode:", error);
            alert("Erreur lors du changement de rôle : " + error.message);
        }
        setIsSaving(false);
    };

    const handleDeleteAccount = async () => {
        const confirm1 = window.confirm("⚠️ ATTENTION : Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible et toutes vos données (profil, messages, devis) seront définitivement effacées.");
        if (!confirm1) return;

        const confirm2 = window.confirm("Dernière vérification : Toute suppression est DÉFINITIVE. Êtes-vous ABSOLUMENT sûr ?");
        if (!confirm2) return;

        setIsSaving(true);
        try {
            // 1. Appel de la nouvelle fonction FORCE avec l'ID explicite ✨🚀
            const { error: rpcError } = await supabase.rpc('delete_user_account_force', {
                p_user_id: user.id
            });

            if (rpcError) {
                console.error("RPC delete failed:", rpcError);
                alert("Erreur de suppression (RPC) : " + rpcError.message);
                
                // Fallback direct avec alerte
                const { error: dbError } = await supabase.from('users').delete().eq('id', user.id);
                if (dbError) {
                    alert("Erreur de suppression directe (BD) : " + dbError.message);
                    throw dbError;
                }
            }

            // 3. Déconnexion et nettoyage
            localStorage.removeItem('user');
            await supabase.auth.signOut();
            
            alert("Votre compte a été supprimé avec succès. Au revoir !");
            window.location.href = '/login';

        } catch (error) {
            console.error("Error deleting account:", error);
            alert("Erreur lors de la suppression du compte : " + error.message);
        }
        setIsSaving(false);
    };

    if (!localUser) return <div className="container" style={{ padding: '2rem' }}>Veuillez vous connecter.</div>;

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '600px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', textDecoration: 'none', color: '#666', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Retour à l'accueil
            </Link>

            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ textAlign: 'left', flex: 1, minWidth: '200px' }}>
                        {/* Image Upload */}
                        <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '1rem' }}>
                            <img
                                src={previewImage || user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random&color=fff&size=150`}
                                alt="Profile"
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                            />
                            <label htmlFor="avatar-upload" style={{
                                position: 'absolute', bottom: 0, right: 0,
                                backgroundColor: 'var(--primary-color)', color: 'white',
                                borderRadius: '50%', width: '30px', height: '30px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', border: '2px solid white'
                            }}>
                                <Camera size={16} />
                            </label>
                            <input id="avatar-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                        </div>

                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Paramètres du Profil</h2>
                        <p style={{ color: '#666', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>{user.role === 'technician' ? 'Technicien' : 'Client'}</p>
                    </div>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                        {/* 💎 NOUVEAU BOUTON : SCANNER UN ORDINATEUR (Seulement sur Mobile) */}
                        {(isNative || isAndroid) && (
                            <div
                                onClick={startScanner}
                                style={{
                                    padding: '12px', border: '1px solid #10b981', borderRadius: '15px',
                                    cursor: 'pointer', backgroundColor: '#ecfdf5', transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%'
                                }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#d1fae5'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = '#ecfdf5'}
                            >
                                <div style={{ background: '#10b981', padding: '8px', borderRadius: '10px', color: '#fff' }}>
                                    <Smartphone size={20} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#10b981', display: 'block' }}>Connecter PC</span>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Scanner un ordinateur</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>



                <form onSubmit={handleSave}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nom complet</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Téléphone</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                readOnly={true}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#f5f5f5' }}
                            />
                        </div>

                    {/* Technician Specific Fields */}
                    {user.role === 'technician' && (
                        <div style={{ padding: '1.5rem', backgroundColor: '#f9f9f9', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #eee' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: 0, color: 'var(--primary-color)' }}>Informations Professionnelles</h3>

                                {/* Status Toggle */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                    <span style={{ fontWeight: 'bold', color: user.availability === 'unavailable' ? '#dc3545' : '#28a745' }}>
                                        {user.availability === 'unavailable' ? '🔴 Indisponible' : '🟢 Disponible'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const newStatus = user.availability === 'unavailable' ? 'available' : 'unavailable';
                                            try {
                                                await supabase.from('users').update({ availability: newStatus }).eq('id', user.id);
                                                const updated = { ...user, availability: newStatus };
                                                setUser(updated);
                                                localStorage.setItem('user', JSON.stringify(updated));
                                            } catch (e) {
                                                console.error(e);
                                                alert("Erreur maj statut");
                                            }
                                        }}
                                        style={{
                                            padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc',
                                            backgroundColor: 'white', cursor: 'pointer', fontSize: '0.75rem'
                                        }}
                                    >
                                        Changer
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Spécialité</label>
                                <select
                                    name="specialty"
                                    value={formData.specialty}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white' }}
                                >
                                    <option value="">Choisir une spécialité</option>
                                    <option value="Réparation Mobile">Réparation Mobile</option>
                                    <option value="Informatique">Informatique</option>
                                    <option value="Électronique">Électronique</option>
                                    <option value="Froid et Climatisation">Froid et Climatisation</option>
                                    <option value="Électricité">Électricité</option>
                                    <option value="Plomberie">Plomberie</option>
                                    <option value="Sérigraphie">Sérigraphie</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Ville</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Quartier</label>
                                    <input
                                        type="text"
                                        name="district"
                                        value={formData.district}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Compétences (séparez par des virgules)</label>
                                <input
                                    type="text"
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Réparation iPhone, Soudure, Déblocage..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>

                            <div style={{ marginBottom: '0' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Description / Biographie</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder="Décrivez vos compétences et services..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Lock size={18} /> Sécurité et Mot de passe
                        </h3>

                        <div style={{ borderTop: '1px dashed #eee', paddingTop: '1rem' }}>
                            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
                                Laissez ces champs vides si vous ne souhaitez pas changer votre mot de passe.
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                Nouveau code secret (4 chiffres)
                            </label>
                            <input
                                type="password"
                                name="password"
                                maxLength="4"
                                inputMode="numeric"
                                pattern="\d*"
                                value={formData.password}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setFormData({ ...formData, password: val });
                                }}
                                placeholder="Nouveau code"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', letterSpacing: formData.password ? '4px' : 'normal', fontWeight: 'bold' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                Confirmer le nouveau code
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                maxLength="4"
                                inputMode="numeric"
                                pattern="\d*"
                                value={formData.confirmPassword}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setFormData({ ...formData, confirmPassword: val });
                                }}
                                placeholder="Confirmer"
                                style={{ 
                                    width: '100%', padding: '0.75rem', borderRadius: '8px', 
                                    border: `1px solid ${formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword ? '#ef4444' : '#ddd'}`, 
                                    letterSpacing: formData.confirmPassword ? '4px' : 'normal', fontWeight: 'bold' 
                                }}
                            />
                            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: 'bold' }}>
                                    ⚠️ Les codes ne correspondent pas
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '1rem' }}
                    >
                        <Save size={18} />
                        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>

                    <div style={{ marginTop: '3rem', borderTop: '2px solid #fee2e2', paddingTop: '2rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
                            <div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
                                            localStorage.removeItem('user');
                                            await supabase.auth.signOut();
                                            window.location.href = '/login';
                                        }
                                    }}
                                    style={{ 
                                        width: '70px', height: '70px', backgroundColor: '#e11d48', 
                                        color: 'white', border: 'none', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', boxShadow: '0 8px 16px rgba(225, 29, 72, 0.4)',
                                        margin: '0 auto'
                                    }}
                                >
                                    <Power size={30} strokeWidth={2.5} />
                                </button>
                                <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: '#e11d48', fontWeight: 'bold' }}>Se déconnecter</p>
                            </div>

                            <div style={{ backgroundColor: '#fff', border: '1px solid #fee2e2', padding: '1.5rem', borderRadius: '20px', width: '100%', maxWidth: '300px' }}>
                                <p style={{ fontSize: '0.8rem', color: '#991b1b', marginBottom: '1rem', fontWeight: '500' }}>Actions sur le compte</p>
                                {/* Supprimer le compte */}
                                <button
                                    type="button"
                                    onClick={handleDeleteAccount}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        width: '100%', padding: '0.7rem', backgroundColor: '#fef2f2', color: '#dc2626',
                                        border: '1px solid #fecaca', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={16} /> Supprimer mon compte
                                </button>
                            </div>
                        </div>
                    </div>
                </form>


            </div >

            {/* Modal pour le QR Code */}
            {
                showQRModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000,
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        padding: '2rem'
                    }} onClick={() => setShowQRModal(false)}>
                        <div className="card animate-scale-up" style={{
                            backgroundColor: 'white', padding: '2rem', textAlign: 'center',
                            maxWidth: '400px', width: '100%'
                        }} onClick={e => e.stopPropagation()}>
                            <h3 style={{ marginBottom: '1rem' }}>Votre QR Code</h3>
                            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' }}>
                                Scannez ce code avec l'application SamaTechnicien sur votre autre appareil pour vous connecter.
                            </p>

                            <div style={{ padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '12px', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <QRCodeSVG value={qrData} size={200} />
                            </div>

                            <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#856404' }}>
                                    ⚠️ <strong>Attention:</strong> Ce code contient vos identifiants. Ne le partagez jamais et ne le montrez pas à d'autres personnes.
                                </p>
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                onClick={() => setShowQRModal(false)}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Modal Scanner Caméra App */}
            {isScanning && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'black', zIndex: 4000,
                    display: 'flex', flexDirection: 'column', color: 'white'
                }}>
                    <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>Scanner le code QR</h3>
                        <button onClick={() => setIsScanning(false)} style={{ background: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold' }}>Fermer</button>
                    </div>
                    
                    <div id="reader" style={{ flex: 1, width: '100%' }}></div>
                    
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <p>Pointez votre caméra vers l'écran de l'ordinateur</p>
                    </div>
                </div>
            )}
        </div >
    );
};

export default ProfileSettings;
