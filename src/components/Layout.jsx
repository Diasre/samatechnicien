import React from 'react';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import Footer from './Footer';
import { Outlet, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();
    const hideNavbarRoutes = ['/login', '/register'];

    return (
        <>
            {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}
            <main style={{ minHeight: 'calc(100vh - 64px)', paddingBottom: '90px' }}>
                {children ? children : <Outlet />}
            </main>
            {!hideNavbarRoutes.includes(location.pathname) && <MobileNav />}
            {!hideNavbarRoutes.includes(location.pathname) && <Footer />}
        </>
    );
};

export default Layout;
