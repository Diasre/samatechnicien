import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { 
    User, Users, Settings, Star, MessageSquare, Phone, MapPin, CheckCircle, Save, 
    ArrowLeft, PlusCircle, ShoppingBag, Send, MessageCircle, Shield, Share2, 
    Flag, Bell, Info 
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
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [customResponse, setCustomResponse] = useState("");
    const [devisLines, setDevisLines] = useState([{ desc: "Main d'œuvre", qty: 1, price: 0 }]);
    const [devisNote, setDevisNote] = useState("Intervention possible rapidement.");

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
        }
    }, [user?.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. D'abord récupérer les infos locales du tech
            const { data: tech, error: techError } = await supabase.from('users').select('*').eq('id', user.id).single();
            if (techError) throw techError;

            // 2. Utiliser SA spécialité en base pour charger les devis et discussions
            const cleanSpec = (tech.specialty || 'Autre').trim();
            // Créer une recherche qui attrape avec ou sans accent (ex: Macon, Maçon, Maconnerie...)
            const searchPattern = cleanSpec.toLowerCase().replace(/[açéèêëìîïòôöùûü]/g, '_');
            const specSearch = `%${searchPattern.substring(0, 5)}%`;

            const [reviewsResponse, productsResponse, quotesResponse, convsResponse] = await Promise.all([
                supabase.from('reviews').select('*, client:clientId(fullname)').eq('technicianId', user.id).order('created_at', { ascending: false }),
                supabase.from('products').select('*').eq('technicianid', user.id).order('created_at', { ascending: false }),
                supabase.from('quotes').select('*, client:client_id(fullname, phone, userId:id)').ilike('specialty', specSearch).order('created_at', { ascending: false }),
                supabase.from('conversations').select(`
                    id, 
                    updated_at,
                    participant1:participant1_id (id, fullname, image),
                    participant2:participant2_id (id, fullname, image)
                `).or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`).order('updated_at', { ascending: false }).limit(5)
            ]);

            const { data: reviewsData } = reviewsResponse;
            const { data: productsData } = productsResponse;
            const { data: quotesData } = quotesResponse;
            const { data: convsData } = convsResponse;

            setTechData(tech);
            // Sync local storage specialty if mismatch
            if (tech.specialty && tech.specialty !== user.specialty) {
                const updatedUser = { ...user, specialty: tech.specialty };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            if (techError) {
                console.error("Supabase error fetching user:", techError);
            }

            if (!tech) {
                console.warn("User ID not found in Supabase. Probably old session.");
                alert("Votre session a expiré ou votre compte n'existe plus. Veuillez vous reconnecter.");
                localStorage.removeItem('user');
                window.location.href = '/login';
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

            if (quotesData) {
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
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleShare = async () => {
        const profileUrl = `${window.location.origin}/technician/${user.id}`;
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

    const openResponseForm = (quote) => {
        setSelectedQuote(quote);
        setCustomResponse(`Bonjour ${quote.client?.fullname || ''}, je suis intéressé par votre devis pour : "${quote.title || quote.specialty}". Pouvons-nous en discuter ? Voici ma proposition : `);
        setShowResponseModal(true);
    };

    const handleSendFinalReply = async () => {
        const subtotal = devisLines.reduce((acc, line) => acc + (Number(line.qty || 0) * Number(line.price || 0)), 0);
        const tva = Math.round(subtotal * 0.19);
        const totalTtc = subtotal + tva;

        if (!user || !selectedQuote || devisLines.length === 0 || totalTtc <= 0) {
            alert("⚠️ Veuillez saisir au moins un article avec un prix valide.");
            return;
        }
        setSendingQuickMsg(selectedQuote.id);
        
        try {
            const devisData = {
                type: 'DEVIS_PRO',
                id: `DEV-${Date.now().toString().slice(-6)}`,
                demande_id: selectedQuote.id,
                technicien: {
                    nom: user.fullname,
                    rubrique: user.specialty,
                    note: 4.8
                },
                lignes: devisLines,
                sous_total: subtotal,
                tva: 19,
                tva_montant: tva,
                total_ttc: totalTtc,
                note_technicien: devisNote,
                statut: 'en_attente',
                date_envoi: new Date().toISOString()
            };

            // 1. DÉBOGAGE : RÉSOLUTION DE L'ID CLIENT (UUID) SANS ÉCHEC
            let clientId = selectedQuote.client_id;
            const clientPhone = selectedQuote.client_phone || selectedQuote.client?.phone;
            
            // On cherche le VRAI profil pour être certain d'avoir l'UUID texte
            const { data: profile } = await supabase.from('users').select('id').eq('phone', clientPhone).maybeSingle();
            if (profile) clientId = profile.id;

            // 2. RECHERCHE DE CONVERSATION (TOLÉRANCE MAXIMALE AUX FORMATS)
            // On cherche si une conversation existe entre ces deux UUIDs
            const { data: existing } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${clientId}),and(participant1_id.eq.${clientId},participant2_id.eq.${user.id}),and(participant1_id.eq."${user.id}",participant2_id.eq."${clientId}"),and(participant1_id.eq."${clientId}",participant2_id.eq."${user.id}")`)
                .maybeSingle();
            
            let convId = existing?.id;

            // 3. CRÉATION DU TUNNEL (SI INEXISTANT)
            if (!convId) {
                const { data: newConv, error: convErr } = await supabase
                    .from('conversations')
                    .insert([{ 
                        participant1_id: String(user.id), 
                        participant2_id: String(clientId),
                        last_message: "Invitation au devis"
                    }])
                    .select()
                    .single();
                
                if (convErr) throw convErr;
                convId = newConv.id;
            }

            // 4. ENVOI DU MESSAGE (JSON_DEVIS)
            // 1. DÉPOSE DE L'OFFRE AU GUICHET (V42 - TABLE RASE)
            // On ne crée PAS de conversation ici, on dépose juste le prix
            try {
                const { error: devisErr } = await supabase
                    .from('devis')
                    .insert([{
                        demande_id: selectedQuote.id, // ID numérique simple (ex: 45)
                        technicien_id: String(user.id),
                        montant: totalTtc,
                        statut: 'en_attente',
                        note: devisNote
                    }]);
                
                if (devisErr) throw devisErr;

                // On informe la demande qu'une offre est arrivée
                await supabase.from('quotes').update({ last_offer_price: totalTtc }).eq('id', selectedQuote.id);

                alert("✅ Offre déposée avec succès ! Le client peut la voir sur son accueil.");
                setShowResponseModal(false);
                // On retire de la liste pour ne pas répondre deux fois
                setQuotes(quotes.filter(q => q.id !== selectedQuote.id));
            } catch (err) {
                console.error("Erreur Depôt:", err);
                alert("Erreur lors de l'envoi de l'offre : " + err.message);
            }
        } catch (e) {
            console.error(e);
            alert("Erreur lors de l'envoi du devis.");
        }
        setSendingQuickMsg(null);
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

        // Validation Email (Gmail/Outlook/Yahoo/Hotmail/iCloud)
        const emailRegex = /^[a-zA-Z0-9._-]+@(gmail\.com|outlook\.com|yahoo\.com|yahoo\.fr|hotmail\.com|hotmail\.fr|icloud\.com)$/i;
        if (formData.email && !emailRegex.test(formData.email)) {
            alert("Donner une email valide (Gmail, Outlook, Yahoo, Hotmail, iCloud)");
            setIsSaving(false);
            return;
        }

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

            const { error: updateError } = await supabase
                .from('users')
                .update(payload)
                .eq('id', user.id);

            if (!updateError) {
                alert("Profil mis à jour avec succès !");
                setEditMode(false);

                // Update local storage
                const updatedUser = { ...user, fullName: formData.fullName, email: formData.email };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Clear passwords
                setFormData(prev => ({ ...prev, currentPassword: '', password: '', confirmPassword: '' }));

                fetchData();
            } else {
                alert("Erreur lors de la sauvegarde: " + updateError.message);
            }
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
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Mon profil</h1>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>Gérez votre profil et suivez vos performances.</p>
                </div>
                {!editMode && (
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <Link to="/technicians" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold', borderRadius: '12px' }}>
                            <Users size={18} /> Trouver un collègue
                        </Link>
                        <button 
                            className="btn btn-outline" 
                            style={{ position: 'relative', width: '45px', height: '45px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}
                            onClick={() => {
                                if (quotes.length > 0) openResponseForm(quotes[0]);
                                else alert("Aucune notification pour le moment.");
                            }}
                        >
                            <Bell size={20} color={quotes.length > 0 ? '#ef4444' : '#64748b'} />
                            {quotes.length > 0 && (
                                <span style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '50%', fontWeight: '900' }}>
                                    {quotes.length}
                                </span>
                            )}
                        </button>
                        <button className="btn btn-primary" onClick={() => setEditMode(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', borderRadius: '12px' }}>
                            <Settings size={18} /> Paramètres
                        </button>
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

                    {/* ESPACE DEVIS - VERSION ÉPURÉE SANS LISTE AUTOMATIQUE */}
                    <div className="card" style={{ padding: '2rem', textAlign: 'center', border: '1px dashed #e2e8f0', backgroundColor: '#f8fafc', marginBottom: '1.5rem' }}>
                        <div style={{ backgroundColor: '#f1f5f9', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#94a3b8' }}>
                            <MessageSquare size={30} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>Espace Devis Expert</h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '280px', margin: '0 auto' }}>
                           Désormais, les demandes ne s'affichent plus automatiquement. Vous recevrez une notification directe lorsqu'un client souhaitera travailler avec vous.
                        </p>
                    </div>

                    {/* MODAL DE RÉPONSE PERSONNALISÉE */}
                    {showResponseModal && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', marginTop: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>Répondre au devis</h3>
                                    <button onClick={() => setShowResponseModal(false)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                </div>
                                
                                {/* DÉTAILS DE LA DEMANDE ENRICHIE (V49) */}
                                {selectedQuote && (
                                    <div style={{ backgroundColor: '#fff7ed', padding: '15px', borderRadius: '18px', marginBottom: '1.5rem', border: '1px solid #ffedd5', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <div style={{ backgroundColor: '#fb923c', color: 'white', padding: '4px', borderRadius: '8px' }}><Info size={16} /></div>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#9a3412' }}>{selectedQuote.title || 'Besoin urgent'}</h4>
                                        </div>
                                        
                                        <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#c2410c', lineHeight: '1.4' }}>
                                            {selectedQuote.description || selectedQuote.message}
                                        </p>

                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                            <span style={{ backgroundColor: 'white', padding: '4px 10px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '800', border: '1px solid #ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Clock size={12} /> CONTRAT: {selectedQuote.billing_type?.toUpperCase() || 'JOURNALIER'}
                                            </span>
                                            <span style={{ backgroundColor: 'white', padding: '4px 10px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '800', border: '1px solid #ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Calendar size={12} /> {selectedQuote.planned_date ? new Date(selectedQuote.planned_date).toLocaleDateString() : 'Aujourd\'hui'}
                                            </span>
                                        </div>

                                        {selectedQuote.photo_url && (
                                            <div style={{ marginTop: '10px' }}>
                                                <img 
                                                    src={selectedQuote.photo_url} 
                                                    alt="Demande"
                                                    onClick={() => window.open(selectedQuote.photo_url, '_blank')}
                                                    style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '15px', border: '2px solid white', cursor: 'zoom-in' }} 
                                                />
                                                <p style={{ fontSize: '0.6rem', color: '#9a3412', textAlign: 'center', marginTop: '4px' }}>Cliquer pour agrandir la photo</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', marginBottom: '10px', color: '#1e293b' }}>Votre Proposition Financière :</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr auto', gap: '8px', marginBottom: '8px', fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>
                                        <span>Désignation</span>
                                        <span>Qté</span>
                                        <span>Prix Unit.</span>
                                        <span></span>
                                    </div>
                                    {devisLines.map((line, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr auto', gap: '8px', marginBottom: '8px' }}>
                                            <input 
                                                value={line.desc} 
                                                onChange={(e) => updateDevisLine(idx, 'desc', e.target.value)}
                                                placeholder="Travail..."
                                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.8rem' }}
                                            />
                                            <input 
                                                type="number" 
                                                value={line.qty} 
                                                onChange={(e) => updateDevisLine(idx, 'qty', e.target.value)}
                                                placeholder="Qté"
                                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.8rem', width: '100%' }}
                                            />
                                            <input 
                                                type="number" 
                                                value={line.price} 
                                                onChange={(e) => updateDevisLine(idx, 'price', e.target.value)}
                                                placeholder="Prix"
                                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.8rem', width: '100%', fontWeight: 'bold' }}
                                            />
                                            <button onClick={() => removeDevisLine(idx)} style={{ background: 'none', border: 'none', color: '#ef4444' }}>✕</button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={addDevisLine}
                                        style={{ width: '100%', padding: '8px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', marginBottom: '10px' }}
                                    >
                                        + Ajouter une ligne de prix
                                    </button>
                                </div>

                                <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #bbf7d0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#166534', marginBottom: '4px' }}>
                                        <span>Sous-total HT :</span>
                                        <span>{devisLines.reduce((acc, l) => acc + (Number(l.qty || 0) * Number(l.price || 0)), 0).toLocaleString()} F</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#166534', marginBottom: '4px' }}>
                                        <span>TVA (19%) :</span>
                                        <span>{Math.round(devisLines.reduce((acc, l) => acc + (Number(l.qty || 0) * Number(l.price || 0)), 0) * 0.19).toLocaleString()} F</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '900', borderTop: '2px dashed #bbf7d0', paddingTop: '8px', marginTop: '8px' }}>
                                        <span>TOTAL TTC :</span>
                                        <span style={{ color: '#10b981' }}>{(devisLines.reduce((acc, l) => acc + (Number(l.qty || 0) * Number(l.price || 0)), 0) + Math.round(devisLines.reduce((acc, l) => acc + (Number(l.qty || 0) * Number(l.price || 0)), 0) * 0.19)).toLocaleString()} F</span>
                                    </div>
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
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', minHeight: '120px', resize: 'vertical' }}
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
        </div >
    );
};

export default ExpertDashboard;
