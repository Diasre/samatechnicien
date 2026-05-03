import React from 'react';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import Footer from './Footer';
import { Outlet, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();
    
    // Détecter si on est sur une discussion (ex: /forum/123)
    const isDiscussionThread = location.pathname.startsWith('/forum/') && location.pathname.length > 7;
    
    // Liste des pages où on cache les menus de navigation habituels
    const hideNavbarRoutes = ['/login', '/register'];
    const shouldHide = hideNavbarRoutes.includes(location.pathname) || isDiscussionThread;

    return (
        <>
            {!shouldHide && <Navbar />}
            <main style={{ 
                minHeight: 'calc(100vh - 64px)', 
                paddingBottom: isDiscussionThread ? '0px' : '90px' // Pas d'espace vide en bas pour le chat
            }}>
                {children ? children : <Outlet />}
            </main>
            {!shouldHide && <Footer />}
            {!shouldHide && <MobileNav />}
        </>
    );
};

export default Layout;
