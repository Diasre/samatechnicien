import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Import supabase
import Layout from './components/Layout';
import Home from './pages/Home';
import TechniciansList from './pages/TechniciansList';
import TechnicianProfile from './pages/TechnicianProfile';
import Marketplace from './pages/Marketplace';
import Chat from './pages/Chat';
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
import Terms from './pages/Terms';

const AdminRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || user.email !== 'Diassecke@gmail.com') {
        return <Navigate to="/" replace />;
    }

    return children;
};

const TechnicianRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user'));

    const userRole = (user?.role || "").toLowerCase().trim();
    const isTech = userRole.includes('tech') || userRole.includes('expert') || userRole.includes('pro');

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!isTech) {
        console.warn("🚫 Rôle non reconnu pour accès Expert:", userRole);
        return <Navigate to="/" replace />; // On renvoie à l'accueil plutôt que de déconnecter
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
        // Vérifier si l'utilisateur existe encore en base de données
        // verifyProfile a été mis en pause car il provoquait des déconnexions intempestives (V98)
        /*
        const verifyProfile = async () => {
            const stored = localStorage.getItem('user');
            if (stored) {
                try {
                    const u = JSON.parse(stored);
                    if (u?.id) {
                        const { data, error } = await supabase.from('users').select('id').eq('id', u.id).maybeSingle();
                        if (!data && !error) {
                            console.warn('Profil introuvable, déconnexion...');
                            localStorage.clear(); 
                            await supabase.auth.signOut();
                            window.location.reload();
                        }
                    }
                } catch (e) { console.error(e); }
            }
        };
        verifyProfile();
        */

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("🔔 Global Auth Event:", event);

            if (event === 'SIGNED_IN' && session) {
                // L'utilisateur vient d'être connecté via Supabase (Magic Link ou autre)
                // On vérifie si on a déjà la session locale "Legacy"
                const localUser = localStorage.getItem('user');

                if (!localUser) {
                    try {
                        console.log("🔄 Session Supabase détectée, synchronisation du profil pour ID:", session.user.id);

                        // 2. On récupère le profil complet via l'ID
                        let { data: userData, error: fetchError } = await supabase
                            .from('users')
                            .select('*')
                            .eq('id', session.user.id)
                            .maybeSingle();

                        // 🛡️ SECOURS : Recherche par téléphone si l'ID échoue (fréquent sur mobile)
                        if (!userData && session.user.phone) {
                            console.log("🔍 Secours: Recherche profil par téléphone...");
                            const cleanPhone = session.user.phone.replace('+', '');
                            const { data: fallbackData } = await supabase
                                .from('users')
                                .select('*')
                                .or(`phone.eq.${cleanPhone},phone.eq.${session.user.phone}`)
                                .maybeSingle();
                            if (fallbackData) userData = fallbackData;
                        }

                        if (userData) {
                            console.log("✅ Profil identifié, mise à jour session...");
                            const finalUserData = userData || {}; 
                            
                            // 🛠️ RÉPARATION DU RÔLE (V180)
                            // Si l'utilisateur était déjà connu comme tech, on garde ce rôle même si la DB est vide
                            const oldUser = JSON.parse(localStorage.getItem('user') || '{}');
                            const oldRole = (oldUser.role || "").toLowerCase();
                            const isOldTech = ['technician', 'technicien', 'expert'].includes(oldRole);
                            
                            let finalRole = (finalUserData.role || "").toLowerCase().trim();
                            if (!finalRole && isOldTech) finalRole = 'technician';
                            if (!finalRole) finalRole = 'client';

                            const mappedUser = {
                                ...finalUserData,
                                fullName: finalUserData.fullname || finalUserData.full_name || finalUserData.fullName || "Utilisateur",
                                isBlocked: (finalUserData.isblocked !== undefined ? finalUserData.isblocked : finalUserData.isBlocked) === 1,
                                role: finalRole
                            };

                            localStorage.setItem('user', JSON.stringify(mappedUser));
                            
                            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                                window.location.reload();
                            }
                        }
                    } catch (err) {
                        console.error("💥 Erreur critique lors de la synchronisation:", err);
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
                    <Route path="/terms" element={<Terms />} />
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
                    <Route path="/chat" element={
                        <ProtectedRoute>
                            <Chat />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
