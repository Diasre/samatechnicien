import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { Geolocation } from '@capacitor/geolocation';
import { 
    ShoppingCart, Phone, MessageCircle, Trash2, Search, Camera, Heart, Clock, MapPin, 
    User, CheckCircle, ArrowLeft, ArrowRight, Share2, Info, Smartphone, Wrench, Hammer, 
    Globe, Eye, Settings, Briefcase, Map, ShoppingBag 
} from 'lucide-react';
import logo from '../assets/logo.png';

const ProductCard = ({ product, user, handleEdit, handleStatusToggle, handleDeleteProduct, handleViewDetails, isFavorite, toggleFavorite }) => {

    const images = [
        product.image,
        product.image2,
        product.image3
    ].filter(Boolean);

    const displayImage = images[0] || 'https://via.placeholder.com/300x200?text=Produit';

    // Formater la date (simulé pour le design)
    const timeAgo = "Aujourd'hui"; 

    return (
        <div className="market-card-premium" onClick={() => handleViewDetails(product)}>
            {/* Image Section */}
            <div className="card-image-wrapper" style={{ backgroundColor: '#f1f5f9' }}>
                <img 
                    src={displayImage} 
                    alt={product.title} 
                    className="card-main-img" 
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://ui-avatars.com/api/?name=Produit&background=F1F5F9&color=64748B&size=300';
                    }}
                />
                
                <div className="badge-time">
                    <Clock size={10} />
                    <span>{timeAgo}</span>
                </div>

                <button 
                    className={`btn-favorite ${isFavorite ? 'active' : ''}`}
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleFavorite(product.id); 
                    }}
                >
                    <Heart size={16} fill={isFavorite ? "var(--primary-color)" : "none"} color={isFavorite ? "var(--primary-color)" : "#666"} />
                    {product.likes > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-10px',
                            background: 'var(--primary-color)',
                            color: 'white',
                            fontSize: '0.6rem',
                            fontWeight: '900',
                            padding: '2px 5px',
                            borderRadius: '10px',
                            border: '1px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                            {product.likes}
                        </span>
                    )}
                </button>

                {product.status === 'sold' && <div className="sold-overlay">VENDU</div>}
            </div>

            {/* Info Section */}
            <div className="card-content-premium">
                <div className="price-tag">{Number(product.price).toLocaleString('fr-FR')} CFA</div>
                <div className="promo-bar-red">Garanti par le revendeur</div>
                <h3 className="product-title-premium">{product.title}</h3>
                
                {/* Numéro de téléphone en gros */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0', padding: '4px 8px', background: '#ecfdf5', borderRadius: '8px', width: 'fit-content' }}>
                    <Phone size={14} color="#007bff" fill="#007bff" />
                    <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#065f46' }}>
                        {product.whatsapp || product.technicianPhone || 'Non spécifié'}
                    </span>
                </div>

                <div className="location-tag">
                    <MapPin size={10} />
                    <span>{product.address || 'Dakar'}</span>
                </div>
            </div>

            {/* Footer Section */}
            <div className="card-footer-premium" 
                 onClick={(e) => { 
                    e.stopPropagation(); 
                    if (product.technicianid || product.technicianId) {
                        navigate(`/technician/${product.technicianid || product.technicianId}`);
                    }
                 }} 
                 style={{ cursor: 'pointer' }}>
                <div className="seller-brief">
                    <div className="seller-avatar-mini" style={{ 
                        background: 'var(--primary-color)', 
                        color: 'white',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {product.technicianImage ? (
                            <img 
                                src={product.technicianImage} 
                                alt={product.technicianName} 
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.technicianName || 'S')}&background=007bff&color=fff`;
                                }}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <User size={12} />
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="seller-name-mini" style={{ fontWeight: 800 }}>{(product.technicianName || 'Sama Tech').substring(0, 15)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={10} color="#007bff" />
                            <span style={{ fontSize: '0.7rem', color: '#007bff', fontWeight: 800 }}>
                                {product.whatsapp || product.technicianPhone || 'Non spécifié'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={product.technicianRole === 'client' ? "badge-client-mini" : "badge-pro-mini"}>
                    {product.technicianRole === 'client' ? 'PART' : 'PRO'}
                </div>
            </div>

            {/* Admin Actions (Si propriétaire) */}
            {user && (user.id === product.technicianid || user.id === product.technicianId) && (
                <div className="admin-actions-overlay" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEdit(product)} className="admin-btn edit"><Info size={16} /></button>
                    <button onClick={() => handleDeleteProduct(product)} className="admin-btn delete"><Trash2 size={16} /></button>
                </div>
            )}
        </div>
    );
};

const Marketplace = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [products, setProducts] = useState(() => {
        const saved = localStorage.getItem('ST_CACHE_PRODUCTS');
        return saved ? JSON.parse(saved) : [];
    });
    const [loading, setLoading] = useState(products.length === 0);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [newProduct, setNewProduct] = useState({
        title: '',
        price: '',
        category: 'Smartphone',
        condition: 'Occasion',
        description: '',
        whatsapp: '',
        address: '',
        label1: '',
        origin: 'Certifié',
        warranty: '7 jours'
    });
    const [imageFiles, setImageFiles] = React.useState([null, null, null]);
    const [submitting, setSubmitting] = React.useState(false);
    const [editingProduct, setEditingProduct] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');

    const user = JSON.parse(localStorage.getItem('user'));
    const isLoggedIn = !!user;
    const isTechnician = user && user.role === 'technician';
    const timeAgo = "À l'instant";

    useEffect(() => {
        fetchProducts();
        if (user) fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('product_favorites')
                .select('product_id')
                .eq('user_id', user.id);
            if (error) throw error;
            setFavorites(data.map(f => f.product_id));
        } catch (err) {
            console.error("Error fetching favorites:", err);
        }
    };

    const toggleFavorite = async (productId) => {
        if (!isLoggedIn) {
            alert("Veuillez vous connecter pour ajouter des favoris.");
            navigate('/login');
            return;
        }

        const isFavorited = favorites.includes(productId);
        
        try {
            if (isFavorited) {
                // Remove
                const { error } = await supabase
                    .from('product_favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productId);
                if (error) throw error;
                setFavorites(prev => prev.filter(id => id !== productId));
                // Update local likes count
                setProducts(prev => prev.map(p => 
                    p.id === productId ? { ...p, likes: Math.max(0, (p.likes || 0) - 1) } : p
                ));
            } else {
                // Add
                const { error } = await supabase
                    .from('product_favorites')
                    .insert([{ user_id: user.id, product_id: productId }]);
                if (error) throw error;
                setFavorites(prev => [...prev, productId]);
                // Update local likes count
                setProducts(prev => prev.map(p => 
                    p.id === productId ? { ...p, likes: (p.likes || 0) + 1 } : p
                ));
            }
        } catch (err) {
            console.error("Error toggling favorite:", err);
        }
    };

    const handleViewDetails = async (product) => {
        setSelectedProduct(product);
        // Incrémenter les vues
        console.log("Incrémentation vue pour:", product.id);
        const { error } = await supabase.rpc('increment_product_views', { product_id: product.id });
        
        if (error) {
            console.warn("Erreur RPC increment_product_views, tentative fallback direct:", error.message);
            // Fallback direct sur update si l'utilisateur est le proprio (ou si RLS le permet)
            await supabase
                .from('products')
                .update({ views: (product.views || 0) + 1 })
                .eq('id', product.id);
        }
    };

    const closeDetails = () => {
        setSelectedProduct(null);
    };

    const filteredProducts = products.filter(product => {
        const term = searchTerm.toLowerCase();
        return (
            product.title.toLowerCase().includes(term) ||
            (product.category && product.category.toLowerCase().includes(term)) ||
            (product.technicianName && product.technicianName.toLowerCase().includes(term)) ||
            (product.description && product.description.toLowerCase().includes(term))
        );
    });

    const handleStartChat = async (product) => {
        const currentUser = JSON.parse(localStorage.getItem('user'));

        if (!currentUser) {
            alert('Veuillez vous connecter pour envoyer un message.');
            navigate('/login');
            return;
        }

        const techId = product.technicianid || product.technicianId;
        if (!techId) {
            alert("Erreur: Identifiant du vendeur introuvable.");
            return;
        }

        if (String(currentUser.id) === String(techId)) {
            alert('Vous ne pouvez pas vous envoyer de message à vous-même.');
            return;
        }

        try {
            // 1. Find existing conversation
            const { data: existingConvs, error: fetchError } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant1_id.eq.${currentUser.id},participant2_id.eq.${techId}),and(participant1_id.eq.${techId},participant2_id.eq.${currentUser.id})`);

            if (fetchError) throw fetchError;

            let conversationId;

            if (existingConvs && existingConvs.length > 0) {
                conversationId = existingConvs[0].id;
            } else {
                // 2. Create new conversation
                const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert([{ participant1_id: currentUser.id, participant2_id: techId }])
                    .select()
                    .single();

                if (createError) throw createError;
                conversationId = newConv.id;
            }

            // Redirect to chat
            navigate(`/chat?id=${conversationId}`);
        } catch (error) {
            console.error('Error starting chat:', error);
            alert(`Erreur technique : ${error.message}`);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Mode 1 : Essai avec jointure (Plus complet)
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    users!technicianid (
                        fullname,
                        full_name,
                        phone,
                        image,
                        role
                    )
                `)
                .order('created_at', { ascending: false });

            if (!error && data) {
                const mappedProducts = data.map(p => {
                    const tRaw = p.users || p.user || {};
                    const tech = Array.isArray(tRaw) ? (tRaw[0] || {}) : tRaw;
                    return {
                        ...p,
                        technicianName: tech.fullname || tech.full_name || 'SamaExpert',
                        technicianPhone: tech.phone || '',
                        technicianImage: tech.image,
                        technicianRole: tech.role,
                        technicianId: p.technicianid
                    };
                });
                setProducts(mappedProducts);
                localStorage.setItem('ST_CACHE_PRODUCTS', JSON.stringify(mappedProducts));
            } else {
                // Mode 2 : Fallback sur une requête simple si la jointure échoue
                console.warn("⚠️ Mode Secours Boutique activé car la jointure a échoué.");
                const { data: simpleData, error: simpleError } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (simpleError) throw simpleError;
                
                if (simpleData) {
                    // On essaie de récupérer les IDs des techniciens pour une deuxième passe si possible
                    const techIds = [...new Set(simpleData.map(p => p.technicianid).filter(Boolean))];
                    let techMap = {};
                    
                    if (techIds.length > 0) {
                        const { data: usersData } = await supabase
                            .from('users')
                            .select('id, fullname, full_name, phone')
                            .in('id', techIds);
                        
                        if (usersData) {
                            usersData.forEach(u => {
                                techMap[u.id] = u;
                            });
                        }
                    }

                    const mappedProducts = simpleData.map(p => {
                        const tech = techMap[p.technicianid] || {};
                        return {
                            ...p,
                            technicianName: tech.fullname || tech.full_name || 'SamaExpert',
                            technicianPhone: tech.phone || '',
                            technicianId: p.technicianid
                        };
                    });
                    setProducts(mappedProducts);
                }
            }
        } catch (err) {
            console.error("❌ ERREUR BOUTIQUE (V205):", err.message);
            // Diagnostic visible pour l'utilisateur
            if (loading) {
                alert("⚠️ Problème Boutique (V207) :\n" + err.message);
            }
        }
        setLoading(false);
    };

    // Gérer l'ouverture directe d'un produit via l'URL (?id=... ou ?edit=...)
    useEffect(() => {
        if (!loading && products.length > 0) {
            const params = new URLSearchParams(location.search);
            const productId = params.get('id');
            const editId = params.get('edit');

            if (productId) {
                const product = products.find(p => p.id.toString() === productId.toString());
                if (product) {
                    setSelectedProduct(product);
                    handleViewDetails(product); // Also trigger increment
                }
            }

            if (editId) {
                const product = products.find(p => p.id.toString() === editId.toString());
                if (product) handleEdit(product);
            }
        }
    }, [location.search, products, loading]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProduct(prev => ({ ...prev, [name]: value }));
    };

    // Helper to upload a single file
    const uploadImage = async (file) => {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('produits')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            alert("Erreur lors de l'envoi de l'image : " + uploadError.message);
            return null;
        }

        const { data } = supabase.storage.from('produits').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!editingProduct && !imageFiles[0]) {
            alert("Veuillez charger au moins l'image principale (Photo 1) avant de publier votre annonce.");
            return;
        }

        if (editingProduct && !editingProduct.image && !imageFiles[0]) {
            alert("Veuillez charger au moins l'image principale (Photo 1) avant de publier votre annonce.");
            return;
        }

        setSubmitting(true);

        try {
            // 1. Upload images if present
            let imageUrls = [null, null, null];

            // If editing, keep old images by default
            if (editingProduct) {
                imageUrls[0] = editingProduct.image;
                imageUrls[1] = editingProduct.image2;
                imageUrls[2] = editingProduct.image3;
            }

            // Upload new files
            for (let i = 0; i < 3; i++) {
                if (imageFiles[i]) {
                    const url = await uploadImage(imageFiles[i]);
                    if (!url) {
                        setSubmitting(false);
                        return; // ARRET IMMEDIAT si l'image échoue
                    }
                    imageUrls[i] = url;
                }
            }

            // 2. Prepare payload
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error("Session expirée. Veuillez vous reconnecter.");

            // 1.5 - Limite 5 articles (V201)
            if (!editingProduct) {
                const { count, error: countError } = await supabase
                    .from('products')
                    .select('id', { count: 'exact', head: true })
                    .eq('technicianid', authUser.id);
                
                if (!countError && count >= 5) {
                    alert("⚠️ Limite atteinte : Vous ne pouvez pas publier plus de 5 articles simultanément.");
                    setSubmitting(false);
                    return;
                }
            }

            const productData = {
                technicianid: authUser.id,
                title: newProduct.title,
                price: parseFloat(newProduct.price),
                category: newProduct.category || 'Autres',
                condition: newProduct.condition || 'Neuf',
                description: newProduct.description || '',
                whatsapp: newProduct.whatsapp || '',
                address: newProduct.address || '',
                image1_label: newProduct.label1 || 'Angle 1',
                image2_label: newProduct.origin || 'Certifié',
                image3_label: newProduct.warranty || '7 jours',
                status: 'active',
                created_at: new Date().toISOString(),
                // Assign images
                image: imageUrls[0],
                image2: imageUrls[1],
                image3: imageUrls[2],
            };

            let error;
            if (editingProduct) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('products')
                    .insert([productData]);
                error = insertError;
            }

            if (error) throw error;

            alert(editingProduct ? 'Produit mis à jour !' : 'Produit ajouté !');
            handleCancel();
            fetchProducts();

        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            alert(`⚠️ DIAGNOSTIC BOUTIQUE :\n\n` +
                  `Message: ${error.message}\n` +
                  `Code: ${error.code || 'Inconnu'}\n` +
                  `Détails: ${error.details || 'Aucun'}\n` +
                  `Aide: ${error.hint || 'Aucun'}`);
        }
        setSubmitting(false);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setNewProduct({
            title: product.title,
            price: product.price,
            category: product.category,
            condition: product.condition,
            description: product.description || '',
            whatsapp: product.whatsapp || '',
            address: product.address || '',
            label1: product.image1_label || '',
            origin: product.image2_label || 'Certifié',
            warranty: product.image3_label || '7 jours'
        });
        setImageFiles([null, null, null]);
        setIsFormVisible(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setIsFormVisible(false);
        setEditingProduct(null);
        setNewProduct({
            title: '', price: '', category: 'Cartes mères de téléphone', condition: 'Occasion', description: '',
            label1: '', origin: 'Certifié', warranty: '7 jours'
        });
        setImageFiles([null, null, null]);
    };

    const handleStatusToggle = async (product) => {
        const newStatus = product.status === 'sold' ? 'available' : 'sold';
        try {
            const { error } = await supabase
                .from('products')
                .update({ status: newStatus })
                .eq('id', product.id);

            if (error) throw error;

            // Update local list
            setProducts(products.map(p =>
                p.id === product.id ? { ...p, status: newStatus } : p
            ));
        } catch (error) {
            console.error(error);
            alert("Erreur maj statut");
        }
    };

    const handleDeleteProduct = async (product) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
            try {
                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', product.id);

                if (error) throw error;

                setProducts(products.filter(p => p.id !== product.id));
            } catch (error) {
                console.error(error);
                alert("Erreur suppression: " + error.message);
            }
        }
    };

    // Styles Premium Injectés
    const premiumStyles = `
        .market-card-premium {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            position: relative;
            box-shadow: 0 4px 15px rgba(0,0,0,0.06);
            transition: all 0.3s ease;
            height: 100%;
            cursor: pointer;
        }
        .market-card-premium:active { transform: scale(0.98); }
        
        .card-image-wrapper {
            position: relative;
            aspect-ratio: 4/3;
            max-height: 180px;
            background: #f1f5f9;
        }
        .card-main-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            transition: transform 0.5s ease;
        }
        .market-card-premium:hover .card-main-img {
            transform: scale(1.05);
        }
        .badge-time {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.6);
            color: white;
            padding: 3px 8px;
            border-radius: 20px;
            font-size: 0.65rem;
            display: flex;
            align-items: center;
            gap: 4px;
            backdrop-filter: blur(4px);
        }
        .btn-favorite {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            border: none;
            z-index: 10;
        }
        .sold-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.4);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 1.2rem;
            text-transform: uppercase;
        }
        .card-content-premium {
            padding: 18px 12px 10px 12px;
        }
        .price-tag {
            color: #f1c40f; /* Or/Jaune de l'image */
            font-weight: 950;
            font-size: 1.4rem;
            margin-bottom: 2px;
            letter-spacing: -0.5px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .promo-bar-red {
            background: var(--primary-color); /* Rouge vif */
            color: white;
            font-size: 0.65rem;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 4px;
            display: inline-block;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .product-title-premium {
            font-size: 0.85rem;
            font-weight: 500;
            color: #334155;
            margin: 0 0 6px 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            height: 2.4em;
        }
        .location-tag {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #94a3b8;
            font-size: 0.7rem;
        }
        .card-footer-premium {
            margin-top: auto;
            border-top: 1px solid #f1f5f9;
            padding: 10px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .seller-brief {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .seller-avatar-mini {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .seller-name-mini {
            font-size: 0.7rem;
            font-weight: 600;
            color: #64748b;
        }
        .badge-pro-mini {
            background: #3b82f6;
            color: white;
            font-size: 0.55rem;
            font-weight: 900;
            padding: 1px 4px;
            border-radius: 4px;
        }
        .admin-actions-overlay {
            position: absolute;
            top: 15px;
            right: 60px;
            display: flex;
            gap: 8px;
            z-index: 15;
        }
        .admin-btn {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
        }
        .admin-btn.edit { background: rgba(59, 130, 246, 0.8); }
        .admin-btn.delete { background: rgba(239, 68, 68, 0.8); }

        .market-float-btn {
            position: fixed;
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-color);
            color: white;
            padding: 12px 24px;
            border-radius: 30px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 8px 20px rgba(233, 30, 99, 0.4);
            border: none;
            z-index: 100;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            font-size: 0.85rem;
            white-space: nowrap;
        }
        .market-float-btn:active { transform: translateX(-50%) scale(0.95); }

        .category-tab-scroll {
            display: flex;
            overflow-x: auto;
            gap: 12px;
            padding: 0 0 15px 0;
            margin-bottom: 20px;
            scrollbar-width: none;
        }
        .category-tab-scroll::-webkit-scrollbar { display: none; }
        .category-pill {
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 10px;
            width: 80px;
            cursor: pointer;
        }
        .pill-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.05);
            color: #64748b;
        }
        .pill-text {
            font-size: 0.65rem;
            font-weight: 600;
            text-align: center;
            color: #64748b;
        }
        .category-pill.active .pill-icon {
            background: var(--primary-color);
            color: white;
        }
        .category-pill.active .pill-text { color: var(--primary-color); }

        /* Styles Vue Détail CoinAfrique */
        .detail-fixed-actions {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            padding: 12px;
            display: flex;
            gap: 10px;
            box-shadow: 0 -4px 15px rgba(0,0,0,0.1);
            z-index: 3100;
        }
        .detail-btn-action {
            flex: 1;
            height: 48px;
            border-radius: 10px;
            border: none;
            color: white;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 0.9rem;
        }
        .spec-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .spec-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 8px;
        }
        .spec-icon-box {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
        }
        .spec-label { font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; }
        .spec-value { font-size: 0.75rem; font-weight: 700; color: #334155; }
    `;


    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '1.5rem 1rem',
            fontFamily: "'Outfit', 'Inter', sans-serif",
            backgroundColor: '#f8fafc',
            minHeight: '100vh'
        }}>
            <style>{premiumStyles}</style>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>Sama Boutique</h2>
                
                {/* Sélecteur de Catégories Horizontal */}
                <div className="category-tab-scroll">
                    {[
                        { id: 'all', name: 'Tous', icon: <ShoppingCart size={20} /> },
                        { id: 'it', name: 'Informaticien', icon: <Camera size={20} /> },
                        { id: 'auto', name: 'Mecanicien Automobile', icon: <Wrench size={20} /> },
                        { id: 'macon', name: 'Macon', icon: <Hammer size={20} /> },
                        { id: 'service', name: 'Service', icon: <Settings size={20} /> },
                        { id: 'alu', name: 'Aluminium', icon: <Info size={20} /> },
                        { id: 'plumb', name: 'Plombier', icon: <MapPin size={20} /> },
                        { id: 'network', name: 'Réseau', icon: <Globe size={20} /> },
                        { id: 'main', name: 'Maintenancier', icon: <Briefcase size={20} /> },
                        { id: 'video', name: 'Vidéo Surveillance', icon: <Eye size={20} /> },
                        { id: 'tel', name: 'Telephone', icon: <Smartphone size={20} /> },
                    ].map(cat => {
                        const isActive = (cat.id === 'all' && searchTerm === '') || (searchTerm === cat.name);
                        return (
                            <div 
                                key={cat.id} 
                                className={`category-pill ${isActive ? 'active' : ''}`}
                                onClick={() => setSearchTerm(cat.id === 'all' ? '' : cat.name)}
                            >
                                <div className="pill-icon">{cat.icon}</div>
                                <div className="pill-text">{cat.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bouton Flottant Publier */}
            {isLoggedIn && (
                <button
                    className="market-float-btn"
                    onClick={() => {
                        if (isFormVisible) {
                            handleCancel();
                        } else {
                            const myProductsCount = products.filter(p => (p.technicianid === user.id || p.technicianId === user.id)).length;
                            if (myProductsCount >= 5) {
                                alert("Limite atteinte (" + myProductsCount + "/5) !");
                                return;
                            }
                            setEditingProduct(null);
                            setNewProduct({ title: '', price: '', category: 'Smartphone', condition: 'Occasion', description: '', origin: 'Certifié', warranty: '7 jours' });
                            setIsFormVisible(true);
                            setTimeout(() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                        }
                    }}
                >
                    <Camera size={18} />
                    <span>Publier une annonce</span>
                </button>
            )}


            {isFormVisible && (
                <div className="card animate-fade-in" style={{ padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--primary-color)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>{editingProduct ? 'Modifier l\'article' : 'Ajouter un nouvel article'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Titre</label>
                                <input type="text" name="title" required value={newProduct.title} onChange={handleInputChange} style={{ width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: '12px', fontSize: '0.9rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Prix (FCFA)</label>
                                <input type="number" name="price" required value={newProduct.price} onChange={handleInputChange} style={{ width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: '12px', fontSize: '0.9rem' }} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{ gridColumn: '1 / -1', marginBottom: '0.75rem' }}>
                                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Catégorie</label>
                                <div style={{ 
                                    display: 'flex', 
                                    overflowX: 'auto', 
                                    gap: '8px', 
                                    paddingBottom: '10px',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                }}>
                                    {[
                                        "Téléphone", "Ordinateur", "Informatique", "Électronique", "Automobile", "Moto", "Vélo", 
                                        "Frigo", "Imprimante", "Décoration", "Alimentation", "Agriculture",
                                        "Maison", "Appartement", "Photo", "Réseau",
                                        "Écrans", "Batteries", "Caméras", 
                                        "Cartes mères PC", "Disques durs", "RAM", "Écrans PC", "Claviers / souris",
                                        "Moteur", "Batterie", "Alternateur", "Démarreur", "Plaquettes de frein", "Bougies", "Filtre à huile / air",
                                        "Plomberie", "Maçonnerie", "Électricité", "Climatisation", "Menuiserie",
                                        "Caméras de surveillance", "DVR / NVR", "Alarmes"
                                    ].map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setNewProduct({ ...newProduct, category: cat })}
                                            style={{
                                                flex: '0 0 auto',
                                                padding: '6px 14px',
                                                borderRadius: '20px',
                                                fontSize: '0.7rem',
                                                border: '1px solid ' + (newProduct.category === cat ? 'var(--primary-color)' : '#ddd'),
                                                backgroundColor: newProduct.category === cat ? 'var(--primary-color)' : 'white',
                                                color: newProduct.category === cat ? 'white' : '#666',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ gridColumn: '1 / -1', marginBottom: '0.75rem' }}>
                                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>État</label>
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
                                    {["Neuf", "Occasion", "Reconditionné", "Pour pièces"].map(cond => (
                                        <button
                                            key={cond}
                                            type="button"
                                            onClick={() => setNewProduct({ ...newProduct, condition: cond })}
                                            style={{
                                                flex: '0 0 auto',
                                                padding: '6px 14px',
                                                borderRadius: '20px',
                                                fontSize: '0.7rem',
                                                border: '1px solid ' + (newProduct.condition === cond ? '#ff9800' : '#ddd'),
                                                backgroundColor: newProduct.condition === cond ? '#ff9800' : 'white',
                                                color: newProduct.condition === cond ? 'white' : '#666',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {cond}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ gridColumn: '1 / -1', marginBottom: '0.75rem' }}>
                                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Origine</label>
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
                                    {["Certifié", "Importé", "Local", "Autre"].map(orig => (
                                        <button
                                            key={orig}
                                            type="button"
                                            onClick={() => setNewProduct({ ...newProduct, origin: orig })}
                                            style={{
                                                flex: '0 0 auto',
                                                padding: '6px 14px',
                                                borderRadius: '20px',
                                                fontSize: '0.7rem',
                                                border: '1px solid ' + (newProduct.origin === orig ? '#3b82f6' : '#ddd'),
                                                backgroundColor: newProduct.origin === orig ? '#3b82f6' : 'white',
                                                color: newProduct.origin === orig ? 'white' : '#666',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {orig}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ gridColumn: '1 / -1', marginBottom: '0.75rem' }}>
                                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Garantie</label>
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
                                    {["Sans garantie", "24h test", "3 jours", "7 jours", "1 mois", "6 mois", "1 an"].map(war => (
                                        <button
                                            key={war}
                                            type="button"
                                            onClick={() => setNewProduct({ ...newProduct, warranty: war })}
                                            style={{
                                                flex: '0 0 auto',
                                                padding: '6px 14px',
                                                borderRadius: '20px',
                                                fontSize: '0.7rem',
                                                border: '1px solid ' + (newProduct.warranty === war ? '#f59e0b' : '#ddd'),
                                                backgroundColor: newProduct.warranty === war ? '#f59e0b' : 'white',
                                                color: newProduct.warranty === war ? 'white' : '#666',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {war}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'none' }}>
                                <select name="category" value={newProduct.category} onChange={handleInputChange}><option>{newProduct.category}</option></select>
                                <select name="condition" value={newProduct.condition} onChange={handleInputChange}><option>{newProduct.condition}</option></select>
                            </div>
                        </div>
                        <div style={{ marginBottom: '0.75rem' }}>
                            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Description (Optionnel)</label>
                            <textarea 
                                name="description" 
                                value={newProduct.description} 
                                onChange={handleInputChange} 
                                style={{ width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: '12px', minHeight: '60px', fontSize: '0.9rem' }}
                                placeholder="Détails sur l'article..."
                            ></textarea>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                <MessageCircle size={14} color="#007bff" /> Numéro WhatsApp
                            </label>
                            <input 
                                type="tel" 
                                name="whatsapp" 
                                placeholder="Ex: 771234567"
                                value={newProduct.whatsapp} 
                                onChange={handleInputChange} 
                                style={{ width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: '12px', fontSize: '0.9rem' }} 
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                <MapPin size={14} color="var(--primary-color)" /> Localisation de l'article
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input 
                                    type="text" 
                                    name="address" 
                                    placeholder="Ex: HLM Grand Yoff, Villa N°..."
                                    value={newProduct.address} 
                                    onChange={handleInputChange} 
                                    style={{ width: '100%', padding: '0.7rem 3rem 0.7rem 0.7rem', border: '1px solid #ddd', borderRadius: '12px', fontSize: '0.9rem' }} 
                                />
                                <button 
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            setNewProduct(prev => ({ ...prev, address: "Recherche GPS..." }));
                                            const perm = await Geolocation.requestPermissions();
                                            if (perm.location !== 'granted') throw new Error("GPS refusé");
                                            const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
                                            const { latitude, longitude } = pos.coords;
                                            try {
                                                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                                const data = await res.json();
                                                setNewProduct(prev => ({ ...prev, address: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
                                            } catch (e) {
                                                setNewProduct(prev => ({ ...prev, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
                                            }
                                        } catch (err) {
                                            alert("Erreur GPS. Vérifiez vos paramètres de localisation.");
                                            setNewProduct(prev => ({ ...prev, address: "" }));
                                        }
                                    }}
                                    style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}
                                >
                                    <MapPin size={22} fill="#cce5ff" />
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Images et Variantes/Options</label>
                            {editingProduct && <small style={{ display: 'block', marginBottom: '0.5rem', color: '#d9534f' }}>Note : Ajouter de nouvelles images remplacera toutes les images actuelles.</small>}

                            <div style={{ 
                                display: 'flex', 
                                overflowX: 'auto', 
                                gap: '10px', 
                                paddingBottom: '10px',
                                scrollbarWidth: 'none', // Hide for Firefox
                                msOverflowStyle: 'none', // Hide for IE/Edge
                                webkitOverflowScrolling: 'touch' // Smooth scroll for iOS
                            }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} style={{ 
                                        flex: '0 0 110px', // Fixed width for scroll
                                        border: '1px solid #eee', 
                                        padding: '8px', 
                                        borderRadius: '12px', 
                                        backgroundColor: '#f8fafc',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ 
                                            position: 'relative', 
                                            height: '70px', 
                                            borderRadius: '8px', 
                                            border: '1px dashed #cbd5e1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            backgroundColor: 'white'
                                        }}>
                                            {imageFiles[i] ? (
                                                <img 
                                                    src={URL.createObjectURL(imageFiles[i])} 
                                                    alt={`Prevue ${i}`} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                />
                                            ) : (
                                                <Camera size={24} color="#94a3b8" />
                                            )}
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={(e) => {
                                                    const newFiles = [...imageFiles];
                                                    newFiles[i] = e.target.files[0];
                                                    setImageFiles(newFiles);
                                                }} 
                                                style={{ 
                                                    position: 'absolute', 
                                                    inset: 0, 
                                                    opacity: 0, 
                                                    cursor: 'pointer' 
                                                }} 
                                            />
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="Label"
                                            value={newProduct[`label${i + 1}`]}
                                            onChange={(e) => setNewProduct({ ...newProduct, [`label${i + 1}`]: e.target.value })}
                                            style={{ 
                                                width: '100%', 
                                                padding: '4px', 
                                                fontSize: '0.7rem', 
                                                border: '1px solid #e2e8f0', 
                                                borderRadius: '6px',
                                                textAlign: 'center'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', padding: '0.5rem' }}>
                            {submitting ? 'Traitement...' : (editingProduct ? 'Mettre à jour' : 'Publier l\'article')}
                        </button>
                    </form>
                </div>
            )}

            {/* Barre de recherche */}
            <div className="card shadow-sm" style={{ marginBottom: '1.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: '25px', padding: '0.5rem 1rem', border: '1px solid #eee' }}>
                    <Search size={18} color="var(--primary-color)" />
                    <input
                        type="text"
                        placeholder="Rechercher un iPhone, Samsung, ordinateur, réparateur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: 'none', background: 'none', outline: 'none', marginLeft: '0.75rem', width: '100%', fontSize: '0.95rem' }}
                    />
                </div>
            </div>

            <div className="marketplace-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: window.innerWidth < 600 ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '15px',
                padding: '0 5px'
            }}>
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                        <div className="animate-spin" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary-color)', borderRadius: '50%' }}></div>
                        <p style={{ color: '#666', fontWeight: 600 }}>Chargement de la boutique...</p>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            user={user}
                            handleEdit={handleEdit}
                            handleStatusToggle={handleStatusToggle}
                            handleDeleteProduct={handleDeleteProduct}
                            handleViewDetails={handleViewDetails}
                            isFavorite={favorites.includes(product.id)}
                            toggleFavorite={toggleFavorite}
                        />
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#666' }}>
                        <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ fontWeight: 600 }}>Aucun produit ne correspond à votre recherche.</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem' }}>Essayer de cliquer sur "Tous" ou d'actualiser.</p>
                        <button 
                            onClick={fetchProducts} 
                            className="btn btn-outline" 
                            style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, borderRadius: '12px' }}
                        >
                            Actualiser la boutique
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Détails Produit Style CoinAfrique */}
            {selectedProduct && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'white', zIndex: 3000,
                    display: 'flex', flexDirection: 'column', overflowY: 'auto'
                }} className="animate-fade-in market-detail-view">
                    
                    {/* Header bar (Solid White) */}
                    <div style={{ 
                        position: 'sticky', top: 0, left: 0, right: 0, height: '80px', padding: '10px 20px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                        zIndex: 3105, background: 'white', borderBottom: '1px solid #eee',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                    }}>
                        <button onClick={closeDetails} style={{ 
                            background: 'none', color: '#1e293b', border: 'none', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            padding: '10px'
                        }}>
                            <ArrowLeft size={32} />
                        </button>
                        
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                            <img src={logo} alt="SamaTechnicien" style={{ height: '45px', objectFit: 'contain' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button style={{ 
                                background: 'none', color: '#1e293b', border: 'none', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                padding: '10px'
                            }}>
                                <Share2 size={28} />
                            </button>
                        </div>
                    </div>

                    {/* Image Carousel */}
                    <div style={{ height: '500px', maxHeight: '70vh', position: 'relative', background: '#f8fafc' }}>
                        <ProductImageCarousel product={selectedProduct} />
                    </div>

                    {/* Content Section */}
                    <div style={{ 
                        padding: '20px', 
                        paddingBottom: '120px', 
                        backgroundColor: 'white', 
                        marginTop: '-20px', 
                        borderRadius: '20px 20px 0 0',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                            <div>
                                <h1 style={{ fontSize: '1.8rem', fontWeight: 950, color: '#f1c40f', marginBottom: '4px', letterSpacing: '-1px' }}>
                                    {Number(selectedProduct.price).toLocaleString('fr-FR')} CFA
                                </h1>
                                <div className="promo-bar-red">Garanti par le revendeur ✅</div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', lineHeight: '1.2' }}>
                                    {selectedProduct.title}
                                </h2>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(selectedProduct.id); }}
                                    style={{ 
                                        width: '44px', 
                                        height: '44px', 
                                        borderRadius: '50%', 
                                        background: favorites.includes(selectedProduct.id) ? '#fff1f2' : '#f8fafc', 
                                        border: '1px solid',
                                        borderColor: favorites.includes(selectedProduct.id) ? '#fda4af' : '#f1f5f9', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        color: favorites.includes(selectedProduct.id) ? 'var(--primary-color)' : '#64748b',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <Heart size={22} fill={favorites.includes(selectedProduct.id) ? "var(--primary-color)" : "none"} />
                                </button>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                                    {selectedProduct.likes || 0} Like{selectedProduct.likes > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', color: '#64748b', fontSize: '0.8rem', marginBottom: '20px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: '4px 10px', borderRadius: '15px' }}>
                                <Clock size={14} color="#64748b" /> {timeAgo}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: '4px 10px', borderRadius: '15px' }}>
                                <ShoppingCart size={14} color="#64748b" /> {selectedProduct.category}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: '4px 10px', borderRadius: '15px' }}>
                                <MapPin size={14} color="#64748b" /> {selectedProduct.address || 'Dakar'}
                            </span>
                        </div>

                        <div style={{ padding: '15px', background: '#fff9fa', borderRadius: '12px', border: '1px solid #cce5ff', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                background: 'var(--primary-color)', 
                                borderRadius: '10px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: 'white',
                                overflow: 'hidden'
                            }}>
                                {selectedProduct.technicianImage ? (
                                    <img 
                                        src={selectedProduct.technicianImage} 
                                        alt={selectedProduct.technicianName} 
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProduct.technicianName || 'S')}&background=007bff&color=fff`;
                                        }}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>{selectedProduct.technicianName || 'SamaExpert'}</div>
                                <a 
                                    href={`tel:${(selectedProduct.technicianPhone || '').replace(/\s/g, '')}`} 
                                    style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textDecoration: 'none', display: 'block' }}
                                >
                                    {selectedProduct.whatsapp || selectedProduct.technicianPhone || 'Non spécifié'}
                                </a>
                                <div style={{ fontSize: '0.7rem', color: (selectedProduct.technicianRole === 'client' ? '#007bff' : 'var(--primary-color)'), fontWeight: 800 }}>
                                    {selectedProduct.technicianRole === 'client' ? 'Vendeur Particulier (Client)' : 'Vendeur Professionnel (Expert)'}
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    if (selectedProduct.technicianid || selectedProduct.technicianId) {
                                        navigate(`/technician/${selectedProduct.technicianid || selectedProduct.technicianId}`);
                                    }
                                }}
                                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 700, background: 'transparent', cursor: 'pointer' }}
                            >
                                PROFIL
                            </button>
                        </div>

                        {/* Fiche Technique */}
                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '20px', color: '#1e293b', borderLeft: '4px solid var(--primary-color)', paddingLeft: '10px' }}>Caractéristiques</h3>
                            
                            <div className="spec-grid">
                                <div className="spec-item">
                                    <div className="spec-icon-box" style={{ background: '#f8fafc', border: 'none' }}><CheckCircle size={22} color="#22c55e" /></div>
                                    <span className="spec-label">État</span>
                                    <span className="spec-value">{selectedProduct.condition || 'Occasion'}</span>
                                </div>
                                <div className="spec-item">
                                    <div className="spec-icon-box" style={{ background: '#f8fafc', border: 'none' }}><Info size={22} color="#3b82f6" /></div>
                                    <span className="spec-label">Origine</span>
                                    <span className="spec-value">{selectedProduct.image2_label || 'Certifié'}</span>
                                </div>
                                <div className="spec-item">
                                    <div className="spec-icon-box" style={{ background: '#f8fafc', border: 'none' }}><Clock size={22} color="#f59e0b" /></div>
                                    <span className="spec-label">Garantie</span>
                                    <span className="spec-value">{selectedProduct.image3_label || '7 jours'}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '12px', color: '#1e293b', borderLeft: '4px solid var(--primary-color)', paddingLeft: '10px' }}>Description</h3>
                            <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                {selectedProduct.description || "Aucune description fournie par le vendeur."}
                            </p>
                        </div>
                    </div>

                    {/* Fixed Actions Bottom */}
                    <div className="detail-fixed-actions">
                        <button 
                            className="detail-btn-action" 
                            style={{ background: '#22c55e' }}
                            onClick={() => {
                                // Utiliser le numéro WhatsApp spécifique s'il existe, sinon le téléphone
                                let rawPhone = (selectedProduct.whatsapp || selectedProduct.technicianPhone || '');
                                let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
                                if (cleanPhone && cleanPhone.length === 9) cleanPhone = '221' + cleanPhone;
                                if (!cleanPhone) { alert("Le numéro WhatsApp n'est pas renseigné."); return; }
                                window.open(`https://wa.me/${cleanPhone}?text=Bonjour, je suis intéressé par votre article : ${selectedProduct.title} (vu sur Sama Boutique / Application SamaTechnicien).`, '_blank');
                            }}
                        >
                            <MessageCircle size={20} /> WHATSAPP
                        </button>
                        <button 
                            className="detail-btn-action" 
                            style={{ background: 'var(--primary-color)' }}
                            onClick={() => {
                                const rawPhone = (selectedProduct.technicianPhone || selectedProduct.whatsapp || '').replace(/\s/g, '');
                                const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
                                if (!cleanPhone) { alert("Le numéro du vendeur n'est pas renseigné."); return; }
                                window.location.href = `tel:${cleanPhone}`;
                            }}
                        >
                            <Phone size={20} /> APPEL
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProductImageCarousel = ({ product }) => {
    const images = [
        product.image,
        product.image2,
        product.image3
    ].filter(Boolean);

    const [idx, setIdx] = React.useState(0);
    const [isZoomed, setIsZoomed] = React.useState(false);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <img 
                src={images[idx]} 
                onClick={() => setIsZoomed(true)}
                alt={product.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'zoom-in', transition: 'transform 0.3s ease' }} 
                className="main-carousel-img"
            />

            {/* Overlay de Zoom Premium */}
            {isZoomed && (
                <div 
                    onClick={() => setIsZoomed(false)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: 'rgba(0,0,0,0.98)', zIndex: 99999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'fadeIn 0.3s ease-out',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                        <img 
                            src={images[idx]} 
                            alt="Zoom"
                            style={{ 
                                maxWidth: '100vw', 
                                maxHeight: '100vh', 
                                objectFit: 'contain',
                                animation: 'zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                            }} 
                        />

                        {/* Bouton Fermer */}
                        <button 
                            onClick={() => setIsZoomed(false)}
                            style={{ 
                                position: 'absolute', top: '30px', right: '30px', 
                                background: 'rgba(255,255,255,0.15)', color: 'white', 
                                borderRadius: '50%', width: '50px', height: '50px', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                                fontSize: '1.5rem', fontWeight: 'bold', zIndex: 100001,
                                backdropFilter: 'blur(5px)'
                            }}
                        >
                            ✕
                        </button>

                        {/* Navigation interne au zoom */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={() => setIdx((idx - 1 + images.length) % images.length)}
                                    style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(5px)' }}
                                >
                                    <ArrowLeft size={30} />
                                </button>
                                <button
                                    onClick={() => setIdx((idx + 1) % images.length)}
                                    style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(5px)' }}
                                >
                                    <ArrowRight size={30} />
                                </button>

                                <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px' }}>
                                    {images.map((_, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => setIdx(i)} 
                                            style={{ 
                                                width: '12px', height: '12px', borderRadius: '50%', 
                                                background: i === idx ? 'var(--primary-color)' : 'rgba(255,255,255,0.3)', 
                                                cursor: 'pointer',
                                                border: '1px solid rgba(255,255,255,0.5)',
                                                transition: 'all 0.3s ease'
                                            }} 
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Contrôles du Carousel Principal */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={() => setIdx((idx - 1 + images.length) % images.length)}
                        style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(255,255,255,0.7)', border: 'none', color: '#1e293b', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', zIndex: 10 }}
                    ><ArrowLeft size={20} /></button>
                    <button
                        onClick={() => setIdx((idx + 1) % images.length)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(255,255,255,0.7)', border: 'none', color: '#1e293b', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', zIndex: 10 }}
                    ><ArrowRight size={20} /></button>

                    <div style={{ position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 10 }}>
                        {images.map((_, i) => (
                            <div key={i} onClick={() => setIdx(i)} style={{
                                width: '10px', height: '10px', borderRadius: '50%',
                                backgroundColor: i === idx ? 'var(--primary-color)' : 'white',
                                border: '1px solid rgba(0,0,0,0.1)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                cursor: 'pointer'
                            }} />
                        ))}
                    </div>

                    <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backdropFilter: 'blur(4px)', zIndex: 10 }}>
                        {idx + 1} / {images.length}
                    </div>
                </>
            )}

            <style>
                {`
                    @keyframes zoomIn {
                        from { transform: scale(0.8); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    .main-carousel-img:hover {
                        transform: scale(1.02);
                    }
                `}
            </style>
        </div>
    );
};

export default Marketplace;
