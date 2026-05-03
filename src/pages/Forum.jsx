import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { MessageSquare, Plus, User, Clock, MessageCircle, Image, Camera, X, Trash2, Edit2 } from 'lucide-react';
import { Camera as CapCamera, CameraResultType } from '@capacitor/camera';

const Forum = () => {
    const [discussions, setDiscussions] = useState(() => {
        const saved = localStorage.getItem('ST_CACHE_FORUM');
        return saved ? JSON.parse(saved) : [];
    });
    const [loading, setLoading] = useState(discussions.length === 0);
    const [showNewDiscussion, setShowNewDiscussion] = useState(false);
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [pendingImage, setPendingImage] = useState(null);

    const [onlineCount, setOnlineCount] = useState(0);
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const userRole = (currentUser?.role || "").toLowerCase();
    const isTech = userRole.includes('tech') || userRole.includes('expert') || userRole.includes('pro');

    if (!currentUser) {
        return <div style={{ textAlign: 'center', padding: '2rem' }}>⚠️ Veuillez vous connecter pour accéder à la communauté.</div>;
    }

    useEffect(() => {
        fetchDiscussions();
        fetchOnlineCount();
        const interval = setInterval(fetchOnlineCount, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchOnlineCount = async () => {
        try {
            const { count, error } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('availability', 'available');
            
            if (!error) setOnlineCount(count || 0);
        } catch (e) {
            console.log("Error fetching online count");
        }
    };

    const fetchDiscussions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('discussions')
                .select('*, users (fullname, specialty, image)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedDiscussions = data.map(d => {
                    const userProfile = d.users || {};
                    return {
                        id: d.id,
                        title: d.title,
                        content: d.content,
                        createdAt: d.created_at,
                        authorName: userProfile.fullname || userProfile.full_name || 'Technicien',
                        authorSpecialty: userProfile.specialty || '',
                        authorImage: userProfile.image,
                        imageUrl: d.image_url,
                        userId: d.user_id,
                        messageCount: 0
                    };
                });
                setDiscussions(mappedDiscussions);
                localStorage.setItem('ST_CACHE_FORUM', JSON.stringify(mappedDiscussions));
            }
        } catch (error) {
            console.error("Error fetching discussions:", error.message);
        }
        setLoading(false);
    };

    const handleCreateDiscussion = async (e) => {
        e.preventDefault();
        if (!content.trim() && !pendingImage) {
            alert("Veuillez écrire un message ou ajouter une photo.");
            return;
        }

        setSubmitting(true);
        try {
            let uploadedImageUrl = null;

            if (pendingImage) {
                const fileExt = pendingImage.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `threads/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('forum')
                    .upload(filePath, pendingImage);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('forum')
                    .getPublicUrl(filePath);
                
                uploadedImageUrl = publicUrlData.publicUrl;
            }

            const { error } = await supabase
                .from('discussions')
                .insert([{
                    user_id: currentUser.id,
                    title: content.substring(0, 50) + (content.length > 50 ? '...' : '') || "Nouvelle discussion",
                    content: content,
                    image_url: uploadedImageUrl
                }]);

            if (error) throw error;

            setContent('');
            setPendingImage(null);
            setShowNewDiscussion(false);
            fetchDiscussions();
            alert("Discussion créée avec succès !");

        } catch (error) {
            console.error("Error creating discussion:", error.message);
            alert("Erreur lors de la création : " + error.message);
        }
        setSubmitting(false);
    };

    const handleDeleteDiscussion = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!window.confirm("Voulez-vous vraiment supprimer cette discussion ? Cette action est irréversible.")) {
            return;
        }

        try {
            // 1. Supprimer d'abord les messages liés (au cas où il n'y a pas de ON DELETE CASCADE)
            await supabase
                .from('discussion_messages')
                .delete()
                .eq('discussion_id', id);

            // 2. Supprimer la discussion avec select() pour vérifier
            const { data, error } = await supabase
                .from('discussions')
                .delete()
                .eq('id', id)
                .select();

            if (error) throw error;
            
            if (!data || data.length === 0) {
                alert("La suppression a échoué côté serveur. Assurez-vous d'avoir les droits de suppression.");
                return;
            }
            
            // Update local state
            const newDiscussions = discussions.filter(d => d.id !== id);
            setDiscussions(newDiscussions);
            localStorage.setItem('ST_CACHE_FORUM', JSON.stringify(newDiscussions));
            
            // Optionnel : Forcer le rechargement depuis le serveur pour être 100% sûr
            fetchDiscussions();
            
            alert("Discussion supprimée avec succès !");
        } catch (error) {
            console.error("Erreur suppression:", error);
            alert("Erreur lors de la suppression : " + error.message);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPendingImage(e.target.files[0]);
        }
    };

    const takePhoto = async () => {
        try {
            const image = await CapCamera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Uri
            });

            if (image.webPath) {
                const response = await fetch(image.webPath);
                const blob = await response.blob();
                const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
                setPendingImage(file);
            }
        } catch (error) {
            console.error("Camera error:", error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return date.toLocaleDateString('fr-FR');
    };

    // Identité déjà validée en haut du composant

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100vh', 
            background: '#f0f2f5', // Fond clair WhatsApp
            color: '#111b21', // Texte foncé WhatsApp
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            position: 'relative'
        }}>
            {/* Header WhatsApp Clair */}
            <header style={{
                background: '#00a884',
                color: '#ffffff', // Blanc pur pour le titre
                padding: '40px 16px 16px 16px', // Augmenté pour éviter l'encoche
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '700', color: '#ffffff' }}>Communauté</h1>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 'bold' }}>
                        Communauté Pro
                    </div>
                    <div style={{ 
                        fontSize: '0.7rem', 
                        color: '#dcfce7', 
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '4px',
                        marginTop: '2px'
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80', boxShadow: '0 0 5px #4ade80' }}></div>
                        {onlineCount} en ligne
                    </div>
                </div>
            </header>

            {/* Message d'information pour les utilisateurs */}
            <div style={{ 
                padding: '12px 16px', 
                background: '#e0f2fe', // Bleu très clair pour être informatif
                color: '#0369a1', // Texte bleu foncé
                fontSize: '0.85rem', 
                textAlign: 'center', 
                borderBottom: '1px solid #bae6fd',
                fontWeight: '500'
            }}>
                Précisez ici si vous êtes client ou technicien. Si vous recherchez une pièce ou autre chose, publiez-le ici.
            </div>

            {/* Formulaire Clair */}
            {showNewDiscussion && (
                <div style={{ 
                    padding: '16px', 
                    background: '#ffffff', 
                    borderBottom: '1px solid #e9edef',
                    animation: 'slideDown 0.3s ease'
                }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#00a884' }}>Nouvelle discussion</h3>
                    <form onSubmit={handleCreateDiscussion}>
                        <textarea
                            placeholder="Écrivez votre message..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '15px',
                                border: 'none',
                                fontSize: '0.95rem',
                                minHeight: '100px',
                                marginBottom: '12px',
                                background: '#f0f2f5',
                                color: '#111b21',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                outline: 'none'
                            }}
                            required={!pendingImage} // Facultatif si on a une image
                        />

                        {/* Prévisualisation Photo */}
                        {pendingImage && (
                            <div style={{
                                background: '#f0f2f5',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '12px',
                                borderLeft: '3px solid #00a884'
                            }}>
                                <span style={{ fontSize: '0.85rem', color: '#111b21', flex: 1 }}>
                                    📷 Image prête : {pendingImage.name}
                                </span>
                                <button type="button" onClick={() => setPendingImage(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold' }}>×</button>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {/* Bouton Galerie */}
                            <label style={{ cursor: 'pointer', color: '#00a884', padding: '12px', background: '#f0f2f5', borderRadius: '15px', display: 'flex', alignItems: 'center', transition: '0.2s', border: '1px solid #e9edef' }}>
                                <Image size={24} />
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                    style={{ display: 'none' }} 
                                />
                            </label>

                            {/* Bouton Caméra Direct */}
                            <button 
                                type="button"
                                onClick={takePhoto}
                                style={{ 
                                    cursor: 'pointer', color: '#00a884', padding: '12px', background: '#f0f2f5', 
                                    borderRadius: '15px', display: 'flex', alignItems: 'center', 
                                    border: '1px solid #e9edef', transition: '0.2s' 
                                }}
                            >
                                <Camera size={24} />
                            </button>

                            <div style={{ flex: 1 }} />

                            <button
                                type="submit"
                                style={{ 
                                    background: '#00a884', 
                                    color: '#fff', 
                                    border: 'none', 
                                    padding: '10px 20px', 
                                    borderRadius: '20px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                                disabled={submitting}
                            >
                                {submitting ? 'Publication...' : 'Publier'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowNewDiscussion(false)}
                                style={{ 
                                    background: 'transparent', 
                                    color: '#8696a0', 
                                    border: 'none', 
                                    padding: '10px 10px', 
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <style>{`
                @keyframes slideDown {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            {/* Liste des Discussions Style WhatsApp Clair */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#8696a0' }}>Chargement...</div>
            ) : discussions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#ffffff', color: '#8696a0' }}>
                    <MessageSquare size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '0.9rem' }}>Aucune discussion pour le moment.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', background: '#f0f2f5' }}>
                    {discussions.map(discussion => (
                        <Link
                            key={discussion.id}
                            to={`/forum/${discussion.id}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px 16px',
                                textDecoration: 'none',
                                color: 'inherit',
                                background: '#ffffff',
                                borderBottom: '1px solid #e2e8f0',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                        >
                            {/* Avatar */}
                            <div style={{ position: 'relative', marginRight: '15px' }}>
                                <img
                                    src={discussion.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(discussion.authorName)}&background=007bff&color=fff&size=50`}
                                    alt={discussion.authorName}
                                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            {/* Infos */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                    <h3 style={{ 
                                        fontSize: '1.05rem', 
                                        margin: 0, 
                                        fontWeight: '500', 
                                        color: '#1e293b',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {discussion.title}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#8696a0' }}>
                                            {formatDate(discussion.createdAt)}
                                        </span>
                                        {discussion.userId === currentUser.id && (
                                            <button 
                                                onClick={(e) => handleDeleteDiscussion(e, discussion.id)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Supprimer la discussion"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {discussion.imageUrl && (
                                    <img 
                                        src={discussion.imageUrl} 
                                        alt="Preview" 
                                        style={{ width: '100%', height: '120px', borderRadius: '8px', objectFit: 'cover', margin: '8px 0' }} 
                                    />
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <p style={{ 
                                        fontSize: '0.9rem', 
                                        color: '#8696a0', 
                                        margin: 0,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        flex: 1
                                    }}>
                                        <span style={{ fontWeight: '500', color: '#00a884' }}>{discussion.authorName}</span> : {discussion.content}
                                    </p>
                                    {discussion.messageCount > 0 && (
                                        <span style={{ 
                                            background: '#00a884', 
                                            color: '#ffffff', 
                                            fontSize: '0.75rem', 
                                            minWidth: '20px', 
                                            height: '20px', 
                                            borderRadius: '10px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            padding: '0 6px',
                                            marginLeft: '8px',
                                            fontWeight: 'bold'
                                        }}>
                                            {discussion.messageCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Bouton Plus Style WhatsApp */}
            <button
                onClick={() => setShowNewDiscussion(!showNewDiscussion)}
                style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '25px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '18px', // Plus carré style WhatsApp Web
                    background: '#00a884',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    zIndex: 200,
                    transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <Edit2 size={26} />
            </button>
        </div>
    );
};

export default Forum;
