import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { technicians } from '../data/mockData';
import { Search, MapPin, Star, Phone, MessageCircle, AlertCircle } from 'lucide-react';

const TechniciansList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [allTechnicians, setAllTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTechnicians = async () => {
            setLoading(true);
            try {
                // Fetch technicians from Supabase
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('role', 'technician');

                if (error) throw error;

                if (data) {
                    // Map real users to technician format
                    const realTechs = data.map(user => ({
                        id: user.id,
                        name: user.fullName,
                        specialty: user.specialty || 'Nouveau',
                        rating: user.rating || 0,
                        reviews_count: 0, // Need to implement reviews count later via join/count
                        city: user.city || 'Dakar',
                        district: user.district || '-',
                        phone: user.phone || null,
                        image: user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random&color=fff&size=150`,
                        description: user.description || 'Technicien professionnel référencé.',
                        isBlocked: user.isBlocked
                    }));

                    setAllTechnicians(realTechs);
                }
            } catch (error) {
                console.error("Error fetching technicians:", error.message);
            }
            setLoading(false);
        };

        fetchTechnicians();
    }, []);

    const filteredTechnicians = allTechnicians.filter(tech => {
        const matchesSearch = tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tech.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tech.specialty.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSpecialty = selectedSpecialty ? tech.specialty === selectedSpecialty : true;

        // Show all if admin, otherwise hide blocked
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const isAdmin = currentUser && currentUser.role === 'admin';
        const isVisible = isAdmin ? true : !tech.isBlocked;

        return matchesSearch && matchesSpecialty && isVisible;
    }).sort((a, b) => b.rating - a.rating);

    const specialties = [...new Set(allTechnicians.map(t => t.specialty))];

    const handleContact = (tech) => {
        if (tech.phone) {
            window.location.href = `tel:${tech.phone}`;
        } else {
            alert("Le numéro de téléphone de ce technicien n'est pas encore disponible.");
        }
    };

    const handleWhatsApp = (tech) => {
        if (tech.phone) {
            let cleanPhone = tech.phone.replace(/[^0-9]/g, '');
            if (cleanPhone.length === 9 && (cleanPhone.startsWith('77') || cleanPhone.startsWith('78') || cleanPhone.startsWith('70') || cleanPhone.startsWith('76'))) {
                cleanPhone = '221' + cleanPhone;
            }
            window.open(`https://wa.me/${cleanPhone}`, '_blank');
        } else {
            alert("Le numéro de téléphone de ce technicien n'est pas encore disponible pour WhatsApp.");
        }
    };

    const handleDelete = async (techId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce technicien ?")) {
            try {
                const { error } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', techId);

                if (error) throw error;

                alert('Technicien supprimé.');
                setAllTechnicians(allTechnicians.filter(t => t.id !== techId));
            } catch (error) {
                console.error(error);
                alert('Erreur lors de la suppression: ' + error.message);
            }
        }
    };

    const handlePasswordChange = async (techId) => {
        const newPassword = window.prompt("Entrez le nouveau Code PIN (4 chiffres) pour ce technicien :");

        if (newPassword && newPassword.trim() !== "") {
            if (!/^\d{4}$/.test(newPassword.trim())) {
                alert("Le PIN doit être composé de exactement 4 chiffres.");
                return;
            }

            try {
                const { error } = await supabase
                    .from('users')
                    .update({ password: newPassword.trim() })
                    .eq('id', techId);

                if (error) throw error;

                alert('Le Code PIN a été mis à jour avec succès.');
            } catch (error) {
                console.error(error);
                alert('Erreur lors de la mise à jour: ' + error.message);
            }
        }
    };

    // Mock admin check - in real app check user role from context/storage
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isAdmin = currentUser && currentUser.role === 'admin';

    return (
        <div className="container" style={{ padding: '1rem 1rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Techniciens</h2>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '6px', padding: '0.35rem' }}>
                        <Search size={16} color="#666" />
                        <input
                            type="text"
                            placeholder="Recherche..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', outline: 'none', marginLeft: '0.4rem', width: '100%', fontSize: '0.9rem' }}
                        />
                    </div>
                    <select
                        value={selectedSpecialty}
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                        style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #ddd', minWidth: '150px', fontSize: '0.9rem' }}
                    >
                        <option value="">Spécialités</option>
                        {specialties.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Chargement des techniciens...</div>
            ) : filteredTechnicians.length === 0 ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                    <p style={{ color: '#666' }}>Aucun technicien trouvé pour cette recherche ou spécialité.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {filteredTechnicians.map(tech => (
                        <div key={tech.id} className="card" style={{
                            padding: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            fontSize: '0.8rem',
                            opacity: tech.isBlocked ? 0.7 : 1,
                            borderLeft: tech.isBlocked ? '4px solid #dc2626' : 'none',
                            position: 'relative'
                        }}>
                            {/* Blocked Badge */}
                            {!!tech.isBlocked && (
                                <div style={{
                                    position: 'absolute',
                                    top: '0.5rem',
                                    right: '0.5rem',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '4px',
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    zIndex: 10
                                }}>
                                    <AlertCircle size={10} />
                                    BLOQUÉ
                                </div>
                            )}

                            {/* Header Info */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <img
                                    src={tech.image}
                                    alt={tech.name}
                                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                                />
                                <div style={{ overflow: 'hidden' }}>
                                    <h3 style={{ fontSize: '0.9rem', margin: '0 0 0.1rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tech.name}</h3>
                                    <p style={{ margin: 0, color: 'var(--primary-color)', fontWeight: '500', fontSize: '0.75rem' }}>{tech.specialty}</p>
                                    {Number(tech.rating || 0) > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: '#f1c40f' }}>
                                            <Star size={10} fill="#f1c40f" /> <span>{Number(tech.rating || 0).toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description & Location (Flexible Spacer) */}
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.75rem', color: '#666', lineHeight: '1.3', marginBottom: '0.5rem' }}>
                                    {tech.description.length > 50 ? tech.description.substring(0, 50) + '...' : tech.description}
                                </p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#888', fontSize: '0.7rem', marginBottom: '0.75rem' }}>
                                    <MapPin size={10} /> {tech.city}
                                </div>
                            </div>

                            {/* Actions (Always at the bottom) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', gap: '0.2rem' }}>
                                    <Link to={`/technician/${tech.id}`} className="btn btn-outline" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '0.25rem', fontSize: '0.7rem' }}>Profil</Link>
                                    <button
                                        className="btn btn-primary"
                                        style={{ flex: 1, padding: '0.25rem', fontSize: '0.7rem' }}
                                        onClick={() => handleContact(tech)}
                                        disabled={tech.isBlocked}
                                    >
                                        Appel
                                    </button>
                                    <button
                                        className="btn"
                                        style={{ flex: 1, backgroundColor: '#25D366', color: 'white', border: 'none', padding: '0.25rem', fontSize: '0.7rem' }}
                                        onClick={() => handleWhatsApp(tech)}
                                        disabled={tech.isBlocked}
                                    >
                                        WA
                                    </button>
                                </div>
                                {/* Admin Actions */}
                                {isAdmin && (
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                        <button
                                            onClick={() => handlePasswordChange(tech.id)}
                                            style={{
                                                flex: 1,
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.25rem',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Clé
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tech.id)}
                                            style={{
                                                flex: 3,
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.25rem',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Supprimer (Admin)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TechniciansList;
