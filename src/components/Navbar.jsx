import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, MessageSquare, MessageCircle, Settings, Power, LogOut, Heart } from 'lucide-react';
import logo from '../assets/logo.png';
import { supabase } from '../supabaseClient';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();

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

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            localStorage.clear();
            setShowLogoutModal(false);
            window.location.href = '/login';
        } catch (e) {
            console.error("Erreur déconnexion:", e);
        }
    };

    // It's strictly an entry page if you're not logged in, OR if you're on login/register
    const isEntryPage = (!isLoggedIn && path === '/') || ['/login', '/register'].includes(path);

    if (isEntryPage) return null;

    return (
        <>
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
                        <img src={logo} alt="SamaTechnicien Logo" className="nav-logo" />
                    </Link>

                    {/* Desktop Menu */}
                    <div className="desktop-menu" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Link to={user?.role === 'technician' ? "/expert-dashboard" : "/"} className={`nav-link ${isActive('/')}`}>Accueil</Link>
                        {user?.role !== 'technician' && (
                            <Link to={isLoggedIn ? "/technicians" : "/register"} className={`nav-link ${isActive('/technicians')}`} style={{ textDecoration: 'none' }}>
                                Trouver un technicien
                            </Link>
                        )}
                        <Link to="/marketplace" className={`nav-link ${isActive('/marketplace')}`}>Boutique des techniciens</Link>
                        {user?.role === 'technician' && (
                            <Link to="/expert-dashboard" className={`nav-link ${isActive('/expert-dashboard')}`} style={{ color: '#10b981', fontWeight: '700', border: '1px solid #10b981', borderRadius: '15px', padding: '0.2rem 0.6rem' }}>
                                Mon Espace Expert
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
                                    onClick={() => setShowLogoutModal(true)}
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
                        <button className="mobile-menu-btn" onClick={toggleMenu} style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px', marginTop: '8px' }}>
                            {isOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                <div className={`mobile-nav ${isOpen ? 'open' : ''}`} style={{ display: 'flex' }}>
                    <Link to={user?.role === 'technician' ? "/expert-dashboard" : "/"} onClick={toggleMenu} className={`nav-link ${isActive('/')}`}>Accueil</Link>
                    <Link to="/marketplace" onClick={toggleMenu} className={`nav-link ${isActive('/marketplace')}`}>Boutique</Link>
                    
                    <hr style={{ border: 'none', borderTop: '1px solid #eee', width: '100%' }} />
                    
                    {isLoggedIn && (
                        <>
                            <Link to="/profile" onClick={toggleMenu} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Settings size={20} /> Paramètres
                            </Link>
                            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <button
                                    onClick={() => { setShowLogoutModal(true); toggleMenu(); }}
                                    style={{ 
                                        width: '64px', height: '64px', backgroundColor: '#e11d48', 
                                        color: 'white', border: 'none', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', boxShadow: '0 6px 12px rgba(225, 29, 72, 0.4)'
                                    }}
                                >
                                    <Power size={28} strokeWidth={2.5} />
                                </button>
                                <span style={{ fontSize: '0.9rem', color: '#e11d48', fontWeight: 'bold' }}>Déconnexion</span>
                            </div>
                        </>
                    )}
                </div>
            </nav>

            {/* Logout Confirmation Modal - Style inspiré de ton image */}
            {showLogoutModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px', fontFamily: "'Outfit', sans-serif"
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '24px', padding: '30px',
                        maxWidth: '400px', width: '100%', textAlign: 'center',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        animation: 'popIn 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67)'
                    }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '18px',
                            background: '#ecfdf5', color: '#10b981', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                        }}>
                            <LogOut size={30} strokeWidth={2.5} />
                        </div>
                        
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '10px', color: '#1e293b' }}>Déconnexion</h2>
                        <p style={{ color: '#64748b', marginBottom: '25px', lineHeight: '1.5' }}>Voulez-vous vraiment quitter votre session sur SamaTechnicien ?</p>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={() => setShowLogoutModal(false)}
                                style={{ 
                                    flex: 1, padding: '12px', borderRadius: '15px', border: '1px solid #e2e8f0',
                                    background: 'white', color: '#64748b', fontWeight: '700', cursor: 'pointer'
                                }}
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleLogout}
                                style={{ 
                                    flex: 1, padding: '12px', borderRadius: '15px', border: 'none',
                                    background: '#10b981', color: 'white', fontWeight: '700', cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                Oui, sortir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes popIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </>
    );
};

export default Navbar;
