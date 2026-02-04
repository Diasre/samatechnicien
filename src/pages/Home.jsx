import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users } from 'lucide-react';
import logo from '../assets/logo.png';

import WelcomeOverlay from '../components/WelcomeOverlay';

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
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
            <div className="container splash-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
                <img src={logo} alt="SamaTechnicien Logo" className="animate-fade-in splash-logo" />

                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '500px', width: '100%', marginTop: '0' }}>
                    <h1 className="splash-title">
                        Sama<span style={{ color: 'var(--primary-color)' }}>Technicien</span>
                    </h1>
                    <p className="splash-subtitle" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                        Réparations Expertes au Sénégal.
                    </p>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <Link to="/login" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', borderRadius: '8px' }}>
                            Connexion
                        </Link>
                        <Link to="/register" className="btn btn-outline" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', borderRadius: '8px' }}>
                            S'inscrire
                        </Link>
                    </div>

                    <div className="splash-image-container">
                        <img src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=2070" alt="Repair Service" style={{ width: '100%', borderRadius: '8px', boxShadow: '0 3px 6px rgba(0,0,0,0.1)' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
