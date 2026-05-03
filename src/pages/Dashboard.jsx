import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { Users, Wrench, ShoppingBag, BarChart2, Edit, X, Lock, Unlock, MessageCircle, Clock, Trash2, PlusCircle, ArrowRight, LogOut, UserX, Settings, Eye, Heart } from 'lucide-react';

const StatCard = ({ title, value, color, icon }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem' }}>
        <div style={{
            backgroundColor: `${color}20`, color: color, padding: '0.5rem', borderRadius: '50%', display: 'flex'
        }}>
            {React.cloneElement(icon, { size: 18 })}
        </div>
        <div>
            <p style={{ margin: 0, color: '#666', fontSize: '0.75rem' }}>{title}</p>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{value}</h3>
        </div>
    </div>
);

const Dashboard = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const isAdmin = user?.email === 'Diassecke@gmail.com';
    const [activeTab, setActiveTab] = useState(isAdmin ? 'admin' : 'sales'); 
    const [technicians, setTechnicians] = useState([]);
    const [clients, setClients] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [myProducts, setMyProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [adminSubTab, setAdminSubTab] = useState('techs'); // 'techs', 'clients', 'feedback'
    const [isEditing, setIsEditing] = useState(false);
    const [techStats, setTechStats] = useState({ rating: 0, reviews_count: 0 });
    const [currentTech, setCurrentTech] = useState(null);
    const [fullTechData, setFullTechData] = useState(null);

    const fetchUserData = async () => {
        try {
            // SYNC ID (Support UUID transition)
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser && authUser.id !== user.id) {
                const correctedUser = { ...user, id: authUser.id };
                localStorage.setItem('user', JSON.stringify(correctedUser));
                setUser(correctedUser);
                await supabase.rpc('fix_my_id', { new_id: authUser.id, user_phone: user.phone });
            }

            const currentId = authUser?.id || user.id;

            // Get user data
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', currentId)
                .single();

            if (userError) throw userError;

            // Stats pour techniciens (optionnel si client)
            let rating = 0;
            let count = 0;
            
            try {
                const { data: reviews } = await supabase
                    .from('reviews')
                    .select('rating')
                    .eq('technicianId', user.id);

                if (reviews && reviews.length > 0) {
                    count = reviews.length;
                    const total = reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
                    rating = (total / count).toFixed(1);
                }
            } catch (revErr) { 
                console.log("No reviews yet or not a technician.");
            }

            if (userData) {
                const mappedUser = {
                    ...userData,
                    fullName: userData.fullname || userData.fullName,
                    specialty: userData.specialty,
                    city: userData.city,
                    isBlocked: userData.isblocked !== undefined ? userData.isblocked : userData.isBlocked,
                    commentsEnabled: userData.commentsenabled !== undefined ? userData.commentsenabled : userData.commentsEnabled
                };
                setFullTechData({ ...mappedUser, rating: rating, reviews_count: count });
                setTechStats({
                    rating: rating,
                    reviews_count: count
                });
                // Mettre à jour l'utilisateur local pour les compteurs
                setUser(mappedUser);
                localStorage.setItem('user', JSON.stringify(mappedUser));
            }
        } catch (error) {
            console.error("Error fetching user data:", error.message);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'technician');

            if (error) throw error;
            if (data) {
                const mappedTechs = data.map(t => ({
                    ...t,
                    fullName: t.fullname || t.fullName,
                    isBlocked: t.isblocked !== undefined ? t.isblocked : t.isBlocked,
                    commentsEnabled: t.commentsenabled !== undefined ? t.commentsenabled : t.commentsEnabled,
                    // Ensure other fields are present if needed
                }));
                setTechnicians(mappedTechs);
            }
        } catch (error) {
            console.error("Error fetching technicians:", error.message);
        }
    };

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'client');

            if (error) throw error;
            if (data) {
                const mappedClients = data.map(c => ({
                    ...c,
                    fullName: c.fullname || c.fullName,
                    isBlocked: c.isblocked !== undefined ? c.isblocked : c.isBlocked
                }));
                setClients(mappedClients);
            }
        } catch (error) {
            console.error("Error fetching clients:", error.message);
        }
    };

    const fetchFeedback = async () => {
        try {
            const { data, error } = await supabase
                .from('platform_feedback')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setFeedback(data);
        } catch (error) {
            console.error("Error fetching feedback:", error.message);
        }
    };

    const fetchMyProducts = async () => {
        if (!user?.id) return;
        setLoadingProducts(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('technicianid', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setMyProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error.message);
        }
        setLoadingProducts(false);
    };

    const handleLogout = async () => {
        if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
            try {
                // On tente de déconnecter proprement via Supabase
                await supabase.auth.signOut();
            } catch (error) {
                console.error("Erreur signOut:", error);
            } finally {
                // Quoi qu'il arrive, on nettoie le local et on redirige
                localStorage.clear();
                window.location.href = '/login';
            }
        }
    };

    const handleDeleteAccount = async () => {
        const confirm = window.confirm(
            "⚠️ ATTENTION : Cette action est IRREVERSIBLE.\n\n" +
            "Toutes vos annonces, messages et informations de profil seront supprimés définitivement.\n\n" +
            "Voulez-vous vraiment supprimer votre compte ?"
        );
        
        if (confirm) {
            try {
                // Delete user from our database table
                const { error: dbError } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', user.id);
                
                if (dbError) throw dbError;

                // Sign out
                await supabase.auth.signOut();
                localStorage.clear();
                alert("Votre compte a été supprimé avec succès.");
                window.location.href = '/register';
            } catch (error) {
                console.error("Erreur suppression compte:", error);
                alert("Erreur lors de la suppression : " + error.message);
            }
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm("Supprimer cet article définitivement ?")) return;
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);
            if (error) throw error;
            setMyProducts(prev => prev.filter(p => p.id !== productId));
        } catch (error) {
            alert("Erreur: " + error.message);
        }
    };

    const handleDeleteFeedback = async (id) => {
        try {
            const { error } = await supabase
                .from('platform_feedback')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setFeedback(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Error deleting feedback:", error.message);
            alert("Erreur lors de la suppression : " + error.message);
        }
    };

    useEffect(() => {
        if (activeTab === 'admin') {
            fetchTechnicians();
            fetchClients();
            fetchFeedback();
        } else if (activeTab === 'tech' && user?.id) {
            fetchUserData();
        } else if (activeTab === 'sales' && user?.id) {
            fetchUserData(); 
            fetchMyProducts();
        }
    }, [activeTab, user?.id]);

    const handleToggleBlock = async (tech) => {
        const confirmMessage = tech.isBlocked
            ? `Voulez-vous vraiment débloquer ${tech.fullName} ?`
            : `Voulez-vous vraiment bloquer ${tech.fullName} ?`;

        if (!window.confirm(confirmMessage)) return;

        try {
            const { error } = await supabase
                .from('users')
                .update({ isblocked: tech.isBlocked ? 0 : 1 }) // Use lowercase 'isblocked' for update
                .eq('id', tech.id);

            if (error) throw error;

            alert(`Utilisateur ${tech.isBlocked ? 'débloqué' : 'bloqué'} avec succès`);
            fetchTechnicians();
            fetchClients();

        } catch (error) {
            console.error(error);
            alert('⚠️ Échec de la mise à jour : ' + error.message);
        }
    };

    const handleKycValidation = async (techId, action) => {
        if (!window.confirm(action === 'verify' ? "Voulez-vous valider le Contrat de Confiance pour ce technicien ?" : "Voulez-vous rejeter la demande de ce technicien ?")) return;

        try {
            const { data, error } = await supabase
                .from('users')
                .update({ 
                    verification_status: action === 'verify' ? 'verified' : 'rejected',
                    contrat_confiance: action === 'verify' ? true : false
                })
                .eq('id', techId)
                .select();

            if (error) throw error;
            
            if (!data || data.length === 0) {
                alert("❌ ERREUR SÉCURITÉ : Vous n'avez pas les droits (RLS Supabase) pour modifier ce technicien. La mise à jour a été bloquée par la base de données.");
                return;
            }

            // Notification pour le technicien
            await supabase.from('notifications').insert([{
                user_id: techId,
                title: action === 'verify' ? '🏆 Contrat de Confiance Validé' : '❌ Contrat de Confiance Rejeté',
                content: action === 'verify' 
                    ? 'Félicitations ! Votre profil bénéficie désormais du badge officiel.'
                    : 'Votre demande n\'a pas pu être validée. Veuillez vérifier vos documents.',
                type: 'system',
                link: '/expert-dashboard'
            }]);

            alert(action === 'verify' ? '✅ Contrat de Confiance validé !' : 'Demande rejetée.');
            fetchTechnicians();
        } catch (error) {
            console.error("Erreur KYC:", error);
            alert("Erreur: " + error.message);
        }
    };

    const handleToggleVerify = async (user) => {
        const action = user.email_verified ? "invalider" : "valider manuellement";
        if (!window.confirm(`Voulez-vous vraiment ${action} l'email de ${user.fullName} ?`)) return;

        try {
            const { error } = await supabase
                .from('users')
                .update({ email_verified: !user.email_verified })
                .eq('id', user.id);

            if (error) throw error;
            alert(`Email ${user.email_verified ? 'invalidé' : 'validé'} avec succès !`);
            fetchTechnicians();
            fetchClients();
        } catch (error) {
            console.error(error);
            alert('Erreur: ' + error.message);
        }
    };

    const handleGenerateRecoveryCode = async (user) => {
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        
        if (!window.confirm(`Générer un code de récupération pour ${user.fullName} ?\nLe code sera : ${newCode}`)) return;

        try {
            const { error } = await supabase
                .from('users')
                .update({ recovery_code: newCode })
                .eq('id', user.id);

            if (error) throw error;
            alert(`Code généré avec succès ! Donnez-le à ${user.fullName} sur WhatsApp : ${newCode}`);
            fetchTechnicians();
            fetchClients();
        } catch (error) {
            console.error(error);
            alert('Erreur: ' + error.message);
        }
    };

    const handlePasswordChange = async (userId, userName, isClient = true) => {
        const promptMsg = isClient
            ? `Entrez le nouveau mot de passe pour le client ${userName} (Min 8 car, 1 Maj, 1 Chiffre) :`
            : `Entrez le nouveau mot de passe pour le technicien ${userName} (Min 8 car, 1 Maj, 1 Chiffre) :`;

        const newPassword = window.prompt(promptMsg);

        if (newPassword && newPassword.trim() !== "") {
            // Politique de sécurité du mot de passe
            const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                alert("Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.");
                return;
            }

            try {
                // In a real app we would hash this. For now storing as is or consistent with current logic.
                const { error } = await supabase
                    .from('users')
                    .update({ password: newPassword.trim() })
                    .eq('id', userId);

                if (error) throw error;

                alert('Mot de passe mis à jour avec succès');

            } catch (error) {
                console.error(error);
                alert('⚠️ Échec de la mise à jour : ' + error.message);
            }
        }
    };

    const standardSpecialties = ["Informatique", "Reparateur telephone", "Reparateur imprimante", "Réseaux", "Maintenancier", "Mécanicien", "Maçon", "Plombier", "Menuisier", "Sérigraphie"];

    const handleEdit = (tech) => {
        const isStandard = standardSpecialties.includes(tech.specialty);
        setCurrentTech({
            ...tech,
            fullName: tech.fullName || tech.fullname, // Sync names
            specialtyType: isStandard ? tech.specialty : 'Autre',
            otherSpecialty: isStandard ? '' : tech.specialty || '',
            commentsEnabled: !!tech.commentsEnabled,
            district: tech.district || ''
        });
        setIsEditing(true);
    };

    const handleCloseModal = () => {
        setIsEditing(false);
        setCurrentTech(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const saveBtn = e.target.querySelector('button[type="submit"]');
        if (saveBtn) saveBtn.disabled = true;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const currentId = session?.user?.id || user.id || currentTech.id;
            
            console.log("🛠️ Sauvegarde ID:", currentId);

            const payload = {
                fullname: currentTech.fullName || user.fullName, 
                email: currentTech.email || user.email,
                description: currentTech.description || '',
                image: currentTech.image || '',
                city: currentTech.city || '',
                district: currentTech.district || '',
                phone: currentTech.phone || '',
                commentsenabled: currentTech.commentsEnabled ? 1 : 0, 
                specialty: currentTech.specialtyType === 'Autre' ? currentTech.otherSpecialty : currentTech.specialtyType
            };

            const { data, error } = await supabase
                .from('users')
                .update(payload)
                .eq('id', currentId)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                alert("⚠️ Attention : La modification n'a pas pu être enregistrée en base. Vérifiez vos permissions.");
            } else {
                alert('Informations mises à jour avec succès');
            }

            setIsEditing(false);

            const updatedUser = { 
                ...user, 
                ...payload,
                fullName: payload.fullname 
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser); 
            fetchUserData();
            
            if (activeTab === 'admin') fetchTechnicians();

            setTimeout(() => {
               window.location.reload(); 
            }, 1000);

        } catch (error) {
            console.error(error);
            alert('⚠️ Échec de la mise à jour : ' + error.message);
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    };

    const handleInputChange = (e) => {
        setCurrentTech({ ...currentTech, [e.target.name]: e.target.value });
    };

    return (
        <div className="container" style={{ padding: '1rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Tableau de bord</h2>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                        className={`btn ${activeTab === 'sales' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setActiveTab('sales')}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    >Mes Ventes</button>
                    {user?.role === 'technician' && (
                        <button
                            className={`btn ${activeTab === 'tech' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setActiveTab('tech')}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        >Expert</button>
                    )}
                    {isAdmin && (
                        <button
                            className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setActiveTab('admin')}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        >Admin</button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {activeTab === 'admin' ? (
                    <>
                        <StatCard title="Total Clients" value={clients.length} color="#3498DB" icon={<Users />} />
                        <StatCard title="Techniciens" value={technicians.length} color="#007bff" icon={<Wrench />} />
                        <StatCard title="Total Annonces" value="23" color="#9B59B6" icon={<ShoppingBag />} />
                        <StatCard title="Signalements" value={feedback.length} color="#e53e3e" icon={<MessageCircle />} />
                    </>
                ) : (
                    <>
                        <StatCard title="Articles" value={myProducts.length} color="#9B59B6" icon={<ShoppingBag />} />
                        <StatCard title="Vues" value={myProducts.reduce((acc, p) => acc + (Number(p.views) || 0), 0) + (Number(fullTechData?.profile_views) || Number(user?.profile_views) || 0)} color="#3498DB" icon={<Eye />} />
                        <StatCard title="Likes" value={myProducts.reduce((acc, p) => acc + (Number(p.likes) || 0), 0)} color="#e91e63" icon={<Heart />} />
                        <StatCard title="Vendus" value={myProducts.filter(p => p.status === 'sold').length} color="#007bff" icon={<BarChart2 />} />
                    </>
                )}
            </div>

            {activeTab === 'tech' && fullTechData && (
                <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <img
                            src={fullTechData.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullTechData.fullName)}&background=007bff&color=fff&size=100`}
                            alt={fullTechData.fullName}
                            style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>{fullTechData.fullName}</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{fullTechData.specialty} • {fullTechData.city}</p>
                        </div>
                        <button
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={() => handleEdit(fullTechData)}
                        >
                            Modifier mon profil
                        </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#444', fontStyle: fullTechData.description ? 'normal' : 'italic' }}>
                        {fullTechData.description || "Aucune description renseignée."}
                    </p>
                </div>
            )}

            {activeTab === 'sales' && (
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '800' }}>Mes Articles en Vente</h3>
                        <Link to="/marketplace" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
                            <PlusCircle size={16} /> Ajouter un article
                        </Link>
                    </div>

                    {loadingProducts ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Chargement de vos articles...</p>
                    ) : myProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed #eee', borderRadius: '15px' }}>
                            <ShoppingBag size={40} color="#ccc" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: '#666', marginBottom: '1rem' }}>Vous n'avez aucun article en vente pour le moment.</p>
                            <Link to="/marketplace" style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none' }}>Publier ma première annonce →</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {myProducts.map(product => (
                                <div key={product.id} className="card-premium-list" style={{ 
                                    padding: '1rem', 
                                    position: 'relative', 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    gap: '1rem', 
                                    backgroundColor: 'white',
                                    borderRadius: '24px',
                                    marginBottom: '0.8rem',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                    border: '1px solid #f8fafc'
                                }}>
                                    <div style={{ 
                                        width: '64px', 
                                        height: '64px', 
                                        flexShrink: 0, 
                                        position: 'relative',
                                        backgroundColor: '#f1f5f9', 
                                        borderRadius: '50%', // Circle like the stats cards
                                        overflow: 'hidden',
                                        border: '2px solid white',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                    }}>
                                        {product.image ? (
                                            <img 
                                                src={product.image} 
                                                alt={product.title} 
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none'; // Hide if failed
                                                    e.target.parentElement.classList.add('broken-img-container');
                                                }}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                            />
                                        ) : null}
                                        {/* Beautiful Icon Fallback */}
                                        <div className="img-fallback" style={{ 
                                            position: 'absolute', inset: 0, 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                            backgroundColor: '#e0f2fe', color: '#0ea5e9' 
                                        }}>
                                            <ShoppingBag size={24} />
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ margin: '0 0 2px 0', fontSize: '1rem', fontWeight: '850', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.title}</h4>
                                        <div style={{ color: '#007bff', fontWeight: '900', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                                            {Number(product.price).toLocaleString()} F
                                        </div>
                                                                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
                                            <button 
                                                onClick={() => handleDeleteProduct(product.id)}
                                                style={{ border: 'none', background: '#fff1f2', color: '#e11d48', padding: '6px 10px', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                                            >
                                                <Trash2 size={14} /> Supprimer
                                            </button>
                                            <Link 
                                                to={`/marketplace?edit=${product.id}`}
                                                style={{ textDecoration: 'none', background: '#ecfdf5', color: '#007bff', padding: '6px 10px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                                            >
                                                <Edit size={14} /> Modifier
                                            </Link>
                                            <Link 
                                                to={`/marketplace?id=${product.id}`}
                                                style={{ textDecoration: 'none', background: '#f1f5f9', color: '#475569', padding: '6px 10px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                                            >
                                                <ArrowRight size={14} /> Voir
                                            </Link>
                                        </div>
                                    </div>
                                    {product.status === 'sold' && (
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 'bold' }}>
                                            VENDU
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Section Paramètres Compte - V147 */}
                    <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#64748b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Settings size={16} /> Paramètres
                        </h4>
                        
                        <button
                            onClick={() => handleEdit(fullTechData || user)}
                            style={{
                                width: '100%', padding: '0.9rem', borderRadius: '12px', border: 'none',
                                background: '#007bff', color: 'white', fontSize: '0.9rem', fontWeight: '700',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                marginBottom: '1rem', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0, 123, 255, 0.2)'
                            }}
                        >
                            <Settings size={18} /> Modifier mon profil
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button
                                onClick={handleLogout}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0',
                                    background: 'white', color: '#1e293b', fontSize: '0.85rem', fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                <LogOut size={16} /> Déconnexion
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    padding: '0.75rem', borderRadius: '12px', border: 'none',
                                    background: '#fff1f2', color: '#e11d48', fontSize: '0.85rem', fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                <UserX size={16} /> Supprimer mon compte
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'admin' && (
                <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Gestion des Comptes</h3>
                        <div style={{ display: 'flex', backgroundColor: '#f0f0f0', padding: '4px', borderRadius: '8px' }}>
                            <button
                                onClick={() => setAdminSubTab('techs')}
                                style={{
                                    padding: '6px 16px', fontSize: '0.85rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
                                    backgroundColor: adminSubTab === 'techs' ? 'white' : 'transparent',
                                    fontWeight: adminSubTab === 'techs' ? 'bold' : 'normal',
                                    color: adminSubTab === 'techs' ? 'var(--primary-color)' : '#666',
                                    transition: 'all 0.2s',
                                    boxShadow: adminSubTab === 'techs' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >Techniciens ({technicians.length})</button>
                            <button
                                onClick={() => setAdminSubTab('feedback')}
                                style={{
                                    padding: '6px 16px', fontSize: '0.85rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
                                    backgroundColor: adminSubTab === 'feedback' ? 'white' : 'transparent',
                                    fontWeight: adminSubTab === 'feedback' ? 'bold' : 'normal',
                                    color: adminSubTab === 'feedback' ? 'var(--primary-color)' : '#666',
                                    transition: 'all 0.2s',
                                    boxShadow: adminSubTab === 'feedback' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >Revendications ({feedback.length})</button>
                            <button
                                onClick={() => setAdminSubTab('kyc')}
                                style={{
                                    padding: '6px 16px', fontSize: '0.85rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
                                    backgroundColor: adminSubTab === 'kyc' ? 'white' : 'transparent',
                                    fontWeight: adminSubTab === 'kyc' ? 'bold' : 'normal',
                                    color: adminSubTab === 'kyc' ? 'var(--primary-color)' : '#666',
                                    transition: 'all 0.2s',
                                    boxShadow: adminSubTab === 'kyc' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                Contrats KYC ({technicians.filter(t => t.verification_status === 'pending').length})
                            </button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        {adminSubTab === 'techs' ? (
                            <div>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#666' }}>Liste des Techniciens</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f9fafb', color: '#4b5563', borderBottom: '2px solid #edf2f7' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nom</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Spécialité</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Ville</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {technicians.map((tech) => (
                                            <tr key={tech.id} style={{
                                                borderBottom: '1px solid #edf2f7',
                                                backgroundColor: tech.isBlocked ? '#fff5f5' : 'transparent'
                                            }}>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontWeight: '600' }}>{tech.fullName}</span>
                                                        {tech.contrat_confiance && (
                                                            <span title="Contrat de Confiance Validé" style={{ fontSize: '0.9rem' }}>🛡️</span>
                                                        )}
                                                        {tech.isBlocked === 1 && <span style={{ fontSize: '0.65rem', backgroundColor: '#feb2b2', color: '#9b2c2c', padding: '1px 6px', borderRadius: '4px' }}>Bloqué</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ebf8ff', color: '#2b6cb0', fontSize: '0.75rem' }}>
                                                        {tech.specialty}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>{tech.city}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button 
                                                            className="btn btn-outline" 
                                                            style={{ padding: '0.3rem', borderRadius: '4px', color: '#805ad5' }} 
                                                            onClick={() => handleGenerateRecoveryCode(tech)} 
                                                            title="Générer Code Secret de Récupération"
                                                        >
                                                            <Lock size={14} fill={tech.recovery_code ? '#805ad530' : 'none'} />
                                                        </button>
                                                        <button className="btn btn-outline" style={{ padding: '0.3rem', borderRadius: '4px' }} onClick={() => handleEdit(tech)} title="Modifier profil"><Edit size={14} /></button>
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.3rem', borderRadius: '4px' }}
                                                            onClick={() => handlePasswordChange(tech.id, tech.fullName, false)}
                                                            title="Modifier le mot de passe"
                                                        >
                                                            <Lock size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.3rem', borderRadius: '4px', color: tech.isBlocked ? '#38a169' : '#d69e2e' }}
                                                            onClick={() => handleToggleBlock(tech)}
                                                            title={tech.isBlocked ? "Débloquer" : "Bloquer"}
                                                        >
                                                            {tech.isBlocked ? <Unlock size={14} /> : <X size={14} />}
                                                        </button>
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.3rem', borderRadius: '4px', color: tech.email_verified ? '#38a169' : '#e53e3e' }}
                                                            onClick={() => handleToggleVerify(tech)}
                                                            title={tech.email_verified ? "Invalider Email" : "Valider Email (Force)"}
                                                        >
                                                            {tech.email_verified ? '✅' : '⚠️'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : adminSubTab === 'clients' ? (
                            <div>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#666' }}>Liste des Clients Inscrits</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f9fafb', color: '#4b5563', borderBottom: '2px solid #edf2f7' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Client</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Contact</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Localisation</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clients.length === 0 ? (
                                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Aucun client trouvé.</td></tr>
                                        ) : (
                                            clients.map((client) => (
                                                <tr key={client.id} style={{
                                                    borderBottom: '1px solid #edf2f7',
                                                    backgroundColor: client.isBlocked ? '#fff5f5' : 'transparent'
                                                }}>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ fontWeight: '500' }}>{client.fullName}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#888' }}>ID: #{client.id}</div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ fontSize: '0.8rem' }}>{client.email}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{client.phone}</div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>{client.city} {client.district ? `(${client.district})` : ''}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                            <button
                                                                 className="btn btn-outline"
                                                                 style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem' }}
                                                                 onClick={() => handlePasswordChange(client.id, client.fullName, true)}
                                                             >
                                                                 Mot de passe
                                                             </button>
                                                             <button
                                                                 className="btn btn-outline"
                                                                 style={{ padding: '0.3rem', borderRadius: '4px', color: '#805ad5' }}
                                                                 onClick={() => handleGenerateRecoveryCode(client)}
                                                                 title="Générer Code de Récupération"
                                                             >
                                                                 <Lock size={14} fill={client.recovery_code ? '#805ad530' : 'none'} />
                                                             </button>
                                                            <button
                                                                className="btn btn-outline"
                                                                style={{ padding: '0.3rem', borderRadius: '4px', color: client.isBlocked ? '#38a169' : '#e53e3e' }}
                                                                onClick={() => handleToggleBlock(client)}
                                                                title={client.isBlocked ? 'Débloquer' : 'Bloquer'}
                                                            >
                                                                {client.isBlocked ? 'Déloquer' : 'Bloquer'}
                                                            </button>
                                                            <button
                                                                className="btn btn-outline"
                                                                style={{ padding: '0.3rem', borderRadius: '4px', color: client.email_verified ? '#38a169' : '#e53e3e' }}
                                                                onClick={() => handleToggleVerify(client)}
                                                                title={client.email_verified ? "Invalider Email" : "Valider Email (Force)"}
                                                            >
                                                                {client.email_verified ? '✅' : '⚠️'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : adminSubTab === 'kyc' ? (
                            <div>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#666' }}>Demandes de Contrat de Confiance (KYC)</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                    {technicians.filter(t => t.verification_status === 'pending').length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: '#999', gridColumn: '1 / -1' }}>Aucune demande en attente.</div>
                                    ) : (
                                        technicians.filter(t => t.verification_status === 'pending').map((tech) => (
                                            <div key={tech.id} className="card" style={{ padding: '1rem', borderTop: '4px solid #0ea5e9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <img src={tech.image || `https://ui-avatars.com/api/?name=${tech.fullName}`} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                                                    <div>
                                                        <h4 style={{ margin: 0 }}>{tech.fullName}</h4>
                                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>ID: {tech.id} • {tech.specialty}</p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                    <a href={tech.id_card_recto} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '0.5rem', background: '#f1f5f9', textAlign: 'center', borderRadius: '8px', textDecoration: 'none', color: '#0ea5e9', fontSize: '0.8rem', fontWeight: 'bold' }}>Voir Recto</a>
                                                    <a href={tech.id_card_verso} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '0.5rem', background: '#f1f5f9', textAlign: 'center', borderRadius: '8px', textDecoration: 'none', color: '#0ea5e9', fontSize: '0.8rem', fontWeight: 'bold' }}>Voir Verso</a>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                    <button onClick={() => handleKycValidation(tech.id, 'verify')} style={{ flex: 1, padding: '0.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Valider KYC</button>
                                                    <button onClick={() => handleKycValidation(tech.id, 'reject')} style={{ flex: 1, padding: '0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Rejeter</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#666' }}>Signalisations et Messages</h4>
                                {feedback.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Aucun signalement reçu.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {feedback.map(item => {
                                            // Simple parsing for "[Signalement ...]" format
                                            const match = item.content && item.content.match(/^\[Signalement Profil (.+?) \(ID: (.+?)\)\] (.*)$/s);
                                            const isReport = !!match;
                                            const reportedName = match ? match[1] : null;
                                            const reportedId = match ? match[2] : null;
                                            const messageContent = match ? match[3] : item.content;

                                            return (
                                                <div key={item.id} className="card" style={{ padding: '1rem', borderLeft: '4px solid #dc2626', position: 'relative' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm('Supprimer ce signalement ?')) {
                                                                handleDeleteFeedback(item.id);
                                                            }
                                                        }}
                                                        style={{
                                                            position: 'absolute', top: '10px', right: '10px',
                                                            background: 'none', border: 'none', cursor: 'pointer', color: '#999'
                                                        }}
                                                        title="Supprimer"
                                                    >
                                                        <X size={16} />
                                                    </button>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingRight: '20px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <strong style={{ fontSize: '0.9rem' }}>
                                                                {item.userName || 'Anonyme'}
                                                            </strong>
                                                            <span style={{ fontSize: '0.7rem', color: '#666' }}>Auteur du signalement</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#999', fontSize: '0.7rem' }}>
                                                            <Clock size={12} />
                                                            {new Date(item.createdAt).toLocaleString()}
                                                        </div>
                                                    </div>

                                                    {isReport && (
                                                        <div style={{
                                                            backgroundColor: '#fff5f5', padding: '0.5rem', borderRadius: '4px',
                                                            marginBottom: '0.5rem', fontSize: '0.8rem', border: '1px solid #fed7d7'
                                                        }}>
                                                            <strong>⚠️ Profil Signalé : </strong> {reportedName}
                                                            <div style={{ fontSize: '0.7rem', color: '#666' }}>ID: {reportedId}</div>
                                                        </div>
                                                    )}

                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#333', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                                                        {messageContent}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isEditing && currentTech && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '350px', padding: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Modifier le profil</h3>
                            <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ fontSize: '0.85rem' }}>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Nom complet</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={currentTech.fullName}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                                />
                            </div>

                            {user?.role !== 'client' && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={currentTech.email}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                                    />
                                </div>
                            )}

                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Photo de profil (Upload)</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;

                                            try {
                                                const fileExt = file.name.split('.').pop();
                                                const fileName = `avatars/${currentTech.id}_${Date.now()}.${fileExt}`;

                                                const { error: uploadError } = await supabase.storage
                                                    .from('produits') // Use 'produits' (users bucket)
                                                    .upload(fileName, file);

                                                if (uploadError) throw uploadError;

                                                const { data } = supabase.storage.from('produits').getPublicUrl(fileName);

                                                if (data.publicUrl) {
                                                    setCurrentTech(prev => ({ ...prev, image: data.publicUrl }));
                                                }
                                            } catch (err) {
                                                console.error("Upload error:", err);
                                                alert("Erreur lors de l'upload de l'image : " + err.message);
                                            }
                                        }}
                                        style={{ fontSize: '0.8rem' }}
                                    />
                                    {currentTech.image && (
                                        <img src={currentTech.image} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Biographie</label>
                                <textarea
                                    name="description"
                                    value={currentTech.description || ''}
                                    onChange={handleInputChange}
                                    placeholder="Biographie du technicien..."
                                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem', minHeight: '100px' }}
                                />
                            </div>

                            {user?.role !== 'client' && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Spécialité</label>
                                    <select
                                        name="specialtyType"
                                        value={currentTech.specialtyType}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem', backgroundColor: 'white' }}
                                    >
                                        <option value="Informatique">Informatique</option>
                                        <option value="Reparateur telephone">Reparateur telephone</option>
                                        <option value="Reparateur imprimante">Reparateur imprimante</option>
                                        <option value="Réseaux">Réseaux</option>
                                        <option value="Maintenancier">Maintenancier</option>
                                        <option value="Mécanicien">Mécanicien</option>
                                        <option value="Maçon">Maçon</option>
                                        <option value="Plombier">Plombier</option>
                                        <option value="Menuisier">Menuisier</option>
                                        <option value="Sérigraphie">Sérigraphie</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>
                            )}

                            {user?.role !== 'client' && currentTech.specialtyType === 'Autre' && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Précisez le métier</label>
                                    <input
                                        type="text"
                                        name="otherSpecialty"
                                        value={currentTech.otherSpecialty}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Ville</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={currentTech.city}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Tél</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={currentTech.phone || ''}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                <input
                                    type="checkbox"
                                    id="commentsEnabledAdmin"
                                    checked={currentTech.commentsEnabled}
                                    onChange={(e) => setCurrentTech({ ...currentTech, commentsEnabled: e.target.checked })}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label htmlFor="commentsEnabledAdmin" style={{ fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>
                                    Autoriser les avis sur ce profil
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={handleCloseModal} className="btn btn-outline" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}>
                                    Sauvegarder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
