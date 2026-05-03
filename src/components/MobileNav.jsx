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
    
    const userRole = (user?.role || "").toLowerCase();
    const isTechnician = userRole.includes('tech') || userRole.includes('expert') || userRole.includes('pro');
    const isLoggedIn = !!user;

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/', icon: Home, label: 'Accueil' },
        ...(isTechnician ? [] : [{ path: '/technicians', icon: Users, label: 'Pros' }]),
        { path: '/forum', icon: MessageCircle, label: 'Communauté' },
        { path: '/marketplace', icon: ShoppingBag, label: 'Sama Boutique' },
        { 
            path: isLoggedIn ? (isTechnician ? '/expert-dashboard' : '/dashboard') : '/register', 
            icon: User, 
            label: isLoggedIn ? 'Profil' : 'Compte',
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
                
                // Si l'utilisateur n'est pas connecté, seul 'Accueil' est cliquable
                const isLocked = !isLoggedIn && item.label !== 'Accueil';

                const content = (
                    <>
                        <div style={{
                            padding: item.highlight ? '8px' : '0',
                            backgroundColor: item.highlight ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: isLocked ? 0.3 : 1
                        }}>
                            {isLoggedIn && item.label === 'Profil' ? (
                                user.image ? (
                                    <img 
                                        src={user.image} 
                                        alt="Profile" 
                                        style={{ 
                                            width: '24px', 
                                            height: '24px', 
                                            borderRadius: '50%', 
                                            objectFit: 'cover',
                                            border: active ? '2px solid var(--primary-color)' : '1px solid #ddd'
                                        }} 
                                    />
                                ) : (
                                    <div style={{ 
                                        width: '24px', 
                                        height: '24px', 
                                        borderRadius: '50%', 
                                        background: active ? 'var(--primary-color)' : '#e2e8f0', 
                                        color: active ? 'white' : '#64748b', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontSize: '11px', 
                                        fontWeight: '800',
                                        border: active ? 'none' : '1px solid #cbd5e1'
                                    }}>
                                        {(user.fullname || user.fullName || "U").charAt(0).toUpperCase()}
                                    </div>
                                )
                            ) : (
                                <ActiveIcon size={20} strokeWidth={active ? 2.5 : 2} />
                            )}
                        </div>
                        <span style={{ 
                            fontSize: '9px', 
                            fontWeight: active ? '700' : '500',
                            opacity: isLocked ? 0.4 : 1
                        }}>
                            {item.label}
                        </span>
                    </>
                );

                if (isLocked) {
                    return (
                        <div key={item.path} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            color: '#999',
                            gap: '2px',
                            flex: 1,
                            cursor: 'default'
                        }}>
                            {content}
                        </div>
                    );
                }

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
                        {content}
                    </Link>
                );
            })}

        </div>
    );
};

export default MobileNav;
