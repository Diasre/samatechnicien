import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Calendar, Star, Users, Briefcase, Search, ArrowRight, CheckCircle, ShoppingBag } from 'lucide-react';
import { supabase } from '../supabaseClient';

const LandingPage = () => {
    const [products, setProducts] = useState([]);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        const fetchRecentProducts = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(8);
            
            if (data && !error) {
                setProducts(data);
            }
        };
        fetchRecentProducts();
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || products.length === 0) return;

        let intervalId;
        
        const startScroll = () => {
            intervalId = setInterval(() => {
                if (container) {
                    if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 1) {
                        container.scrollLeft = 0;
                    } else {
                        container.scrollLeft += 1;
                    }
                }
            }, 30);
        };

        startScroll();
        const stopScroll = () => clearInterval(intervalId);

        container.addEventListener('mouseenter', stopScroll);
        container.addEventListener('mouseleave', startScroll);
        container.addEventListener('touchstart', stopScroll);
        container.addEventListener('touchend', startScroll);

        return () => {
            clearInterval(intervalId);
            if (container) {
                container.removeEventListener('mouseenter', stopScroll);
                container.removeEventListener('mouseleave', startScroll);
                container.removeEventListener('touchstart', stopScroll);
                container.removeEventListener('touchend', startScroll);
            }
        };
    }, [products]);

    return (
        <div className="landing-page" style={{ overflowX: 'hidden' }}>
            <style>
                {`
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes pulse-blue {
                        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
                        70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
                        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                    }
                    @keyframes float {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                        100% { transform: translateY(0px); }
                    }
                    .feature-card { transition: all 0.3s ease; opacity: 0; animation: fadeInUp 0.8s ease-out forwards; }
                    .feature-card:hover { transform: translateY(-10px); box-shadow: 0 15px 30px rgba(0,0,0,0.15); }
                `}
            </style>
            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(135deg, var(--primary-color) 0%, #0056b3 100%)',
                color: 'white',
                padding: '4rem 1rem',
                textAlign: 'center',
                borderBottomLeftRadius: '50% 20px',
                borderBottomRightRadius: '50% 20px',
                marginBottom: '3rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        marginBottom: '1rem',
                        color: 'white',
                        animation: 'fadeInUp 0.8s ease-out forwards'
                    }}>
                        La Solution Expert pour vos Réparations
                    </h1>
                    <p style={{
                        fontSize: '1.2rem',
                        marginBottom: '2rem',
                        color: 'white',
                        opacity: '0',
                        animation: 'fadeInUp 0.8s ease-out 0.3s forwards'
                    }}>
                        Connectez-vous avec les meilleurs techniciens certifiés du Sénégal ou développez votre activité en toute simplicité.
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        opacity: '0',
                        animation: 'fadeInUp 0.8s ease-out 0.6s forwards'
                    }}>
                        <Link to="/login" className="btn" style={{
                            backgroundColor: 'white',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold',
                            padding: '1rem 2rem',
                            borderRadius: '30px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            animation: 'pulse-blue 2s infinite',
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none'
                        }}>
                            Trouver un réparateur <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                        </Link>
                        
                        <Link to="/marketplace" className="btn" style={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            color: 'white',
                            fontWeight: 'bold',
                            padding: '1rem 2rem',
                            borderRadius: '30px',
                            border: '1px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            backdropFilter: 'blur(5px)'
                        }}>
                            <ShoppingBag size={20} style={{ marginRight: '8px' }} /> SamaBoutique
                        </Link>

                        <Link to="/login" className="btn btn-outline" style={{
                            borderColor: 'white',
                            color: 'white',
                            padding: '1rem 2rem',
                            borderRadius: '30px',
                            textDecoration: 'none'
                        }}>
                            Se connecter
                        </Link>
                    </div>
                </div>
            </section>

            {/* Recent Products Section */}
            {products.length > 0 && (
                <section className="container" style={{ marginBottom: '3rem', zIndex: 10, position: 'relative', marginTop: '-2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                        <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0 }}>Derniers articles</h2>
                        <Link to="/marketplace" style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                            Voir tout <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div ref={scrollContainerRef} style={{ 
                        display: 'flex', 
                        overflowX: 'auto', 
                        gap: '1rem', 
                        paddingBottom: '1rem',
                        paddingLeft: '0.5rem',
                        paddingRight: '0.5rem',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch'
                    }} className="hide-scrollbar">
                        <style>
                            {`.hide-scrollbar::-webkit-scrollbar { display: none; }`}
                        </style>
                        {products.map((product, idx) => (
                            <Link to={`/marketplace?id=${product.id}`} key={product.id} style={{ textDecoration: 'none', color: 'inherit', flex: '0 0 auto' }}>
                                <div className="card feature-card" style={{ padding: '0', width: '180px', overflow: 'hidden', animationDelay: `${0.1 * (idx % 5)}s`, display: 'flex', flexDirection: 'column', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                                    <div style={{ height: '130px', backgroundColor: '#f1f5f9', position: 'relative' }}>
                                        <img 
                                            src={[product.image, product.image2, product.image3].filter(Boolean)[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.title || 'Produit')}&background=F1F5F9&color=007BFF&size=200`} 
                                            alt={product.title}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.title || 'Produit')}&background=F1F5F9&color=007BFF&size=200`;
                                            }}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'var(--primary-color)', color: 'white', fontWeight: '900', padding: '4px 8px', borderRadius: '8px', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                            {Number(product.price).toLocaleString('fr-FR')} CFA
                                        </div>
                                    </div>
                                    <div style={{ padding: '12px' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: '600', margin: '0 0 6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#1e293b' }}>{product.title}</h4>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                            {product.address || 'Dakar'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Value Proposition */}
            <section className="container" style={{ marginBottom: '4rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '3rem', color: 'var(--text-primary)' }}>Pourquoi choisir SamaTechnicien ?</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                    <div className="card feature-card" style={{ textAlign: 'center', padding: '2rem', animationDelay: '0.2s' }}>
                        <div style={{ background: '#e8f5e9', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <ShieldCheck size={30} color="var(--primary-color)" />
                        </div>
                        <h3>Fiabilité</h3>
                        <p>Tous nos techniciens sont vérifiés pour vous garantir un service de qualité et en toute sécurité. Les techniciens en partenariat direct avec SamaTechnicien ont été certifiés par un badge vert.</p>
                    </div>
                    <div className="card feature-card" style={{ textAlign: 'center', padding: '2rem', animationDelay: '0.4s' }}>
                        <div style={{ background: '#e3f2fd', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <Search size={30} color="#2196f3" />
                        </div>
                        <h3>Simplicité</h3>
                        <p>Trouvez le bon expert en quelques clics grâce à notre système de recherche intuitif et géolocalisé.</p>
                    </div>
                    <div className="card feature-card" style={{ textAlign: 'center', padding: '2rem', animationDelay: '0.6s' }}>
                        <div style={{ background: '#fff3e0', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <Star size={30} color="#ff9800" />
                        </div>
                        <h3>Transparence</h3>
                        <p>Consultez les avis des autres clients et choisissez le technicien qui correspond le mieux à vos attentes.</p>
                    </div>
                </div>
            </section>

            {/* For Clients */}
            <section style={{ backgroundColor: '#f8f9fa', padding: '4rem 1rem', marginBottom: '4rem' }}>
                <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '3rem', maxWidth: '1000px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap-reverse' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <h2 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem' }}>Pour les Clients</h2>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                    <CheckCircle size={24} color="var(--primary-color)" style={{ marginRight: '1rem', flexShrink: 0 }} />
                                    Accès à un large réseau de techniciens qualifiés.
                                </li>
                                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                    <CheckCircle size={24} color="var(--primary-color)" style={{ marginRight: '1rem', flexShrink: 0 }} />
                                    Prise de contact directe et rapide.
                                </li>
                                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                    <CheckCircle size={24} color="var(--primary-color)" style={{ marginRight: '1rem', flexShrink: 0 }} />
                                    Possibilité de noter et laisser des avis.
                                </li>
                                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                    <CheckCircle size={24} color="var(--primary-color)" style={{ marginRight: '1rem', flexShrink: 0 }} />
                                    Service client réactif.
                                </li>

                                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                    <CheckCircle size={24} color="var(--primary-color)" style={{ marginRight: '1rem', flexShrink: 0 }} />
                                    Vendez vos articles et pièces détachées dans la boutique.
                                </li>
                            </ul>
                            <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                Trouver un réparateur
                            </Link>
                        </div>
                        <div style={{ flex: 1, minWidth: '300px', textAlign: 'center' }}>
                            <div style={{
                                background: 'white',
                                borderRadius: '20px',
                                padding: '2rem',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                display: 'inline-block',
                                animation: 'float 6s ease-in-out infinite'
                            }}>
                                <Users size={120} color="var(--secondary-color)" style={{ opacity: 0.8 }} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Technicians */}
            <section className="container" style={{ padding: '0 1rem 4rem 1rem', maxWidth: '1000px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px', textAlign: 'center' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '2rem',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                            display: 'inline-block',
                            animation: 'float 6s ease-in-out infinite 3s'
                        }}>
                            <Briefcase size={120} color="var(--primary-color)" style={{ opacity: 0.8 }} />
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <h2 style={{ color: 'var(--secondary-color)', marginBottom: '1.5rem' }}>Pour les Techniciens</h2>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                <CheckCircle size={24} color="var(--secondary-color)" style={{ marginRight: '1rem', flexShrink: 0 }} />
                                Augmentez votre visibilité auprès des clients locaux.
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                <CheckCircle size={24} color="var(--secondary-color)" style={{ marginRight: '1rem', flexShrink: 0 }} />
                                Gérez votre profil et vos disponibilités.
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                <CheckCircle size={24} color="var(--secondary-color)" style={{ marginRight: '1rem', flexShrink: 0 }} />
                                Accédez au Marketplace pour vos pièces détachées.
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                <CheckCircle size={24} color="var(--secondary-color)" style={{ marginRight: '1rem', flexShrink: 0 }} />
                                Rejoignez une communauté de professionnels.
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                <CheckCircle size={24} color="var(--secondary-color)" style={{ marginRight: '1rem', flexShrink: 0 }} />
                                Partagez votre profil et votre boutique directement avec vos clients.
                            </li>
                        </ul>
                        <Link to="/login" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                            Proposer mes services
                        </Link>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section style={{
                background: 'var(--text-primary)',
                color: 'white',
                padding: '4rem 1rem',
                textAlign: 'center',
                marginTop: '2rem'
            }}>
                <div className="container">
                    <h2 style={{
                        color: 'white',
                        marginBottom: '1rem',
                        animation: 'fadeInUp 0.8s ease-out forwards'
                    }}>
                        Prêt à commencer ?
                    </h2>
                    <p style={{
                        fontSize: '1.2rem',
                        marginBottom: '2rem',
                        color: '#bdc3c7',
                        opacity: 0,
                        animation: 'fadeInUp 0.8s ease-out 0.2s forwards'
                    }}>
                        Rejoignez dès aujourd'hui la première plateforme de réparation au Sénégal.
                    </p>
                    <Link to="/login" className="btn btn-primary" style={{
                        padding: '1rem 3rem',
                        fontSize: '1.2rem',
                        borderRadius: '30px',
                        animation: 'pulse-blue 2s infinite',
                        display: 'inline-block'
                    }}>
                        Rechercher un technicien
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
