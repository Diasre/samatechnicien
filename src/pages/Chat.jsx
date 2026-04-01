import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Send, User, MessageCircle, ArrowLeft, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Chat = () => {
    const navigate = useNavigate();
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

            // Priority: Try UUID from session
            let resolved = user.uuid || user.user_id || user.auth_id;
            
            // If not found, use user.id as the identifier (standard in this app)
            if (!resolved && user.id) {
                resolved = user.id;
            }

            // Fallback: If numeric ID, try to get official tech UUID (keeping for legacy)
            if (typeof resolved === 'number' || (typeof resolved === 'string' && /^\d+$/.test(resolved))) {
                try {
                    const { data, error } = await supabase.rpc('get_technician_uuid', {
                        technician_id: Number(user.id)
                    });
                    if (data && !error) resolved = data;
                } catch (e) { console.error("Error resolving tech UUID:", e); }
            }

            if (resolved) {
                const finalStr = String(resolved);
                console.log("Chat resolved identity:", finalStr);
                setUserUUID(finalStr);
            }
        };
        resolveUserUUID();
    }, []);

    useEffect(() => {
        if (userUUID) {
            fetchConversations();
        }
    }, [userUUID]);

    // Effect to handle deep linking via URL parameter (?id=... or ?userId=...)
    useEffect(() => {
        const handleDeepLink = async () => {
            const params = new URLSearchParams(window.location.search);
            const conversationId = params.get('id');
            const targetUserId = params.get('userId');

            if (!conversationId && !targetUserId) return;

            if (conversationId) {
                // 1. Existing conversation by ID
                const targetConv = conversations.find(c => c.id === conversationId);
                if (targetConv) {
                    setSelectedConversation(targetConv);
                } else {
                    try {
                        const { data, error } = await supabase
                            .from('conversations')
                            .select(`
                                id, 
                                participant1_id,
                                participant2_id,
                                updated_at
                            `)
                            .eq('id', conversationId)
                            .single();

                        if (data) {
                            const otherId = data.participant1_id === userUUID ? data.participant2_id : data.participant1_id;
                            // Need to fetch other user details
                            const { data: ud } = await supabase.from('users').select('id, fullname, image').eq('id', otherId).single();
                            
                            const formattedConv = {
                                id: data.id,
                                otherUser: {
                                    id: otherId,
                                    full_name: ud?.fullname || 'Utilisateur',
                                    avatar_url: ud?.image || ''
                                },
                                updated_at: data.updated_at
                            };

                            setSelectedConversation(formattedConv);
                            setConversations(prev => [formattedConv, ...prev.filter(c => c.id !== formattedConv.id)]);
                        }
                    } catch (err) { console.error(err); }
                }
            } else if (targetUserId && userUUID) {
                // 2. Start conversation with a specific User ID
                try {
                    // Search if exists
                    const { data: existing, error: errExist } = await supabase
                        .from('conversations')
                        .select('id')
                        .or(`and(participant1_id.eq.${userUUID},participant2_id.eq.${targetUserId}),and(participant1_id.eq.${targetUserId},participant2_id.eq.${userUUID})`)
                        .maybeSingle();

                    let finalId = existing?.id;

                    if (!finalId) {
                        // Create new
                        const { data: created, error: errCreate } = await supabase
                            .from('conversations')
                            .insert([{
                                participant1_id: userUUID,
                                participant2_id: targetUserId
                            }])
                            .select()
                            .single();
                        
                        if (created) finalId = created.id;
                    }

                    if (finalId) {
                        // Fetch other user details
                        const { data: ud } = await supabase.from('users').select('id, fullname, image').eq('id', targetUserId).single();
                        const formattedConv = {
                            id: finalId,
                            otherUser: {
                                id: targetUserId,
                                full_name: ud?.fullname || 'Client',
                                avatar_url: ud?.image || ''
                            },
                            updated_at: new Date().toISOString()
                        };

                        setSelectedConversation(formattedConv);
                        setConversations(prev => [formattedConv, ...prev.filter(c => c.id !== formattedConv.id)]);
                    }
                } catch (err) { console.error("Error starting chat:", err); }
            }
        };

        if (userUUID) handleDeepLink();
    }, [userUUID, window.location.search]);

    useEffect(() => {
        if (!userUUID) return;

        // Subscribe to new conversations for this user
        const channelConv = supabase
            .channel(`user-conversations:${userUUID}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'conversations',
                filter: `participant1_id=eq.${userUUID}`
            }, () => fetchConversations())
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'conversations',
                filter: `participant2_id=eq.${userUUID}`
            }, () => fetchConversations())
            .subscribe();

        return () => {
            supabase.removeChannel(channelConv);
        };
    }, [userUUID]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
            // Subscribe to new messages for this conversation
            const channelMsg = supabase
                .channel(`chat-messages:${selectedConversation.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `conversation_id=eq.${selectedConversation.id}`
                }, (payload) => {
                    // Only add if not already there to prevent duplicates
                    setMessages((prev) => {
                        if (prev.find(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
                    });
                    setTimeout(scrollToBottom, 100);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channelMsg);
            };
        }
    }, [selectedConversation]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const validateProposal = async (devisIdProp = null) => {
        if (!selectedConversation || !userUUID || user?.role !== 'client') return;
        if (!window.confirm("Voulez-vous accepter officiellement cette proposition ?")) return;
        
        try {
            // 1. Marquer le contrat dans le chat
            const { error } = await supabase.from('direct_messages').insert({
                conversation_id: selectedConversation.id,
                sender_id: userUUID,
                content: "✅ [CONTRAT VALIDÉ] J'accepte officiellement cette proposition j vais contacter le Technicien Merci !"
            });
            
            // 2. Mettre à jour l'ALGORITHME (Statuts DB)
            // On tente de mettre à jour si les tables existent
            try {
                // Si on a un devis structuré, on remonte à la demande
                const { data: conv } = await supabase.from('direct_messages').select('content').eq('conversation_id', selectedConversation.id).like('content', 'JSON_DEVIS:%').limit(1).maybeSingle();
                if (conv) {
                    const devis = JSON.parse(conv.content.replace('JSON_DEVIS:', ''));
                    // Fermer le devis
                    await supabase.from('devis').update({ statut: 'validé' }).eq('demande_id', devis.demande_id).contains('technicien_id', devis.technicien_id);
                    // Fermer la demande (Algorithme d'Unicité)
                    await supabase.from('quotes').update({ status: 'fermée' }).eq('id', devis.demande_id);
                }
            } catch (algoErr) {
                console.warn("Algorithme SQL non encore prêt, seul le chat est validé.");
            }

            if (error) throw error;
            alert("Proposition validée ! Félicitations !");
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la validation.");
        }
    };

    const fetchConversations = async () => {
        if (!userUUID) return;
        setLoading(true);
        try {
            // SUPER SYNC PAR TÉLÉPHONE (LE PONT ULTIME)
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const userPhone = storedUser?.phone || "";
            console.log("Super Sync par téléphone started for:", userPhone);

            // 1. Trouver TOUTES les identités liées à ce numéro (UUID ou Numérique)
            const { data: profileIds } = await supabase.from('users').select('id').eq('phone', userPhone);
            const myIdentities = profileIds?.map(p => p.id) || [userUUID];
            
            // On ajoute aussi l'UUID actuel au cas où il n'est pas encore dans la table
            if (!myIdentities.includes(userUUID)) myIdentities.push(userUUID);

            // 2. Chercher les conversations liées à l'UNE de ces identités
            // On utilise .or() pour participant1 ou participant2
            const { data: convs, error: convError } = await supabase
                .from('conversations')
                .select('*, participant1:participant1_id(fullname, phone, id, image, role, specialty), participant2:participant2_id(fullname, phone, id, image, role, specialty)')
                .or(`participant1_id.in.(${myIdentities.map(id => `"${id}"`).join(',')}),participant2_id.in.(${myIdentities.map(id => `"${id}"`).join(',')})`)
                .order('updated_at', { ascending: false });

            if (convs && !convError) {
                const mapped = convs.map(conv => {
                    // On détermine qui est l'AUTRE utilisateur
                    const isP1 = myIdentities.includes(String(conv.participant1_id));
                    const otherUser = isP1 ? conv.participant2 : conv.participant1;
                    
                    return {
                        id: conv.id,
                        otherUser: {
                            id: otherUser?.id || (isP1 ? conv.participant2_id : conv.participant1_id),
                            fullname: otherUser?.fullname || 'Utilisateur',
                            phone: otherUser?.phone || '',
                            image: otherUser?.image || null,
                            role: otherUser?.role || 'user',
                            specialty: otherUser?.specialty || ''
                        },
                        lastMessage: 'Message...', // Variable temporaire
                        updatedAt: conv.updated_at
                    };
                });
                setConversations(mapped);
                setLoading(false);
                return;
            }
            
            if (convError) console.error("Conv Error:", convError);
        } catch (err) {
            console.error("Critical Sync Error:", err);
        }
        setLoading(false);
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

        // Resolve the sender ID using userUUID (more robust) or fallback to user.id
        const senderId = userUUID || user.id;

        try {
            const { error: sendError } = await supabase
                .from('direct_messages')
                .insert({
                    conversation_id: selectedConversation.id,
                    sender_id: senderId,
                    content: messageContent
                });

            if (sendError) {
                console.error('Supabase Send Error:', sendError);
                throw sendError;
            }
        } catch (error) {
            console.error('Detailed Error sending message:', error);
            alert(`Erreur lors de l'envoi: ${error.message || 'Problème de connexion'}`);
        }
    };

    if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Chargement de vos messages...</div>;

    return (
        <div className="container" style={{ padding: '1rem', height: 'calc(100vh - 80px)', display: 'flex', gap: '1rem' }}>
            {/* Sidebar List (Full width on mobile if no conversation selected) */}
            <div className={`card ${selectedConversation ? 'mobile-hidden' : ''}`} style={{ flex: '1', maxWidth: '350px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '15px', marginBottom: '1.5rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>Mes Messages</h1>
                </div>
                <div style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}>
                        <MessageCircle size={20} style={{ marginRight: '0.5rem' }} /> Conversations
                    </h2>
                </div>
                <div style={{ padding: '1rem', borderTop: '1px solid #eee' }}>
                     {!conversations.length && (
                         <button 
                            disabled={loading}
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    // 1. Trouver tous les profils avec ce numéro de téléphone
                                    const { data: profiles } = await supabase
                                        .from('users')
                                        .select('id')
                                        .eq('phone', user.phone);
                                    
                                    if (profiles && profiles.length > 0) {
                                        const ids = profiles.map(p => p.id);
                                        const idFilter = ids.map(id => `participant1_id.eq.${id},participant2_id.eq.${id}`).join(',');
                                        
                                        // 2. Chercher les conversations pour TOUS ces IDs
                                        const { data: convs, error } = await supabase
                                            .from('conversations')
                                            .select(`
                                                id, 
                                                updated_at, 
                                                participant1:participant1_id (id, fullname, image),
                                                participant2:participant2_id (id, fullname, image)
                                            `)
                                            .or(idFilter);

                                        if (convs && convs.length > 0) {
                                            const formatted = convs.map(c => {
                                                const isP1Me = ids.includes(c.participant1?.id);
                                                return {
                                                    id: c.id,
                                                    otherUser: isP1Me ? c.participant2 : c.participant1,
                                                    updated_at: c.updated_at
                                                };
                                            });
                                            setConversations(formatted);
                                            alert(`✅ ${formatted.length} discussion(s) récupérée(s) !`);
                                        } else {
                                            alert("📭 Aucun message trouvé pour ce numéro de téléphone.");
                                        }
                                    }
                                } catch (e) {
                                    console.error(e);
                                    alert("Erreur technique lors de la récupération.");
                                }
                                setLoading(false);
                            }}
                            style={{ width: '100%', padding: '0.8rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>
                            {loading ? '⏳ Recherche en cours...' : '🔄 RÉPARER MA MESSAGERIE (SYNC)'}
                         </button>
                     )}
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
                                <div 
                                    onClick={(e) => {
                                        if (conv.otherUser.role === 'technician') {
                                            e.stopPropagation();
                                            navigate(`/technician/${conv.otherUser.id}`);
                                        }
                                    }}
                                    style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        backgroundColor: '#ddd', marginRight: '1rem',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        overflow: 'hidden', border: conv.otherUser.role === 'technician' ? '2px solid #10b981' : 'none'
                                    }}
                                >
                                    {conv.otherUser.image ? (
                                        <img src={conv.otherUser.image} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={20} color="#666" />
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        {conv.otherUser.fullname || 'Utilisateur'}
                                        {conv.otherUser.role === 'technician' && <CheckCircle size={12} color="#10b981" />}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                        {conv.otherUser.role === 'technician' ? `Expert • ${conv.otherUser.specialty}` : 'Cliquez pour voir les messages'}
                                    </div>
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
                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button className="mobile-only" onClick={() => setSelectedConversation(null)} style={{ background: 'none', border: 'none', padding: '5px' }}>
                                    <ArrowLeft size={20} />
                                </button>
                                <Link 
                                    to={selectedConversation.otherUser.role === 'technician' ? `/technician/${selectedConversation.otherUser.id}` : '#'}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: selectedConversation.otherUser.role === 'technician' ? '2px solid #10b981' : 'none' }}>
                                        {selectedConversation.otherUser.image ? (
                                            <img src={selectedConversation.otherUser.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <User size={20} color="#94a3b8" />
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {selectedConversation.otherUser.fullname}
                                            {selectedConversation.otherUser.role === 'technician' && <ExternalLink size={12} color="#10b981" />}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: '#10b981' }}>{selectedConversation.otherUser.role === 'technician' ? selectedConversation.otherUser.specialty : 'En ligne'}</div>
                                    </div>
                                </Link>
                            </div>

                            {/* BOUTON VALIDATION CLIENT */}
                            {user?.role === 'client' && (
                                <button 
                                    onClick={validateProposal}
                                    style={{ padding: '0.5rem 0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(16, 185, 129, 0.3)' }}
                                >
                                    <CheckCircle size={14} /> Valider l'Offre
                                </button>
                            )}
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
                                    {msg.content.startsWith('JSON_DEVIS:') ? (() => {
                                        try {
                                            const devis = JSON.parse(msg.content.replace('JSON_DEVIS:', ''));
                                            return (
                                                <div style={{ backgroundColor: 'white', border: '2px solid #10b981', borderRadius: '15px', padding: '1rem', color: '#1e293b', minWidth: '220px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', pb: '8px', mb: '8px' }}>
                                                        <span style={{ fontWeight: '900', color: '#10b981', fontSize: '0.9rem' }}>{devis.id}</span>
                                                        <span style={{ fontSize: '0.65rem', backgroundColor: '#dcfce7', color: '#166534', px: '6px', borderRadius: '4px', height: 'fit-content' }}>PROPOSITION</span>
                                                    </div>
                                                    
                                                    <div style={{ marginBottom: '1rem' }}>
                                                        {devis.lignes.map((l, i) => (
                                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                                                <span style={{ color: '#64748b' }}>{l.qty}x {l.desc}</span>
                                                                <span style={{ fontWeight: '600' }}>{(l.qty * l.price).toLocaleString()} F</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '8px', marginBottom: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                                                            <span>Sous-total HT</span>
                                                            <span>{devis.sous_total.toLocaleString()} F</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                                                            <span>TVA (19%)</span>
                                                            <span>{devis.tva_montant.toLocaleString()} F</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '900', color: '#1e293b', marginTop: '4px' }}>
                                                            <span>TOTAL TTC</span>
                                                            <span style={{ color: '#10b981' }}>{devis.total_ttc.toLocaleString()} F</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {devis.note_technicien && (
                                                        <p style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic', margin: '0 0 10px 0' }}>"{devis.note_technicien}"</p>
                                                    )}

                                                    {user?.role === 'client' && (
                                                        <button 
                                                            onClick={validateProposal}
                                                            style={{ width: '100%', padding: '0.6rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}
                                                        >
                                                            ✅ ACCEPTER CE DEVIS
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        } catch (e) {
                                            return <p>{msg.content}</p>;
                                        }
                                    })() : msg.content.includes('[CONTRAT VALIDÉ]') ? (
                                              <div style={{ backgroundColor: '#059669', color: '#ffffff', padding: '15px', borderRadius: '15px', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 4px 15px rgba(5, 150, 105, 0.2)' }}>
                                                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, marginBottom: '5px', color: '#ffffff' }}>OFFICIALISATION</div>
                                                  <div style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#ffffff' }}>🏆 CONTRAT ACCEPTÉ 🤝</div>
                                                  <p style={{ margin: '0', fontWeight: '800', fontSize: '0.9rem', color: '#ffffff', lineHeight: '1.4' }}>
                                                      {msg.content.replace('[CONTRAT VALIDÉ]', '').replace('✅', '').trim()}
                                                  </p>
                                              </div>
                                         ) : msg.content}
                                    <div style={{ fontSize: '0.65rem', textAlign: 'right', marginTop: '0.25rem', opacity: 0.8 }}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area Supprimé à la demande de l'utilisateur V69 */}
                    <div style={{ height: '20px', backgroundColor: '#f8fafc' }} />
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
