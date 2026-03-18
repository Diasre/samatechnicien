import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users } from 'lucide-react';
import logo from '../assets/logo.png';

import WelcomeOverlay from '../components/WelcomeOverlay';
import LandingPage from './LandingPage';

const Home = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const isLoggedIn = !!user;

    // Logged-in Home View
    if (isLoggedIn) {
        return (
            <div className="container animate-fade-in" style={{
                padding: '0.5rem 1rem',
                textAlign: 'center',
                minHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <WelcomeOverlay userName={user.fullName} duration={2000} />
                <div style={{
                    width: '180px', height: '180px', margin: '0 auto 0.75rem',
                    backgroundColor: 'white', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                }}>
                    <img src={logo} alt="SamaTechnicien Logo" style={{ maxWidth: '85%', height: 'auto', objectFit: 'contain' }} />
                </div>
                <h1 style={{ fontSize: '1.35rem', marginBottom: '0.25rem', marginTop: '0' }}>
                    Bienvenue, <span style={{ color: 'var(--primary-color)' }}>{user.fullName}</span> !
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Que souhaitez-vous faire aujourd'hui ?
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', maxWidth: '360px', margin: '0 auto', width: '100%' }}>
                    <Link to="/technicians" className="card" style={{ textDecoration: 'none', padding: '0.5rem', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', aspectRatio: '1 / 1', borderRadius: '50%' }}>
                        <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.4rem' }}>
                            <ShieldCheck size={18} />
                        </div>
                        <h3 style={{ fontSize: '0.8rem', margin: 0, textAlign: 'center', lineHeight: '1.2' }}>Trouver un<br />technicien</h3>
                    </Link>

                    <Link to="/marketplace" className="card" style={{ textDecoration: 'none', padding: '0.5rem', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', aspectRatio: '1 / 1', borderRadius: '50%' }}>
                        <div style={{ backgroundColor: 'var(--secondary-color)', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.4rem' }}>
                            <ShieldCheck size={18} />
                        </div>
                        <h3 style={{ fontSize: '0.8rem', margin: 0, textAlign: 'center', lineHeight: '1.2' }}>Boutique des<br />techniciens</h3>
                    </Link>

                    <Link to="/invite" className="card" style={{ textDecoration: 'none', padding: '0.85rem', transition: 'transform 0.2s', gridColumn: '1 / -1', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '100px' }}>
                        <div style={{ backgroundColor: '#2196f3', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={16} />
                        </div>
                        <h3 style={{ fontSize: '0.9rem', margin: 0 }}>Inviter des amis</h3>
                    </Link>
                </div>
            </div>
        );
    }

    // Splash Screen for guest users
    return <LandingPage />;
};

export default Home;
