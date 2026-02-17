import React from 'react';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { products } from '../data/mockData';
import { ShoppingCart, Phone, MessageCircle, Trash2, Search } from 'lucide-react';

const ProductCard = ({ product, user, handleEdit, handleStatusToggle, handleDeleteProduct, handleViewDetails }) => {
    const [activeImgIndex, setActiveImgIndex] = React.useState(0);

    const images = [
        { src: product.image, label: product.image1_label },
        { src: product.image2, label: product.image2_label },
        { src: product.image3, label: product.image3_label }
    ].filter(img => img.src);

    const currentImage = images[activeImgIndex] || { src: 'https://via.placeholder.com/300x200?text=Produit', label: '' };

    return (
        <div
            className="card card-3d"
            onClick={() => handleViewDetails(product)}
            style={{ padding: '0', overflow: 'hidden', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
        >
            <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#f8f9fa', position: 'relative' }}>
                {/* Image principale */}
                <img
                    src={currentImage.src}
                    alt={product.title}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        transition: 'opacity 0.3s ease',
                        opacity: product.status === 'sold' ? 0.6 : 1,
                        filter: product.status === 'sold' ? 'grayscale(100%)' : 'none'
                    }}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/300x200?text=Image+Introuvable";
                        // Afficher l'URL qui pose problème juste en dessous (visible seulement quand ça casse)
                        e.target.nextElementSibling.style.display = 'block';
                        e.target.nextElementSibling.innerText = "Lien brisé : " + currentImage.src.split('/storage/v1/object/public/')[1];
                    }}
                />
                <div style={{ display: 'none', position: 'absolute', bottom: 0, left: 0, background: 'rgba(0,0,0,0.8)', color: 'red', fontSize: '10px', padding: '2px', width: '100%', wordBreak: 'break-all' }}>
                    Debug URL
                </div>



                {/* Sélecteur d'images (si plusieurs) */}
                {images.length > 1 && (
                    <div style={{
                        position: 'absolute', bottom: '10px', right: '10px',
                        display: 'flex', gap: '4px', zIndex: 5
                    }}>
                        {images.map((_, idx) => (
                            <div
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setActiveImgIndex(idx); }}
                                style={{
                                    width: '12px', height: '12px', borderRadius: '50%',
                                    backgroundColor: activeImgIndex === idx ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.7)',
                                    cursor: 'pointer', border: '2px solid white',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Badge VENDU */}
                {product.status === 'sold' && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(220, 53, 69, 0.9)', color: 'white', padding: '5px 15px',
                        borderRadius: '5px', fontSize: '0.9rem', fontWeight: 'bold', border: '2px solid white',
                        zIndex: 10
                    }}>
                        VENDU
                    </div>
                )}
            </div>

            <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.title}</h3>
                    <span style={{
                        backgroundColor: '#e1f5fe', color: '#0288d1',
                        padding: '1px 6px', borderRadius: '10px', fontSize: '0.65rem', flexShrink: 0
                    }}>{product.category}</span>
                </div>
                <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1rem', margin: '0.25rem 0' }}>
                    {product.price.toLocaleString()} F
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>{product.condition}</p>
                    <span style={{
                        fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px',
                        color: 'white', fontWeight: 'bold',
                        backgroundColor: product.status === 'sold' ? '#dc3545' : '#28a745'
                    }}>
                        {product.status === 'sold' ? 'Vendu' : 'Disponible'}
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    <p style={{ fontSize: '0.65rem', color: '#999', margin: 0 }}>Vendeur: {product.technicianName}</p>
                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#666' }}>{product.technicianPhone}</span>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-primary"
                            onClick={(e) => { e.stopPropagation(); window.open(`tel:${product.technicianPhone}`, '_self'); }}
                            disabled={product.status === 'sold'}
                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: product.status === 'sold' ? 0.5 : 1 }}>
                            <Phone size={14} /> Appeler
                        </button>
                        <button className="btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                let cleanPhone = (product.technicianPhone || '').replace(/[^0-9]/g, '');
                                if (cleanPhone.length === 9) cleanPhone = '221' + cleanPhone;
                                window.open(`https://wa.me/${cleanPhone}`, '_blank');
                            }}
                            disabled={product.status === 'sold'}
                            style={{ flex: 1, backgroundColor: '#25D366', color: 'white', border: 'none', padding: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', borderRadius: '4px', cursor: 'pointer', opacity: product.status === 'sold' ? 0.5 : 1 }}>
                            <MessageCircle size={14} /> WhatsApp
                        </button>
                    </div>

                    <div style={{ marginTop: '0.25rem' }}>
                        <button className="btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                const cart = JSON.parse(localStorage.getItem('cart')) || [];
                                cart.push(product);
                                localStorage.setItem('cart', JSON.stringify(cart));
                                window.dispatchEvent(new Event('cartUpdated'));
                                alert("Ajouté au panier !");
                            }}
                            disabled={product.status === 'sold'}
                            style={{ width: '100%', backgroundColor: '#ff9800', color: 'white', border: 'none', padding: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', borderRadius: '4px', cursor: 'pointer', opacity: product.status === 'sold' ? 0.5 : 1 }}>
                            <ShoppingCart size={14} /> Ajouter au panier
                        </button>
                    </div>

                    {user && user.id === product.technicianId && (
                        <div style={{ display: 'flex', gap: '5px', marginTop: '0.5rem' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleStatusToggle(product); }}
                                style={{
                                    flex: 1, padding: '0.25rem',
                                    fontSize: '0.7rem', backgroundColor: product.status === 'sold' ? '#28a745' : '#dc3545',
                                    color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                                }}
                            >
                                {product.status === 'sold' ? 'Dispo' : 'Vendu'}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                                style={{
                                    flex: 1, padding: '0.25rem',
                                    fontSize: '0.7rem', backgroundColor: '#6c757d',
                                    color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                                }}
                            >
                                Modifier
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product); }}
                                style={{
                                    flex: 0.5, padding: '0.25rem',
                                    fontSize: '0.7rem', backgroundColor: '#343a40',
                                    color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                title="Supprimer"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Marketplace = () => {
    const [products, setProducts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [isFormVisible, setIsFormVisible] = React.useState(false);
    const [selectedProduct, setSelectedProduct] = React.useState(null);
    const [newProduct, setNewProduct] = React.useState({
        title: '',
        price: '',
        category: 'Smartphone',
        condition: 'Occasion',
        description: '',
        label1: '',
        label2: '',
        label3: ''
    });
    const [imageFiles, setImageFiles] = React.useState([null, null, null]);
    const [submitting, setSubmitting] = React.useState(false);
    const [editingProduct, setEditingProduct] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');

    const user = JSON.parse(localStorage.getItem('user'));
    const isTechnician = user && user.role === 'technician';

    const handleViewDetails = (product) => {
        setSelectedProduct(product);
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

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Join with users table to get technician details
            const { data, error } = await supabase
                .from('products')
                .select('*, users (fullname, phone, city, district, specialty)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedProducts = data.map(p => ({
                    ...p,
                    technicianName: p.users?.fullname || p.users?.fullName || 'Technicien Inconnu',
                    technicianPhone: p.users?.phone || '',
                    technicianSpecialty: p.users?.specialty || '', // Assuming you might want this
                    technicianId: p.technicianid || p.technicianId // Handle both cases just to be safe
                }));
                setProducts(mappedProducts);
            }
        } catch (err) {
            console.error("Erreur chargement produits:", err.message);
        }
        setLoading(false);
    };

    React.useEffect(() => {
        fetchProducts();
    }, []);

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
            const productData = {
                technicianid: user.id, // Lowercase 'i' for Supabase
                title: newProduct.title,
                price: parseFloat(newProduct.price),
                category: newProduct.category,
                condition: newProduct.condition,
                description: newProduct.description,
                image1_label: newProduct.label1,
                image2_label: newProduct.label2,
                image3_label: newProduct.label3,
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
            console.error('Erreur sauvegarde:', error.message);
            alert('Erreur: ' + error.message);
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
            label1: product.image1_label || '',
            label2: product.image2_label || '',
            label3: product.image3_label || ''
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
            label1: '', label2: '', label3: ''
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

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Chargement de la boutique...</div>;

    return (
        <div className="container" style={{ padding: '1rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Boutique des techniciens</h2>
                    <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>Matériels certifiés par nos pros.</p>
                </div>
                {isTechnician && (
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            if (isFormVisible) {
                                handleCancel();
                            } else {
                                // Check limit
                                const myProductsCount = products.filter(p => p.technicianId === user.id).length;
                                if (myProductsCount >= 3) {
                                    alert(`Limite atteinte (${myProductsCount}/3) !\n\nPour garantir la qualité de la boutique, chaque technicien est limité à 3 annonces simultanées.\n\nVeuillez supprimer ou vendre un article existant pour en ajouter un nouveau.`);
                                    return;
                                }

                                setEditingProduct(null);
                                setNewProduct({ title: '', price: '', category: 'Cartes mères de téléphone', condition: 'Occasion', description: '' });
                                setIsFormVisible(true);
                            }
                        }}
                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                    >
                        {isFormVisible ? 'Annuler' : `+ Ajouter un article (${products.filter(p => p.technicianId === user.id).length}/3)`}
                    </button>
                )}
            </div>

            {isFormVisible && (
                <div className="card animate-fade-in" style={{ padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--primary-color)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>{editingProduct ? 'Modifier l\'article' : 'Ajouter un nouvel article'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Titre</label>
                                <input type="text" name="title" required value={newProduct.title} onChange={handleInputChange} style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Prix (FCFA)</label>
                                <input type="number" name="price" required value={newProduct.price} onChange={handleInputChange} style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Catégorie</label>
                                <select name="category" value={newProduct.category} onChange={handleInputChange} style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                                    <optgroup label="🔧 Téléphone & Électronique">
                                        <option>Cartes mères de téléphone</option>
                                        <option>Écrans</option>
                                        <option>Batteries</option>
                                        <option>Caméras</option>
                                        <option>Haut-parleurs</option>
                                        <option>Connecteurs</option>
                                        <option>Pièces de rechange diverses</option>
                                    </optgroup>
                                    <optgroup label="💻 Informatique">
                                        <option>Cartes mères PC</option>
                                        <option>Disques durs</option>
                                        <option>RAM</option>
                                        <option>Alimentation</option>
                                        <option>Écrans PC</option>
                                        <option>Claviers / souris</option>
                                        <option>Maintenance informatique</option>
                                    </optgroup>
                                    <optgroup label="🚗 Pièces automobiles">
                                        <option>Moteur</option>
                                        <option>Batterie</option>
                                        <option>Alternateur</option>
                                        <option>Démarreur</option>
                                        <option>Plaquettes de frein</option>
                                        <option>Bougies</option>
                                        <option>Filtre à huile / air</option>
                                        <option>Capteurs (ABS, température, etc.)</option>
                                        <option>Phares et feux</option>
                                        <option>Pièces de carrosserie</option>
                                    </optgroup>
                                    <optgroup label="🏠 Maison & Bâtiment">
                                        <option>Plomberie</option>
                                        <option>Maçonnerie</option>
                                        <option>Électricité</option>
                                        <option>Climatisation</option>
                                        <option>Menuiserie</option>
                                    </optgroup>
                                    <optgroup label="📹 Sécurité & Surveillance">
                                        <option>Caméras de surveillance</option>
                                        <option>DVR / NVR</option>
                                        <option>Câbles</option>
                                        <option>Disques durs</option>
                                        <option>Alarmes</option>
                                    </optgroup>
                                    <optgroup label="⚙️ Autres services techniques">
                                        <option>Réparation motos</option>
                                        <option>Réparation appareils électroménagers</option>
                                        <option>Soudure</option>
                                        <option>Installation panneaux solaires</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>État</label>
                                <select name="condition" value={newProduct.condition} onChange={handleInputChange} style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                                    <option>Neuf</option>
                                    <option>Occasion</option>
                                    <option>Reconditionné</option>
                                    <option>Pour pièces</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginBottom: '0.75rem' }}>
                            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Description</label>
                            <textarea name="description" value={newProduct.description} onChange={handleInputChange} style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}></textarea>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>Images et Variantes/Options</label>
                            {editingProduct && <small style={{ display: 'block', marginBottom: '0.5rem', color: '#d9534f' }}>Note : Ajouter de nouvelles images remplacera toutes les images actuelles.</small>}

                            {[0, 1, 2].map(i => (
                                <div key={i} style={{ marginBottom: '0.5rem', border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px' }}>
                                    <div style={{ marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Image {i + 1}</span>
                                    </div>
                                    <input type="file" accept="image/*" onChange={(e) => {
                                        const newFiles = [...imageFiles];
                                        newFiles[i] = e.target.files[0];
                                        setImageFiles(newFiles);
                                    }} style={{ fontSize: '0.8rem', width: '100%', marginBottom: '0.25rem' }} />

                                    <input type="text"
                                        placeholder={`Option / Variante (ex: Rouge, 64Go)`}
                                        value={newProduct[`label${i + 1}`]}
                                        onChange={(e) => setNewProduct({ ...newProduct, [`label${i + 1}`]: e.target.value })}
                                        style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>
                            ))}
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }} className="card-3d-wrapper">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            user={user}
                            handleEdit={handleEdit}
                            handleStatusToggle={handleStatusToggle}
                            handleDeleteProduct={handleDeleteProduct}
                            handleViewDetails={handleViewDetails}
                        />
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#666' }}>
                        <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>Aucun produit ne correspond à votre recherche.</p>
                    </div>
                )}
            </div>

            {/* Modal Détails Produit */}
            {selectedProduct && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000,
                    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
                    padding: '1rem', overflowY: 'auto'
                }} onClick={closeDetails}>
                    <div className="card animate-scale-up" style={{
                        width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden',
                        backgroundColor: 'white', marginTop: '20px'
                    }} onClick={e => e.stopPropagation()}>

                        {/* Header Modal */}
                        <div style={{ position: 'relative', height: '300px', backgroundColor: '#f0f0f0' }}>
                            <button onClick={closeDetails} style={{
                                position: 'absolute', top: '10px', right: '10px',
                                width: '32px', height: '32px', borderRadius: '50%',
                                backgroundColor: 'rgba(0,0,0,0.5)', color: 'white',
                                border: 'none', cursor: 'pointer', zIndex: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>✕</button>

                            <ProductImageCarousel product={selectedProduct} />
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{
                                    backgroundColor: 'var(--primary-color)', color: 'white',
                                    padding: '2px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold'
                                }}>{selectedProduct.category}</span>
                                <span style={{ color: '#666', fontSize: '0.8rem' }}>ID: #{selectedProduct.id}</span>
                            </div>

                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedProduct.title}</h2>
                            <p style={{
                                fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--primary-color)',
                                margin: '0 0 1rem 0'
                            }}>{selectedProduct.price.toLocaleString()} FCFA</p>

                            <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#333' }}>Description</h4>
                                <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.5', margin: 0 }}>
                                    {selectedProduct.description || "Aucune description fournie."}
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ border: '1px solid #eee', padding: '0.75rem', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#999', display: 'block' }}>État</span>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{selectedProduct.condition}</span>
                                </div>
                                <div style={{ border: '1px solid #eee', padding: '0.75rem', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#999', display: 'block' }}>Disponibilité</span>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: selectedProduct.status === 'sold' ? '#dc3545' : '#28a745' }}>
                                        {selectedProduct.status === 'sold' ? 'Vendu' : 'En stock'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>Vendeur (Technicien certifié)</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '50px', height: '50px', borderRadius: '50%',
                                        backgroundColor: '#eee', overflow: 'hidden'
                                    }}>
                                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProduct.technicianName)}&background=random&color=fff`} style={{ width: '100%', height: '100%' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{selectedProduct.technicianName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{selectedProduct.technicianSpecialty}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button className="btn btn-primary"
                                        onClick={() => window.open(`tel:${selectedProduct.technicianPhone}`, '_self')}
                                        style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <Phone size={20} /> Appeler
                                    </button>
                                    <button className="btn"
                                        onClick={() => {
                                            let cleanPhone = (selectedProduct.technicianPhone || '').replace(/[^0-9]/g, '');
                                            if (cleanPhone.length === 9) cleanPhone = '221' + cleanPhone;
                                            window.open(`https://wa.me/${cleanPhone}?text=Bonjour, je suis intéressé par votre article : ${selectedProduct.title}`, '_blank');
                                        }}
                                        style={{ flex: 1, backgroundColor: '#25D366', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <MessageCircle size={20} /> WhatsApp
                                    </button>
                                </div>
                                <button className="btn"
                                    onClick={() => {
                                        const cart = JSON.parse(localStorage.getItem('cart')) || [];
                                        cart.push(selectedProduct);
                                        localStorage.setItem('cart', JSON.stringify(cart));
                                        window.dispatchEvent(new Event('cartUpdated'));
                                        alert("Ajouté au panier !");
                                    }}
                                    disabled={selectedProduct.status === 'sold'}
                                    style={{ width: '100%', backgroundColor: '#ff9800', color: 'white', border: 'none', padding: '1rem', fontSize: '1rem', fontWeight: 'bold' }}>
                                    <ShoppingCart size={18} style={{ marginRight: '8px' }} /> Ajouter au panier
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProductImageCarousel = ({ product }) => {
    const images = [
        { src: product.image, label: product.image1_label },
        { src: product.image2, label: product.image2_label },
        { src: product.image3, label: product.image3_label }
    ].filter(img => img.src);

    const [idx, setIdx] = React.useState(0);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <img src={images[idx]?.src} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />

            {images.length > 1 && (
                <>
                    <button
                        onClick={() => setIdx((idx - 1 + images.length) % images.length)}
                        style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%' }}
                    >←</button>
                    <button
                        onClick={() => setIdx((idx + 1) % images.length)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%' }}
                    >→</button>

                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
                        {images.map((img, i) => (
                            <div key={i} onClick={() => setIdx(i)} style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                backgroundColor: i === idx ? 'var(--primary-color)' : 'white'
                            }} />
                        ))}
                    </div>

                    {images[idx]?.label && (
                        <div style={{
                            position: 'absolute', bottom: '30px', left: '0', right: '0',
                            textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white',
                            padding: '2px 0', fontSize: '0.75rem'
                        }}>
                            Option: {images[idx].label}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Marketplace;
