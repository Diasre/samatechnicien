import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { 
    ShieldCheck, Users, Monitor, Hammer, Droplets, Settings, Smartphone, 
    Tv, Snowflake, BrickWall, Truck, Video, Layout, Shield, PlusCircle,
    Printer, Wifi, Palette, Leaf, Sprout, Eye, Wrench, FileText, Send, X,
    Bell, MessageSquare, Info, Image, Calendar, Clock, ChevronRight, Check, Trash2
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
        billing_type: 'journalier', 
        planned_date: '',
        photo_url: '' 
    });
    const [sendingQuote, setSendingQuote] = useState(false);
    const [myQuotes, setMyQuotes] = useState([]);
    const [loadingMyQuotes, setLoadingMyQuotes] = useState(false);
    const navigate = useNavigate();

    let user = null;
    try {
        const stored = localStorage.getItem('user');
        if (stored) user = JSON.parse(stored);
    } catch (e) {
        console.error('LocalStorage access blocked:', e);
    }

    React.useEffect(() => {
        if (user?.id && user.role === 'client') {
            fetchMyQuotes();
        }
    }, [user?.id]);

    const takePhoto = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Prompt, // Demande Photo ou Galerie
                promptLabelHeader: 'Image du Problème',
                promptLabelPhoto: 'Prendre une photo',
                promptLabelPicture: 'Choisir dans la galerie'
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
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .eq('client_id', user.id)
                .order('created_at', { ascending: false });
            
            if (data) setMyQuotes(data);
        } catch (err) {
            console.error(err);
        }
        setLoadingMyQuotes(false);
    };

    const handleDeleteQuote = async (quoteId) => {
        if (!window.confirm("🗑️ Voulez-vous supprimer cette demande ainsi que toutes les offres liées ?")) return;
        try {
            // Nettoyage en deux temps pour éviter les pivots de clés étrangères si RLS limités
            await supabase.from('devis').delete().eq('demande_id', quoteId);
            const { error } = await supabase.from('quotes').delete().eq('id', quoteId);
            if (error) throw error;
            alert("✅ Demande et offres supprimées.");
            fetchMyQuotes();
        } catch (err) {
            console.error("Del Error:", err);
            alert("Erreur lors de la suppression : " + err.message);
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
            const { error } = await supabase
                .from('quotes')
                .insert([{
                    client_id: String(user.id) || null,
                    specialty: quoteData.specialty,
                    title: quoteData.title,
                    description: quoteData.description,
                    message: quoteData.description, // On garde message pour la rétro-compatibilité
                    billing_type: quoteData.billing_type,
                    planned_date: quoteData.planned_date || null,
                    photo_url: quoteData.photo_url || null,
                    city: user.city || '',
                    district: user.district || ''
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
            alert("Erreur lors de l'envoi du devis. Assurez-vous d'être connecté.");
        } finally {
            setSendingQuote(false);
        }
    };

    // SYSTÈME DE NOTIFICATIONS CLIENT (BELL & TOAST)
    const [notifications, setNotifications] = useState([]);
    const [devisNotifs, setDevisNotifs] = useState([]);

    const fetchNotifs = async () => {
        if (!user?.id) return;
        const { data } = await supabase
            .from('direct_messages')
            .select('*, conversation:conversation_id(*)')
            .eq('seen', false)
            .not('sender_id', 'eq', user.id)
            .order('created_at', { ascending: false });
        if (data) setNotifications(data);
    };

    const fetchDevisNotifs = async () => {
        if (!user?.id || myQuotes.length === 0) return;
        const myQuoteIds = myQuotes.map(q => q.id);
        const { data } = await supabase
            .from('devis')
            .select('*, quotes(*)')
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
                .on('postgres_changes', { event: 'INSERT', table: 'direct_messages' }, () => fetchNotifs())
                .on('postgres_changes', { event: 'INSERT', table: 'devis' }, () => {
                    fetchDevisNotifs();
                    // On rafraîchit aussi les demandes pour mettre à jour les compteurs
                    fetchMyQuotes();
                })
                .subscribe();
            return () => supabase.removeChannel(sub);
        }
    }, [user?.id, myQuotes.length]);
    const isLoggedIn = !!user;

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
        { name: 'Autre', icon: PlusCircle, color: '#10b981' }
    ];

    // Logged-in Home View
    if (isLoggedIn) {
        if (user.role === 'technician') {
            return <Navigate to="/expert-dashboard" replace />;
        }
        return (
            <div className="container animate-fade-in" style={{ padding: '1rem', paddingBottom: '80px' }}>
            <WelcomeOverlay userName={user?.fullName} duration={1500} />

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <img src={logo} alt="SamaTechnicien" style={{ height: '35px' }} />
                    <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1e293b' }}>SamaTechnicien</span>
                </Link>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button 
                        onClick={() => navigate('/chat')}
                        style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <Bell size={20} color={(notifications.length > 0 || devisNotifs.length > 0) ? '#ef4444' : '#64748b'} className={(notifications.length > 0 || devisNotifs.length > 0) ? 'animate-bounce' : ''} />
                        {(notifications.length > 0 || devisNotifs.length > 0) && (
                            <span style={{ position: 'absolute', top: '0', right: '0', backgroundColor: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '50%', fontWeight: '900', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)' }}>
                                {notifications.length + devisNotifs.length}
                            </span>
                        )}
                    </button>
                    {!user && (
                        <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Connexion</Link>
                    )}
                </div>
            </header>

            {/* BANNER NOTIFICATION (TOAST) / SYNC BUTTON */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                {/* BANNIÈRE DEVIS RÉCENTS (CLIQUABLE) */}
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

                {/* BANNIÈRE CHAT RÉCENT */}
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
            </div>

                <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e293b', marginBottom: '0.2rem' }}>Espace Services</h2>
                    <p style={{ fontSize: '1rem', color: '#64748b', fontWeight: '500' }}>Trouvez le bon technicien en un clic</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '400px', margin: '0 auto 2.5rem', width: '100%' }}>
                    <Link 
                        to="/technicians" 
                        style={{ 
                            textDecoration: 'none', padding: '1.2rem', display: 'flex', flexDirection: 'column', 
                            alignItems: 'center', justifyContent: 'center', aspectRatio: '1 / 1', 
                            borderRadius: '50%', border: '4px solid #10b981', background: 'white',
                            boxShadow: '0 15px 35px rgba(16, 185, 129, 0.2)', transition: 'transform 0.2s'
                        }}
                    >
                        <div style={{ backgroundColor: '#10b981', color: 'white', width: '54px', height: '54px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
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
                        <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: '800', color: '#1e293b', lineHeight: '1.1' }}>Boutique<br />Pros</h3>
                    </Link>

                    <Link to="/invite" style={{ textDecoration: 'none', padding: '1.1rem', background: '#fff', border: '1px solid #f1f5f9', gridColumn: '1 / -1', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '100px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ backgroundColor: '#eff6ff', color: '#3b82f6', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={20} />
                        </div>
                        <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: '700', color: '#334155' }}>Inviter des amis et gagner</h3>
                    </Link>
                </div>

                {/* NOS MÉTIERS SECTION */}
                <div style={{ textAlign: 'left', maxWidth: '440px', margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 10px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>Nos Métiers</h3>
                        <Link to="/technicians" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#10b981', textDecoration: 'none' }}>Tout voir →</Link>
                    </div>
                </div>
                {/* QUICK ACTIONS */}
                <div style={{ marginBottom: '2.5rem' }}>
                    {user?.role === 'client' && (
                        <button 
                            onClick={() => setShowQuoteModal(true)}
                            style={{ 
                                width: '100%', padding: '1.2rem', background: '#10b981', color: '#fff', 
                                border: 'none', borderRadius: '24px', fontWeight: '900', fontSize: '1.1rem', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                boxShadow: '0 10px 20px rgba(16, 185, 129, 0.25)', cursor: 'pointer',
                                marginBottom: '1.5rem'
                            }}
                        >
                            <FileText size={20} /> Demander un Devis (Général)
                        </button>
                    )}

                    {/* MES DEMANDES DE DEVIS (SECTION CLIENT) */}
                    {user?.role === 'client' && myQuotes.length > 0 && (
                        <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Mes Demandes Récents</h3>
                                <div style={{ backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>{myQuotes.length}</div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', padding: '5px 0 15px' }}>
                                {myQuotes.map(quote => (
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
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
                        <div style={{ 
                            width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto',
                            background: '#fff', borderRadius: '35px', padding: '2rem', 
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative' 
                        }}>
                            <button onClick={() => setShowQuoteModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer' }}><X size={20} /></button>
                            
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ backgroundColor: '#f0fdf4', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#10b981' }}>
                                    <FileText size={28} />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.3rem', color: '#1e293b' }}>Nouvelle Demande</h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Détaillez votre besoin pour des offres précises.</p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleSendQuote(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.4rem' }}>
                                            <Settings size={14} /> Rubrique
                                        </label>
                                        <select 
                                            value={quoteData.specialty}
                                            onChange={(e) => setQuoteData({ ...quoteData, specialty: e.target.value })}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', outline: 'none' }}
                                        >
                                            {specialtiesRubrics.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.4rem' }}>
                                            <Clock size={14} /> Type Contrat
                                        </label>
                                        <select 
                                            value={quoteData.billing_type}
                                            onChange={(e) => setQuoteData({ ...quoteData, billing_type: e.target.value })}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', outline: 'none' }}
                                        >
                                            <option value="journalier">Journalier</option>
                                            <option value="mensuel">Mensuel</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.4rem' }}>
                                        <Check size={14} /> Nom de la demande
                                    </label>
                                    <input 
                                        type="text"
                                        value={quoteData.title}
                                        placeholder="Ex: Réparation clim, Peinture salon..."
                                        onChange={(e) => setQuoteData({ ...quoteData, title: e.target.value })}
                                        style={{ width: '100%', padding: '0.9rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.4rem' }}>
                                        <Info size={14} /> Description descriptive
                                    </label>
                                    <textarea 
                                        value={quoteData.description}
                                        onChange={(e) => setQuoteData({ ...quoteData, description: e.target.value })}
                                        placeholder="Décrivez précisément les travaux, l'état actuel..."
                                        style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', minHeight: '100px', fontSize: '0.9rem', resize: 'none', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.4rem' }}>
                                            <Calendar size={14} /> Planification
                                        </label>
                                        <input 
                                            type="date"
                                            value={quoteData.planned_date}
                                            onChange={(e) => setQuoteData({ ...quoteData, planned_date: e.target.value })}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.4rem' }}>
                                            <Image size={14} /> Photo
                                        </label>
                                        <button 
                                            type="button"
                                            onClick={takePhoto}
                                            style={{ 
                                                width: '100%', padding: '0.8rem', borderRadius: '14px', 
                                                border: '1px dashed #cbd5e1', 
                                                background: quoteData.photo_url ? '#dcfce7' : '#f8fafc', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                gap: '8px', fontSize: '0.75rem', color: '#64748b',
                                                cursor: 'pointer', outline: 'none'
                                            }}
                                        >
                                            {quoteData.photo_url ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <img src={quoteData.photo_url} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} alt="Thumb" />
                                                    <span style={{ color: '#10b981', fontWeight: 'bold' }}> Photo OK</span>
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
                                        width: '100%', padding: '1.1rem', background: '#10b981', color: '#fff', 
                                        border: 'none', borderRadius: '18px', fontWeight: '900', fontSize: '1.1rem', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                        boxShadow: '0 10px 20px rgba(16, 185, 129, 0.25)', cursor: 'pointer',
                                        marginTop: '0.5rem', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    {sendingQuote ? 'Envoi...' : <><Send size={20} /> Valider la demande</>}
                                </button>
                            </form>
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
            // Lecture directe "Zéro blocage"
            const { data, error } = await supabase
                .from('devis')
                .select('*, technician:users!technicien_id(*)')
                .eq('demande_id', quote.id)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error("Erreur lecture devis:", error);
                // Tentative sans jointure en cas d'échec de droits
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
        fetchOffers(); // Charger au montage
        
        // Double rafraîchissement au montage (sécurité latence)
        const timer = setTimeout(fetchOffers, 1500);

        // Souscription temps réel pour CETTE demande précise
        const sub = supabase.channel(`devis-sync-${quote.id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                table: 'devis', 
                filter: `demande_id=eq.${quote.id}` 
            }, () => {
                fetchOffers();
                setTimeout(fetchOffers, 1000); // 2ème passe de sécurité
            })
            .on('postgres_changes', { 
                event: 'UPDATE', 
                table: 'devis', 
                filter: `demande_id=eq.${quote.id}` 
            }, () => fetchOffers())
            .subscribe();
            
        return () => {
            clearTimeout(timer);
            supabase.removeChannel(sub);
        };
    }, [quote.id]);

    const handleAccept = async (offer) => {
        if (!confirm("Voulez-vous accepter ce devis et ouvrir le chat avec le technicien ?")) return;
        
        // 1. Marquer comme validé
        await supabase.from('devis').update({ statut: 'validé' }).eq('id', offer.id);
        
        // 2. Fermer la demande (Algorithme d'Unicité)
        await supabase.from('quotes').update({ status: 'fermée' }).eq('id', quote.id);
        
        // 3. Rediriger vers le chat pour finaliser
        navigate(`/chat?userId=${offer.technicien_id}`);
    };

    return (
        <div className="card" style={{ padding: '1.2rem', border: quote.status === 'fermée' ? '1px solid #eee' : '1px solid #dcfce7', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary-color)', fontSize: '1rem' }}>{quote.specialty}</span>
                <button onClick={onDelete} style={{ color: '#94a3b8', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#1e293b' }}>{quote.title || 'Besoin sans titre'}</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{quote.description || quote.message}"</p>
                <div style={{ marginTop: '8px', fontSize: '0.65rem', color: '#94a3b8', display: 'flex', gap: '8px' }}>
                    <span>📅 {new Date(quote.created_at).toLocaleDateString()}</span>
                    <span>● {quote.billing_type?.toUpperCase()}</span>
                </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: quote.status === 'fermée' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                    ● {quote.status === 'fermée' ? 'Demande Fermée' : 'En attente d\'offres'}
                </span>
                <button 
                    onClick={() => setShowOffers(!showOffers)}
                    className="btn" 
                    style={{ 
                        fontSize: '0.75rem', padding: '8px 16px', 
                        backgroundColor: '#fbbf24', color: '#854d0e',
                        border: 'none', borderRadius: '12px', fontWeight: '900',
                        boxShadow: '0 4px 6px -1px rgba(251, 191, 36, 0.2)'
                    }}
                >
                    {showOffers ? 'Réduire' : `💰 Voir les Offres (${offers.length})`}
                </button>
            </div>

            {showOffers && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>Liste des propositions :</span>
                        <button onClick={fetchOffers} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.65rem', textDecoration: 'underline', cursor: 'pointer' }}>Forcer Rafraîchir</button>
                    </div>
                    {loading ? <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>Chargement...</p> : (
                        offers.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '15px' }}>
                                <p style={{ fontSize: '0.8rem', color: '#999', margin: 0 }}>Aucun prix n'est apparu pour le moment.</p>
                                <p style={{ fontSize: '0.65rem', color: '#cbd5e1', marginTop: '5px' }}>ID Demande: {quote.id}</p>
                            </div>
                        ) : (
                            offers.map(offer => (
                                <div key={offer.id} style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '15px', border: '1px solid #bbf7d0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                                                {offer.technicien_id?.substring(0, 1) || 'T'}
                                            </div>
                                            <span style={{ fontWeight: '900', fontSize: '0.85rem', color: '#166534' }}>{offer.technician?.fullname || 'Expert Sama'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#059669', fontWeight: '900', fontSize: '1.1rem' }}>{offer.montant} F</span>
                                            <button 
                                                onClick={async () => {
                                                    const success = await onRejectOffer(offer.id);
                                                    if (success) fetchOffers();
                                                }} 
                                                style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#15803d', marginBottom: '1rem', fontStyle: 'italic', backgroundColor: 'white', padding: '8px', borderRadius: '8px' }}>
                                        "{offer.note || 'Intervention rapide possible.'}"
                                    </p>
                                    <button 
                                        onClick={() => handleAccept(offer)}
                                        className="btn" 
                                        style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}
                                    >
                                        ✅ Accepter cette offre
                                    </button>
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
