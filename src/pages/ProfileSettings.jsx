import React, { useState, useEffect } from 'react';
import { User, Lock, Save, ArrowLeft, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_URL from '../config';
import { QRCodeSVG } from 'qrcode.react';

const ProfileSettings = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        currentPassword: '',
        password: '',
        confirmPassword: ''
    });

    const [qrData, setQrData] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            alert("Les mots de passe ne correspondent pas.");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    currentPassword: formData.currentPassword,
                    password: formData.password || undefined // Only send if not empty
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Profil mis à jour avec succès !");
                // Update local storage
                const updatedUser = { ...user, fullName: formData.fullName, email: formData.email };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Clear password fields
                setFormData(prev => ({ ...prev, currentPassword: '', password: '', confirmPassword: '' }));
            } else {
                alert(data.message || "Erreur lors de la mise à jour.");
            }
        } catch (error) {
            console.error(error);
            alert("Erreur réseau.");
        }
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 500);
    };

    const generateLoginQR = () => {
        if (!formData.currentPassword || formData.currentPassword.length === 0) {
            alert("Veuillez saisir votre PIN/Mot de passe actuel dans la section Sécurité pour générer le QR Code.");
            return;
        }

        // Create a JSON string with login info
        const data = {
            type: 'SAMATECH_LOGIN',
            email: formData.email,
            pin: formData.currentPassword
        };

        setQrData(JSON.stringify(data));
        setShowQRModal(true);
    };

    if (!user) return <div className="container" style={{ padding: '2rem' }}>Veuillez vous connecter.</div>;

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '600px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', textDecoration: 'none', color: '#666', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Retour à l'accueil
            </Link>

            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                            }}>
                                <User size={20} />
                            </div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Paramètres du Profil</h2>
                        </div>
                        <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>{user.role === 'technician' ? 'Technicien' : 'Client'}</p>
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

                    <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Lock size={18} /> {user.email === 'Diassecke@gmail.com' ? 'Sécurité' : 'Sécurité et Mot de passe'}
                        </h3>

                        <div style={{ marginBottom: '1.5rem', backgroundColor: '#fff9c4', padding: '1rem', borderRadius: '8px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#856404' }}>
                                {user.email === 'Diassecke@gmail.com' ? 'Mot de passe actuel' : 'Confirmation (PIN actuel)'}
                            </label>
                            <input
                                type="password"
                                name="currentPassword"
                                inputMode={user.email === 'Diassecke@gmail.com' ? 'text' : 'numeric'}
                                maxLength={user.email === 'Diassecke@gmail.com' ? undefined : 4}
                                value={formData.currentPassword}
                                onChange={(e) => {
                                    if (user.email === 'Diassecke@gmail.com') {
                                        setFormData({ ...formData, currentPassword: e.target.value });
                                    } else {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 4) setFormData({ ...formData, currentPassword: val });
                                    }
                                }}
                                placeholder={user.email === 'Diassecke@gmail.com' ? '********' : '****'}
                                required={!!formData.password}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ffeeba', backgroundColor: 'white', textAlign: 'center', letterSpacing: user.email === 'Diassecke@gmail.com' ? '2px' : '4px' }}
                            />
                            <p style={{ fontSize: '0.75rem', color: '#856404', marginTop: '0.5rem', marginBottom: 0 }}>
                                Nécessaire pour toute modification sécurisée.
                            </p>
                        </div>

                        <div style={{ borderTop: '1px dashed #eee', paddingTop: '1rem' }}>
                            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
                                {user.email === 'Diassecke@gmail.com' ? 'Laissez vide pour ne pas modifier le mot de passe.' : 'Laissez les champs suivants vides si vous ne souhaitez pas changer votre Code PIN.'}
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                {user.email === 'Diassecke@gmail.com' ? 'Nouveau mot de passe' : 'Nouveau Code PIN (4 chiffres)'}
                            </label>
                            <input
                                type="password"
                                name="password"
                                inputMode={user.email === 'Diassecke@gmail.com' ? 'text' : 'numeric'}
                                maxLength={user.email === 'Diassecke@gmail.com' ? undefined : 4}
                                value={formData.password}
                                onChange={(e) => {
                                    if (user.email === 'Diassecke@gmail.com') {
                                        setFormData({ ...formData, password: e.target.value });
                                    } else {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 4) setFormData({ ...formData, password: val });
                                    }
                                }}
                                placeholder={user.email === 'Diassecke@gmail.com' ? '********' : '****'}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center', letterSpacing: user.email === 'Diassecke@gmail.com' ? '2px' : '4px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Confirmer {user.email === 'Diassecke@gmail.com' ? 'le nouveau mot de passe' : 'le nouveau PIN'}</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                inputMode={user.email === 'Diassecke@gmail.com' ? 'text' : 'numeric'}
                                maxLength={user.email === 'Diassecke@gmail.com' ? undefined : 4}
                                value={formData.confirmPassword}
                                onChange={(e) => {
                                    if (user.email === 'Diassecke@gmail.com') {
                                        setFormData({ ...formData, confirmPassword: e.target.value });
                                    } else {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 4) setFormData({ ...formData, confirmPassword: val });
                                    }
                                }}
                                placeholder={user.email === 'Diassecke@gmail.com' ? '********' : '****'}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center', letterSpacing: user.email === 'Diassecke@gmail.com' ? '2px' : '4px' }}
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


            </div>

            {/* Modal pour le QR Code */}
            {showQRModal && (
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
            )}
        </div>
    );
};

export default ProfileSettings;
