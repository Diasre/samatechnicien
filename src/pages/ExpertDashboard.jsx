import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL, WEB_URL } from '../config';
import { supabase } from '../supabaseClient';
import { 
    User, Users, Settings, Star, MessageSquare, Phone, MapPin, CheckCircle, Save, 
    ArrowLeft, PlusCircle, ShoppingBag, Send, MessageCircle, Shield, Share2, 
    Flag, Bell, Info, Clock, Calendar, Home, X
} from 'lucide-react';
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
    const [products, setProducts] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [activeConversations, setActiveConversations] = useState([]);
    const [loadingQuotes, setLoadingQuotes] = useState(false);
    const [sendingQuickMsg, setSendingQuickMsg] = useState(null);
    const [sentOffers, setSentOffers] = useState([]);
    const [loadingSent, setLoadingSent] = useState(false);
    const [contactPhone, setContactPhone] = useState("");
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [customResponse, setCustomResponse] = useState("");
    const [devisNote, setDevisNote] = useState("Intervention possible rapidement.");
    const [sysNotifs, setSysNotifs] = useState([]); // Nouvelles alertes système
    const [loadingSysNotifs, setLoadingSysNotifs] = useState(false);
    const [showNotifModal, setShowNotifModal] = useState(null); 
    const [showNotifsListModal, setShowNotifsListModal] = useState(false); 
    const [devisLines, setDevisLines] = useState([{ desc: "Prestation", qty: 1, price: 0 }]); // Restored (V132)

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

    const standardSpecialties = [
        "Informaticien", 
        "Soudeur", 
        "Plombier", 
        "Mecanicien Automobile", 
        "Telephone", 
        "Frigo", 
        "Macon", 
        "Maçon",
        "Manoeuvre", 
        "Camera Monteur", 
        "Aluminium", 
        "Vigile", 
        "Imprimante", 
        "Réseau", 
        "Décoration Intérieur", 
        "Agronome en protection des Végétaux", 
        "Agriculture", 
        "Vidéo Surveillance", 
        "Maintenancier"
    ];

    useEffect(() => {
        if (user?.id) {
            fetchData();
            
            // ABONNEMENT TEMPS RÉEL (NOTIFICATIONS SONORES)
            const sub = supabase.channel('expert_notifs')
                .on('postgres_changes', { event: 'INSERT', table: 'quotes' }, (payload) => {
                    const techSpec = user.specialty?.toLowerCase() || '';
                    if (payload.new.specialty?.toLowerCase().includes(techSpec.substring(0, 5))) {
                        playNotifSound();
                        fetchData();
                        fetchSysNotifs(); 
                    }
                })
                .on('postgres_changes', { event: 'INSERT', table: 'notifications' }, (payload) => {
                    if (payload.new.user_id === user.id) {
                        playNotifSound();
                        fetchSysNotifs();
                    }
                })
                .on('postgres_changes', { event: 'INSERT', table: 'direct_messages' }, (payload) => {
                    if (payload.new.sender_id !== user.id) {
                        playNotifSound();
                        fetchData();
                    }
                })
                .subscribe();
                
            return () => supabase.removeChannel(sub);
        }
    }, [user?.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 0. VÉRIFICATION D'IDENTITÉ SUPABASE (Crucial pour la sécurité RLS)
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser && authUser.id !== user.id) {
                console.log("🔄 Décalage d'identité détecté! Migration vers UUID...");
                // On met à jour l'ID local pour qu'il corresponde à Supabase Auth
                const correctedUser = { ...user, id: authUser.id };
                localStorage.setItem('user', JSON.stringify(correctedUser));
                
                // On répare la base de données pour ce nouvel ID via notre fonction RPC
                await supabase.rpc('fix_my_id', { new_id: authUser.id, user_phone: user.phone });
                
                // On recharge avec le bon ID
                user.id = authUser.id; 
            }

            // 1. D'abord récupérer les infos locales du tech
            let { data: tech, error: techError } = await supabase.from('users').select('*').eq('id', user.id).single();
            
            // 🛡️ RÉPARATION SILENCIEUSE DES ANCIENS COMPTES (Fallback par téléphone)
            if (techError || !tech) {
                console.log("🔍 Profil non trouvé par ID, tentative par téléphone...");
                const { data: techByPhone } = await supabase.from('users').select('*').eq('phone', user.phone).maybeSingle();
                
                if (techByPhone && techByPhone.id !== user.id) {
                    console.log("🛠️ Réparation d'ID détectée pour:", user.phone);
                    await supabase.rpc('fix_my_id', { new_id: user.id, user_phone: user.phone });
                    const { data: fixedTech } = await supabase.from('users').select('*').eq('id', user.id).single();
                    if (fixedTech) tech = fixedTech;
                } else if (techError) {
                    throw techError;
                }
            }

            // 2. Utiliser SA spécialité en base pour charger les devis et discussions
            const cleanSpec = (tech.specialty || 'Autre').trim();
            // Créer une recherche qui attrape avec ou sans accent (ex: Macon, Maçon, Maconnerie...)
            const searchPattern = cleanSpec.toLowerCase().replace(/[açéèêëìîïòôöùûü]/g, '_');
            const specSearch = `%${searchPattern.substring(0, 5)}%`;

            const [reviewsResponse, productsResponse, quotesResponse, convsResponse, sentResponse] = await Promise.all([
                supabase.from('reviews').select('*, client:clientId(fullname)').eq('technicianId', user.id).order('created_at', { ascending: false }),
                supabase.from('products').select('*').eq('technicianid', user.id).order('created_at', { ascending: false }),
                supabase.from('quotes').select('*, client:client_id(fullname, phone, userId:id)').ilike('specialty', specSearch).order('created_at', { ascending: false }),
                supabase.from('conversations').select(`
                    id, 
                    updated_at,
                    participant1:participant1_id (id, fullname, image),
                    participant2:participant2_id (id, fullname, image)
                `).or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`).order('updated_at', { ascending: false }).limit(5),
                supabase.from('devis').select('*, quote:demande_id(*)').eq('technicien_id', user.id).order('created_at', { ascending: false })
            ]);

            const { data: reviewsData } = reviewsResponse;
            const { data: productsData } = productsResponse;
            const { data: quotesData } = quotesResponse;
            const { data: convsData } = convsResponse;
            const { data: sentData } = sentResponse;

            setTechData(tech);
            if (tech.phone) setContactPhone(tech.phone);
            // Sync local storage specialty if mismatch
            if (tech.specialty && tech.specialty !== user.specialty) {
                const updatedUser = { ...user, specialty: tech.specialty };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            if (techError) {
                console.error("Supabase error fetching user:", techError);
            }

            if (!tech) {
                console.warn("User ID not found in Supabase. Probably sync delay or profile missing.");
                // Au lieu de déconnecter brutalement, on marque le chargement comme fini pour afficher l'erreur techData
                setLoading(false);
                return;
            }

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

            if (productsData) {
                setProducts(productsData);
            }

            if (sentData) {
                setSentOffers(sentData);
                // On filtre les quotes pour ne pas afficher celles auxquelles on a déjà répondu
                const repliedIds = sentData.map(s => s.demande_id);
                if (quotesData) {
                    setQuotes(quotesData.filter(q => !repliedIds.includes(q.id)));
                }
            } else if (quotesData) {
                setQuotes(quotesData);
            }

            if (convsData) {
                const formatted = convsData.map(c => {
                    const other = c.participant1.id === user.id ? c.participant2 : c.participant1;
                    return { id: c.id, otherUser: other, updatedAt: c.updated_at };
                });
                setActiveConversations(formatted);
            }

        } catch (error) {
            console.error("Error fetching expert data:", error);
        }
        setLoading(false);
        fetchSysNotifs();
    };

    const fetchSysNotifs = async () => {
        if (!user?.id) return;
        setLoadingSysNotifs(true);
        try {
            // V150 - Chargement de l'historique complet (limite 30)
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(30);
            
            if (data) {
                setSysNotifs(data);
                // On affiche le modal auto uniquement pour la toute dernière non lue
                const latestUnseen = data.find(n => !n.seen);
                if (latestUnseen && !showNotifModal) {
                    setShowNotifModal(latestUnseen); 
                }
            }
        } catch (err) {
            console.error("Notif Fetch Error:", err);
        }
        setLoadingSysNotifs(false);
    };

    const deleteNotif = async (id) => {
        if (!window.confirm("🗑️ Supprimer cette alerte définitivement ?")) return;
        try {
            const { error } = await supabase.from('notifications').delete().eq('id', id);
            if (error) throw error;
            setSysNotifs(prev => prev.filter(n => n.id !== id));
            if (showNotifModal?.id === id) setShowNotifModal(null);
        } catch (err) {
            console.error("Delete Notif Error:", err);
        }
    };

    const markAllRead = async (singleNotifId = null) => {
        if (!user?.id) return;
        
        if (singleNotifId) {
            await supabase.from('notifications').update({ seen: true }).eq('id', singleNotifId);
            setSysNotifs(prev => prev.map(n => n.id === singleNotifId ? { ...n, seen: true } : n));
        } else if (sysNotifs.some(n => !n.seen)) {
            await supabase.from('notifications').update({ seen: true }).eq('user_id', user.id);
            setSysNotifs(prev => prev.map(n => ({ ...n, seen: true })));
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleShare = async () => {
        const profileUrl = `${WEB_URL}/technician/${user.id}`;
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

    const openResponseForm = (quoteOrId) => {
        // V146 - Intelligence de secours : si on a juste un ID ou un objet partiel
        const quote = typeof quoteOrId === 'object' ? quoteOrId : { id: quoteOrId, specialty: 'Service demandé', title: 'Demande urgente' };
        
        setSelectedQuote(quote);
        const initPrice = 0; 
        setDevisLines([{ desc: `Prestation ${quote.specialty || ''}`, qty: 1, price: initPrice }]);
        setCustomResponse(`Bonjour ${quote.client?.fullname || ''}, je suis intéressé par votre devis pour : "${quote.title || quote.specialty}". Pouvons-nous en discuter ? Voici ma proposition : `);
        setShowResponseModal(true);
    };

    const playNotifSound = () => {
        try {
            const audio = new Audio('https://www.soundjay.com/buttons/sounds/beep-07.mp3');
            audio.play().catch(e => console.log("Audio play blocked:", e));
        } catch (err) {
            console.error("Sound error:", err);
        }
    };

    const handleSendFinalReply = async () => {
        if (!user || !selectedQuote) return;
        
        setSendingQuickMsg(true); // Utilisation correcte de l'état existant (V149)
        try {
            // V149 - LOGIQUE D'ENVOI BLINDÉE (POST-CRASH FIX)
            const qId = Number(selectedQuote.id);
            if (isNaN(qId)) throw new Error("Référence de devis invalide (#" + selectedQuote.id + ")");

            // 1. Détermination de l'ID Client (On a besoin de son UUID)
            let finalClientId = selectedQuote.client_id;
            if (!finalClientId) {
                const cPhone = selectedQuote.client_phone || selectedQuote.client?.phone;
                if (cPhone) {
                    const { data: profile } = await supabase.from('users').select('id').eq('phone', cPhone).maybeSingle();
                    finalClientId = profile?.id;
                }
            }

            const subtotal = devisLines.reduce((acc, line) => acc + (Number(line.qty || 0) * Number(line.price || 0)), 0);
            const totalTtc = Math.round(subtotal);
            if (totalTtc <= 0) throw new Error("Le montant total doit être supérieur à 0.");

            // 2. ENREGISTREMENT DE L'OFFRE (Table devis)
            const { data: insertData, error: devisErr } = await supabase
                .from('devis')
                .insert([{
                    demande_id: qId,
                    technicien_id: String(user.id),
                    montant: totalTtc,
                    statut: 'en_attente',
                    note: `📞 Contact: ${contactPhone} | ${devisNote}`
                }])
                .select();

            if (devisErr) {
                console.error("DEBUG DEVIS ERR:", devisErr);
                throw new Error(`DB Error: ${devisErr.message} (${devisErr.code})`);
            }

            // 3. MISE À JOUR DE LA DEMANDE
            await supabase.from('quotes').update({ 
                last_offer_price: totalTtc,
                last_technician_name: user.fullname 
            }).eq('id', qId);

            // 4. NOTIFICATION AU CLIENT (POUR VALIDATION)
            if (finalClientId) {
                await supabase.from('notifications').insert([{
                    user_id: finalClientId,
                    title: `🏷️ Offre de ${user.fullname} : ${totalTtc.toLocaleString()} F`,
                    content: `Nouveau tarif reçu pour votre demande #${qId}. Cliquez pour valider !`,
                    type: 'offer_received',
                    seen: false,
                    redirect_url: `/demande/${qId}`
                }]);
            }

            alert("✅ Votre offre a été envoyée ! Le client a été notifié pour validation.");
            setShowResponseModal(false);
            fetchData(); 
        } catch (err) {
            console.error("❌ Erreur Envoi Devis:", err);
            alert("⚠️ Échec de l'envoi : " + (err.message || "Vérifiez votre connexion internet."));
        } finally {
            setSendingQuickMsg(false);
        }
    };
    
    const handleDeleteOffer = async (offerId) => {
        if (!window.confirm("🗑️ Voulez-vous vraiment retirer votre offre pour ce devis ?")) return;
        
        try {
            const { error } = await supabase.from('devis').delete().eq('id', offerId);
            if (error) throw error;
            
            alert("✅ Offre retirée avec succès.");
            fetchData(); // Rafraîchir tout
        } catch (err) {
            console.error("Delete Offer Error:", err);
            alert("Erreur lors de la suppression de l'offre.");
        }
    };

    const addDevisLine = () => setDevisLines([...devisLines, { desc: "", qty: 1, price: 0 }]);
    const updateDevisLine = (index, field, value) => {
        const newLines = [...devisLines];
        if (field === 'qty' || field === 'price') {
            newLines[index][field] = value === '' ? '' : Number(value);
        } else {
            newLines[index][field] = value;
        }
        setDevisLines(newLines);
    };
    const removeDevisLine = (index) => {
        if (devisLines.length > 1) {
            setDevisLines(devisLines.filter((_, i) => i !== index));
        } else {
            alert("Il faut au moins une ligne de prix.");
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

        // Validation Email (Supprimée pour éviter les blocages sur les adresses dummy)

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
                if (formData.password.length !== 4 || !/^\d{4}$/.test(formData.password)) {
                    alert('Le nouveau code secret doit contenir exactement 4 chiffres.');
                    setIsSaving(false);
                    return;
                }
                payload.password = formData.password + "00";
            }

            console.log("💾 Appel RPC de sauvegarde pour ID:", user.id);

            const { error: updateError } = await supabase.rpc('save_expert_profile', {
                p_id: user.id,
                p_fullname: formData.fullName,
                p_specialty: formData.specialty === 'Autre' ? formData.otherSpecialty : formData.specialty,
                p_city: formData.city,
                p_district: formData.district,
                p_phone: formData.phone,
                p_description: formData.description,
                p_image: formData.image,
                p_commentsenabled: formData.commentsEnabled ? 1 : 0
            });

            if (updateError) {
                console.error("❌ RPC Update Error:", updateError);
                throw updateError;
            }

            alert("Profil mis à jour avec succès !");
            setEditMode(false);

            // Mettre à jour TOUT le LocalStorage pour que les changements persistent
            const updatedUser = { 
                ...user, 
                fullname: formData.fullName, // Nom de la table
                fullName: formData.fullName, // Compatibilité UI
                email: formData.email,
                city: formData.city,
                district: formData.district,
                specialty: formData.specialty === 'Autre' ? formData.otherSpecialty : formData.specialty,
                phone: formData.phone,
                description: formData.description,
                commentsenabled: formData.commentsEnabled ? 1 : 0,
                image: formData.image
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));

                // Clear passwords
                setFormData(prev => ({ ...prev, currentPassword: '', password: '', confirmPassword: '' }));

                fetchData();
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

            const { error: feedbackError } = await supabase
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
    if (!techData) return (
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--error-color)' }}>Erreur : Expert non trouvé.</h3>
            <p style={{ margin: '1rem 0' }}>Impossible de charger les données pour l'utilisateur ID: <strong>{user?.id}</strong></p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Cela arrive souvent après une mise à jour. Veuillez cliquer ci-dessous.</p>

            <button
                onClick={() => {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }}
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
            >
                🔄 Réparer ma session (Déconnexion)
            </button>
        </div>
    );

    const avatarUrl = techData.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(techData.fullName)}&background=random&color=fff&size=150`;

    return (
        <div className="container animate-fade-in" style={{ padding: '1.5rem 1rem' }}>
            <WelcomeOverlay userName={techData.fullName} duration={2000} />
            
            {/* ALERTE DE NOUVELLE DEMANDE (BANNER) */}
            {quotes.length > 0 && (
                <div 
                    onClick={() => {
                        const targetQuote = quotes[quotes.length - 1]; // La plus récente
                        openResponseForm(targetQuote);
                    }}
                    style={{ 
                        backgroundColor: '#fff3cd', border: '1px solid #ffeeba', padding: '1rem', borderRadius: '15px', 
                        marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', animation: 'slideDown 0.5s ease-out'
                    }}
                >
                    <div style={{ backgroundColor: '#fbbf24', padding: '8px', borderRadius: '10px', color: 'white' }}>
                        <Bell size={20} className="animate-pulse" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: '800', fontSize: '0.9rem', color: '#854d0e' }}>🚨 Nouvel appel pour vous !</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e' }}>Cliquez ici pour répondre immédiatement au client.</p>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '10px', borderRadius: '15px' }}>
                        <Shield size={28} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', fontWeight: '900' }}>
                            Espace Expert <span style={{ fontSize: '0.7rem', color: 'var(--primary-color)', opacity: 0.6 }}>(V143)</span>
                        </h1>
                        <p style={{ fontSize: '0.85rem', color: '#666' }}>Gérez votre profil et vos interventions.</p>
                    </div>
                </div>
                {!editMode && (
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        {/* Bouton Mode Client retiré (V95) */}
                        <button 
                            className="btn btn-outline" 
                            style={{ position: 'relative', width: '45px', height: '45px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: sysNotifs.length > 0 ? '2px solid #ef4444' : '1px solid #ddd' }}
                            onClick={() => setShowNotifsListModal(true)}
                        >
                            <Bell size={20} color={sysNotifs.length > 0 ? '#ef4444' : '#64748b'} />
                            {sysNotifs.length > 0 && (
                                <span style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '50%', fontWeight: '900', animation: 'pulse 1s infinite' }}>
                                    {sysNotifs.length}
                                </span>
                            )}
                        </button>
                        {/* Paramètres Retirés */}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Left Column: Profile & Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Profile Card */}
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 1rem' }}>
                            <img
                                src={(editMode && formData.image) ? formData.image : avatarUrl}
                                alt={techData.fullName}
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)' }}
                            />
                            {editMode && (
                                <label
                                    htmlFor="profile-upload"
                                    style={{
                                        position: 'absolute', bottom: 0, right: 0,
                                        backgroundColor: 'var(--primary-color)', color: 'white',
                                        borderRadius: '50%', padding: '6px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '2px solid white'
                                    }}
                                    title="Modifier la photo"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                                    <input
                                        id="profile-upload"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;

                                            try {
                                                const fileExt = file.name.split('.').pop();
                                                const fileName = `avatars/${techData.id}_${Date.now()}.${fileExt}`;

                                                // Show loading state if needed, or just hope it's fast
                                                const { error: uploadError } = await supabase.storage
                                                    .from('produits') // Using 'produits' bucket as it is public
                                                    .upload(fileName, file);

                                                if (uploadError) throw uploadError;

                                                const { data } = supabase.storage.from('produits').getPublicUrl(fileName);

                                                if (data.url || data.publicUrl) {
                                                    const publicUrl = data.publicUrl || data.url;
                                                    setFormData(prev => ({ ...prev, image: publicUrl }));
                                                }
                                            } catch (err) {
                                                console.error("Upload error:", err);
                                                alert("Erreur lors de l'upload de l'image. (Vérifiez votre connexion)");
                                            }
                                        }}
                                    />
                                </label>
                            )}
                            {!editMode && techData.is_verified !== false && (
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

                    {/* ESPACE DEVIS SUPPRIMÉ V70 */}

                    {/* DEMANDES DE DEVIS DISPONIBLES (NOUVEAU V144) - RÉVOLUTION UX */}
                    {!editMode && quotes.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ backgroundColor: '#10b981', color: 'white', padding: '6px', borderRadius: '10px' }}><Clock size={18} /></div>
                                    Appels d'offres ({quotes.length})
                                </h3>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {quotes.map(quote => (
                                    <div 
                                        key={quote.id} 
                                        className="card" 
                                        style={{ 
                                            padding: '16px', border: '2px solid #f0fdf4', borderRadius: '25px', cursor: 'pointer',
                                            transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                                        }}
                                        onClick={() => openResponseForm(quote)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <span style={{ backgroundColor: '#f0fdf4', color: '#10b981', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase' }}>
                                                        {quote.specialty}
                                                    </span>
                                                    <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>#{quote.id}</span>
                                                </div>
                                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>{quote.title || 'Demande de service'}</h4>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(quote.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 12px 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {quote.description || quote.message}
                                        </p>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '16px' }}>
                                            <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: '#475569', fontWeight: 'bold' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {quote.city || 'Dakar'}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {quote.billing_type?.toUpperCase() || 'JOUR'}</span>
                                            </div>
                                            <button 
                                                className="btn"
                                                style={{ padding: '6px 14px', fontSize: '0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900' }}
                                            >
                                                RÉPONDRE
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {!editMode && sentOffers.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Mes Réponses aux Devis</h3>
                                <div style={{ backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>{sentOffers.length}</div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {sentOffers.map(offer => (
                                    <div key={offer.id} className="card" style={{ padding: '12px', border: '1px solid #e2e8f0', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#10b981' }}>{offer.quote?.title || 'Demande de devis'}</h4>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                                                    Proposé le {new Date(offer.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteOffer(offer.id)}
                                                style={{ padding: '8px', background: '#ffe4e6', border: 'none', borderRadius: '10px', color: '#e11d48', cursor: 'pointer', display: 'flex' }}
                                                title="Supprimer mon offre"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 0h6"></path><path d="M10 11v6m4-6v6"></path></svg>
                                            </button>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '10px' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Votre prix :</span>
                                            <span style={{ fontSize: '0.95rem', fontWeight: '900', color: '#1e293b' }}>{Number(offer.montant).toLocaleString()} F</span>
                                        </div>
                                        
                                        {offer.statut === 'validé' && (
                                            <div style={{ marginTop: '8px', padding: '10px', background: '#dcfce7', borderRadius: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '900', color: '#166534', border: '1px solid #bbf7d0', animation: 'bounce 2s infinite' }}>
                                                🏆 OFFRE VALIDÉE PAR LE CLIENT ! 🎉
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MODAL DE RÉPONSE PERSONNALISÉE */}
                    {showResponseModal && (
                        <div style={{ 
                            position: 'fixed', inset: 0, 
                            backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', 
                            zIndex: 10000, padding: '15px', paddingTop: '5vh',
                            animation: 'fadeIn 0.2s ease-out'
                        }}>
                            <div className="card" style={{ 
                                width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto',
                                padding: '1.5rem', borderRadius: '30px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                backgroundColor: 'white'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-color)' }}>
                                            <img src={avatarUrl} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>Répondre au devis</h3>
                                    </div>
                                    <button onClick={() => setShowResponseModal(false)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                </div>
                                
                                {/* DÉTAILS DE LA DEMANDE ENRICHIE (V49) */}
                                {selectedQuote && (
                                    <div style={{ backgroundColor: '#fff7ed', padding: '12px', borderRadius: '20px', marginBottom: '1rem', border: '1px solid #ffedd5' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <div style={{ backgroundColor: '#fb923c', color: 'white', padding: '4px', borderRadius: '8px' }}><Info size={14} /></div>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '900', color: '#9a3412' }}>{selectedQuote.title || 'Besoin urgent'}</h4>
                                        </div>
                                        
                                        <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#c2410c', lineHeight: '1.4' }}>
                                            {selectedQuote.description || selectedQuote.message}
                                        </p>

                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                            <span style={{ backgroundColor: 'white', padding: '3px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '800', border: '1px solid #ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={10} /> {selectedQuote.billing_type?.toUpperCase() || 'JOURNALIER'}
                                            </span>
                                            <span style={{ backgroundColor: 'white', padding: '3px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '800', border: '1px solid #ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={10} /> {selectedQuote.planned_date ? new Date(selectedQuote.planned_date).toLocaleDateString() : 'Aujourd\'hui'}
                                            </span>
                                            <span style={{ backgroundColor: '#fff', padding: '3px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '800', border: '1px solid #ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <MapPin size={10} /> {selectedQuote.city || 'Dakar'} / {selectedQuote.district || '?' }
                                            </span>
                                        </div>

                                        {selectedQuote.photo_url && (
                                            <div style={{ marginTop: '8px' }}>
                                                <img 
                                                    src={selectedQuote.photo_url} 
                                                    alt="Demande"
                                                    onClick={() => window.open(selectedQuote.photo_url, '_blank')}
                                                    style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '12px', border: '2px solid white', cursor: 'zoom-in' }} 
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div style={{ marginBottom: '10px' }}>
                                    <h4 style={{ fontSize: '0.8rem', fontWeight: '800', marginBottom: '8px', color: '#1e293b' }}>Votre Proposition :</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr auto', gap: '6px', marginBottom: '6px', fontSize: '0.65rem', fontWeight: 'bold', color: '#64748b' }}>
                                        <span>Désignation</span>
                                        <span>Qté</span>
                                        <span>Prix Unit.</span>
                                        <span></span>
                                    </div>
                                    <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                                        {devisLines.map((line, idx) => (
                                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr auto', gap: '6px', marginBottom: '6px' }}>
                                                <input 
                                                    value={line.desc} 
                                                    onChange={(e) => updateDevisLine(idx, 'desc', e.target.value)}
                                                    placeholder="Travail..."
                                                    style={{ padding: '6px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.75rem' }}
                                                />
                                                <input 
                                                    type="number" 
                                                    value={line.qty} 
                                                    onChange={(e) => updateDevisLine(idx, 'qty', e.target.value)}
                                                    placeholder="Qté"
                                                    style={{ padding: '6px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.75rem', width: '100%' }}
                                                />
                                                <input 
                                                    type="number" 
                                                    value={line.price} 
                                                    onChange={(e) => updateDevisLine(idx, 'price', e.target.value)}
                                                    placeholder="Prix"
                                                    style={{ padding: '6px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.75rem', width: '100%', fontWeight: 'bold' }}
                                                />
                                                <button onClick={() => removeDevisLine(idx)} style={{ background: 'none', border: 'none', color: '#ef4444' }}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={addDevisLine}
                                        style={{ width: '100%', padding: '6px', background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#64748b', fontSize: '0.7rem', cursor: 'pointer', marginTop: '5px' }}
                                    >
                                        + Ajouter une ligne
                                    </button>
                                </div>

                                <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '20px', marginBottom: '1.25rem', border: '2px solid #bbf7d0' }}>
                                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: '900', color: '#166534', margin: 0 }}>VOTRE OFFRE TOTALE (F) :</h4>
                                        <div style={{ backgroundColor: 'white', padding: '2px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 'bold', border: '1px solid #bbf7d0' }}>NET À PERCEVOIR</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                        <input 
                                            type="number"
                                            value={devisLines[0].price}
                                            onChange={(e) => updateDevisLine(0, 'price', e.target.value)}
                                            style={{ 
                                                width: '100%', padding: '12px 15px', fontSize: '1.8rem', fontWeight: '900', 
                                                borderRadius: '15px', border: '1px solid #10b981', color: '#10b981',
                                                outline: 'none', textAlign: 'center', backgroundColor: 'white',
                                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                                            }}
                                            placeholder="0"
                                        />
                                        <span style={{ position: 'absolute', right: '15px', fontSize: '1.2rem', fontWeight: '900', color: '#10b981' }}>FCFA</span>
                                    </div>
                                    
                                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Basé sur 1 prestation d'urgence</span>
                                        <button 
                                            onClick={() => setDevisLines([...devisLines, { desc: "Accessoires", qty: 1, price: 0 }])}
                                            style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.7rem', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}
                                        >
                                            + Ajouter des détails
                                        </button>
                                    </div>
                                </div>
                                
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <h4 style={{ fontSize: '0.8rem', fontWeight: '800', marginBottom: '8px', color: '#1e293b' }}>Numéro de téléphone de contact :</h4>
                                    <input 
                                        type="tel"
                                        value={contactPhone}
                                        onChange={(e) => setContactPhone(e.target.value)}
                                        placeholder="Votre numéro (ex: 77 000 00 00)"
                                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                                    />
                                </div>
                                
                                <textarea 
                                    rows="2"
                                    value={devisNote}
                                    onChange={(e) => setDevisNote(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.8rem', marginBottom: '1.25rem', fontFamily: 'inherit' }}
                                    placeholder="Une note additionnelle (facultatif)..."
                                ></textarea>
                                
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setShowResponseModal(false)} className="btn" style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#64748b', border: 'none' }}>Annuler</button>
                                    <button 
                                        onClick={handleSendFinalReply} 
                                        disabled={sendingQuickMsg}
                                        className="btn" 
                                        style={{ flex: 2, backgroundColor: '#10b981', color: 'white', border: 'none' }}
                                    >
                                        {sendingQuickMsg ? 'Envoi...' : 'Envoyer la réponse'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Publications Card - DÉPLACÉE ICI */}
                    {!editMode && (
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ backgroundColor: 'var(--primary-color)', padding: '8px', borderRadius: '10px', color: 'white' }}>
                                        <ShoppingBag size={20} />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>
                                        Mes Publications
                                    </h3>
                                </div>
                                <Link to="/marketplace" style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>
                                    Gérer ma boutique →
                                </Link>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                gap: '0.75rem'
                            }}>
                                {products.length === 0 ? (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem', color: '#999', backgroundColor: '#f9fafb', borderRadius: '10px' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem' }}>Aucun article en vente.</p>
                                    </div>
                                ) : (
                                    products.map(product => (
                                        <Link 
                                            key={product.id} 
                                            to={`/marketplace?id=${product.id}`}
                                            style={{
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                backgroundColor: 'white',
                                                borderRadius: '10px',
                                                padding: '6px',
                                                border: '1px solid #eee',
                                                position: 'relative',
                                                display: 'block',
                                                transition: 'transform 0.2s ease'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <img
                                                src={product.image || 'https://via.placeholder.com/150'}
                                                alt={product.title}
                                                style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }}
                                            />
                                            <div style={{ fontWeight: 'bold', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                                                {product.title}
                                            </div>
                                            <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                {Number(product.price).toLocaleString()} F
                                            </div>
                                            {product.status === 'sold' && (
                                                <div style={{
                                                    position: 'absolute', top: '4px', right: '4px',
                                                    backgroundColor: '#ef4444', color: 'white',
                                                    padding: '1px 4px', borderRadius: '3px',
                                                    fontSize: '0.55rem', fontWeight: 'bold'
                                                }}>VENDU</div>
                                            )}
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
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
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem', color: '#856404' }}>Mot de passe actuel (requis pour modification)</label>
                                    <input
                                        type="password" name="currentPassword"
                                        value={formData.currentPassword || ''}
                                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                        placeholder="Votre mot de passe actuel"
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ffeeba', backgroundColor: '#fff9c4', fontSize: '0.9rem' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Nouveau code secret (4 chiffres)</label>
                                        <input
                                            type="password" name="password"
                                            maxLength="4"
                                            inputMode="numeric"
                                            pattern="\d*"
                                            value={formData.password}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setFormData({ ...formData, password: val });
                                            }}
                                            placeholder="Nouveau code"
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', letterSpacing: formData.password ? '4px' : 'normal', fontWeight: 'bold' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>Confirmer le code</label>
                                        <input
                                            type="password" name="confirmPassword"
                                            maxLength="4"
                                            inputMode="numeric"
                                            pattern="\d*"
                                            value={formData.confirmPassword}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setFormData({ ...formData, confirmPassword: val });
                                            }}
                                            placeholder="Confirmer"
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', letterSpacing: formData.confirmPassword ? '4px' : 'normal', fontWeight: 'bold' }}
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
                                            {standardSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
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

                                                try {
                                                    const fileExt = file.name.split('.').pop();
                                                    const fileName = `avatars/${techData.id}_${Date.now()}.${fileExt}`;

                                                    const { error: uploadError } = await supabase.storage
                                                        .from('produits') // Using 'produits' bucket as it is public
                                                        .upload(fileName, file);

                                                    if (uploadError) throw uploadError;

                                                    const { data } = supabase.storage.from('produits').getPublicUrl(fileName);

                                                    if (data.url || data.publicUrl) {
                                                        setFormData(prev => ({ ...prev, image: data.publicUrl || data.url }));
                                                    }
                                                } catch (err) {
                                                    console.error("Upload error:", err);
                                                    alert("Erreur lors de l'upload de l'image (Vérifiez que le bucket 'produits' est Public).");
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
                                        style={{ width: '100%', padding: '10px', borderRadius: '15px', border: '1px solid #ddd', fontSize: '0.8rem', minHeight: '120px', resize: 'vertical' }}
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
                                                <span style={{ fontSize: '0.7rem', color: '#999' }}>{new Date(review.createdAt || review.created_at).toLocaleDateString()}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* MODAL DE NOTIFICATIONS SYSTÈME (ACTIONNABLE) */}
            {showNotifModal && (
                <div style={{ 
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    zIndex: 20000, padding: '1rem', animation: 'fadeIn 0.3s ease-out' 
                }}>
                    <div style={{ 
                        width: '90%', maxWidth: '400px', background: '#fff', borderRadius: '30px', 
                        padding: '2rem 1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
                        textAlign: 'center', position: 'relative', animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                        <div style={{ 
                            backgroundColor: showNotifModal.type === 'offer_accepted' ? '#f0fdf4' : '#fff7ed', 
                            width: '60px', height: '60px', borderRadius: '50%', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.2rem',
                            boxShadow: 'inner 0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            {showNotifModal.type === 'offer_accepted' ? '🎉' : '🔔'}
                        </div>
                        
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b', marginBottom: '0.5rem' }}>
                            {showNotifModal.title}
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                            {showNotifModal.content}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(showNotifModal.title.includes('Nouvel appel') || showNotifModal.title.includes('Demande')) && (
                                <button 
                                    onClick={async () => {
                                        // V146 - SYSTÈME DE RÉESSAI AUTO (Anti-clic multiple)
                                        let techTarget = null;
                                        const idExtraction = showNotifModal.content.match(/#([a-zA-Z0-9-]{1,})/i);
                                        const extractedId = idExtraction ? idExtraction[1] : null;

                                        // Fonction de recherche interne
                                        const findQuote = async (id) => {
                                            // 1. Local
                                            let res = quotes.find(q => String(q.id) === String(id));
                                            // 2. Server
                                            if (!res && id) {
                                                const { data } = await supabase.from('quotes').select('*, client:client_id(*)').eq('id', id).maybeSingle();
                                                res = data;
                                            }
                                            return res;
                                        };

                                        techTarget = await findQuote(extractedId);
                                        
                                        if (techTarget) {
                                            openResponseForm(techTarget);
                                            setShowNotifModal(null);
                                            markAllRead(showNotifModal.id);
                                        } else {
                                            // RECOURS : Si on a l'ID mais pas l'objet complet, on l'ouvre quand même
                                            if (extractedId) {
                                                console.log("🛠️ Ouverture forcée par ID:", extractedId);
                                                openResponseForm(extractedId); 
                                                setShowNotifModal(null);
                                                markAllRead(showNotifModal.id);
                                            } else {
                                                fetchData();
                                                alert("⚠️ Données en cours de mise à jour. Veuillez réessayer dans un instant.");
                                            }
                                        }
                                    }}
                                    style={{ 
                                        width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                        color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1rem',
                                        boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)', cursor: 'pointer'
                                    }}
                                >
                                    💰 Proposer mon prix
                                </button>
                            )}
                            
                            <button 
                                onClick={() => {
                                    setShowNotifModal(null);
                                    markAllRead();
                                }}
                                style={{ 
                                    width: '100%', padding: '0.8rem', background: '#f1f5f9', color: '#64748b', 
                                    border: 'none', borderRadius: '15px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer'
                                }}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* LISTE COMPLÈTE DES NOTIFICATIONS (TECHNICIEN) */}
            {showNotifsListModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 19000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto', animation: 'slideUp 0.3s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '900' }}>Notifications 🔔</h3>
                            <button onClick={() => setShowNotifsListModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        {sysNotifs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                                <p style={{ color: '#64748b', fontWeight: 'bold' }}>Aucune notification pour le moment.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {sysNotifs.map(notif => (
                                    <div key={notif.id} style={{ 
                                        padding: '1rem', borderRadius: '20px', border: notif.seen ? '1px solid #f1f5f9' : '2px solid #10b981', 
                                        background: notif.seen ? '#fff' : '#f0fdf4', 
                                        position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                                            <p style={{ margin: 0, fontWeight: '900', fontSize: '0.95rem', color: '#1e293b' }}>
                                                {notif.seen ? '' : '🟢 '}{notif.title}
                                            </p>
                                            <button 
                                                onClick={() => deleteNotif(notif.id)}
                                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>{notif.content}</p>
                                        
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {(notif.title.includes('Nouvel appel') || notif.type === 'new_quote' || notif.type === 'offer_received' || notif.type === 'offer_accepted') && (
                                                <button 
                                                    onClick={async () => {
                                                        const match = notif.content.match(/#([a-zA-Z0-9-]{1,})/i);
                                                        const quoteId = match ? match[1] : null;
                                                        let target = quotes.find(q => (quoteId && String(q.id) === String(quoteId)));
                                                        
                                                        if (target) {
                                                            openResponseForm(target);
                                                            setShowNotifsListModal(false);
                                                            markAllRead(notif.id);
                                                        } else {
                                                            // Recherche serveur forcée sans jointures fragiles
                                                            const cleanId = quoteId ? quoteId.replace(/\D/g, '') : null;
                                                            try {
                                                                const { data: qServer, error: qErr } = await supabase.from('quotes').select('*, client:client_id(*)').eq('id', cleanId).maybeSingle();
                                                                if (qServer) {
                                                                    openResponseForm(qServer);
                                                                    setShowNotifsListModal(false);
                                                                    markAllRead(notif.id);
                                                                } else {
                                                                    // Forçage même si profil client incomplet
                                                                    openResponseForm(cleanId);
                                                                    setShowNotifsListModal(false);
                                                                }
                                                            } catch (err) {
                                                                openResponseForm(cleanId);
                                                            }
                                                        }
                                                    }}
                                                    style={{ flex: 2, padding: '0.65rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '0.8rem' }}
                                                >
                                                    ✍️ Action
                                                </button>
                                            )}
                                            {!notif.seen && (
                                                <button 
                                                    onClick={() => markAllRead(notif.id)}
                                                    style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}
                                                >
                                                    Lu
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {sysNotifs.some(n => !n.seen) && (
                                    <button onClick={() => markAllRead()} style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#10b981', fontWeight: 'bold', textDecoration: 'underline', width: '100%', fontSize: '0.9rem' }}>
                                        Tout marquer comme lu
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div >
    );
};

export default ExpertDashboard;
