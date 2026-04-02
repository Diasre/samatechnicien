import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { MessageSquare, Plus, User, Clock, MessageCircle } from 'lucide-react';

const Forum = () => {
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewDiscussion, setShowNewDiscussion] = useState(false);
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const userRole = (currentUser?.role || "").toLowerCase();
    const isTech = userRole.includes('tech') || userRole.includes('expert') || userRole.includes('pro');

    if (!currentUser || !isTech) {
        return <div style={{ textAlign: 'center', padding: '2rem' }}>⚠️ Accès réservé aux techniciens.</div>;
    }

    useEffect(() => {
        fetchDiscussions();
    }, []);

    const fetchDiscussions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('discussions')
                .select('*, users (fullname, specialty, image)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                console.log("💾 Discussions brut Supabase:", data);
                const mappedDiscussions = data.map(d => {
                    // Récupération souple des données utilisateur
                    const userProfile = d.users || {};
                    return {
                        id: d.id,
                        title: d.title,
                        content: d.content,
                        createdAt: d.created_at,
                        authorName: userProfile.fullname || userProfile.full_name || 'Technicien',
                        authorSpecialty: userProfile.specialty || '',
                        authorImage: userProfile.image,
                        messageCount: 0
                    };
                });
                setDiscussions(mappedDiscussions);
            }
        } catch (error) {
            console.error("Error fetching discussions:", error.message);
        }
        setLoading(false);
    };

    const handleCreateDiscussion = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            alert("Veuillez écrire votre message.");
            return;
        }

        setSubmitting(true);
        try {
            console.log("👷‍♂️ Tentative d'insertion avec user_id...");
            const { error } = await supabase
                .from('discussions')
                .insert([{
                    user_id: currentUser.id,
                    title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                    content: content
                }]);

            if (error) throw error;

            setContent('');
            setShowNewDiscussion(false);
            fetchDiscussions();
            alert("Discussion créée avec succès !");

        } catch (error) {
            console.error("Error creating discussion:", error.message);
            alert("Erreur lors de la création : " + error.message);
        }
        setSubmitting(false);
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
            background: '#fff',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            position: 'relative'
        }}>
            {/* Header WhatsApp */}
            <header style={{
                background: '#075e54',
                color: '#fff',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '700' }}>Communauté</h1>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                    Espace Pro
                </div>
            </header>

            {/* Formulaire (S'affiche par dessus ou en haut) */}
            {showNewDiscussion && (
                <div style={{ 
                    padding: '16px', 
                    background: '#f0f2f5', 
                    borderBottom: '1px solid #ddd',
                    animation: 'slideDown 0.3s ease'
                }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#075e54' }}>Nouvelle discussion</h3>
                    <form onSubmit={handleCreateDiscussion}>
                        <textarea
                            placeholder="De quoi voulez-vous discuter ?"
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
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                outline: 'none'
                            }}
                            required
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="submit"
                                style={{ 
                                    background: '#25d366', 
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
                                    color: '#666', 
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

            {/* Discussions List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Chargement...</div>
            ) : discussions.length === 0 ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <MessageSquare size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Aucune discussion pour le moment.</p>
                    <p style={{ color: '#999', fontSize: '0.8rem' }}>Soyez le premier à lancer une discussion !</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', background: '#fff' }}>
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
                                borderBottom: '1px solid #f0f2f5',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f6f6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                        >
                            {/* Avatar */}
                            <div style={{ position: 'relative', marginRight: '15px' }}>
                                <img
                                    src={discussion.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(discussion.authorName)}&background=random&color=fff&size=50`}
                                    alt={discussion.authorName}
                                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            </div>

                            {/* Infos */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <h3 style={{ 
                                        fontSize: '1rem', 
                                        margin: 0, 
                                        fontWeight: '700', 
                                        color: '#111b21',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {discussion.title}
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', color: '#667781' }}>
                                        {formatDate(discussion.createdAt)}
                                    </span>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <p style={{ 
                                        fontSize: '0.85rem', 
                                        color: '#667781', 
                                        margin: 0,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        flex: 1
                                    }}>
                                        <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{discussion.authorName}</span> : {discussion.content}
                                    </p>
                                    {discussion.messageCount > 0 && (
                                        <span style={{ 
                                            background: '#25d366', 
                                            color: '#fff', 
                                            fontSize: '0.7rem', 
                                            minWidth: '20px', 
                                            height: '20px', 
                                            borderRadius: '10px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            padding: '0 6px',
                                            marginLeft: '8px',
                                            fontWeight: '700'
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

            {/* Floating Action Button (FAB) */}
            <button
                onClick={() => setShowNewDiscussion(!showNewDiscussion)}
                style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '25px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#25d366',
                    color: '#fff',
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
                <Plus size={30} />
            </button>
        </div>
    );
};

export default Forum;
