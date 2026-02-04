import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { Users, Wrench, ShoppingBag, BarChart2, Edit, X, Lock, Unlock, MessageCircle, Clock } from 'lucide-react';
import WelcomeOverlay from '../components/WelcomeOverlay';

const StatCard = ({ title, value, color, icon }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem' }}>
        <div style={{
            backgroundColor: `${color}20`, color: color, padding: '0.5rem', borderRadius: '50%', display: 'flex'
        }}>
            {React.cloneElement(icon, { size: 18 })}
        </div>
        <div>
            <p style={{ margin: 0, color: '#666', fontSize: '0.75rem' }}>{title}</p>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{value}</h3>
        </div>
    </div>
);

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'tech'
    const [technicians, setTechnicians] = useState([]);
    const [clients, setClients] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [adminSubTab, setAdminSubTab] = useState('techs'); // 'techs', 'clients', 'feedback'
    const [isEditing, setIsEditing] = useState(false);
    const [techStats, setTechStats] = useState({ rating: 0, reviews_count: 0 });
    const [currentTech, setCurrentTech] = useState(null);
    const [fullTechData, setFullTechData] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));

    const fetchTechStats = async () => {
        try {
            // Get user data
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            // Get reviews to calculate stats accurately
            const { data: reviews, error: reviewsError } = await supabase
                .from('reviews')
                .select('rating')
                .eq('technicianId', user.id);

            if (reviewsError) throw reviewsError;

            let rating = 0;
            let count = 0;

            if (reviews && reviews.length > 0) {
                count = reviews.length;
                const total = reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
                rating = (total / count).toFixed(1);
            }

            if (userData) {
                setFullTechData({ ...userData, rating: rating, reviews_count: count });
                setTechStats({
                    rating: rating,
                    reviews_count: count
                });
            }
        } catch (error) {
            console.error("Error fetching tech stats:", error.message);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'technician');

            if (error) throw error;
            if (data) setTechnicians(data);
        } catch (error) {
            console.error("Error fetching technicians:", error.message);
        }
    };

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'client');

            if (error) throw error;
            if (data) setClients(data);
        } catch (error) {
            console.error("Error fetching clients:", error.message);
        }
    };

    const fetchFeedback = async () => {
        try {
            const { data, error } = await supabase
                .from('platform_feedback')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setFeedback(data);
        } catch (error) {
            console.error("Error fetching feedback:", error.message);
        }
    };

    useEffect(() => {
        if (activeTab === 'admin') {
            fetchTechnicians();
            fetchClients();
            fetchFeedback();
        } else if (activeTab === 'tech' && user?.id) {
            fetchTechStats();
        }
    }, [activeTab, user?.id]);

    const handleToggleBlock = async (tech) => {
        const confirmMessage = tech.isBlocked
            ? `Voulez-vous vraiment débloquer ${tech.fullName} ?`
            : `Voulez-vous vraiment bloquer ${tech.fullName} ?`;

        if (!window.confirm(confirmMessage)) return;

        try {
            const { error } = await supabase
                .from('users')
                .update({ isBlocked: tech.isBlocked ? 0 : 1 })
                .eq('id', tech.id);

            if (error) throw error;

            alert(`Utilisateur ${tech.isBlocked ? 'débloqué' : 'bloqué'} avec succès`);
            fetchTechnicians();
            fetchClients();

        } catch (error) {
            console.error(error);
            alert('Erreur technique : ' + error.message);
        }
    };

    const handlePasswordChange = async (userId, userName, isClient = true) => {
        const promptMsg = isClient
            ? `Entrez le nouveau Code PIN (4 chiffres) pour le client ${userName} :`
            : `Entrez le nouveau Code PIN (4 chiffres) pour le technicien ${userName} :`;

        const newPassword = window.prompt(promptMsg);

        if (newPassword && newPassword.trim() !== "") {
            if (!/^\d{4}$/.test(newPassword.trim())) {
                alert("Le PIN doit être composé de exactement 4 chiffres.");
                return;
            }

            try {
                // In a real app we would hash this. For now storing as is or consistent with current logic.
                const { error } = await supabase
                    .from('users')
                    .update({ password: newPassword.trim() })
                    .eq('id', userId);

                if (error) throw error;

                alert('Code PIN mis à jour avec succès');

            } catch (error) {
                console.error(error);
                alert('Erreur technique : ' + error.message);
            }
        }
    };

    const standardSpecialties = ["Informatique", "Téléphonie", "Imprimantes", "Réseaux"];

    const handleEdit = (tech) => {
        const isStandard = standardSpecialties.includes(tech.specialty);
        setCurrentTech({
            ...tech,
            specialtyType: isStandard ? tech.specialty : 'Autre',
            otherSpecialty: isStandard ? '' : tech.specialty || '',
            commentsEnabled: !!tech.commentsEnabled
        });
        setIsEditing(true);
    };

    const handleCloseModal = () => {
        setIsEditing(false);
        setCurrentTech(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                fullName: currentTech.fullName,
                email: currentTech.email,
                description: currentTech.description,
                image: currentTech.image,
                city: currentTech.city,
                phone: currentTech.phone,
                commentsEnabled: currentTech.commentsEnabled ? 1 : 0,
                specialty: currentTech.specialtyType === 'Autre' ? currentTech.otherSpecialty : currentTech.specialtyType
            };

            const { error } = await supabase
                .from('users')
                .update(payload)
                .eq('id', currentTech.id);

            if (error) throw error;

            alert('Informations mises à jour avec succès');
            setIsEditing(false);

            if (currentTech.id === user.id) {
                const updatedUser = { ...user, ...payload };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                fetchTechStats();
            }

            if (activeTab === 'admin') fetchTechnicians();

        } catch (error) {
            console.error(error);
            alert('Erreur technique : ' + error.message);
        }
    };

    const handleInputChange = (e) => {
        setCurrentTech({ ...currentTech, [e.target.name]: e.target.value });
    };

    return (
        <div className="container" style={{ padding: '1rem 1rem' }}>
            <WelcomeOverlay userName={user?.fullName} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Dashboard</h2>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                        className={`btn ${activeTab === 'tech' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setActiveTab('tech')}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    >Expert</button>
                    <button
                        className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setActiveTab('admin')}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    >Admin</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {activeTab === 'admin' ? (
                    <>
                        <StatCard title="Total Clients" value={clients.length} color="#3498DB" icon={<Users />} />
                        <StatCard title="Techniciens" value={technicians.length} color="#2ECC71" icon={<Wrench />} />
                        <StatCard title="Ventes" value="23" color="#9B59B6" icon={<ShoppingBag />} />
                        <StatCard title="Revenus" value="450k" color="#F1C40F" icon={<BarChart2 />} />
                    </>
                ) : (
                    <>
                        <StatCard title="Clients" value="12" color="#3498DB" icon={<Users />} />
                        <StatCard title="Ma Note" value={`${techStats.rating} (${techStats.reviews_count})`} color="#F1C40F" icon={<Wrench />} />
                        <StatCard title="Ventes" value="4" color="#9B59B6" icon={<ShoppingBag />} />
                        <StatCard title="Gains" value="85k" color="#2ECC71" icon={<BarChart2 />} />
                    </>
                )}
            </div>

            {activeTab === 'tech' && fullTechData && (
                <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <img
                            src={fullTechData.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullTechData.fullName)}&background=random&color=fff&size=100`}
                            alt={fullTechData.fullName}
                            style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>{fullTechData.fullName}</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{fullTechData.specialty} • {fullTechData.city}</p>
                        </div>
                        <button
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={() => handleEdit(fullTechData)}
                        >
                            Modifier mon profil
                        </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#444', fontStyle: fullTechData.description ? 'normal' : 'italic' }}>
                        {fullTechData.description || "Aucune description renseignée."}
                    </p>
                </div>
            )}

            {activeTab === 'admin' && (
                <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Gestion des Comptes</h3>
                        <div style={{ display: 'flex', backgroundColor: '#f0f0f0', padding: '4px', borderRadius: '8px' }}>
                            <button
                                onClick={() => setAdminSubTab('techs')}
                                style={{
                                    padding: '6px 16px', fontSize: '0.85rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
                                    backgroundColor: adminSubTab === 'techs' ? 'white' : 'transparent',
                                    fontWeight: adminSubTab === 'techs' ? 'bold' : 'normal',
                                    color: adminSubTab === 'techs' ? 'var(--primary-color)' : '#666',
                                    transition: 'all 0.2s',
                                    boxShadow: adminSubTab === 'techs' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >Techniciens ({technicians.length})</button>
                            <button
                                onClick={() => setAdminSubTab('feedback')}
                                style={{
                                    padding: '6px 16px', fontSize: '0.85rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
                                    backgroundColor: adminSubTab === 'feedback' ? 'white' : 'transparent',
                                    fontWeight: adminSubTab === 'feedback' ? 'bold' : 'normal',
                                    color: adminSubTab === 'feedback' ? 'var(--primary-color)' : '#666',
                                    transition: 'all 0.2s',
                                    boxShadow: adminSubTab === 'feedback' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >Revendications ({feedback.length})</button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        {adminSubTab === 'techs' ? (
                            <div>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#666' }}>Liste des Techniciens</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f9fafb', color: '#4b5563', borderBottom: '2px solid #edf2f7' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nom</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Spécialité</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Ville</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {technicians.map((tech) => (
                                            <tr key={tech.id} style={{
                                                borderBottom: '1px solid #edf2f7',
                                                backgroundColor: tech.isBlocked ? '#fff5f5' : 'transparent'
                                            }}>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {tech.fullName}
                                                        {tech.isBlocked === 1 && <span style={{ fontSize: '0.65rem', backgroundColor: '#feb2b2', color: '#9b2c2c', padding: '1px 6px', borderRadius: '4px' }}>Bloqué</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ebf8ff', color: '#2b6cb0', fontSize: '0.75rem' }}>
                                                        {tech.specialty}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>{tech.city}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button className="btn btn-outline" style={{ padding: '0.3rem', borderRadius: '4px' }} onClick={() => handleEdit(tech)} title="Modifier profil"><Edit size={14} /></button>
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.3rem', borderRadius: '4px' }}
                                                            onClick={() => handlePasswordChange(tech.id, tech.fullName, false)}
                                                            title="Changer le PIN"
                                                        >
                                                            <Lock size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.3rem', borderRadius: '4px', color: tech.isBlocked ? '#38a169' : '#d69e2e' }}
                                                            onClick={() => handleToggleBlock(tech)}
                                                            title={tech.isBlocked ? "Débloquer" : "Bloquer"}
                                                        >
                                                            {tech.isBlocked ? <Unlock size={14} /> : <X size={14} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : adminSubTab === 'clients' ? (
                            <div>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#666' }}>Liste des Clients Inscrits</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f9fafb', color: '#4b5563', borderBottom: '2px solid #edf2f7' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Client</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Contact</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Localisation</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clients.length === 0 ? (
                                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Aucun client trouvé.</td></tr>
                                        ) : (
                                            clients.map((client) => (
                                                <tr key={client.id} style={{
                                                    borderBottom: '1px solid #edf2f7',
                                                    backgroundColor: client.isBlocked ? '#fff5f5' : 'transparent'
                                                }}>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ fontWeight: '500' }}>{client.fullName}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#888' }}>ID: #{client.id}</div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ fontSize: '0.8rem' }}>{client.email}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{client.phone}</div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>{client.city} {client.district ? `(${client.district})` : ''}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                            <button
                                                                className="btn btn-outline"
                                                                style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem' }}
                                                                onClick={() => handlePasswordChange(client.id, client.fullName, true)}
                                                            >
                                                                Code PIN
                                                            </button>
                                                            <button
                                                                className="btn btn-outline"
                                                                style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem', color: client.isBlocked ? '#38a169' : '#e53e3e' }}
                                                                onClick={() => handleToggleBlock(client)}
                                                            >
                                                                {client.isBlocked ? 'Débloquer' : 'Bloquer'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#666' }}>Revendications et Suggestions</h4>
                                {feedback.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Aucune revendication reçue.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {feedback.map(item => (
                                            <div key={item.id} className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--primary-color)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <strong style={{ fontSize: '0.9rem' }}>{item.userName || 'Anonyme'}</strong>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#999', fontSize: '0.7rem' }}>
                                                        <Clock size={12} />
                                                        {new Date(item.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#444', lineHeight: '1.4' }}>{item.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isEditing && currentTech && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '350px', padding: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Modifier le profil</h3>
                            <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ fontSize: '0.85rem' }}>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Nom complet</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={currentTech.fullName}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                                />
                            </div>

                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={currentTech.email}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                                />
                            </div>

                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Photo de profil (Upload)</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;

                                            try {
                                                const fileExt = file.name.split('.').pop();
                                                const fileName = `avatars/${currentTech.id}_${Date.now()}.${fileExt}`;

                                                const { error: uploadError } = await supabase.storage
                                                    .from('products') // Reuse products bucket for simplicity
                                                    .upload(fileName, file);

                                                if (uploadError) throw uploadError;

                                                const { data } = supabase.storage.from('products').getPublicUrl(fileName);

                                                if (data.publicUrl) {
                                                    setCurrentTech(prev => ({ ...prev, image: data.publicUrl }));
                                                }
                                            } catch (err) {
                                                console.error("Upload error:", err);
                                                alert("Erreur lors de l'upload de l'image : " + err.message);
                                            }
                                        }}
                                        style={{ fontSize: '0.8rem' }}
                                    />
                                    {currentTech.image && (
                                        <img src={currentTech.image} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Biographie</label>
                                <textarea
                                    name="description"
                                    value={currentTech.description || ''}
                                    onChange={handleInputChange}
                                    placeholder="Biographie du technicien..."
                                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem', minHeight: '100px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Spécialité</label>
                                <select
                                    name="specialtyType"
                                    value={currentTech.specialtyType}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem', backgroundColor: 'white' }}
                                >
                                    <option value="Informatique">Informatique</option>
                                    <option value="Téléphonie">Téléphonie</option>
                                    <option value="Imprimantes">Imprimantes</option>
                                    <option value="Réseaux">Réseaux</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>

                            {currentTech.specialtyType === 'Autre' && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Précisez le métier</label>
                                    <input
                                        type="text"
                                        name="otherSpecialty"
                                        value={currentTech.otherSpecialty}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Ville</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={currentTech.city}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.2rem', fontWeight: '500' }}>Tél</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={currentTech.phone || ''}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                <input
                                    type="checkbox"
                                    id="commentsEnabledAdmin"
                                    checked={currentTech.commentsEnabled}
                                    onChange={(e) => setCurrentTech({ ...currentTech, commentsEnabled: e.target.checked })}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label htmlFor="commentsEnabledAdmin" style={{ fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>
                                    Autoriser les avis sur ce profil
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={handleCloseModal} className="btn btn-outline" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}>
                                    Sauvegarder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
