import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StatusBar, Style } from '@capacitor/status-bar';
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

// Dashboard is now open to all authenticated users

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
        // 🔋 CONFIGURATION BARRE DE STATUT (V155)
        const initStatusBar = async () => {
            try {
                // Définit le style des icônes (Sombre pour fond clair)
                await StatusBar.setStyle({ style: Style.Light }); // Light style means DARK icons
                // Assure que la barre est visible
                await StatusBar.show();
            } catch (e) {
                console.log("StatusBar plugin not available");
            }
        };
        initStatusBar();

        // 🛠️ RÉCUPÉRATION DE SESSION AU CHARGEMENT (Persistent Session Guard)
        const checkInitialSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error || !session) {
                if (localStorage.getItem('user')) {
                    console.log("⚠️ Session expirée ou invalide. Nettoyage du cache...");
                    localStorage.removeItem('user');
                    if (!['/login', '/register', '/'].includes(window.location.pathname)) {
                        window.location.href = '/login';
                    }
                }
            } else if (session && !localStorage.getItem('user')) {
                console.log("🛠️ Restauration de session locale depuis Supabase...");
                await syncUserProfile(session.user);
            }
        };
        
        const syncUserProfile = async (authUser) => {
            if (!authUser) return;
            try {
                // 2. On récupère le profil complet via l'ID
                let { data: userData, error: fetchError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .maybeSingle();

                // 🛡️ SECOURS : Recherche par téléphone si l'ID échoue (fréquent sur mobile)
                if (!userData && authUser.phone) {
                    console.log("🔍 Secours: Recherche profil par téléphone...");
                    const cleanPhone = authUser.phone.replace('+', '');
                    const { data: fallbackData } = await supabase
                        .from('users')
                        .select('*')
                        .or(`phone.eq.${cleanPhone},phone.eq.${authUser.phone}`)
                        .maybeSingle();
                    if (fallbackData) userData = fallbackData;
                }

                if (userData) {
                    console.log("✅ Profil identifié, mise à jour session...");
                    const finalUserData = userData || {}; 
                    
                    // 🛠️ RÉPARATION DU RÔLE (V185)
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
                    
                    // Ne pas recharger si on est déjà sur une page publique
                    if (!['/login', '/register'].includes(window.location.pathname)) {
                        window.location.reload();
                    }
                }
            } catch (err) {
                console.error("💥 Erreur lors de la synchronisation:", err);
            }
        };

        checkInitialSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("🔔 Événement Auth:", event);

            if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
                console.log("👋 Déconnexion détectée, nettoyage...");
                localStorage.removeItem('user');
                if (!['/login', '/register', '/'].includes(window.location.pathname)) {
                    window.location.href = '/login';
                }
            } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
                const localUser = localStorage.getItem('user');
                // On synchronise si localUser est absent OU si c'est un refresh (pour éviter les données obsolètes)
                if (!localUser || event === 'TOKEN_REFRESHED') {
                    await syncUserProfile(session.user);
                }
            }
        });

        // 🌍 SYSTÈME DE PRÉSENCE GLOBAL (V160)
        const updateGlobalPresence = async (status) => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user?.id) return;
            try {
                await supabase.from('users').update({ availability: status }).eq('id', user.id);
            } catch (e) { /* ignore */ }
        };

        // En ligne à l'ouverture de l'app
        updateGlobalPresence('available');
        
        // Heartbeat toutes les 60s
        const globalHeartbeat = setInterval(() => updateGlobalPresence('available'), 60000);

        return () => {
            clearInterval(globalHeartbeat);
            updateGlobalPresence('unavailable');
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
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/expert-dashboard" element={
                        <TechnicianRoute>
                            <ExpertDashboard />
                        </TechnicianRoute>
                    } />
                    <Route path="/forum" element={
                        <ProtectedRoute>
                            <Forum />
                        </ProtectedRoute>
                    } />
                    <Route path="/forum/:id" element={
                        <ProtectedRoute>
                            <DiscussionThread />
                        </ProtectedRoute>
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
