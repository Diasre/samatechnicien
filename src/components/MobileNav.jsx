import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, PlusSquare, MessageCircle, User, Users } from 'lucide-react';

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

    return (
        <div className="mobile-only-nav" style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: '25px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '12px 10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            zIndex: 2000,
            border: '1px solid rgba(255, 255, 255, 0.3)',
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
                            gap: '4px',
                            transition: 'all 0.2s ease'
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
                            <ActiveIcon size={item.highlight ? 24 : 20} strokeWidth={active ? 2.5 : 2} />
                        </div>
                        <span style={{ 
                            fontSize: '10px', 
                            fontWeight: active ? '700' : '500',
                            opacity: active ? 1 : 0.8
                        }}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
};

export default MobileNav;
