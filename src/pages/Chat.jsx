import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Send, User, MessageCircle } from 'lucide-react';

const Chat = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    const [userUUID, setUserUUID] = useState(null);

    // Resolve User UUID on mount
    useEffect(() => {
        const resolveUserUUID = async () => {
            if (!user) return;

            // Allow direct UUIDs
            let resolved = user.uuid || user.user_id || user.auth_id || (typeof user.id === 'string' && user.id.length > 20 ? user.id : null);

            // If ID is integer, try to fetch UUID via RPC
            if (!resolved && user.id) {
                try {
                    const { data, error } = await supabase.rpc('get_technician_uuid', {
                        technician_id: Number(user.id)
                    });
                    if (data && !error) resolved = data;
                } catch (e) { console.error("Error resolving:", e); }
            }
            if (resolved) setUserUUID(resolved);
        };
        resolveUserUUID();
    }, []);

    useEffect(() => {
        if (userUUID) {
            fetchConversations();
        }
    }, [userUUID]);

    // Effect to handle deep linking via URL parameter (?id=...)
    useEffect(() => {
        const handleDeepLink = async () => {
            const params = new URLSearchParams(window.location.search);
            const conversationId = params.get('id');

            if (!conversationId) return;

            // 1. Try to find in loaded list
            const targetConv = conversations.find(c => c.id === conversationId);

            if (targetConv) {
                // Found in list, select it
                setSelectedConversation(targetConv);
            } else {
                // 2. Not in list (maybe new?), fetch specifically
                try {
                    const { data, error } = await supabase
                        .from('conversations')
                        .select(`
                            id, 
                            created_at, 
                            participant1:participant1_id (id, full_name, avatar_url),
                            participant2:participant2_id (id, full_name, avatar_url),
                            updated_at
                        `)
                        .eq('id', conversationId)
                        .single();

                    if (data) {
                        // Format it
                        const otherUser = data.participant1.id === user.id ? data.participant2 : data.participant1;
                        const formattedConv = {
                            id: data.id,
                            otherUser: otherUser || { full_name: 'Utilisateur Inconnu' },
                            updated_at: data.updated_at
                        };

                        // Select it immediately
                        setSelectedConversation(formattedConv);

                        // Add to list responsibly
                        setConversations(prev => {
                            if (prev.find(c => c.id === formattedConv.id)) return prev;
                            return [formattedConv, ...prev];
                        });
                    }
                } catch (err) {
                    console.error("Error fetching specific conversation:", err);
                }
            }
        };

        handleDeepLink();
    }, [conversations, window.location.search]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
            // Subscribe to new messages for this conversation
            const channel = supabase
                .channel(`chat:${selectedConversation.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `conversation_id=eq.${selectedConversation.id}`
                }, (payload) => {
                    setMessages((prev) => [...prev, payload.new]);
                    scrollToBottom();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedConversation]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversations = async () => {
        if (!userUUID) return;
        setLoading(true);
        try {
            // Priority: Try the robust RPC call (bypasses RLS issues)
            const { data: rpcData, error: rpcError } = await supabase.rpc('fetch_my_conversations', {
                p_user_uuid: userUUID
            });

            if (rpcData && !rpcError) {
                // Map RPC result to component format
                const formatted = rpcData.map(c => ({
                    id: c.id,
                    otherUser: {
                        id: c.other_user_id,
                        full_name: c.other_user_name,
                        avatar_url: c.other_user_image
                    },
                    updated_at: c.updated_at
                }));
                setConversations(formatted);
            } else {
                // Fallback: Try standard query (might fail due to permissions)
                console.warn("RPC fetch failed, falling back to standard query", rpcError);

                const { data, error } = await supabase
                    .from('conversations')
                    .select(`
                        id, 
                        created_at, 
                        participant1:participant1_id (id, full_name, avatar_url),
                        participant2:participant2_id (id, full_name, avatar_url)
                    `)
                    .or(`participant1_id.eq.${userUUID},participant2_id.eq.${userUUID}`)
                    .order('updated_at', { ascending: false });

                if (error) throw error;

                const formatted = data.map(conv => {
                    const otherUser = conv.participant1.id === userUUID ? conv.participant2 : conv.participant1;
                    return {
                        id: conv.id,
                        otherUser: otherUser || { full_name: 'Utilisateur Inconnu' },
                        updated_at: conv.updated_at
                    };
                });
                setConversations(formatted);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId) => {
        const { data, error } = await supabase
            .from('direct_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
        } else {
            setMessages(data);
            setTimeout(scrollToBottom, 100);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const messageContent = newMessage.trim();
        setNewMessage(''); // Clear input immediately for better UX

        try {
            const { error } = await supabase
                .from('direct_messages')
                .insert({
                    conversation_id: selectedConversation.id,
                    sender_id: user.id,
                    content: messageContent
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Erreur lors de l\'envoi du message');
        }
    };

    if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Chargement de vos messages...</div>;

    return (
        <div className="container" style={{ padding: '1rem', height: 'calc(100vh - 80px)', display: 'flex', gap: '1rem' }}>
            {/* Sidebar List (Full width on mobile if no conversation selected) */}
            <div className={`card ${selectedConversation ? 'mobile-hidden' : ''}`} style={{ flex: '1', maxWidth: '350px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}>
                        <MessageCircle size={20} style={{ marginRight: '0.5rem' }} /> Messages
                    </h2>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {conversations.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                            <p>Aucune conversation pour le moment.</p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid #f0f0f0',
                                    cursor: 'pointer',
                                    backgroundColor: selectedConversation?.id === conv.id ? '#f0f9ff' : 'white',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    backgroundColor: '#ddd', marginRight: '1rem',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    overflow: 'hidden'
                                }}>
                                    {conv.otherUser.avatar_url ? (
                                        <img src={conv.otherUser.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={20} color="#666" />
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{conv.otherUser.full_name || 'Utilisateur'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Cliquez pour voir les messages</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            {selectedConversation ? (
                <div className="card" style={{ flex: '2', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Header */}
                    <div style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
                        <button
                            className="mobile-only"
                            onClick={() => setSelectedConversation(null)}
                            style={{ marginRight: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                        >
                            ←
                        </button>
                        <h3 style={{ margin: 0 }}>{selectedConversation.otherUser.full_name}</h3>
                    </div>

                    {/* Messages Area */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column' }}>
                        {messages.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#888', marginTop: '2rem' }}>
                                Début de la conversation avec {selectedConversation.otherUser.full_name}
                            </div>
                        )}
                        {messages.map((msg) => {
                            const isMe = msg.sender_id === user.id;
                            return (
                                <div key={msg.id} style={{
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '70%',
                                    marginBottom: '0.75rem',
                                    backgroundColor: isMe ? 'var(--primary-color)' : 'white',
                                    color: isMe ? 'white' : 'black',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '18px',
                                    borderBottomRightRadius: isMe ? '4px' : '18px',
                                    borderBottomLeftRadius: isMe ? '18px' : '4px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}>
                                    {msg.content}
                                    <div style={{ fontSize: '0.65rem', textAlign: 'right', marginTop: '0.25rem', opacity: 0.8 }}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '1rem', borderTop: '1px solid #eee' }}>
                        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Écrivez votre message..."
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '25px', border: '1px solid #ddd' }}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                style={{
                                    backgroundColor: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    width: '45px', height: '45px',
                                    borderRadius: '50%',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    cursor: newMessage.trim() ? 'pointer' : 'default',
                                    opacity: newMessage.trim() ? 1 : 0.6
                                }}
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="card mobile-hidden" style={{ flex: '2', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888', flexDirection: 'column' }}>
                    <MessageCircle size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>Sélectionnez une conversation pour commencer à discuter.</p>
                </div>
            )}

            <style>{`
                @media (max-width: 768px) {
                    .mobile-hidden {
                        display: none !important;
                    }
                    .mobile-only {
                        display: block;
                    }
                }
                @media (min-width: 769px) {
                    .mobile-only {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default Chat;
