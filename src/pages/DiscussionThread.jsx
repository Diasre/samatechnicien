import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Send, User, Clock } from 'lucide-react';

const DiscussionThread = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [discussion, setDiscussion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user'));

    // Redirect if not a technician
    useEffect(() => {
        if (!currentUser || currentUser.role !== 'technician') {
            navigate('/');
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        fetchDiscussion();
    }, [id]);

    const fetchDiscussion = async () => {
        setLoading(true);
        try {
            // 1. Fetch Discussion Details
            const { data: discussionData, error: discussionError } = await supabase
                .from('discussions')
                .select('*, users (fullname, specialty, image)')
                .eq('id', id)
                .single();

            if (discussionError) throw discussionError;

            // 2. Fetch Messages
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('*, users (fullname, specialty, image)')
                .eq('discussionId', id)
                .order('created_at', { ascending: true });

            if (messagesError) throw messagesError;

            if (discussionData) {
                const messages = messagesData ? messagesData.map(m => ({
                    id: m.id,
                    message: m.content,
                    createdAt: m.created_at,
                    authorName: m.users?.fullname || m.users?.fullName || 'Utilisateur inconnu',
                    authorSpecialty: m.users?.specialty || '',
                    authorImage: m.users?.image
                })) : [];

                setDiscussion({
                    id: discussionData.id,
                    title: discussionData.title,
                    content: discussionData.content,
                    createdAt: discussionData.created_at,
                    authorName: discussionData.users?.fullname || discussionData.users?.fullName || 'Auteur inconnu',
                    authorSpecialty: discussionData.users?.specialty || '',
                    authorImage: discussionData.users?.image,
                    messages: messages
                });
            }

        } catch (error) {
            console.error("Error fetching discussion:", error.message);
            setError(error.message);
        }
        setLoading(false);
    };

    const handlePostMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) {
            alert("Veuillez écrire un message.");
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('messages')
                .insert([{
                    discussionId: id,
                    technicianId: currentUser.id,
                    content: message
                }]);

            if (error) throw error;

            setMessage('');
            fetchDiscussion(); // Refresh to show new message

        } catch (error) {
            console.error("Error posting message:", error.message);
            alert("Erreur lors de l'envoi : " + error.message);
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

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    if (!currentUser || currentUser.role !== 'technician') {
        return null;
    }

    if (loading) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
                Chargement...
            </div>
        );
    }

    if (!discussion) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
                <h3>Discussion non trouvée</h3>
                <p style={{ color: 'red', fontSize: '0.9rem' }}>
                    {error ? `Erreur: ${error}` : "La discussion demandée n'existe pas ou a été supprimée."}
                </p>
                <Link to="/forum" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
                    Retour au forum
                </Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '1rem', maxWidth: '900px', margin: '0 auto' }}>
            {/* Back Button */}
            <Link
                to="/forum"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    textDecoration: 'none',
                    color: '#666',
                    fontSize: '0.85rem'
                }}
            >
                <ArrowLeft size={16} /> Retour au forum
            </Link>

            {/* Discussion Header */}
            <div className="card" style={{ padding: '0.6rem', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>
                    {discussion.title}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #eee' }}>
                    <img
                        src={discussion.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(discussion.authorName)}&background=random&color=fff&size=48`}
                        alt={discussion.authorName}
                        style={{ width: '26px', height: '26px', borderRadius: '50%' }}
                    />
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '0.7rem' }}>{discussion.authorName}</div>
                        <div style={{ fontSize: '0.6rem', color: '#666' }}>
                            {discussion.authorSpecialty} • {formatDate(discussion.createdAt)}
                        </div>
                    </div>
                </div>

                <p style={{ fontSize: '0.75rem', lineHeight: '1.3', color: '#333', whiteSpace: 'pre-line' }}>
                    {discussion.content}
                </p>
            </div>

            {/* Messages */}
            <div style={{ marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.8rem', marginBottom: '0.4rem', color: '#666' }}>
                    Réponses ({discussion.messages?.length || 0})
                </h3>

                {discussion.messages && discussion.messages.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {discussion.messages.map((msg) => (
                            <div
                                key={msg.id}
                                className="card"
                                style={{
                                    padding: '0.5rem',
                                    backgroundColor: msg.authorName === currentUser.fullName ? '#f0f9ff' : '#fff'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                                    <img
                                        src={msg.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.authorName)}&background=random&color=fff&size=32`}
                                        alt={msg.authorName}
                                        style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.7rem' }}>{msg.authorName}</div>
                                        <div style={{ fontSize: '0.6rem', color: '#888' }}>
                                            {msg.authorSpecialty}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.6rem', color: '#999', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                        <Clock size={10} />
                                        {formatDate(msg.createdAt)}
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.72rem', lineHeight: '1.3', color: '#444', margin: 0, whiteSpace: 'pre-line' }}>
                                    {msg.message}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card" style={{ padding: '1rem', textAlign: 'center', color: '#999', fontSize: '0.75rem' }}>
                        Aucune réponse pour le moment. Soyez le premier à répondre !
                    </div>
                )}
            </div>

            {/* Reply Form */}
            <div className="card" style={{ padding: '0.6rem', position: 'sticky', bottom: '1rem', backgroundColor: '#fff' }}>
                <h4 style={{ fontSize: '0.75rem', marginBottom: '0.4rem' }}>Votre réponse</h4>
                <form onSubmit={handlePostMessage}>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Écrivez votre réponse..."
                        style={{
                            width: '100%',
                            padding: '0.4rem',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            fontSize: '0.75rem',
                            minHeight: '50px',
                            marginBottom: '0.5rem',
                            resize: 'vertical'
                        }}
                        required
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', padding: '0.35rem 0.7rem' }}
                    >
                        <Send size={14} />
                        {submitting ? 'Envoi...' : 'Envoyer'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DiscussionThread;
