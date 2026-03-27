import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, PlusSquare, MessageCircle, User, Users, Power } from 'lucide-react';

const MobileNav = () => {
    const location = useLocation();
    
    let user = null;
    try {
        const stored = localStorage.getItem('user');
        if (stored) user = JSON.parse(stored);
    } catch (e) {
        console.error('Mobile storage blocked:', e);
    }
    
    const isTechnician = user?.role === 'technician';
    const isLoggedIn = !!user;

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/', icon: Home, label: 'Accueil' },
        { path: '/technicians', icon: Users, label: 'Pros' },
        { path: '/marketplace', icon: ShoppingBag, label: 'Boutique' },
        { 
            path: isTechnician ? '/expert-dashboard' : '/register', 
            icon: PlusSquare, 
            label: isTechnician ? 'Publier' : 'Compte',
            highlight: true 
        },
    ];

    const handleLogout = () => {
        if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    };

    return (
        <div className="mobile-only-nav" style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '95%',
            maxWidth: '430px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(15px)',
            borderRadius: '25px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            zIndex: 2000,
            border: '1px solid rgba(255, 255, 255, 0.5)',
        }}>
            {navItems.map((item) => {
                const ActiveIcon = item.icon;
                const active = isActive(item.path);

                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: item.highlight 
                                ? 'var(--primary-color)' 
                                : (active ? 'var(--primary-color)' : '#666'),
                            gap: '2px',
                            transition: 'all 0.2s ease',
                            flex: 1
                        }}
                    >
                        <div style={{
                            padding: item.highlight ? '8px' : '0',
                            backgroundColor: item.highlight ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <ActiveIcon size={20} strokeWidth={active ? 2.5 : 2} />
                        </div>
                        <span style={{ 
                            fontSize: '9px', 
                            fontWeight: active ? '700' : '500',
                        }}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}

            {isLoggedIn && (
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        background: 'none',
                        border: 'none',
                        color: '#e11d48',
                        gap: '2px',
                        cursor: 'pointer',
                        flex: 1
                    }}
                >
                    <div style={{
                        padding: '6px',
                        backgroundColor: 'rgba(225, 29, 72, 0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(225, 29, 72, 0.2)'
                    }}>
                        <Power size={20} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: '700' }}>Sortir</span>
                </button>
            )}
        </div>
    );
};

export default MobileNav;
