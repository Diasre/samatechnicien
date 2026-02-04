import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { User, Settings, Star, MessageSquare, Phone, MapPin, CheckCircle, Save, ArrowLeft, Share2, Flag } from 'lucide-react';
import WelcomeOverlay from '../components/WelcomeOverlay';

const ExpertDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [techData, setTechData] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [sendingFeedback, setSendingFeedback] = useState(false);

    // Import Supabase client if not already imported at top (I will add import in next step or assume it) 
    // Wait, I need to check imports. 
    // The previous file content shows API_URL import but NOT supabase. 
    // I will fix imports in a separate call or try to merge if I can, but replace_file_content targets specific block.
    // I'll stick to replacing the logic block first.

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        specialty: '',
        otherSpecialty: '',
        city: '',
        district: '',
        phone: '',
        image: '',
        description: '',
        commentsEnabled: true
    });

    const standardSpecialties = ["Informatique", "Téléphonie", "Imprimantes", "Réseaux"];

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }
    }, [user?.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Technician Data
            const { data: tech, error: techError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (techError) {
                console.error("Supabase error fetching user:", techError);
                // Don't auto-logout on network error, just stop
            }

            if (!tech) {
                console.warn("User ID not found in Supabase. Probably old session.");
                alert("Votre session a expiré ou votre compte n'existe plus. Veuillez vous reconnecter.");
                localStorage.removeItem('user');
                window.location.href = '/login';
                return;
            }

            // 2. Fetch Reviews
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('reviews')
                .select('*, client:clientId(fullname)')
                .eq('technicianId', user.id)
                .order('created_at', { ascending: false });

            const isStandard = standardSpecialties.includes(tech.specialty);
            setTechData({
                ...tech,
                fullName: tech.fullname || tech.fullName,
                reviews_count: reviewsData ? reviewsData.length : 0,
                rating: reviewsData && reviewsData.length > 0
                    ? (reviewsData.reduce((acc, curr) => acc + (curr.rating || 0), 0) / reviewsData.length)
                    : 0
            });

            setFormData({
                fullName: tech.fullname || tech.fullName || '',
                email: tech.email || '',
                currentPassword: '',
                password: '',
                confirmPassword: '',
                specialty: isStandard ? tech.specialty : 'Autre',
                otherSpecialty: isStandard ? '' : tech.specialty || '',
                city: tech.city || '',
                district: tech.district || '',
                phone: tech.phone || '',
                image: tech.image || '',
                description: tech.description || '',
                commentsEnabled: (tech.commentsenabled !== undefined ? tech.commentsenabled : tech.commentsEnabled) !== 0
            });


            if (reviewsData) {
                const mappedReviews = reviewsData.map(r => ({
                    ...r,
                    clientName: r.client?.fullname || 'Client Anonyme'
                }));
                setReviews(mappedReviews);
            }

        } catch (error) {
            console.error("Error fetching expert data:", error);
        }
        setLoading(false);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleShare = async () => {
        const profileUrl = `${window.location.origin}/technician/${user.id}`;
        const shareData = {
            title: `Profil de ${techData.fullName} - SamaTechnicien`,
            text: `Je suis disponible pour vos besoins en ${techData.specialty}. Consultez mon profil sur SamaTechnicien !`,
            url: profileUrl
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(profileUrl);
                alert("Lien de votre profil copié !");
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        if (formData.password && formData.password !== formData.confirmPassword) {
            alert("Les mots de passe ne correspondent pas.");
            setIsSaving(false);
            return;
        }

        try {
            const payload = {
                fullname: formData.fullName,
                email: formData.email,
                specialty: formData.specialty === 'Autre' ? formData.otherSpecialty : formData.specialty,
                city: formData.city,
                district: formData.district,
                phone: formData.phone,
                image: formData.image,
                description: formData.description,
                commentsenabled: formData.commentsEnabled ? 1 : 0
            };

            // Only update password if provided
            if (formData.password) {
                payload.password = formData.password;
            }

            const { error: updateError } = await import('../supabaseClient').then(m => m.supabase)
                .from('users')
                .update(payload)
                .eq('id', user.id);

            if (!updateError) {
                alert("Profil mis à jour avec succès !");
                setEditMode(false);

                // Update local storage
                const updatedUser = { ...user, fullName: formData.fullName, email: formData.email };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Clear passwords
                setFormData(prev => ({ ...prev, currentPassword: '', password: '', confirmPassword: '' }));

                fetchData();
            } else {
                alert("Erreur lors de la sauvegarde: " + updateError.message);
            }
        } catch (error) {
            console.error(error);
            alert("Erreur réseau: " + error.message);
        }
        setIsSaving(false);
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!feedbackMsg.trim()) return;

        setSendingFeedback(true);
        try {
            const payload = {
                userId: user?.id || null,
                userName: techData?.fullName || 'Anonyme',
                content: feedbackMsg
            };

            const { error: feedbackError } = await import('../supabaseClient').then(m => m.supabase)
                .from('platform_feedback')
                .insert([payload]);

            if (!feedbackError) {
                alert("Votre message a été envoyé à l'administrateur.");
                setFeedbackMsg('');
            } else {
                alert(`Erreur serveur: ${feedbackError.message}`);
            }
        } catch (error) {
            console.error("Feedback Error:", error);
            alert("Erreur technique : " + error.message);
        }
        setSendingFeedback(false);
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Chargement de votre espace...</div>;
    if (!techData) return <div className="container" style={{ padding: '2rem' }}>Erreur : Expert non trouvé.</div>;

    const avatarUrl = techData.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(techData.fullName)}&background=random&color=fff&size=150`;

    return (
        <div className="container animate-fade-in" style={{ padding: '1.5rem 1rem' }}>
            <WelcomeOverlay userName={techData.fullName} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Mon Espace Expert</h1>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>Gérez votre profil et suivez vos performances.</p>
                </div>
                {!editMode && (
                    <button className="btn btn-primary" onClick={() => setEditMode(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <Settings size={16} /> Paramètres
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Left Column: Profile & Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Profile Card */}
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 1rem' }}>
                            <img
                                src={avatarUrl}
                                alt={techData.fullName}
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)' }}
                            />
                            {techData.is_verified !== false && (
                                <div style={{ position: 'absolute', bottom: 5, right: 5, backgroundColor: 'white', borderRadius: '50%', padding: '2px' }}>
                                    <CheckCircle size={20} color="var(--primary-color)" fill="white" />
                                </div>
                            )}
                        </div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{techData.fullName}</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--primary-color)', fontWeight: '600', marginBottom: '1rem' }}>{techData.specialty}</p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', color: '#f1c40f', fontWeight: 'bold' }}>
                                    <Star size={16} fill="#f1c40f" /> {Number(techData.rating || 0).toFixed(1)}
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#999', margin: 0 }}>Ma Note</p>
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', fontWeight: 'bold' }}>
                                    <MessageSquare size={16} /> {techData.reviews_count || 0}
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#999', margin: 0 }}>Avis</p>
                            </div>
                        </div>

                        <button
                            onClick={handleShare}
                            className="btn btn-outline"
                            style={{
                                marginTop: '1.25rem', width: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '8px', fontSize: '0.85rem', borderColor: 'var(--primary-color)',
                                color: 'var(--primary-color)', fontWeight: 'bold'
                            }}
                        >
                            <Share2 size={16} /> Partager mon profil
                        </button>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                            <p style={{ fontSize: '0.7rem', color: '#999', marginBottom: '0.5rem' }}>Une réclamation ou un problème ?</p>
                            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <textarea
                                    value={feedbackMsg}
                                    onChange={(e) => setFeedbackMsg(e.target.value)}
                                    placeholder="Décrivez votre problème ici..."
                                    style={{
                                        width: '100%', padding: '0.5rem', borderRadius: '8px',
                                        border: '1px solid #ddd', fontSize: '0.8rem', minHeight: '60px',
                                        resize: 'none'
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={sendingFeedback}
                                    className="btn"
                                    style={{
                                        padding: '0.4rem', fontSize: '0.75rem', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', gap: '5px',
                                        backgroundColor: 'var(--primary-color)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        border: 'none',
                                        transition: 'all 0.3s ease',
                                        opacity: sendingFeedback ? 0.7 : 1
                                    }}
                                >
                                    <Flag size={12} /> {sendingFeedback ? 'Envoi...' : "Envoyer"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Personal Info Summary */}
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Informations de contact</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Phone size={16} color="#666" /> <span>{techData.phone || 'Non renseigné'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <MapPin size={16} color="#666" /> <span>{techData.city || 'Dakar'}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Settings or Bio */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {editMode ? (
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Modifier mon profil</h3>
                                <button onClick={() => setEditMode(false)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
                                    Annuler
                                </button>
                            </div>

                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Nom complet</label>
                                    <input
                                        type="text" name="fullName" value={formData.fullName} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Email</label>
                                    <input
                                        type="email" name="email" value={formData.email} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem', color: '#856404' }}>Code PIN actuel (requis pour modification)</label>
                                    <input
                                        type="password" name="currentPassword"
                                        inputMode="numeric" pattern="[0-9]*" maxLength={4}
                                        value={formData.currentPassword || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 4) setFormData({ ...formData, currentPassword: val });
                                        }}
                                        placeholder="****"
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ffeeba', backgroundColor: '#fff9c4', fontSize: '0.9rem', textAlign: 'center', letterSpacing: '4px' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Nouveau Code PIN</label>
                                        <input
                                            type="password" name="password"
                                            inputMode="numeric" pattern="[0-9]*" maxLength={4}
                                            value={formData.password}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (val.length <= 4) setFormData({ ...formData, password: val });
                                            }}
                                            placeholder="****"
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', textAlign: 'center', letterSpacing: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Confirmer PIN</label>
                                        <input
                                            type="password" name="confirmPassword"
                                            inputMode="numeric" pattern="[0-9]*" maxLength={4}
                                            value={formData.confirmPassword}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (val.length <= 4) setFormData({ ...formData, confirmPassword: val });
                                            }}
                                            placeholder="****"
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', textAlign: 'center', letterSpacing: '4px' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Spécialité</label>
                                        <select
                                            name="specialty" value={formData.specialty} onChange={handleInputChange}
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', backgroundColor: 'white' }}
                                        >
                                            <option value="Informatique">Informatique</option>
                                            <option value="Téléphonie">Téléphonie</option>
                                            <option value="Imprimantes">Imprimantes</option>
                                            <option value="Réseaux">Réseaux</option>
                                            <option value="Autre">Autre</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Ville</label>
                                        <input
                                            type="text" name="city" value={formData.city} onChange={handleInputChange}
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>

                                {formData.specialty === 'Autre' && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Précisez votre métier</label>
                                        <input
                                            type="text" name="otherSpecialty" value={formData.otherSpecialty} onChange={handleInputChange}
                                            placeholder="Ex: Plombier, Menuisier..."
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Quartier / Zone</label>
                                        <input
                                            type="text" name="district" value={formData.district} onChange={handleInputChange}
                                            placeholder="Ex: Plateau, Almadies"
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Téléphone</label>
                                        <input
                                            type="text" name="phone" value={formData.phone} onChange={handleInputChange}
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Photo de profil (Upload)</label>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;

                                                const formData = new FormData();
                                                formData.append('image', file);

                                                try {
                                                    const res = await fetch(`${API_URL}/api/upload`, {
                                                        method: 'POST',
                                                        body: formData
                                                    });
                                                    const data = await res.json();
                                                    if (data.url) {
                                                        setFormData(prev => ({ ...prev, image: data.url }));
                                                    }
                                                } catch (err) {
                                                    console.error("Upload error:", err);
                                                    alert("Erreur lors de l'upload de l'image.");
                                                }
                                            }}
                                            style={{ fontSize: '0.8rem' }}
                                        />
                                        {formData.image && (
                                            <img src={formData.image} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Ma Biographie</label>
                                    <textarea
                                        name="description" value={formData.description} onChange={handleInputChange}
                                        placeholder="Parlez de votre parcours, de vos certifications et de votre approche du service client..."
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', minHeight: '120px', resize: 'vertical' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id="commentsEnabled"
                                        checked={formData.commentsEnabled}
                                        onChange={(e) => setFormData({ ...formData, commentsEnabled: e.target.checked })}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="commentsEnabled" style={{ fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                                        Autoriser les clients à laisser des avis sur mon profil
                                    </label>
                                </div>

                                <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    {isSaving ? 'Enregistrement...' : <><Save size={18} /> Sauvegarder les modifications</>}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            {/* Bio Card */}
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>À propos de moi</h3>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#444', fontStyle: techData.description ? 'normal' : 'italic' }}>
                                    {techData.description || "Vous n'avez pas encore rédigé de description. Cliquez sur 'Paramètres' pour vous présenter à vos clients."}
                                </p>
                                <div style={{ marginTop: '1.5rem' }}>
                                    <Link to={`/technician/${techData.id}`} style={{ textDecoration: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        Voir mon profil public <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                                    </Link>
                                </div>
                            </div>

                            {/* Recent Reviews Audit */}
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Avis récents ({reviews.length})</h3>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {reviews.length === 0 ? (
                                        <p style={{ fontSize: '0.85rem', color: '#999', textAlign: 'center', padding: '1rem' }}>Aucun avis reçu pour le moment.</p>
                                    ) : (
                                        reviews.map(review => (
                                            <div key={review.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                    <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{review.clientName}</span>
                                                    <div style={{ display: 'flex', gap: '2px' }}>
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <Star key={s} size={10} fill={s <= review.rating ? "#f1c40f" : "none"} color={s <= review.rating ? "#f1c40f" : "#ccc"} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '0.8rem', color: '#555', margin: '0.25rem 0' }}>{review.comment}</p>
                                                <span style={{ fontSize: '0.7rem', color: '#999' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div >
    );
};

export default ExpertDashboard;
