import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '../supabaseClient';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { 
    ShieldCheck, Users, Monitor, Hammer, Droplets, Settings, Smartphone, 
    Tv, Snowflake, BrickWall, Truck, Video, Layout, Shield, PlusCircle,
    Printer, Wifi, Palette, Leaf, Sprout, Eye, Wrench, FileText, Send, X,
    Bell, MessageSquare, Info, Image, Calendar, Clock, ArrowRight, Check, Trash2, MapPin,
    Menu, LogOut, UserX, User, Flag
} from 'lucide-react';
import logo from '../assets/logo.png';

import WelcomeOverlay from '../components/WelcomeOverlay';
import LandingPage from './LandingPage';

const Home = () => {
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteData, setQuoteData] = useState({ 
        specialty: 'Plombier', 
        title: '', 
        description: '', 
        address: '', 
        billing_type: 'journalier', 
        planned_date: '',
        photo_url: '' 
    });
    const [sendingQuote, setSendingQuote] = useState(false);
    const [myQuotes, setMyQuotes] = useState(() => {
        const saved = localStorage.getItem('ST_CACHE_QUOTES');
        return saved ? JSON.parse(saved) : [];
    });
    const [loadingMyQuotes, setLoadingMyQuotes] = useState(myQuotes.length === 0);
    const [testSoundVisible, setTestSoundVisible] = useState(true);
    const [showNotifsListModal, setShowNotifsListModal] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState(null); // Custom confirm modal
    // Récupération initiale du cache persistant (V130)
    const [deletedQuoteIds, setDeletedQuoteIds] = useState(() => {
        try {
            const saved = localStorage.getItem('ST_DELETED_QUOTES');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    const navigate = useNavigate();

    const playNotifSound = () => {
        try {
            const audio = new Audio('https://www.soundjay.com/buttons/sounds/beep-07.mp3');
            audio.play().catch(e => console.log("Audio play blocked:", e));
        } catch (err) {
            console.error("Sound error:", err);
        }
    };

    let user = null;
    try {
        const stored = localStorage.getItem('user');
        if (stored) user = JSON.parse(stored);
    } catch (e) {
        console.error('LocalStorage access blocked:', e);
    }
    const isLoggedIn = !!user;

    React.useEffect(() => {
        if (user?.role === 'technician') {
            navigate('/expert-dashboard');
        }
    }, [user, navigate]);

    React.useEffect(() => {
        if (user?.id) {
            fetchMyQuotes();
        }
    }, [user?.id]);

    React.useEffect(() => {
        if (user?.id) {
            fetchNotifs();
            fetchDevisNotifs();
            fetchSystemNotifs();
        }
    }, [user?.id, myQuotes]);

    const takePhoto = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Prompt, // Demande Photo ou Galerie
                promptLabelHeader: 'Image du Problème',
                promptLabelPhoto: 'Choisir dans la galerie',
                promptLabelPicture: 'Prendre une photo'
            });
            
            if (image.base64String) {
                const fileName = `quotes/${user.id}_${Date.now()}.jpg`;
                const byteCharacters = atob(image.base64String);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'image/jpeg' });
                const file = new File([blob], fileName, { type: 'image/jpeg' });

                const { error: uploadError } = await supabase.storage.from('produits').upload(fileName, file);
                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('produits').getPublicUrl(fileName);
                setQuoteData(prev => ({ ...prev, photo_url: data.publicUrl }));
            }
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    const fetchMyQuotes = async () => {
        setLoadingMyQuotes(true);
        try {
            // Récupération de l'ID réel pour contourner les erreurs RLS
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                setLoadingMyQuotes(false);
                return;
            }

            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .eq('client_id', authUser.id)
                .neq('status', 'supprimée')
                .order('created_at', { ascending: false });
            
            if (data) setMyQuotes(data);
        } catch (err) {
            console.error(err);
        }
        setLoadingMyQuotes(false);
    };

    const handleDeleteQuote = (quoteId) => {
        setQuoteToDelete(quoteId);
    };

    const confirmDeleteQuote = async () => {
        if (!quoteToDelete) return;
        const qid = quoteToDelete;
        
        // 1. Double Verrouillage Local (Persistant + Session)
        const updatedDeleted = [...deletedQuoteIds, qid];
        setDeletedQuoteIds(updatedDeleted);
        localStorage.setItem('ST_DELETED_QUOTES', JSON.stringify(updatedDeleted));
        
        // On retire de suite de l'écran (V116)
        setMyQuotes(prev => prev.filter(q => q.id !== qid));
        setQuoteToDelete(null); 
        
        try {
            // Tentative DB (Background)
            await supabase.from('devis').delete().eq('demande_id', qid);
            await supabase.from('quotes').delete().eq('id', qid);
            // Fallback soft-delete au cas où
            await supabase.from('quotes').update({ status: 'supprimée' }).eq('id', qid);
        } catch (err) {
            console.error("Silent DB Failure (Handled locally):", err);
        }
    };

    const handleRejectOffer = async (offerId) => {
        if (!window.confirm("❌ Voulez-vous masquer cette offre ?")) return;
        try {
            const { error } = await supabase.from('devis').delete().eq('id', offerId);
            if (error) throw error;
            alert("Offre masquée.");
            return true;
        } catch (err) {
            alert("Erreur : " + err.message);
            return false;
        }
    };

    const handleSendQuote = async () => {
        if (!quoteData.title.trim() || !quoteData.description.trim()) {
            return alert("Veuillez remplir le titre et la description de votre demande.");
        }
        if (!user) return navigate('/login');
        
        setSendingQuote(true);
        try {
            // Correction RLS : On récupère l'ID réel de l'authentification
            const { data: { session } } = await supabase.auth.getSession();
            const authUser = session?.user;
            if (!authUser) {
                alert("Session expirée, veuillez vous reconnecter.");
                return navigate('/login');
            }

            const { error } = await supabase
                .from('quotes')
                .insert([{
                    client_id: authUser.id,
                    specialty: quoteData.specialty,
                    title: quoteData.title,
                    description: quoteData.description,
                    message: quoteData.description, // On garde message pour la rétro-compatibilité
                    billing_type: quoteData.billing_type,
                    planned_date: quoteData.planned_date || null,
                    photo_url: quoteData.photo_url,
                    address: quoteData.address,
                    status: 'en_attente',
                    city: user?.city || '',
                    district: user?.district || ''
                }]);
            
            if (error) throw error;
            
            alert("✅ Votre demande de devis détaillée a été envoyée avec succès !");
            setShowQuoteModal(false);
            setQuoteData({ 
                specialty: 'Plombier', 
                title: '', 
                description: '', 
                billing_type: 'journalier', 
                planned_date: '',
                photo_url: '' 
            });
            fetchMyQuotes(); // Refresh list
        } catch (error) {
            console.error("Error sending quote:", error.message);
            alert("Erreur lors de l'envoi du devis : " + error.message);
        } finally {
            setSendingQuote(false);
        }
    };

    // SYSTÈME DE NOTIFICATIONS CLIENT (BELL & TOAST)
    const [notifications, setNotifications] = useState([]);
    const [devisNotifs, setDevisNotifs] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState("");
    const [sendingFeedback, setSendingFeedback] = useState(false);

    const handleLogout = async () => {
        if (!window.confirm("Voulez-vous vous déconnecter ?")) return;
        await supabase.auth.signOut();
        localStorage.removeItem('user');
        localStorage.removeItem('ST_CACHE_TECH_DATA');
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("⚠️ ATTENTION : Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.")) return;
        if (!window.confirm("DERNIÈRE CONFIRMATION : Toutes vos données seront effacées.")) return;
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const authUser = session?.user;
            if (!authUser) return;

            const { error } = await supabase.rpc('delete_user_account', { user_id: authUser.id });
            if (error) throw error;

            await supabase.auth.signOut();
            localStorage.clear();
            alert("Compte supprimé avec succès.");
            navigate('/login');
        } catch (err) {
            alert("Erreur lors de la suppression : " + err.message);
        }
    };

    const handleFeedbackSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!feedbackMsg.trim()) return;
        
        setSendingFeedback(true);
        try {
            const { error } = await supabase.from('feedbacks').insert([{
                user_id: user?.id,
                message: feedbackMsg,
                type: 'client_problem'
            }]);
            if (error) throw error;
            alert("Merci ! Votre signalement a été envoyé.");
            setFeedbackMsg("");
        } catch (err) {
            alert("Erreur : " + err.message);
        } finally {
            setSendingFeedback(false);
        }
    };

    const fetchNotifs = async () => {
        if (!user?.id) return;
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user;
        if (!authUser) return;

        const { data } = await supabase
            .from('direct_messages')
            .select('*, conversation:conversation_id(*)')
            .eq('seen', false)
            .not('sender_id', 'eq', authUser.id)
            .order('created_at', { ascending: false });
        if (data) setNotifications(data);
    };

    const [sysNotifs, setSysNotifs] = useState([]);
    const fetchSystemNotifs = async () => {
        if (!user?.id) return;
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user;
        if (!authUser) return;

        // V150 - Historique complet pour le client
        try {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', authUser.id)
                .order('created_at', { ascending: false })
                .limit(30);
            if (data) setSysNotifs(data);
        } catch (err) {
            console.error("Fetch client notifs error:", err);
        }
    };

    const deleteSystemNotif = async (id) => {
        if (!window.confirm("🗑️ Supprimer cette alerte définitivement ?")) return;
        try {
            const { error } = await supabase.from('notifications').delete().eq('id', id);
            if (error) throw error;
            setSysNotifs(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error("Delete client notif error:", err);
        }
    };

    const markSysNotifsRead = async (singleId = null) => {
        if (!user?.id) return;
        if (singleId) {
            await supabase.from('notifications').update({ seen: true }).eq('id', singleId);
            setSysNotifs(prev => prev.map(n => n.id === singleId ? { ...n, seen: true } : n));
        } else if (sysNotifs.some(n => !n.seen)) {
            await supabase.from('notifications').update({ seen: true }).eq('user_id', user.id);
            setSysNotifs(prev => prev.map(n => ({ ...n, seen: true })));
        }
    };

    const fetchDevisNotifs = async () => {
        if (!user?.id || myQuotes.length === 0) return;
        const myQuoteIds = myQuotes.map(q => q.id);
        const { data } = await supabase
            .from('devis')
            .select('*, quotes(*), tech:users!technicien_id(*)')
            .in('demande_id', myQuoteIds)
            .eq('statut', 'en_attente')
            .order('created_at', { ascending: false });
        
        if (data) setDevisNotifs(data);
    };

    React.useEffect(() => {
        if (user?.id) {
            fetchNotifs();
            if (myQuotes.length > 0) fetchDevisNotifs();
            
            const sub = supabase.channel('notifs_client')
                .on('postgres_changes', { event: 'INSERT', table: 'direct_messages' }, () => {
                    playNotifSound();
                    fetchNotifs();
                })
                .on('postgres_changes', { event: 'INSERT', table: 'devis' }, () => {
                    playNotifSound();
                    fetchDevisNotifs();
                    // On rafraîchit aussi les demandes pour mettre à jour les compteurs
                    fetchMyQuotes();
                })
                .subscribe();
            return () => supabase.removeChannel(sub);
        }
    }, [user?.id, myQuotes.length]);

    const specialtiesRubrics = [
        { name: 'Informaticien', icon: Monitor, color: '#3b82f6' },
        { name: 'Soudeur', icon: Hammer, color: '#f59e0b' },
        { name: 'Plombier', icon: Droplets, color: '#0ea5e9' },
        { name: 'Mecanicien Automobile', icon: Settings, color: '#64748b' },
        { name: 'Telephone', icon: Smartphone, color: '#ec4899' },
        { name: 'Frigo', icon: Snowflake, color: '#06b6d4' },
        { name: 'Macon', icon: BrickWall, color: '#b45309' },
        { name: 'Manoeuvre', icon: Truck, color: '#78350f' },
        { name: 'Camera Monteur', icon: Video, color: '#f43f5e' },
        { name: 'Aluminium', icon: Layout, color: '#475569' },
        { name: 'Vigile', icon: Shield, color: '#111827' },
        { name: 'Imprimante', icon: Printer, color: '#6366f1' },
        { name: 'Réseau', icon: Wifi, color: '#0ea5e9' },
        { name: 'Décoration Intérieur', icon: Palette, color: '#ec4899' },
        { name: 'Agronome en protection des Végétaux', icon: Leaf, color: '#22c55e' },
        { name: 'Agriculture', icon: Sprout, color: '#16a34a' },
        { name: 'Vidéo Surveillance', icon: Eye, color: '#64748b' },
        { name: 'Maintenancier', icon: Wrench, color: '#f59e0b' },
        { name: 'Autre', icon: PlusCircle, color: '#007bff' }
    ];

    // Logged-in Home View
    if (isLoggedIn) {
        return (
            <div className="container animate-fade-in" style={{ padding: '1rem', paddingBottom: '80px' }}>
                <WelcomeOverlay userName={user?.fullName} duration={1500} />

                {/* SIDEBAR OVERLAY */}
                {showSidebar && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 20000,
                        animation: 'fadeIn 0.2s ease-out'
                    }} onClick={() => setShowSidebar(false)}>
                        <div style={{
                            position: 'absolute', top: '1rem', left: '1rem', bottom: 'auto',
                            width: '280px', backgroundColor: '#111827', color: 'white',
                            padding: '1.5rem 1rem', overflowY: 'auto',
                            animation: 'slideInLeft 0.3s ease-out',
                            boxShadow: '8px 8px 30px rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column', gap: '1.25rem',
                            borderRadius: '28px',
                            maxHeight: 'calc(100vh - 2rem)'
                        }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #374151', paddingBottom: '1rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ backgroundColor: '#374151', padding: '8px', borderRadius: '50%' }}>
                                        <Settings size={20} color="#60a5fa" />
                                    </div>
                                    Paramètres
                                </h2>
                                <button onClick={() => setShowSidebar(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button
                                    onClick={() => { setShowSidebar(false); navigate('/dashboard'); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        width: '100%', padding: '12px', borderRadius: '10px',
                                        background: '#1f2937', color: 'white', border: '1px solid #374151',
                                        fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#374151'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#1f2937'}
                                >
                                    <User size={18} color="#9ca3af" /> Mon Profil
                                </button>
                                
                                <button
                                    onClick={() => { setShowSidebar(false); handleLogout(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        width: '100%', padding: '12px', borderRadius: '10px',
                                        background: '#1f2937', color: '#fca5a5', border: '1px solid #374151',
                                        fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#374151'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#1f2937'}
                                >
                                    <LogOut size={18} color="#f87171" /> Déconnexion
                                </button>

                                <div style={{ borderTop: '1px solid #374151', margin: '10px 0' }}></div>
                                <h4 style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Avancé & Support</h4>

                                <button
                                    onClick={() => { setShowSidebar(false); handleDeleteAccount(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        width: '100%', padding: '12px', borderRadius: '10px',
                                        background: '#7f1d1d', color: '#fecaca', border: '1px solid #991b1b',
                                        fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#991b1b'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#7f1d1d'}
                                >
                                    <UserX size={18} color="#fca5a5" /> Supprimer mon compte
                                </button>

                                <div style={{ marginTop: '1rem', background: '#1f2937', padding: '1rem', borderRadius: '10px', border: '1px solid #374151' }}>
                                    <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '10px' }}>Un problème ? Signalez-le ici :</p>
                                    <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <textarea
                                            value={feedbackMsg}
                                            onChange={(e) => setFeedbackMsg(e.target.value)}
                                            placeholder="Décrivez votre problème..."
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #4b5563', fontSize: '0.85rem', minHeight: '80px', resize: 'none', backgroundColor: '#374151', color: 'white' }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={sendingFeedback}
                                            style={{
                                                padding: '10px', borderRadius: '8px', border: 'none',
                                                background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                            }}
                                        >
                                            <Flag size={16} /> {sendingFeedback ? 'Envoi...' : "Envoyer"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                        <img src={logo} alt="SamaTechnicien" style={{ height: '35px' }} />
                        <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1e293b' }}>SamaTechnicien</span>
                    </Link>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button 
                            onClick={() => setShowSidebar(true)} 
                            style={{ 
                                backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '12px', 
                                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                                justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                            }}
                        >
                            <Menu size={24} color="white" />
                        </button>
                        {/* UNE SEULE CLOCHE PUISSANTE */}
                        <div style={{ position: 'relative' }}>
                            <button 
                                onClick={() => setShowNotifsListModal(true)}
                                style={{ 
                                    width: '45px', height: '45px', borderRadius: '15px', 
                                    border: (sysNotifs.length > 0 || devisNotifs.length > 0) ? '2px solid #ef4444' : '1px solid #e2e8f0', 
                                    backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: (sysNotifs.length > 0 || devisNotifs.length > 0) ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none'
                                }}
                            >
                                <Bell size={22} color={(sysNotifs.length > 0 || devisNotifs.length > 0) ? '#ef4444' : '#64748b'} className={(sysNotifs.length > 0 || devisNotifs.length > 0) ? 'animate-bounce' : ''} />
                            </button>
                            {(sysNotifs.length > 0 || devisNotifs.length > 0) && (
                                <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '2px 7px', borderRadius: '10px', fontWeight: '900', border: '2px solid white' }}>
                                    {sysNotifs.length + devisNotifs.length}
                                </span>
                            )}
                        </div>
                    </div>
                </header>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                    {devisNotifs.length > 0 && (
                        <div 
                            onClick={() => {
                                const section = document.getElementById('mes-demandes');
                                if (section) section.scrollIntoView({ behavior: 'smooth' });
                            }}
                            style={{ 
                                backgroundColor: '#fff3cd', border: '1px solid #ffeeba', padding: '1rem', borderRadius: '15px', 
                                display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                                animation: 'slideDown 0.4s ease-out', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                borderLeft: '5px solid #fbbf24'
                            }}
                        >
                            <div style={{ backgroundColor: '#fbbf24', padding: '8px', borderRadius: '10px', color: 'white' }}>
                                <Settings size={20} className="animate-pulse" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: '800', fontSize: '0.9rem', color: '#854d0e' }}>💰 Nouvelle Offre de Prix !</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e' }}>Cliquez pour voir l'offre de {devisNotifs[0].quotes?.specialty}.</p>
                            </div>
                        </div>
                    )}
                    <div id="mes-demandes" style={{ height: '1px' }} />

                    {notifications.length > 0 && (
                        <div 
                            onClick={() => navigate(`/chat?id=${notifications[0].conversation_id}`)}
                            style={{ 
                                backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '15px', 
                                display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                                animation: 'slideDown 0.4s ease-out', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <div style={{ backgroundColor: '#22c55e', padding: '8px', borderRadius: '10px', color: 'white' }}>
                                <MessageSquare size={20} className="animate-pulse" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: '800', fontSize: '0.9rem', color: '#166534' }}>📬 Nouveau Message !</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#15803d' }}>Discutez avec votre technicien.</p>
                            </div>
                        </div>
                    )}

                    {isLoggedIn && (
                        <button 
                            onClick={() => setShowQuoteModal(true)}
                            style={{ 
                                width: '100%', padding: '1.2rem', background: '#007bff', color: '#fff', 
                                border: 'none', borderRadius: '24px', fontWeight: '900', fontSize: '1.1rem', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                boxShadow: '0 10px 20px rgba(0, 123, 255, 0.25)', cursor: 'pointer',
                                marginBottom: '1.5rem', marginTop: '0.5rem'
                            }}
                        >
                            <FileText size={20} /> Demander un Devis (Général)
                        </button>
                    )}
                </div>

                <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e293b', marginBottom: '0.2rem' }}>Nos Services</h2>
                    <p style={{ fontSize: '1rem', color: '#64748b', fontWeight: '500' }}>Trouvez le bon technicien en un clic</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '400px', margin: '0 auto 2.5rem', width: '100%' }}>
                    <Link 
                        to="/technicians" 
                        style={{ 
                            textDecoration: 'none', padding: '1.2rem', display: 'flex', flexDirection: 'column', 
                            alignItems: 'center', justifyContent: 'center', aspectRatio: '1 / 1', 
                            borderRadius: '50%', border: '4px solid #007bff', background: 'white',
                            boxShadow: '0 15px 35px rgba(0, 123, 255, 0.2)', transition: 'transform 0.2s'
                        }}
                    >
                        <div style={{ backgroundColor: '#007bff', color: 'white', width: '54px', height: '54px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
                            <Users size={32} />
                        </div>
                        <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: '800', color: '#1e293b', lineHeight: '1.1' }}>Trouver un<br />expert</h3>
                    </Link>

                    <Link 
                        to="/marketplace" 
                        style={{ 
                            textDecoration: 'none', padding: '1.2rem', display: 'flex', flexDirection: 'column', 
                            alignItems: 'center', justifyContent: 'center', aspectRatio: '1 / 1', 
                            borderRadius: '50%', border: '1px solid #e2e8f0', background: 'white',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.05)', transition: 'transform 0.2s'
                        }}
                    >
                        <div style={{ backgroundColor: '#2196f3', color: 'white', width: '54px', height: '54px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
                            <ShieldCheck size={32} />
                        </div>
                        <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: '800', color: '#1e293b', lineHeight: '1.1' }}>Sama<br />Boutique</h3>
                    </Link>

                    <Link to="/invite" style={{ textDecoration: 'none', padding: '1.1rem', background: '#fff', border: '1px solid #f1f5f9', gridColumn: '1 / -1', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '100px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ backgroundColor: '#eff6ff', color: '#3b82f6', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={20} />
                        </div>
                        <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: '700', color: '#334155' }}>Inviter des amis et gagner</h3>
                    </Link>
                </div>

                <div style={{ textAlign: 'left', maxWidth: '440px', margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 10px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>Nos Métiers</h3>
                        <Link to="/technicians" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#007bff', textDecoration: 'none' }}>Tout voir →</Link>
                    </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    {isLoggedIn && myQuotes.length > 0 && (
                        <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Mes Demandes Récents</h3>
                                <div style={{ backgroundColor: '#007bff', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>{myQuotes.length}</div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', padding: '5px 0 15px' }}>
                                {myQuotes.filter(q => !deletedQuoteIds.includes(q.id)).map(quote => (
                                    <QuoteCard 
                                        key={quote.id} 
                                        quote={quote} 
                                        navigate={navigate} 
                                        onDelete={() => handleDeleteQuote(quote.id)}
                                        onRejectOffer={handleRejectOffer}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', 
                        gap: '10px',
                        padding: '5px'
                    }}>
                        {specialtiesRubrics.map((spec) => (
                            <Link 
                                key={spec.name}
                                to={`/technicians?specialty=${encodeURIComponent(spec.name)}`}
                                style={{
                                    textDecoration: 'none',
                                    padding: '0.8rem 0.3rem',
                                    background: 'white',
                                    borderRadius: '18px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                    border: '1px solid #f8fafc',
                                    aspectRatio: '1/1.1'
                                }}
                            >
                                <div style={{ 
                                    backgroundColor: `${spec.color}12`, 
                                    color: spec.color,
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '2px',
                                    boxShadow: `0 4px 10px ${spec.color}25`
                                }}>
                                    <spec.icon size={20} />
                                </div>
                                <span style={{ 
                                    fontSize: '0.68rem', 
                                    fontWeight: '800', 
                                    color: '#475569',
                                    textAlign: 'center',
                                    lineHeight: '1.2',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: '2',
                                    WebkitBoxOrient: 'vertical',
                                    width: '100%',
                                    paddingHorizontal: '2px'
                                }}>
                                    {spec.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {showQuoteModal && (
                    <div style={{ 
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', 
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', 
                        zIndex: 10000, padding: '1rem', paddingTop: '5vh', animation: 'fadeIn 0.2s ease-out' 
                    }}>
                        <div style={{ 
                            width: '95%', maxWidth: '480px', maxHeight: '88vh', overflowY: 'auto',
                            background: '#fff', borderRadius: '40px', padding: '1.8rem 1.5rem', 
                            boxShadow: '0 35px 70px -15px rgba(0,0,0,0.6)', position: 'relative',
                            animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}>
                            <button onClick={() => setShowQuoteModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#f8fafc', border: 'none', borderRadius: '50%', padding: '12px', cursor: 'pointer', color: '#64748b', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                <X size={22} />
                            </button>
                            
                            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                                <div style={{ backgroundColor: '#f0fdf4', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem', color: '#007bff' }}>
                                    <FileText size={24} />
                                </div>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '0.2rem', color: '#1e293b' }}>Nouvelle Demande</h2>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Détaillez votre besoin pour des offres précises.</p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleSendQuote(); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <div style={{ marginBottom: '0.8rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '900', color: '#1e293b', marginBottom: '0.6rem' }}>
                                        <Settings size={16} color="#007bff" /> Choisir la Rubrique
                                    </label>
                                    <div style={{ 
                                        display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px',
                                        paddingLeft: '2px', // Évite que la bordure soit coupée
                                        scrollbarWidth: 'none', msOverflowStyle: 'none',
                                        WebkitOverflowScrolling: 'touch'
                                    }}>
                                        {specialtiesRubrics.map(spec => (
                                            <div 
                                                key={spec.name}
                                                onClick={() => setQuoteData({ ...quoteData, specialty: spec.name })}
                                                style={{ 
                                                    flexShrink: 0, 
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                                                    padding: '10px 15px', borderRadius: '18px',
                                                    background: quoteData.specialty === spec.name ? '#f0fdf4' : '#f8fafc',
                                                    border: `2px solid ${quoteData.specialty === spec.name ? '#007bff' : '#f1f5f9'}`,
                                                    cursor: 'pointer', transition: '0.2s',
                                                    boxShadow: quoteData.specialty === spec.name ? '0 4px 12px rgba(0, 123, 255, 0.15)' : 'none'
                                                }}
                                            >
                                                <div style={{ 
                                                    width: '32px', height: '32px', borderRadius: '10px', 
                                                    backgroundColor: quoteData.specialty === spec.name ? '#007bff' : '#fff',
                                                    color: quoteData.specialty === spec.name ? '#fff' : spec.color,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <spec.icon size={18} />
                                                </div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: quoteData.specialty === spec.name ? '#065f46' : '#64748b' }}>
                                                    {spec.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '900', color: '#1e293b', marginBottom: '0.6rem' }}>
                                            <Clock size={16} color="#007bff" /> Type de Contrat
                                        </label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {['journalier', 'mensuel'].map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setQuoteData({ ...quoteData, billing_type: type })}
                                                    style={{ 
                                                        flex: 1, padding: '0.8rem', borderRadius: '14px', 
                                                        border: `2px solid ${quoteData.billing_type === type ? '#007bff' : '#f1f5f9'}`,
                                                        background: quoteData.billing_type === type ? '#f0fdf4' : '#f8fafc',
                                                        color: quoteData.billing_type === type ? '#065f46' : '#64748b',
                                                        fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer',
                                                        textTransform: 'capitalize', transition: '0.2s'
                                                    }}
                                                >
                                                    {type === 'journalier' ? '⏳ Par Jour' : '📅 Par Mois'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.2rem' }}>
                                        <Check size={14} /> Nom de la demande
                                    </label>
                                    <input 
                                        type="text"
                                        value={quoteData.title}
                                        placeholder="Ex: Réparation clim, Peinture salon..."
                                        onChange={(e) => setQuoteData({ ...quoteData, title: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', outline: 'none' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '0.8rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '900', color: '#1e293b', marginBottom: '0.6rem' }}>
                                        <MapPin size={16} color="#007bff" /> Adresse d'intervention
                                    </label>
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <MapPin size={18} style={{ position: 'absolute', left: '15px', color: '#007bff' }} />
                                        <input 
                                            type="text"
                                            value={quoteData.address}
                                            placeholder="Ex: Parcelles Assainies, Villa N°..."
                                            onChange={(e) => setQuoteData({ ...quoteData, address: e.target.value })}
                                            style={{ 
                                                width: '100%', 
                                                padding: '1rem 1rem 1rem 2.8rem', 
                                                borderRadius: '18px', 
                                                border: '2px solid #f1f5f9', 
                                                background: '#f8fafc', 
                                                fontSize: '0.95rem', 
                                                outline: 'none',
                                                fontWeight: '600',
                                                transition: 'all 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#007bff'}
                                            onBlur={(e) => e.target.style.borderColor = '#f1f5f9'}
                                        />
                                        <button 
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    setQuoteData({ ...quoteData, address: "📡 Recherche GPS..." });
                                                    
                                                    // Demander la permission
                                                    const perm = await Geolocation.requestPermissions();
                                                    if (perm.location !== 'granted') {
                                                        throw new Error("Accès GPS refusé.");
                                                    }

                                                    // Obtenir les coordonnées
                                                    const pos = await Geolocation.getCurrentPosition({
                                                        enableHighAccuracy: true,
                                                        timeout: 10000
                                                    });
                                                    
                                                    const { latitude, longitude } = pos.coords;
                                                    
                                                    // Reverse Geocoding via Nominatim (Gratuit)
                                                    try {
                                                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                                        const data = await res.json();
                                                        if (data.display_name) {
                                                            setQuoteData(prev => ({ ...prev, address: data.display_name }));
                                                        } else {
                                                            setQuoteData(prev => ({ ...prev, address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
                                                        }
                                                    } catch (e) {
                                                        setQuoteData(prev => ({ ...prev, address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
                                                    }
                                                } catch (err) {
                                                    console.error("GPS Error:", err);
                                                    setQuoteData(prev => ({ ...prev, address: "" }));
                                                    alert("❌ Erreur GPS : Vérifiez que la localisation est activée dans vos paramètres Android.");
                                                }
                                            }}
                                            style={{ 
                                                position: 'absolute', right: '10px', 
                                                background: '#007bff', color: 'white', 
                                                border: 'none', borderRadius: '12px', padding: '6px 10px', 
                                                fontSize: '0.7rem', fontWeight: '900', cursor: 'pointer',
                                                boxShadow: '0 4px 8px rgba(0, 123, 255, 0.2)'
                                            }}
                                        >
                                            📍 Ma Position
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.2rem' }}>
                                        <Info size={14} /> Description descriptive
                                    </label>
                                    <textarea 
                                        value={quoteData.description}
                                        onChange={(e) => setQuoteData({ ...quoteData, description: e.target.value })}
                                        placeholder="Décrivez précisément les travaux, l'état actuel..."
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', minHeight: '80px', fontSize: '0.85rem', resize: 'none', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.2rem' }}>
                                            <Calendar size={14} /> Planification
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <input 
                                                type="date"
                                                className="custom-date-input"
                                                value={quoteData.planned_date}
                                                onChange={(e) => setQuoteData({ ...quoteData, planned_date: e.target.value })}
                                                style={{ width: '100%', padding: '0.7rem', paddingRight: '2.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.8rem', outline: 'none' }}
                                            />
                                            <Calendar size={18} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.2rem' }}>
                                            <Image size={14} /> Photo
                                        </label>
                                        <button 
                                            type="button"
                                            onClick={takePhoto}
                                            style={{ 
                                                width: '100%', padding: '0.7rem', borderRadius: '14px', 
                                                border: '1px dashed #cbd5e1', 
                                                background: quoteData.photo_url ? '#dcfce7' : '#f8fafc', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                gap: '8px', fontSize: '0.7rem', color: '#64748b',
                                                cursor: 'pointer', outline: 'none'
                                            }}
                                        >
                                            {quoteData.photo_url ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <img src={quoteData.photo_url} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} alt="Thumb" />
                                                    <span style={{ color: '#007bff', fontWeight: 'bold' }}> Photo OK</span>
                                                </div>
                                            ) : (
                                                <><PlusCircle size={14} /> Ajouter</>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={sendingQuote}
                                    style={{ 
                                        width: '100%', padding: '0.9rem', background: '#007bff', color: '#fff', 
                                        border: 'none', borderRadius: '18px', fontWeight: '900', fontSize: '1rem', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        boxShadow: '0 8px 16px rgba(0, 123, 255, 0.2)', cursor: 'pointer',
                                        marginTop: '0.3rem', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    {sendingQuote ? 'Envoi...' : <><Send size={18} /> Valider la demande</>}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                {/* MODAL NOTIFICATIONS CLIENT (OFFRES DE PRIX) */}
                {showNotifsListModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 19000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto', animation: 'slideUp 0.3s ease-out' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '900' }}>Mes Alertes 🔔</h3>
                                <button onClick={() => setShowNotifsListModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            {(sysNotifs.length === 0 && (typeof devisNotifs === 'undefined' || devisNotifs.length === 0)) ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                                    <p style={{ color: '#64748b', fontWeight: 'bold' }}>Rien de neuf pour l'instant.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {[...(sysNotifs || []), ...(devisNotifs || [])]
                                        .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
                                        .map((notif, idx) => {
                                        const isOffer = !!notif.demande_id;
                                        const isNew = !notif.seen || (isOffer && notif.statut === 'en_attente');
                                        
                                        return (
                                            <div key={idx} style={{ 
                                                padding: '1.2rem', borderRadius: '22px', 
                                                border: isNew ? '2px solid #fbbf24' : '1px solid #f1f5f9', 
                                                background: isNew ? '#fffbeb' : '#fff', 
                                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                                position: 'relative'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                                                        {isOffer ? (
                                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #fbbf24' }}>
                                                                <img 
                                                                    src={notif.tech?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.tech?.fullname || 'Expert')}&background=007bff&color=fff`} 
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div style={{ backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '12px', color: '#64748b' }}>
                                                                <Bell size={20} />
                                                            </div>
                                                        )}
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ margin: 0, fontWeight: '900', fontSize: '0.95rem', color: '#1e293b' }}>
                                                                {isNew && '🟢 '}{isOffer ? `Offre de ${notif.tech?.fullname || 'Expert'}` : (notif.title || 'Notification')}
                                                            </p>
                                                            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
                                                                {isOffer ? `Proposition pour: ${notif.quotes?.title}` : (notif.content || 'Un message important.')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {!isOffer && (
                                                        <button 
                                                            onClick={() => deleteSystemNotif(notif.id)}
                                                            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {isOffer && (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', backgroundColor: '#fff', padding: '10px', borderRadius: '15px', border: '1px solid #fef3c7' }}>
                                                        <span style={{ fontWeight: '900', color: '#059669', fontSize: '1.1rem' }}>{Number(notif.montant).toLocaleString()} F</span>
                                                        <button 
                                                            onClick={() => {
                                                                const section = document.getElementById('mes-demandes');
                                                                if (section) section.scrollIntoView({ behavior: 'smooth' });
                                                                setShowNotifsListModal(false);
                                                            }}
                                                            style={{ padding: '6px 15px', background: '#fbbf24', color: '#854d0e', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '0.75rem', cursor: 'pointer' }}
                                                        >
                                                            🎯 Voir & Valider
                                                        </button>
                                                    </div>
                                                )}

                                                {!isOffer && !notif.seen && (
                                                    <button 
                                                        onClick={() => markSysNotifsRead(notif.id)}
                                                        style={{ width: '100%', marginTop: '12px', padding: '0.7rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}
                                                    >
                                                        Marquer comme lu
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {sysNotifs.some(n => !n.seen) && (
                                        <button onClick={() => markSysNotifsRead()} style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#fbbf24', fontWeight: '800', textDecoration: 'underline', width: '100%', fontSize: '0.9rem', cursor: 'pointer' }}>
                                            Tout marquer comme lu
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* MODAL DE CONFIRMATION DE SUPPRESSION (V115/V120) */}
                {quoteToDelete && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000000 }}>
                        <div style={{ 
                            position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
                            backgroundColor: '#ffffff', borderRadius: '30px', padding: '2rem', width: '90%', maxWidth: '400px', 
                            textAlign: 'center', boxShadow: '0 40px 100px rgba(0,0,0,1)', zIndex: 1000001,
                            border: '1px solid #ddd'
                        }}>
                            <div style={{ fontSize: '4.5rem', marginBottom: '1.25rem' }}>🗑️</div>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: '900', marginBottom: '0.8rem', color: '#1e293b' }}>Confirmation</h3>
                            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: '1.5', marginBottom: '2.5rem' }}>
                                Voulez-vous vraiment supprimer cet appel ? 🔍
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); confirmDeleteQuote(); }}
                                    style={{ width: '100%', padding: '1.2rem', borderRadius: '20px', background: '#ef4444', color: 'white', border: 'none', fontWeight: '900', fontSize: '1.2rem' }}
                                >
                                    OUI, SUPPRIMER
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setQuoteToDelete(null); }}
                                    style={{ width: '100%', padding: '1.2rem', borderRadius: '20px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: '800' }}
                                >
                                    ANNULER
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Splash Screen for guest users
    return <LandingPage />;
};

const QuoteCard = ({ quote, navigate, onDelete, onRejectOffer }) => {
    const [offers, setOffers] = useState([]);
    const [showOffers, setShowOffers] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchOffers = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('devis')
                .select('*, technician:users!technicien_id(*)')
                .eq('demande_id', quote.id)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error("Erreur lecture devis:", error);
                const { data: simpleData } = await supabase.from('devis').select('*').eq('demande_id', quote.id);
                if (simpleData) setOffers(simpleData);
            } else if (data) {
                setOffers(data);
            }
        } catch (err) {
            console.error("Fatality error:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        let timer;
        fetchOffers();
        const sub = supabase.channel(`devis-sync-${quote.id}`)
            .on('postgres_changes', { event: 'INSERT', table: 'devis', filter: `demande_id=eq.${quote.id}` }, () => {
                fetchOffers();
                timer = setTimeout(fetchOffers, 1000);
            })
            .on('postgres_changes', { event: 'UPDATE', table: 'devis', filter: `demande_id=eq.${quote.id}` }, () => fetchOffers())
            .subscribe();
            
        return () => {
            if (timer) clearTimeout(timer);
            supabase.removeChannel(sub);
        };
    }, [quote.id]);

    const handleAccept = async (offer) => {
        if (!confirm("Voulez-vous accepter ce devis et ouvrir le chat avec le technicien ?")) return;
        await supabase.from('devis').update({ statut: 'validé' }).eq('id', offer.id);
        await supabase.from('quotes').update({ status: 'fermée' }).eq('id', quote.id);
        
        await supabase.from('notifications').insert([{
            user_id: offer.technicien_id,
            title: `✅ Devis Accepté !`,
            content: `Le client a validé votre offre pour la demande "${quote.title || 'sans titre'}". Vous êtes maintenant connectés !`,
            type: 'offer_accepted',
            seen: false
        }]);

        navigate(`/chat?userId=${offer.technicien_id}`);
    };

    return (
        <div className="card" style={{ padding: '1.2rem', border: quote.status === 'fermée' ? '1px solid #eee' : '1px solid #dcfce7', position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', alignItems: 'center' }}>
                <span style={{ fontWeight: '900', color: 'var(--primary-color)', fontSize: '1rem', backgroundColor: '#f0fdf4', padding: '4px 12px', borderRadius: '10px' }}>{quote.specialty}</span>
                <button 
                    onClick={onDelete} 
                    style={{ 
                        color: '#ef4444', 
                        background: '#fef2f2', 
                        border: '1px solid #fee2e2', 
                        padding: '10px 14px', 
                        borderRadius: '12px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '900',
                        boxShadow: '0 2px 5px rgba(239, 68, 68, 0.1)'
                    }}
                    title="Supprimer ma demande"
                >
                    <Trash2 size={18} /> Supprimer
                </button>
            </div>
            
            <div style={{ marginBottom: '1.2rem' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '900', color: '#1e293b' }}>{quote.title || 'Demande sans titre'}</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>"{quote.description || quote.message}"</p>
                <div style={{ marginTop: '10px', fontSize: '0.7rem', color: '#94a3b8', display: 'flex', gap: '10px', fontWeight: '600' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(quote.created_at).toLocaleDateString()}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {quote.billing_type?.toUpperCase()}</span>
                    {quote.address && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {quote.address}</span>}
                </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: quote.status === 'fermée' ? '#ef4444' : '#007bff', animation: quote.status === 'fermée' ? 'none' : 'pulse 2s infinite' }}></div>
                    <span style={{ fontSize: '0.75rem', color: quote.status === 'fermée' ? '#ef4444' : '#007bff', fontWeight: '800' }}>
                        {quote.status === 'fermée' ? 'Demande Terminée' : 'Recherche Experts...'}
                    </span>
                </div>
                <button 
                    onClick={() => setShowOffers(!showOffers)}
                    className="btn" 
                    style={{ 
                        fontSize: '0.8rem', padding: '10px 18px', 
                        backgroundColor: '#fbbf24', color: '#854d0e',
                        border: 'none', borderRadius: '15px', fontWeight: '900',
                        boxShadow: '0 6px 12px -2px rgba(251, 191, 36, 0.3)',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    {showOffers ? <><X size={16} /> Réduire</> : <><Info size={16} /> Voir les Offres ({offers.length})</>}
                </button>
            </div>

            {showOffers && (
                <div style={{ marginTop: '1.2rem', borderTop: '2px dashed #f1f5f9', paddingTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569' }}>Propositions reçues :</span>
                        <button onClick={fetchOffers} style={{ background: '#eff6ff', border: 'none', color: '#3b82f6', fontSize: '0.7rem', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer' }}>Actualiser</button>
                    </div>
                    {loading ? <p style={{ fontSize: '0.85rem', textAlign: 'center', color: '#64748b' }}>Recherche des tarifs...</p> : (
                        offers.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px dashed #e2e8f0' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontWeight: '600' }}>Bientôt de nouveaux tarifs ici !</p>
                                <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Nos experts consultent votre demande.</p>
                            </div>
                        ) : (
                            offers.map(offer => (
                                <div key={offer.id} style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', alignItems: 'center' }}>
                                        <Link 
                                            to={`/technician/${offer.technician?.id}`}
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}
                                        >
                                            <div style={{ width: '45px', height: '45px', borderRadius: '15px', overflow: 'hidden', border: '2px solid #007bff', backgroundColor: '#f1f5f9' }}>
                                                <img 
                                                    src={offer.technician?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(offer.technician?.fullname || 'Expert')}&background=007bff&color=fff`} 
                                                    alt="Expert" 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div>
                                                <span style={{ fontWeight: '900', fontSize: '0.95rem', color: '#1e293b', display: 'block' }}>{offer.technician?.fullname || 'Expert Sama'}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '900' }}>★ {offer.technician?.rating || '5.0'}</span>
                                                    <span style={{ color: '#cbd5e1' }}>•</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700' }}>{offer.technician?.specialty || 'Expert'}</span>
                                                </div>
                                            </div>
                                        </Link>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ color: '#059669', fontWeight: '900', fontSize: '1.2rem', display: 'block' }}>{Number(offer.montant).toLocaleString()} F</span>
                                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '700' }}>Prix Total</span>
                                        </div>
                                    </div>
                                    <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '12px', marginBottom: '1.2rem', borderLeft: '4px solid #007bff' }}>
                                        <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, fontStyle: 'italic', lineHeight: '1.5' }}>
                                            "{offer.note || 'Prêt à intervenir rapidement avec mon matériel.'}"
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button 
                                            onClick={async () => {
                                                const success = await onRejectOffer(offer.id);
                                                if (success) fetchOffers();
                                            }}
                                            style={{ flex: 1, padding: '0.8rem', fontSize: '0.8rem', backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' }}
                                        >
                                            ❌ Supprimer ce devis
                                        </button>
                                        <button 
                                            onClick={() => handleAccept(offer)}
                                            style={{ flex: 1.5, padding: '0.8rem', fontSize: '0.8rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', boxShadow: '0 4px 10px rgba(0, 123, 255, 0.25)', cursor: 'pointer' }}
                                        >
                                            ✅ Accepter & Contacter
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            )}
        </div>
    );
}

export default Home;
