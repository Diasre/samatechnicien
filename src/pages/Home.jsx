import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ShieldCheck, Users } from 'lucide-react';
import logo from '../assets/logo.png';

import WelcomeOverlay from '../components/WelcomeOverlay';
import LandingPage from './LandingPage';

const Home = () => {
    let user = null;
    try {
        const stored = localStorage.getItem('user');
        if (stored) user = JSON.parse(stored);
    } catch (e) {
        console.error('LocalStorage access blocked:', e);
    }
    const isLoggedIn = !!user;

    // Logged-in Home View
    if (isLoggedIn) {
        // Redirection automatique pour les techniciens vers leur espace dédié
        if (user.role === 'technician') {
            return <Navigate to="/expert-dashboard" replace />;
        }
        return (
            <div className="container animate-fade-in" style={{
                padding: '1.5rem 1rem',
                textAlign: 'center',
                minHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <WelcomeOverlay userName={user.fullName} duration={2000} />
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Espace Services</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Choisissez une action pour continuer</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                    {/* Bouton Trouver un technicien - PRIORITÉ CLIENT */}
                    {/* Bouton Trouver un technicien - LIEN DIRECT FORCE */}
                    <Link 
                        to="/technicians" 
                        className="card animate-fade-in" 
                        style={{ 
                            textDecoration: 'none', 
                            padding: '1rem', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            aspectRatio: '1 / 1', 
                            borderRadius: '50%',
                            border: '3px solid #10b981',
                            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15)',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ backgroundColor: '#10b981', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
                            <Users size={28} />
                        </div>
                        <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: '700', color: '#1e293b', textAlign: 'center' }}>Trouver un<br />technicien</h3>
                    </Link>

                    <Link 
                        to="/marketplace" 
                        className="card animate-fade-in" 
                        style={{ 
                            textDecoration: 'none', 
                            padding: '1rem', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            aspectRatio: '1 / 1', 
                            borderRadius: '50%',
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ backgroundColor: '#2196f3', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
                            <ShieldCheck size={28} />
                        </div>
                        <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: '700', color: '#1e293b', textAlign: 'center' }}>Boutique des<br />techniciens</h3>
                    </Link>

                    <Link to="/invite" className="card" style={{ textDecoration: 'none', padding: '1rem', transition: 'transform 0.2s', gridColumn: '1 / -1', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '100px', marginTop: '0.5rem' }}>
                        <div style={{ backgroundColor: '#2196f3', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={16} />
                        </div>
                        <h3 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)' }}>Inviter des amis</h3>
                    </Link>
                </div>
            </div>
        );
    }

    // Splash Screen for guest users
    return <LandingPage />;
};

export default Home;
