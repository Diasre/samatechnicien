import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, MessageSquare, MessageCircle, Settings, Power } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const location = useLocation();

    React.useEffect(() => {
        const updateCount = () => {
            try {
                const storedCart = localStorage.getItem('cart');
                const cart = storedCart ? JSON.parse(storedCart) : [];
                setCartCount(cart.length);
            } catch (e) {
                console.error('Cart access blocked:', e);
                setCartCount(0);
            }
        };
        updateCount();
        window.addEventListener('cartUpdated', updateCount);
        return () => window.removeEventListener('cartUpdated', updateCount);
    }, []);

    const toggleMenu = () => setIsOpen(!isOpen);

    const isActive = (path) => location.pathname === path ? 'active-link' : '';

    const path = location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    
    let user = null;
    try {
        const stored = localStorage.getItem('user');
        if (stored) user = JSON.parse(stored);
    } catch (e) {
        console.error('User session access denied:', e);
    }
    const isLoggedIn = !!user;

    // It's strictly an entry page if you're not logged in, OR if you're on login/register
    const isEntryPage = (!isLoggedIn && path === '/') || ['/login', '/register'].includes(path);

    // Minimal Navbar for Entry Pages (Splash, Login, Register)
    if (isEntryPage) {
        return null;
    }


    // Full Navbar for the rest of the application
    return (
        <nav className="navbar" style={{
            backgroundColor: 'var(--surface-color)',
            boxShadow: 'var(--shadow-sm)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            borderBottom: '1px solid #eee'
        }}>
            <div className="container navbar-container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                {/* Logo */}
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                        src={logo}
                        alt="SamaTechnicien Logo"
                        className="nav-logo"
                    />
                </Link>

                {/* Desktop Menu */}
                <div className="desktop-menu" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link to="/" className={`nav-link ${isActive('/')}`}>Accueil</Link>
                    <Link 
                        to="/technicians" 
                        className={`nav-link ${isActive('/technicians')}`}
                        style={{ textDecoration: 'none' }}
                    >
                        Trouver un technicien
                    </Link>
                    <Link to="/marketplace" className={`nav-link ${isActive('/marketplace')}`}>Boutique des techniciens</Link>
                    {user?.role === 'technician' && (
                        <Link to="/forum" className={`nav-link ${isActive('/forum')}`} style={{ color: 'var(--primary-color)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageSquare size={16} /> Communauté
                        </Link>
                    )}
                </div>

                {/* Right Side Buttons */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div className="desktop-menu" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Link to="/cart" style={{ color: 'var(--text-primary)', position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <ShoppingBag size={18} />
                            {cartCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: -4, right: -4,
                                    background: 'var(--error-color)', color: 'white',
                                    borderRadius: '50%', width: '14px', height: '14px',
                                    fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>{cartCount}</span>
                            )}
                        </Link>

                        {isLoggedIn && (
                            <button
                                onClick={() => {
                                    if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
                                        localStorage.removeItem('user');
                                        window.location.href = '/login';
                                    }
                                }}
                                style={{ 
                                    width: '38px', height: '38px', backgroundColor: '#e11d48', 
                                    color: 'white', border: 'none', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', boxShadow: '0 4px 10px rgba(225, 29, 72, 0.3)',
                                    marginLeft: '5px'
                                }}
                                title="Se déconnecter"
                            >
                                <Power size={20} strokeWidth={2.5} />
                            </button>
                        )}

                        {!isLoggedIn && (
                            <Link to="/login" className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                                Connexion
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={toggleMenu}
                        style={{
                            display: 'none', background: 'none', border: 'none',
                            color: 'var(--text-primary)', cursor: 'pointer', padding: '8px', // Increased padding for easier click
                            marginTop: '8px' // Pushes the button down slightly
                        }}
                    >
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            <div className={`mobile-nav ${isOpen ? 'open' : ''}`} style={{ display: 'flex' }}>
                <Link to="/" onClick={toggleMenu} className={`nav-link ${isActive('/')}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '600' }}>Accueil</Link>
                <Link to="/technicians" onClick={toggleMenu} className={`nav-link ${isActive('/technicians')}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '600' }}>Trouver un technicien</Link>
                <Link to="/marketplace" onClick={toggleMenu} className={`nav-link ${isActive('/marketplace')}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '600' }}>Boutique des techniciens</Link>
                {user?.role === 'technician' && (
                    <Link to="/forum" onClick={toggleMenu} className={`nav-link ${isActive('/forum')}`} style={{ textDecoration: 'none', color: 'var(--primary-color)', fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageSquare size={20} /> Communauté
                    </Link>
                )}
                <hr style={{ border: 'none', borderTop: '1px solid #eee', width: '100%' }} />
                {isLoggedIn && (
                    <Link to="/chat" onClick={toggleMenu} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MessageCircle size={20} /> Mes Messages
                    </Link>
                )}
                <Link to="/cart" onClick={toggleMenu} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShoppingBag size={20} /> Panier ({cartCount})
                </Link>
                {isLoggedIn && (
                    <Link to="/profile" onClick={toggleMenu} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Settings size={20} /> Paramètres du profil
                    </Link>
                )}

                {isLoggedIn && (
                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={() => {
                                if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
                                    localStorage.removeItem('user');
                                    window.location.href = '/login';
                                }
                            }}
                            style={{ 
                                width: '64px', height: '64px', backgroundColor: '#e11d48', 
                                color: 'white', border: 'none', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', boxShadow: '0 6px 12px rgba(225, 29, 72, 0.4)'
                            }}
                        >
                            <Power size={28} strokeWidth={2.5} />
                        </button>
                        <span style={{ fontSize: '0.9rem', color: '#e11d48', fontWeight: 'bold' }}>Se déconnecter</span>
                    </div>
                )}

                {!isLoggedIn && (
                    <Link to="/login" onClick={toggleMenu} className="btn btn-primary" style={{ marginTop: '1rem', textAlign: 'center' }}>
                        Se connecter
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
