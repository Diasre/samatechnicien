import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config';
import { MessageSquare, Plus, User, Clock, MessageCircle } from 'lucide-react';

const Forum = () => {
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewDiscussion, setShowNewDiscussion] = useState(false);
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user'));

    // Redirect if not a technician
    useEffect(() => {
        if (!currentUser || currentUser.role !== 'technician') {
            navigate('/');
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        fetchDiscussions();
    }, []);

    const fetchDiscussions = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/discussions`);
            const data = await response.json();
            if (data.message === 'success') {
                setDiscussions(data.data);
            }
        } catch (error) {
            console.error("Error fetching discussions:", error);
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
            const response = await fetch(`${API_URL}/api/discussions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    technicianId: currentUser.id,
                    title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                    content: content
                })
            });

            if (response.ok) {
                setContent('');
                setShowNewDiscussion(false);
                fetchDiscussions();
                alert("Discussion créée avec succès !");
            } else {
                const errData = await response.json();
                alert(errData.message || "Erreur lors de la création.");
            }
        } catch (error) {
            console.error("Error creating discussion:", error);
            alert("Erreur de connexion au serveur.");
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

    if (!currentUser || currentUser.role !== 'technician') {
        return null;
    }

    return (
        <div className="container" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Forum Techniciens</h2>
                    <p style={{ fontSize: '0.8rem', color: '#666' }}>Espace de discussion entre professionnels</p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => setShowNewDiscussion(!showNewDiscussion)}
                >
                    <Plus size={16} />
                    Nouvelle Discussion
                </button>
            </div>

            {/* New Discussion Form */}
            {showNewDiscussion && (
                <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Créer une nouvelle discussion</h3>
                    <form onSubmit={handleCreateDiscussion}>

                        <textarea
                            placeholder="Écrivez votre question ou sujet de discussion..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #ddd',
                                fontSize: '0.9rem',
                                minHeight: '120px',
                                marginBottom: '0.75rem',
                                resize: 'vertical'
                            }}
                            required
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting}
                                style={{ fontSize: '0.85rem' }}
                            >
                                {submitting ? 'Publication...' : 'Publier'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setShowNewDiscussion(false)}
                                style={{ fontSize: '0.85rem' }}
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {discussions.map(discussion => (
                        <Link
                            key={discussion.id}
                            to={`/forum/${discussion.id}`}
                            className="card"
                            style={{
                                padding: '1rem',
                                textDecoration: 'none',
                                color: 'inherit',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--primary-color)' }}>
                                    {discussion.title}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#666' }}>
                                    <MessageCircle size={14} />
                                    <span>{discussion.messageCount}</span>
                                </div>
                            </div>

                            <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                                {discussion.content.length > 150 ? discussion.content.substring(0, 150) + '...' : discussion.content}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#888' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <img
                                        src={discussion.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(discussion.authorName)}&background=random&color=fff&size=32`}
                                        alt={discussion.authorName}
                                        style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                                    />
                                    <span>{discussion.authorName}</span>
                                    <span style={{ color: '#ccc' }}>•</span>
                                    <span style={{ color: 'var(--primary-color)', fontSize: '0.7rem' }}>{discussion.authorSpecialty}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={12} />
                                    <span>{formatDate(discussion.createdAt)}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Forum;
