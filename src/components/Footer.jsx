import React from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, ShieldCheck } from 'lucide-react';
import { isWeb } from '../utils/platform';
import logo from '../assets/logo.png';

const Footer = () => {
    // On n'affiche le footer que sur le Web pour garder l'app mobile épurée
    if (!isWeb) return null;

    return (
        <footer style={{ 
            background: '#1e293b', 
            color: '#f8fafc', 
            padding: '4rem 2rem 2rem', 
            fontFamily: "'Outfit', sans-serif",
            marginTop: '4rem'
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
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', color: '#10b981' }}>Contactez-nous</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}>
                            <Mail size={18} color="#10b981" />
                            <a href="mailto:Dias@samatechnicien.com" style={{ color: 'inherit', textDecoration: 'none', fontWeight: '600' }}>
                                Dias@samatechnicien.com
                            </a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}>
                            <Phone size={18} color="#10b981" />
                            <span>+221 77 859 96 49</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}>
                            <MapPin size={18} color="#10b981" />
                            <span>Dakar, Sénégal</span>
                        </div>
                    </div>
                </div>

                {/* Section Liens Utiles */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', color: '#10b981' }}>Liens Rapides</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <a href="/" style={{ color: '#94a3b8', textDecoration: 'none', transition: '0.3s' }}>Accueil</a>
                        <a href="/login" style={{ color: '#94a3b8', textDecoration: 'none', transition: '0.3s' }}>Se connecter</a>
                        <a href="/terms" style={{ color: '#94a3b8', textDecoration: 'none', transition: '0.3s' }}>Conditions d'utilisation</a>
                        <a href="/register" style={{ color: '#94a3b8', textDecoration: 'none', transition: '0.3s' }}>Devenir partenaire</a>
                    </div>
                </div>

                {/* Section Confiance */}
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <ShieldCheck size={24} color="#10b981" />
                        <span style={{ fontWeight: '800', color: '#10b981' }}>100% Sécurisé</span>
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
    );
};

export default Footer;
