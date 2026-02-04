import React from 'react';
import Navbar from './Navbar';
import { Outlet, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();
    const hideNavbarRoutes = ['/login', '/register'];

    return (
        <>
            {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}
            <main style={{ minHeight: 'calc(100vh - 100px)' }}>
                {children ? children : <Outlet />}
            </main>
            {!hideNavbarRoutes.includes(location.pathname) && (
                <footer style={{
                    textAlign: 'center',
                    padding: '1.5rem',
                    borderTop: '1px solid #eee',
                    color: '#999',
                    fontSize: '0.75rem',
                    background: '#f9f9f9'
                }}>
                    <p>&copy; {new Date().getFullYear()} SamaTechnicien</p>
                    <div style={{ marginTop: '5px', opacity: 0.8 }}>Version 2.1 (Fix Supabase)</div>
                </footer>
            )}
        </>
    );
};

export default Layout;
