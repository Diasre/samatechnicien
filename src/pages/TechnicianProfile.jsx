import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { technicians as mockTechnicians } from '../data/mockData';
import { MapPin, Star, Phone, MessageCircle, MessageSquare, CheckCircle, ArrowLeft, AlertCircle, Edit, Share2, ShoppingBag, Flag } from 'lucide-react';

const TechnicianProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tech, setTech] = useState(null);
    const [loading, setLoading] = useState(true);

    // ... existing states ...

    const handleStartChat = async () => {
        console.log("handleStartChat triggered");
        // alert("Debug: Fonction lancée..."); // Uncommented for visible confirmation if needed, but console is cleaner for now unless requested.
        // Actually, user requested they see NOTHING. Let's add a clear visual indicator that something is happening.

        const currentUser = JSON.parse(localStorage.getItem('user'));

        if (!currentUser) {
            alert('Veuillez vous connecter pour envoyer un message.');
            navigate('/login');
            return;
        }

        // --- 1. RESOLVE CURRENT USER UUID ---
        let currentUserUUID = currentUser.uuid || currentUser.user_id || currentUser.auth_id || (typeof currentUser.id === 'string' && currentUser.id.length > 20 ? currentUser.id : null);

        if (!currentUserUUID && Number.isInteger(Number(currentUser.id))) {
            try {
                // We reuse the same RPC to find OUR own UUID
                const { data: myRemoteUUID, error: myUuidError } = await supabase.rpc('get_technician_uuid', {
                    technician_id: Number(currentUser.id)
                });
                if (!myUuidError && myRemoteUUID) {
                    currentUserUUID = myRemoteUUID;
                }
            } catch (err) {
                console.error("Failed to retrieve my UUID via RPC", err);
            }
        }

        if (!currentUserUUID) {
            alert("Erreur: Impossible de récupérer votre identifiant sécurisé. Veuillez vous déconnecter et vous reconnecter.");
            return;
        }

        // --- 2. RESOLVE TECHNICIAN UUID ---
        let techUUID = tech.uuid || tech.user_id || tech.auth_id || (typeof tech.id === 'string' && tech.id.length > 20 ? tech.id : null);

        // Fallback: Ask Supabase to find the UUID based on the integer ID
        if (!techUUID && Number.isInteger(Number(tech.id))) {
            try {
                const { data: remoteUUID, error: uuidError } = await supabase.rpc('get_technician_uuid', {
                    technician_id: Number(tech.id)
                });
                if (!uuidError && remoteUUID) {
                    techUUID = remoteUUID;
                    console.log("UUID retrieved via RPC:", techUUID);
                }
            } catch (err) {
                console.error("Failed to retrieve UUID via RPC", err);
            }
        }

        if (!techUUID) {
            console.error("Could not find Technician UUID in object:", tech);
            alert("Erreur système: Impossible de trouver l'identifiant unique du technicien.");
            return;
        }

        // Check if self-chat
        if (currentUserUUID === techUUID) {
            alert('Vous ne pouvez pas vous envoyer de message à vous-même.');
            return;
        }

        try {
            // 3. Try to find an existing conversation directly (Bypassing RPC)
            const { data: existingConvs, error: fetchError } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant1_id.eq.${currentUserUUID},participant2_id.eq.${techUUID}),and(participant1_id.eq.${techUUID},participant2_id.eq.${currentUserUUID})`);

            if (fetchError) throw fetchError;

            let conversationId;

            if (existingConvs && existingConvs.length > 0) {
                conversationId = existingConvs[0].id;
            } else {
                // 4. Create new conversation if none exists
                const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert([{ participant1_id: currentUserUUID, participant2_id: techUUID }])
                    .select()
                    .single();

                if (createError) throw createError;
                conversationId = newConv.id;
            }

            // Redirect to chat
            navigate(`/chat?id=${conversationId}`);
        } catch (error) {
            console.error('Error starting chat:', error);
            alert(`Erreur détaillée:\n${error.message || JSON.stringify(error)}`);
        }
    };
    const [reviews, setReviews] = useState([]);
    const [userRating, setUserRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isHighlighting, setIsHighlighting] = useState(false);
    const [products, setProducts] = useState([]);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [sendingFeedback, setSendingFeedback] = useState(false);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const apiUrl = API_URL;

    const fetchReviews = async (techId) => {
        try {
            const res = await fetch(`${apiUrl}/api/technicians/${techId}/reviews`);
            const data = await res.json();
            if (data.message === 'success') {
                setReviews(data.data);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    useEffect(() => {
        const loadTechnician = async () => {
            setLoading(true);
            try {
                // 1. Fetch Technician Profile
                const { data: techData, error: techError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (techError) throw techError;

                if (techData) {
                    setTech({
                        ...techData,
                        name: techData.fullname || techData.fullName,
                        image: techData.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(techData.fullname || techData.fullName)}&background=random&color=fff&size=200`,
                        description: techData.description || 'Technicien professionnel référencé.',
                        is_verified: true,
                        commentsEnabled: (techData.commentsenabled !== undefined ? techData.commentsenabled : techData.commentsEnabled) !== 0
                    });
                }

                // 2. Fetch Reviews (with client name)
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('*, client:clientId(fullname)')
                    .eq('technicianId', id)
                    .order('created_at', { ascending: false });

                let calculatedRating = 0;
                let calculatedCount = 0;

                if (reviewsData) {
                    const mappedReviews = reviewsData.map(r => ({
                        ...r,
                        clientName: r.client?.fullname || r.client?.fullName || 'Client Anonyme'
                    }));
                    setReviews(mappedReviews);

                    // Calculate stats dynamically
                    calculatedCount = mappedReviews.length;
                    if (calculatedCount > 0) {
                        const total = mappedReviews.reduce((sum, r) => sum + r.rating, 0);
                        calculatedRating = total / calculatedCount;
                    }
                }

                // Update tech with calculated stats
                if (techData) {
                    setTech(prev => ({
                        ...prev,
                        rating: calculatedRating,
                        reviews_count: calculatedCount
                    }));
                }

                // 3. Fetch Products
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('technicianid', id)
                    .eq('status', 'available'); // Only show available products on profile

                if (productsData) setProducts(productsData);

            } catch (error) {
                console.error("Critical error loading technician profile:", error.message);
            }
            setLoading(false);
        };

        loadTechnician();
    }, [id]);

    const handleShare = async () => {
        const shareData = {
            title: `Profil de ${tech.name} - SamaTechnicien`,
            text: `Découvrez le profil de ${tech.name}, expert en ${tech.specialty} sur SamaTechnicien.`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert("Lien du profil copié dans le presse-papier !");
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Veuillez vous connecter pour laisser un avis.");
            return;
        }

        if (String(currentUser.id) === String(tech.id)) {
            alert("Vous ne pouvez pas voter ni commenter votre propre profil.");
            return;
        }

        setSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .insert([{
                    technicianId: id,
                    clientId: currentUser.id,
                    rating: userRating,
                    comment: comment
                }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                // Update UI instantly
                const newReview = {
                    ...data,
                    clientName: currentUser.fullName,
                    createdAt: new Date().toISOString()
                };

                setReviews(prev => [newReview, ...prev]);

                // Update tech rating locally (approximate)
                setTech(prev => {
                    if (!prev) return prev;
                    const oldCount = prev.reviews_count || 0; // note: real count is in DB, this is local approx
                    const oldRating = prev.rating || 0;
                    const newCount = reviews.length + 1;
                    const totalScore = (oldRating * reviews.length) + userRating;
                    const newRating = totalScore / newCount;

                    return { ...prev, reviews_count: newCount, rating: newRating };
                });

                setComment('');
                setUserRating(5);

                // Update tech rating in DB (optional but good for consistency)
                // We'd need a trigger in Supabase or manual update. Skipping manual update to keep it simple, 
                // the "rating" on user table should ideally be calculated or updated.
                // For now, let's just alert.

                // Flash highlight effect
                setIsHighlighting(true);
                setTimeout(() => setIsHighlighting(false), 2000);
                alert("Merci ! Votre avis a été publié.");
            }
        } catch (error) {
            console.error("Review Error:", error.message);
            alert("Erreur lors de la publication : " + error.message);
        }
        setSubmitting(false);
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!feedbackMsg.trim()) return;

        setSendingFeedback(true);
        try {
            const { error } = await supabase
                .from('platform_feedback')
                .insert([{
                    userId: currentUser?.id || null,
                    userName: currentUser?.fullName || 'Anonyme',
                    content: `[Signalement Profil ${tech.name} (ID: ${tech.id})] ${feedbackMsg}`
                }]);

            if (error) throw error;

            alert("Votre signalement a été envoyé à l'administrateur.");
            setFeedbackMsg('');
            setShowFeedbackForm(false);
        } catch (error) {
            console.error("Feedback error:", error.message);
            alert("Erreur technique : " + error.message);
        }
        setSendingFeedback(false);
    };

    if (loading) return (
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="animate-pulse">Chargement du profil...</div>
        </div>
    );

    if (!tech) return (
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="card" style={{ padding: '2rem' }}>
                <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
                <h3>Technicien non trouvé</h3>
                <p style={{ color: '#666' }}>Désolé, ce profil n'existe pas ou n'est plus disponible (ID: {id})</p>
                <Link to="/technicians" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
                    Voir tous les techniciens
                </Link>
            </div>
        </div>
    );

    const isOwner = currentUser && (String(currentUser.id) === String(tech.id));

    return (
        <div className="container" style={{ padding: '1rem 0.5rem' }}>
            <Link to="/technicians" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', textDecoration: 'none', color: '#666', fontSize: '0.85rem' }}>
                <ArrowLeft size={16} /> Retour
            </Link>

            {/* Blocked Alert Banner */}
            {!!tech.isBlocked && (
                <div style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 4px 6px rgba(220, 38, 38, 0.3)'
                }}>
                    <AlertCircle size={24} style={{ flexShrink: 0 }} />
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>⚠️ TECHNICIEN BLOQUÉ</h3>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', lineHeight: '1.4' }}>
                            Ce profil a été suspendu par l'administration. Les services de contact sont actuellement indisponibles.
                        </p>
                    </div>
                </div>
            )}

            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                {/* Banner/Header */}
                <div style={{ backgroundColor: '#e8f5e9', padding: '1.25rem 1rem', textAlign: 'center', position: 'relative' }}>



                    <img
                        src={tech.image}
                        alt={tech.name}
                        style={{
                            width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover',
                            border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    />

                    <button
                        onClick={handleShare}
                        title="Partager ce profil"
                        style={{
                            position: 'absolute', top: '15px', right: '15px',
                            background: 'white', border: 'none',
                            padding: '8px', borderRadius: '50%', cursor: 'pointer',
                            color: 'var(--primary-color)', display: 'flex', alignItems: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'transform 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <Share2 size={18} />
                    </button>

                    {/* "Signaler un problème" button */}
                    <button
                        onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                        title="Signaler un problème avec ce profil"
                        style={{
                            position: 'absolute', top: '15px', left: '15px',
                            background: 'white', border: 'none',
                            padding: '8px', borderRadius: '50%', cursor: 'pointer',
                            color: '#dc2626', display: 'flex', alignItems: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'transform 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <Flag size={18} />
                    </button>

                    <h2 style={{ marginTop: '0.5rem', marginBottom: '0.25rem', fontSize: '1.3rem' }}>
                        {tech.name} {tech.is_verified && <CheckCircle size={18} color="var(--primary-color)" style={{ verticalAlign: 'middle' }} />}
                    </h2>
                    <p style={{ fontSize: '0.95rem', color: '#555' }}>{tech.specialty}</p>
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.5rem',
                        color: isHighlighting ? 'var(--primary-color)' : '#666',
                        fontSize: '0.9rem', fontWeight: isHighlighting ? 'bold' : 'normal',
                        transition: 'all 0.4s ease'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {tech.city}{tech.district ? `, ${tech.district}` : ''}</span>
                        <span style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            backgroundColor: isHighlighting ? '#fff9c4' : 'transparent',
                            padding: '2px 8px', borderRadius: '12px'
                        }}>
                            <Star size={14} fill="gold" color="gold" /> {Number(tech.rating || 0).toFixed(1)} ({tech.reviews_count || 0})
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        {/* Left: Info */}
                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>Biographie</h3>
                            <p style={{ lineHeight: '1.6', color: '#444', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{tech.description}</p>

                            <h4 style={{ marginTop: '1.25rem', fontSize: '1rem' }}>Compétences</h4>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                                {tech.skills ? (
                                    tech.skills.split(',').map(skill => (
                                        <span key={skill.trim()} style={{
                                            backgroundColor: '#f1f5f9', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem'
                                        }}>
                                            {skill.trim()}
                                        </span>
                                    ))
                                ) : (
                                    <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.8rem' }}>Aucune compétence spécifiée</span>
                                )}
                            </div>

                            <h4 style={{ marginTop: '1.25rem', fontSize: '1rem' }}>Horaires</h4>
                            <ul style={{ listStyle: 'none', padding: 0, color: '#666', fontSize: '0.85rem' }}>
                                <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}><span>Semaine</span> <span>09h - 19h</span></li>
                                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Samedi</span> <span>10h - 17h</span></li>
                            </ul>
                        </div>

                        {/* Right: Contact & Review */}
                        <div>
                            <div style={{
                                border: '1px solid #eee', borderRadius: '10px', padding: '1rem',
                                backgroundColor: '#fafafa', marginBottom: '1.5rem'
                            }}>
                                <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Contacter</h4>
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginBottom: '0.75rem', padding: '0.5rem', fontSize: '0.85rem' }}
                                    onClick={() => window.location.href = `tel:${tech.phone}`}
                                    disabled={tech.isBlocked}
                                >
                                    <Phone size={16} /> Appel
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    style={{ width: '100%', marginBottom: '0.75rem', padding: '0.5rem', fontSize: '0.85rem', backgroundColor: 'var(--secondary-color)', color: 'white' }}
                                    onClick={handleStartChat}
                                    disabled={tech.isBlocked}
                                >
                                    <MessageSquare size={16} /> Envoyer un message
                                </button>
                                <button
                                    className="btn"
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#25D366',
                                        color: 'white',
                                        marginBottom: '0.75rem',
                                        padding: '0.5rem',
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                    onClick={() => {
                                        let cleanPhone = tech.phone.replace(/[^0-9]/g, '');
                                        if (cleanPhone.length === 9) cleanPhone = '221' + cleanPhone;
                                        window.open(`https://wa.me/${cleanPhone}`, '_blank');
                                    }}
                                    disabled={tech.isBlocked}
                                >
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    WhatsApp
                                </button>
                            </div>

                            {/* Review Form */}
                            {tech.isBlocked ? (
                                <div style={{ border: '1px solid #eee', borderRadius: '10px', padding: '1.5rem', backgroundColor: '#fff3e0', textAlign: 'center' }}>
                                    <AlertCircle size={32} color="#dc2626" style={{ marginBottom: '0.5rem' }} />
                                    <h4 style={{ color: '#dc2626', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Avis désactivés</h4>
                                    <p style={{ fontSize: '0.75rem', color: '#666' }}>Ce technicien est actuellement bloqué. Les avis ne peuvent pas être soumis.</p>
                                </div>
                            ) : tech.commentsEnabled ? (
                                <div id="review-section" style={{ border: '1px solid #eee', borderRadius: '10px', padding: '1rem', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--primary-color)' }}>Votre satisfaction est importante pour nous !</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: '1.4', marginBottom: '0.75rem' }}>
                                        Merci de noter la fiabilité du technicien qui vous a assisté (ponctualité, sérieux et qualité du service) et actualiser le vote de technicien :
                                    </p>
                                    {currentUser ? (
                                        <form onSubmit={handleReviewSubmit}>
                                            <div style={{ display: 'flex', gap: '4px', marginBottom: '0.75rem' }}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star
                                                        key={star}
                                                        size={24}
                                                        fill={star <= userRating ? "gold" : "none"}
                                                        color={star <= userRating ? "gold" : "#ccc"}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => setUserRating(star)}
                                                    />
                                                ))}
                                            </div>
                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Votre avis nous intéresse (ex: professionnel, poli, etc.)"
                                                style={{
                                                    width: '100%', padding: '0.5rem', borderRadius: '6px',
                                                    border: '1px solid #ddd', fontSize: '0.8rem', minHeight: '60px',
                                                    marginBottom: '0.5rem', resize: 'vertical'
                                                }}
                                            />
                                            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }}>
                                                {submitting ? 'Publication...' : 'Voter maintenant'}
                                            </button>
                                        </form>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                                            <div style={{ padding: '0.75rem', backgroundColor: '#fff3e0', color: '#e65100', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center', marginBottom: '0.75rem' }}>
                                                Identifiez-vous pour laisser un avis ou contacter ce technicien.
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                <Link to="/login" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                                                    Se connecter
                                                </Link>
                                                <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                                                    Créer un compte
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ border: '1px solid #eee', borderRadius: '10px', padding: '1.5rem', backgroundColor: '#f5f5f5', textAlign: 'center' }}>
                                    <MessageSquare size={32} color="#999" style={{ marginBottom: '0.5rem' }} />
                                    <h4 style={{ color: '#666', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Avis désactivés</h4>
                                    <p style={{ fontSize: '0.75rem', color: '#999' }}>Le technicien a choisi de ne pas recevoir de commentaires publics.</p>
                                </div>
                            )}
                        </div>

                        {/* Reviews List */}
                        <div style={{ marginTop: '1.5rem' }}>
                            <h4 style={{ fontSize: '1rem' }}>Avis récents ({reviews.length})</h4>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '0.5rem' }}>
                                {reviews.length === 0 ? (
                                    <p style={{ fontSize: '0.85rem', color: '#888' }}>Aucun avis pour le moment.</p>
                                ) : (
                                    reviews.map(review => (
                                        <div key={review.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <strong style={{ fontSize: '0.85rem' }}>{review.clientName}</strong>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star key={s} size={10} fill={s <= review.rating ? "gold" : "none"} color={s <= review.rating ? "gold" : "#ccc"} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: '#444', marginTop: '0.25rem', marginBottom: '0.2rem' }}>{review.comment}</p>
                                            <span style={{ fontSize: '0.7rem', color: '#999' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Boutique de l'expert */}
                {products.length > 0 && (
                    <div style={{ padding: '1rem', borderTop: '1px solid #eee', backgroundColor: '#fcfcfc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                            <ShoppingBag size={20} color="var(--primary-color)" />
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Ma Boutique - Articles en vente</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                            {Array.isArray(products) && products.map(product => (
                                <div key={product.id} className="card" style={{ padding: '0.5rem', fontSize: '0.8rem' }}>
                                    <img
                                        src={product.image || 'https://via.placeholder.com/150'}
                                        alt={product.title}
                                        style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }}
                                    />
                                    <div style={{ fontWeight: 'bold', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {product.title}
                                    </div>
                                    <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                                        {product.price} FCFA
                                    </div>
                                    {product.status === 'sold' && (
                                        <div style={{ fontSize: '0.7rem', color: 'red', fontWeight: 'bold' }}>VENDU</div>
                                    )}
                                    <Link to="/marketplace" style={{ fontSize: '0.7rem', textDecoration: 'none', color: '#666', marginTop: '4px', display: 'block' }}>
                                        Voir en boutique
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Section: Report Issue Form */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid #eee', backgroundColor: '#fff' }}>
                    {(showFeedbackForm || feedbackMsg) ? (
                        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#dc2626' }}>Signaler un problème</h4>
                            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <textarea
                                    value={feedbackMsg}
                                    onChange={(e) => setFeedbackMsg(e.target.value)}
                                    placeholder="Décrivez le problème avec ce profil..."
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '8px',
                                        border: '1px solid #ddd', fontSize: '0.85rem', minHeight: '80px'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowFeedbackForm(false)}
                                        className="btn btn-outline"
                                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                                    > Annuler </button>
                                    <button
                                        type="submit"
                                        disabled={sendingFeedback}
                                        className="btn"
                                        style={{
                                            flex: 2,
                                            padding: '0.5rem',
                                            fontSize: '0.8rem',
                                            backgroundColor: '#dc2626',
                                            color: 'white',
                                            cursor: 'pointer',
                                            border: 'none',
                                            transition: 'all 0.3s ease',
                                            opacity: sendingFeedback ? 0.7 : 1
                                        }}
                                    >
                                        {sendingFeedback ? 'Envoi...' : 'Envoyer le signalement'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '1rem' }}>
                                Une revendication ou un signalement concernant ce profil ?
                            </p>
                            <button
                                onClick={() => setShowFeedbackForm(true)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    color: '#dc2626', background: 'none', border: '1px solid #dc2626',
                                    fontSize: '0.85rem', fontWeight: '600',
                                    padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer'
                                }}
                            >
                                <Flag size={14} /> Signaler un problème à l'administrateur
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TechnicianProfile;
