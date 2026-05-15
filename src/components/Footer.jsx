import React, { useState } from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, ShieldCheck, CheckCircle } from 'lucide-react';
import { isWeb } from '../utils/platform';
import logo from '../assets/logo.png';
import { supabase } from '../supabaseClient';

const Footer = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;
        
        setIsSubmitting(true);
        
        try {
            // Enregistrer l'e-mail dans la base de données Supabase
            const { error } = await supabase
                .from('newsletter_subscribers')
                .insert([{ email: email }]);

            if (error) {
                // Si l'e-mail existe déjà, on ne veut pas bloquer l'utilisateur (on peut juste lui dire merci)
                if (error.code !== '23505') { // 23505 = unique_violation
                    console.error("Erreur d'abonnement:", error.message);
                }
            }

            setIsSubmitting(false);
            setSubscribed(true);
            setEmail('');
            
            // Masquer le message de succès après 5 secondes
            setTimeout(() => setSubscribed(false), 5000);
        } catch (err) {
            console.error("Erreur:", err);
            setIsSubmitting(false);
        }
    };

    // On n'affiche le footer que sur le Web pour garder l'app mobile épurée
    if (!isWeb) return null;

    return (
        <>
            {/* Section Newsletter dans la zone blanche */}
            <div style={{ background: '#ffffff', padding: '4rem 2rem', borderTop: '1px solid #e2e8f0' }}>
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    padding: '2.5rem',
                    background: '#273444',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <input 
                            type="checkbox" 
                            id="newsletter-policy" 
                            style={{ 
                                marginTop: '4px', 
                                width: '24px', 
                                height: '24px', 
                                cursor: 'pointer',
                                accentColor: '#007bff'
                            }} 
                            required
                        />
                        <label htmlFor="newsletter-policy" style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5', cursor: 'pointer' }}>
                            J'accepte la Politique de confidentialité et des cookies de SamaTechnicien et je comprends que je peux me désabonner des newsletters à tout moment.
                        </label>
                    </div>
                    <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <div style={{ 
                            flex: '1', 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: '#ffffff', 
                            borderRadius: '4px', 
                            padding: '0.5rem 1rem', 
                            minWidth: '280px' 
                        }}>
                            <Mail size={22} color="#94a3b8" style={{ marginRight: '12px' }} />
                            <input 
                                type="email" 
                                placeholder="Entrez votre adresse e-mail" 
                                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1.05rem', color: '#1e293b' }}
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            style={{ 
                                background: isSubmitting ? '#4a4a4a' : '#333333', 
                                color: '#ffffff', 
                                border: '1px solid #ffffff', 
                                borderRadius: '4px', 
                                padding: '0 2.5rem', 
                                fontWeight: '700', 
                                fontSize: '1.05rem',
                                cursor: isSubmitting ? 'wait' : 'pointer',
                                transition: 'background 0.3s',
                                minHeight: '50px',
                                opacity: isSubmitting ? 0.8 : 1
                            }}
                            onMouseOver={(e) => { if(!isSubmitting) e.currentTarget.style.background = '#4a4a4a'; }}
                            onMouseOut={(e) => { if(!isSubmitting) e.currentTarget.style.background = '#333333'; }}
                        >
                            {isSubmitting ? 'En cours...' : "S'abonner"}
                        </button>
                    </form>
                    
                    {subscribed && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            color: '#10b981', 
                            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                            padding: '10px 15px', 
                            borderRadius: '4px',
                            marginTop: '5px'
                        }}>
                            <CheckCircle size={20} />
                            <span style={{ fontWeight: '600' }}>Vous êtes bien abonné à SamaTechnicien. À bientôt !</span>
                        </div>
                    )}
                </div>
            </div>

            <footer style={{ 
                background: '#1e293b', 
                color: '#f8fafc', 
                padding: '4rem 2rem 2rem', 
                fontFamily: "'Outfit', sans-serif"
            }}>
            <div style={{ 
                maxWidth: '1200px', 
                margin: '0 auto', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '3rem' 
            }}>
                {/* Section Logo & Slogan */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={logo} alt="SamaTechnicien" style={{ height: '45px' }} />
                        <span style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-1px' }}>SamaTechnicien</span>
                    </div>
                    <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '0.95rem' }}>
                        La première plateforme de mise en relation entre techniciens certifiés et clients au Sénégal. 
                        Qualité, rapidité et sécurité garanties.
                    </p>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <a href="#" style={{ color: '#94a3b8', transition: '0.3s' }}><Facebook size={20} /></a>
                        <a href="#" style={{ color: '#94a3b8', transition: '0.3s' }}><Instagram size={20} /></a>
                        <a href="#" style={{ color: '#94a3b8', transition: '0.3s' }}><Twitter size={20} /></a>
                    </div>
                </div>

                {/* Section Contact */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', color: '#007bff' }}>Contactez-nous</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}>
                            <Mail size={18} color="#007bff" />
                            <a href="mailto:Dias@samatechnicien.com" style={{ color: 'inherit', textDecoration: 'none', fontWeight: '600' }}>
                                Dias@samatechnicien.com
                            </a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}>
                            <Phone size={18} color="#007bff" />
                            <span>+221 77 859 96 49</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}>
                            <MapPin size={18} color="#007bff" />
                            <span>Dakar, Sénégal</span>
                        </div>
                    </div>
                </div>

                {/* Section Liens Utiles */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', color: '#007bff' }}>Liens Rapides</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <a href="/" style={{ color: '#94a3b8', textDecoration: 'none', transition: '0.3s' }}>Accueil</a>
                        <a href="/login" style={{ color: '#94a3b8', textDecoration: 'none', transition: '0.3s' }}>Se connecter</a>
                        <a href="/terms" style={{ color: '#94a3b8', textDecoration: 'none', transition: '0.3s' }}>Conditions d'utilisation</a>
                        <a href="/register" style={{ color: '#94a3b8', textDecoration: 'none', transition: '0.3s' }}>Devenir partenaire</a>
                    </div>
                </div>

                {/* Section Confiance */}
                <div style={{ background: 'rgba(0, 123, 255, 0.05)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(0, 123, 255, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <ShieldCheck size={24} color="#007bff" />
                        <span style={{ fontWeight: '800', color: '#007bff' }}>100% Sécurisé</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                        Toutes vos données et transactions sont protégées par notre système de sécurité avancé.
                    </p>
                </div>
            </div>

            <div style={{ 
                maxWidth: '1200px', 
                margin: '3rem auto 0', 
                paddingTop: '2rem', 
                borderTop: '1px solid #334155', 
                textAlign: 'center', 
                color: '#64748b',
                fontSize: '0.85rem'
            }}>
                © {new Date().getFullYear()} SamaTechnicien. Tous droits réservés. Design by Dias.
            </div>
        </footer>
        </>
    );
};

export default Footer;
