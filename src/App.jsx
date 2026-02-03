import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
