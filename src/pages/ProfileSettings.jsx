import React, { useState, useEffect } from 'react';
import { User, Lock, Save, ArrowLeft, QrCode, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';

const ProfileSettings = () => {
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
        description: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const [qrData, setQrData] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!localUser?.id) return;

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', localUser.id)
                    .single();

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

        // Validation Email (Gmail/Outlook/Yahoo/Hotmail/iCloud)
        const emailRegex = /^[a-zA-Z0-9._-]+@(gmail\.com|outlook\.com|yahoo\.com|yahoo\.fr|hotmail\.com|hotmail\.fr|icloud\.com)$/i;
        if (formData.email && !emailRegex.test(formData.email)) {
            alert("Donner une email valide (Gmail, Outlook, Yahoo, Hotmail, iCloud)");
            return;
        }

        // Politique de sécurité du mot de passe
        if (formData.password) {
            const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                alert('Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.');
                return;
            }
        }

        setIsSaving(true);
        try {
            // 1. Verify availability of update data
            // Detect correct column name for generic 'fullName'
            // We check the 'user' object keys to find if it uses 'fullname', 'full_name' or 'fullName'
            // Default to 'fullname' as it's the most common Postgres convention if not found
            const nameColumn = Object.keys(user).find(k => ['fullname', 'full_name', 'fullName'].includes(k)) || 'fullname';

            // 2. Upload Image
            let imageUrl = user.image;
            if (imageFile) {
                const url = await uploadProfileImage(user.id);
                if (url) imageUrl = url;
            }

            // 3. Update User
            // 3. Update User Profile (Public Table)
            const updates = {
                [nameColumn]: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                image: imageUrl,
                specialty: formData.specialty,
                city: formData.city,
                district: formData.district,
                description: formData.description
            };

            const { error: profileError } = await supabase
                .from('users')
                .update(updates)
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 4. Update Password (Supabase Auth)
            if (formData.password) {
                const { error: authError } = await supabase.auth.updateUser({
                    password: formData.password
                });
                if (authError) throw authError;
            }

            // Removed 'if (error) throw error;' because 'error' is not defined here.
            // profileError and authError are already checked above.

            alert("Profil mis à jour avec succès !");

            // Update local storage to reflect changes immediately
            const updatedLocalUser = { ...user, ...updates };
            // Don't store password in local storage if possible, but keep structure consistent
            localStorage.setItem('user', JSON.stringify(updatedLocalUser));
            setUser(updatedLocalUser);

            // Clear password fields
            setFormData(prev => ({ ...prev, currentPassword: '', password: '', confirmPassword: '' }));

        } catch (error) {
            console.error(error);
            alert("Erreur lors de la mise à jour: " + error.message);
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

    const handleBecomeTechnician = async () => {
        if (!window.confirm("Voulez-vous vraiment activer le mode Technicien ? Cela vous permettra de proposer vos services.")) {
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ role: 'technician' })
                .eq('id', user.id);

            if (error) throw error;

            alert("Félicitations ! Vous êtes maintenant un Technicien. Veuillez compléter votre profil.");

            // Update local state
            const updatedUser = { ...user, role: 'technician' };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser)); // Update stored user

            // Initialiser les champs vides pour le technicien
            setFormData(prev => ({
                ...prev,
                specialty: '',
                city: '',
                district: '',
                description: ''
            }));

        } catch (error) {
            console.error("Error upgrading to technician:", error);
            alert("Erreur: " + error.message);
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div style={{ textAlign: 'left', flex: 1 }}>
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

                    <div style={{ textAlign: 'center' }}>
                        <div
                            onClick={generateLoginQR}
                            style={{
                                padding: '8px', border: '1px solid #eee', borderRadius: '12px',
                                cursor: 'pointer', backgroundColor: '#f9f9f9', transition: 'all 0.2s',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                            }}
                            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                            onMouseOut={e => e.currentTarget.style.borderColor = '#eee'}
                        >
                            <QrCode size={24} color="var(--primary-color)" />
                            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>Log QR</span>
                        </div>
                    </div>
                </div>

                {/* Section Devenir Technicien (Pour les clients uniquement) */}
                {user.role === 'client' && (
                    <div style={{
                        marginTop: '-1rem', marginBottom: '2rem', padding: '1.5rem',
                        backgroundColor: '#e3f2fd', borderRadius: '12px', border: '1px solid #bbdefb'
                    }}>
                        <h3 style={{ fontSize: '1.1rem', marginTop: 0, color: '#0d47a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🛠️ Devenir Technicien
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#1565c0', lineHeight: '1.5' }}>
                            Vous êtes un réparateur professionnel ? Activez le mode Technicien pour proposer vos services, être visible sur la carte et gérer vos produits.
                        </p>
                        <button
                            type="button"
                            onClick={handleBecomeTechnician}
                            disabled={isSaving}
                            className="btn"
                            style={{
                                backgroundColor: '#1976d2', color: 'white', border: 'none',
                                padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: '600', marginTop: '0.5rem', width: '100%'
                            }}
                        >
                            {isSaving ? 'Activation...' : 'Activer le mode Technicien'}
                        </button>
                    </div>
                )}

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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
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
                                onChange={handleInputChange}
                                placeholder="ex: 77 123 45 67"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>

                    {/* Technician Specific Fields */}
                    {user.role === 'technician' && (
                        <div style={{ padding: '1.5rem', backgroundColor: '#f9f9f9', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #eee' }}>
                            <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '1rem', color: 'var(--primary-color)' }}>Informations Professionnelles</h3>

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
                                Nouveau mot de passe (8 car. min, 1 maj, 1 chiffre)
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Votre nouveau mot de passe"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                Confirmer le nouveau mot de passe
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="Confirmer le mot de passe"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
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
        </div >
    );
};

export default ProfileSettings;
