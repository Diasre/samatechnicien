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
                padding: '1.5rem 1rem',
                textAlign: 'center',
                minHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <WelcomeOverlay userName={user.fullName} duration={2000} />
                <img src={logo} alt="SamaTechnicien Logo" style={{ maxWidth: '250px', height: 'auto', margin: '0 auto 1rem' }} />
                <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', marginTop: '0' }}>
                    Bienvenue, <span style={{ color: 'var(--primary-color)' }}>{user.fullName}</span> !
                </h1>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Que souhaitez-vous faire aujourd'hui ?
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
                    <Link to="/technicians" className="card" style={{ textDecoration: 'none', padding: '1rem', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                            <ShieldCheck size={20} />
                        </div>
                        <h3 style={{ fontSize: '0.9rem', margin: 0 }}>Trouver un technicien</h3>
                    </Link>

                    <Link to="/marketplace" className="card" style={{ textDecoration: 'none', padding: '1rem', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <div style={{ backgroundColor: 'var(--secondary-color)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                            <ShieldCheck size={20} />
                        </div>
                        <h3 style={{ fontSize: '0.9rem', margin: 0 }}>Boutique des techniciens</h3>
                    </Link>

                    <Link to="/invite" className="card" style={{ textDecoration: 'none', padding: '1rem', transition: 'transform 0.2s', gridColumn: '1 / -1', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        <div style={{ backgroundColor: '#2196f3', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={16} />
                        </div>
                        <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Inviter des amis</h3>
                    </Link>
                </div>
            </div>
        );
    }

    // Splash Screen for guest users
    return <LandingPage />;
};

export default Home;
