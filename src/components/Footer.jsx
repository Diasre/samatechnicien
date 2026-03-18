import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin, Tool, CheckCircle } from 'lucide-react';

const Footer = () => {
    return (
        <footer style={{
            backgroundColor: '#111827',
            color: '#f3f4f6',
            padding: '4rem 1rem 1.5rem 1rem',
            borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
            <div className="container" style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2.5rem',
                marginBottom: '3rem'
            }}>
                {/* Column 1: Brand */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{
                            backgroundColor: '#10b981',
                            padding: '0.5rem',
                            borderRadius: '10px'
                        }}>
                            <CheckCircle size={24} color="white" />
                        </div>
                        <span style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
                            <span style={{ color: '#10b981' }}>sama</span>technicien
                        </span>
                    </div>
                    <p style={{ color: '#9ca3af', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                        La première plateforme au Sénégal qui connecte les meilleurs techniciens certifiés avec les particuliers et entreprises en toute confiance.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <a href="#" style={{ color: '#9ca3af', transition: 'color 0.3s' }} onMouseOver={(e) => e.target.style.color = '#10b981'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}><Facebook size={22} /></a>
                        <a href="#" style={{ color: '#9ca3af', transition: 'color 0.3s' }} onMouseOver={(e) => e.target.style.color = '#10b981'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}><Instagram size={22} /></a>
                        <a href="#" style={{ color: '#9ca3af', transition: 'color 0.3s' }} onMouseOver={(e) => e.target.style.color = '#10b981'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}><Linkedin size={22} /></a>
                    </div>
                </div>

                {/* Column 2: Quick Links */}
                <div>
                    <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Liens Rapides</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ marginBottom: '0.75rem' }}><Link to="/technicians" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.95rem' }} onMouseOver={(e) => e.target.style.color = '#10b981'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}>Trouver un technicien</Link></li>
                        <li style={{ marginBottom: '0.75rem' }}><Link to="/marketplace" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.95rem' }} onMouseOver={(e) => e.target.style.color = '#10b981'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}>Boutique Pièces</Link></li>
                        <li style={{ marginBottom: '0.75rem' }}><Link to="/register" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.95rem' }} onMouseOver={(e) => e.target.style.color = '#10b981'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}>Devenir Technicien</Link></li>
                        <li style={{ marginBottom: '0.75rem' }}><Link to="/login" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.95rem' }} onMouseOver={(e) => e.target.style.color = '#10b981'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}>Mon Compte</Link></li>
                    </ul>
                </div>

                {/* Column 3: Legal */}
                <div>
                    <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Légal</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ marginBottom: '0.75rem' }}><Link to="/terms" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.95rem' }} onMouseOver={(e) => e.target.style.color = '#10b981'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}>Conditions Générales (CGU)</Link></li>
                        <li style={{ marginBottom: '0.75rem' }}><Link to="/terms" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.95rem' }} onMouseOver={(e) => e.target.style.color = '#10b981'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}>Confidentialité</Link></li>
                        <li style={{ marginBottom: '0.75rem' }}><a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.95rem' }} onMouseOver={(e) => e.target.style.color = '#10b981'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}>Mentions Légales</a></li>
                    </ul>
                </div>

                {/* Column 4: Contact */}
                <div>
                    <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Contact</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', color: '#9ca3af' }}>
                            <Mail size={18} color="#10b981" />
                            <span style={{ fontSize: '0.95rem' }}>contact@samatechnicien.com</span>
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', color: '#9ca3af' }}>
                            <Phone size={18} color="#10b981" />
                            <span style={{ fontSize: '0.95rem' }}>+221 77 XXX XX XX</span>
                        </li>
                        <li style={{ display: 'flex', gap: '0.75rem', color: '#9ca3af' }}>
                            <MapPin size={18} color="#10b981" />
                            <span style={{ fontSize: '0.95rem' }}>Dakar, Sénégal</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom Copyright */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center'
            }}>
                <p style={{ color: '#4b5563', fontSize: '0.85rem' }}>
                    © {new Date().getFullYear()} SamaTechnicien.com — Tous droits réservés. Développé avec ❤️ au Sénégal.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
