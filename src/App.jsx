import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Import supabase
import Layout from './components/Layout';
import Home from './pages/Home';
import TechniciansList from './pages/TechniciansList';
import TechnicianProfile from './pages/TechnicianProfile';
import Marketplace from './pages/Marketplace';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ExpertDashboard from './pages/ExpertDashboard';
import Forum from './pages/Forum';
import DiscussionThread from './pages/DiscussionThread';
import ProfileSettings from './pages/ProfileSettings';
import Invite from './pages/Invite';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';

const AdminRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || user.email !== 'Diassecke@gmail.com') {
        return <Navigate to="/" replace />;
    }

    return children;
};

const TechnicianRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || user.role !== 'technician') {
        return <Navigate to="/login" replace />;
    }

    return children;
};

const ProtectedRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        // Option: show an alert before redirecting
        // alert("Veuillez vous inscrire ou vous connecter pour voir nos techniciens.");
        return <Navigate to="/register" replace />;
    }

    return children;
};

function App() {
    // 🌍 GESTIONNAIRE D'AUTHENTIFICATION GLOBAL
    // Écoute les connexions Supabase (ex: après clic email) sur TOUTES les pages
    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("🔔 Global Auth Event:", event);

            if (event === 'SIGNED_IN' && session) {
                // L'utilisateur vient d'être connecté via Supabase (Magic Link ou autre)
                // On vérifie si on a déjà la session locale "Legacy"
                const localUser = localStorage.getItem('user');

                if (!localUser) {
                    console.log("🔄 Session Supabase détectée, synchronisation du profil...");

                    // 1. On synchronise le statut vérifié
                    if (session.user.email_confirmed_at) {
                        await supabase.from('users').update({ email_verified: true }).eq('email', session.user.email);
                    }

                    // 2. On récupère le profil complet
                    const { data: userData } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', session.user.email)
                        .single();

                    if (userData) {
                        // 3. On crée la session locale
                        const mappedUser = {
                            ...userData,
                            fullName: userData.fullname || userData.fullName,
                            isBlocked: (userData.isblocked !== undefined ? userData.isblocked : userData.isBlocked) === 1,
                            commentsEnabled: (userData.commentsenabled !== undefined ? userData.commentsenabled : userData.commentsEnabled) !== 0,
                        };

                        localStorage.setItem('user', JSON.stringify(mappedUser));
                        alert("Connexion automatique réussie ! Bienvenue " + mappedUser.fullName);
                        // On recharge pour mettre à jour l'interface (Header, etc.)
                        window.location.reload();
                    }
                }
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/technicians" element={<TechniciansList />} />
                    <Route path="/technician/:id" element={<TechnicianProfile />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/update-password" element={<UpdatePassword />} />
                    <Route path="/dashboard" element={
                        <AdminRoute>
                            <Dashboard />
                        </AdminRoute>
                    } />
                    <Route path="/expert-dashboard" element={
                        <TechnicianRoute>
                            <ExpertDashboard />
                        </TechnicianRoute>
                    } />
                    <Route path="/forum" element={
                        <TechnicianRoute>
                            <Forum />
                        </TechnicianRoute>
                    } />
                    <Route path="/forum/:id" element={
                        <TechnicianRoute>
                            <DiscussionThread />
                        </TechnicianRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <ProfileSettings />
                        </ProtectedRoute>
                    } />
                    <Route path="/invite" element={
                        <ProtectedRoute>
                            <Invite />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
