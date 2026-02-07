import React from 'react';
import Navbar from './Navbar';
import { Outlet, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();
    const hideNavbarRoutes = ['/login', '/register'];

    return (
        <>
            {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}
            <main style={{ minHeight: 'calc(100vh - 64px)' }}>
                {children ? children : <Outlet />}
            </main>
        </>
    );
};

export default Layout;
