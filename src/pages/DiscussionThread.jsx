import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Send, User, Clock, Image } from 'lucide-react';

const DiscussionThread = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [discussion, setDiscussion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [pendingImage, setPendingImage] = useState(null);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (discussion?.messages) {
            scrollToBottom();
        }
    }, [discussion?.messages]);

    // Protected by App.jsx Route

    useEffect(() => {
        fetchDiscussion();

        // 🟢 ABONNEMENT TEMPS RÉEL (V185)
        const sub = supabase.channel(`forum_thread_${id}`)
            .on('postgres_changes', { event: 'INSERT', table: 'discussion_messages', filter: `discussion_id=eq.${id}` }, () => {
                console.log("🆕 Nouveau message détecté par Realtime!");
                fetchDiscussion(); // On recharge silencieusement
            })
            .subscribe();

        return () => {
            supabase.removeChannel(sub);
        };
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
                .from('discussion_messages')
                .select('*, users (fullname, specialty, image)')
                .eq('discussion_id', id)
                .order('created_at', { ascending: true });

            if (messagesError) throw messagesError;

            if (discussionData) {
                const messages = messagesData ? messagesData.map(m => ({
                    id: m.id,
                    message: m.content,
                    createdAt: m.created_at,
                    authorName: m.users?.[0]?.fullname || m.users?.[0]?.fullName || 'Expert', // Souvent un tableau si jointure complexe
                    authorSpecialty: m.users?.[0]?.specialty || '',
                    authorImage: m.users?.[0]?.image,
                    image_url: m.image_url // ✅ ON AJOUTE ÇA
                })) : (messagesData ? messagesData.map(m => ({
                    id: m.id,
                    message: m.content,
                    createdAt: m.created_at,
                    authorName: m.users?.fullname || m.users?.fullName || 'Technicien',
                    authorSpecialty: m.users?.specialty || '',
                    authorImage: m.users?.image,
                    image_url: m.image_url // ✅ ON AJOUTE ÇA
                })) : []);

                setDiscussion({
                    id: discussionData.id,
                    title: discussionData.title,
                    content: discussionData.content,
                    createdAt: discussionData.created_at,
                    authorName: discussionData.users?.fullname || discussionData.users?.[0]?.fullname || 'Auteur',
                    authorSpecialty: discussionData.users?.specialty || discussionData.users?.[0]?.specialty || '',
                    authorImage: discussionData.users?.image || discussionData.users?.[0]?.image,
                    imageUrl: discussionData.image_url, // ✅ ON AJOUTE ÇA
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
        if (!message.trim() && !pendingImage) {
            alert("Veuillez écrire un message ou joindre une photo.");
            return;
        }

        setSubmitting(true);
        try {
            let imageUrl = null;

            // 1. Gérer l'upload de l'image si présente
            if (pendingImage) {
                const fileExt = pendingImage.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `messages/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('forum')
                    .upload(filePath, pendingImage);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('forum')
                    .getPublicUrl(filePath);
                
                imageUrl = publicUrlData.publicUrl;
            }

            // 2. Insérer le message en base
            const { error } = await supabase
                .from('discussion_messages')
                .insert([{
                    discussion_id: id,
                    user_id: currentUser.id,
                    content: message,
                    image_url: imageUrl
                }]);

            if (error) throw error;

            setMessage('');
            setPendingImage(null);
            fetchDiscussion(); // Refresh to show new message

        } catch (error) {
            console.error("Error posting message:", error.message);
            alert("Erreur lors de l'envoi : " + error.message);
        }
        setSubmitting(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPendingImage(e.target.files[0]);
        }
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

    const userRole = (currentUser?.role || "").toLowerCase();

    if (!currentUser) {
        return <div style={{ textAlign: 'center', padding: '2rem' }}>⚠️ Veuillez vous connecter pour accéder à la discussion.</div>;
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
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100vh', 
            background: '#e5ddd5', // Fond de chat clair WhatsApp
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            color: '#111b21',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            overflowX: 'hidden'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '900px',
                margin: '0 auto',
                background: '#ffffff',
                height: '100%',
                boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
            {/* Header style WhatsApp Clair - Descendu pour le clic */}
            <header style={{
                background: '#00a884',
                color: '#ffffff',
                padding: '60px 16px 16px 16px', // Augmenté à 60px pour un clic facile
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 10
            }}>
                <button onClick={() => navigate('/forum')} style={{ background: 'none', border: 'none', color: '#ffffff', padding: '5px', cursor: 'pointer' }}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {discussion.title}
                    </h2>
                    <div style={{ fontSize: '0.75rem', color: '#ffffff' }}>
                        {discussion.authorName} • {discussion.authorSpecialty}
                    </div>
                </div>
            </header>

            {/* Messages Area Clair */}
            <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                backgroundColor: '#e5ddd5',
                backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                backgroundBlendMode: 'overlay'
            }}>
                {/* Premier message (Auteur) */}
                <div style={{
                    alignSelf: 'flex-start',
                    background: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '0 10px 10px 10px',
                    maxWidth: '85%',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    position: 'relative',
                    marginBottom: '10px',
                    borderLeft: '4px solid #00a884'
                }}>
                    <div style={{ fontWeight: '700', fontSize: '0.75rem', color: '#00a884', marginBottom: '4px' }}>
                        {discussion.authorName} (Auteur)
                    </div>
                    {discussion.imageUrl && (
                        <img 
                            src={discussion.imageUrl} 
                            alt="Discussion media" 
                            style={{ maxWidth: '100%', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer' }}
                            onClick={() => window.open(discussion.imageUrl, '_blank')}
                        />
                    )}
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#111b21', lineHeight: '1.4', whiteSpace: 'pre-line' }}>{discussion.content}</p>
                    <div style={{ textAlign: 'right', fontSize: '0.65rem', color: '#667781', marginTop: '4px' }}>
                        {formatDate(discussion.createdAt)}
                    </div>
                </div>

                {/* Réponses */}
                {discussion.messages?.map((msg) => {
                    const isMe = msg.authorName === currentUser.fullName || msg.authorName === currentUser.fullname;
                    return (
                        <div
                            key={msg.id}
                            style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                background: isMe ? '#d9fdd3' : '#ffffff', // Vert clair vs Blanc
                                padding: '8px 12px',
                                borderRadius: isMe ? '10px 0 10px 10px' : '0 10px 10px 10px',
                                maxWidth: '85%',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                position: 'relative'
                            }}
                        >
                            {!isMe && (
                                <div style={{ fontWeight: '700', fontSize: '0.75rem', color: '#3b82f6', marginBottom: '4px' }}>
                                    {msg.authorName} • {msg.authorSpecialty}
                                </div>
                            )}

                            {/* Image dans le message (si existe) */}
                            {msg.image_url && (
                                <img 
                                    src={msg.image_url} 
                                    alt="Message media" 
                                    style={{ maxWidth: '100%', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer' }}
                                    onClick={() => window.open(msg.image_url, '_blank')}
                                />
                            )}

                            <p style={{ margin: 0, fontSize: '0.95rem', color: '#111b21', lineHeight: '1.4', whiteSpace: 'pre-line' }}>{msg.message}</p>
                            <div style={{ textAlign: 'right', fontSize: '0.65rem', color: '#667781', marginTop: '4px' }}>
                                {formatDate(msg.createdAt)}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} style={{ height: '80px' }}></div>
            </div>

            {/* Zone de prévisualisation de l'image sélectionnée */}
            {pendingImage && (
                <div style={{
                    background: '#f0f2f5',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderTop: '1px solid #e9edef'
                }}>
                    <div style={{ fontSize: '0.8rem', color: '#00a884', flex: 1 }}>
                        📷 Image prête : {pendingImage.name}
                    </div>
                    <button onClick={() => setPendingImage(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
                </div>
            )}

            {/* Input Bar Claire */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '10px 12px',
                background: '#f0f2f5',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 20
            }}>
                {/* Bouton Camera */}
                <label style={{ cursor: 'pointer', color: '#667781', padding: '5px' }}>
                    <Image size={24} />
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                    />
                </label>

                <div style={{ 
                    flex: 1, 
                    background: '#ffffff', 
                    borderRadius: '25px', 
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '45px'
                }}>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tapez un message"
                        style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            color: '#111b21',
                            outline: 'none',
                            padding: '10px 5px',
                            fontSize: '0.95rem',
                            resize: 'none',
                            maxHeight: '100px',
                            fontFamily: 'inherit'
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handlePostMessage(e);
                            }
                        }}
                    />
                </div>
                <button
                    onClick={handlePostMessage}
                    disabled={submitting || (!message.trim() && !pendingImage)}
                    style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        background: '#00a884',
                        color: '#ffffff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s',
                        opacity: (!message.trim() && !pendingImage) ? 0.5 : 1
                    }}
                >
                    <Send size={20} />
                </button>
            </div>
            </div>
        </div>

    );
};

export default DiscussionThread;
