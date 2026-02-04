import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { User, Mail, Lock, Shield, Phone } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'client',
        specialty: 'Informatique',
        otherSpecialty: '',
        city: '',
        district: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('Les mots de passe ne correspondent pas.');
            return;
        }

        try {
            const payload = {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                role: formData.role,
                city: formData.city,
                district: formData.district,
                specialty: formData.role === 'technician'
                    ? (formData.specialty === 'Autre' ? formData.otherSpecialty : formData.specialty)
                    : null
            };

            const { data, error } = await supabase
                .from('users')
                .insert([payload])
                .select();

            if (error) {
                alert('Erreur: ' + error.message);
            } else {
                alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
                // Optional: navigate to login
                location.href = '/login';
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erreur lors de l\'inscription.');
        }
    };

    return (
        <div className="container" style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            minHeight: '100vh', padding: '1rem 0', position: 'relative',
            paddingBottom: '2rem'
        }}>
            <Link to="/" style={{ position: 'absolute', top: '40px', left: '20px', color: '#666', zIndex: 10 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </Link>

            <div className="card" style={{ width: '100%', maxWidth: '380px', padding: '1rem' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '1.1rem' }}>Créer un compte V2</h3>

                <form onSubmit={handleSubmit}>
                    {/* Nom complet */}
                    <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.1rem', fontWeight: '500', fontSize: '0.75rem' }}>
                            <User size={14} /> Nom Complet
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            required
                            value={formData.fullName}
                            onChange={handleChange}
                            style={{
                                width: '100%', padding: '0.35rem', borderRadius: '4px',
                                border: '1px solid #ddd', fontSize: '0.8rem'
                            }}
                            placeholder="Ex: Moussa Diop"
                        />
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.1rem', fontWeight: '500', fontSize: '0.75rem' }}>
                            <Mail size={14} /> Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            style={{
                                width: '100%', padding: '0.35rem', borderRadius: '4px',
                                border: '1px solid #ddd', fontSize: '0.8rem'
                            }}
                            placeholder="moussa@exemple.com"
                        />
                    </div>

                    {/* Téléphone */}
                    <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.1rem', fontWeight: '500', fontSize: '0.75rem' }}>
                            <Phone size={14} /> Téléphone
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            style={{
                                width: '100%', padding: '0.35rem', borderRadius: '4px',
                                border: '1px solid #ddd', fontSize: '0.8rem'
                            }}
                            placeholder="+221 77 000 00 00"
                        />
                    </div>

                    {/* Password */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{ marginBottom: '0.5rem', flex: 1 }}>
                            <label style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.1rem', fontWeight: '500', fontSize: '0.75rem' }}>
                                <Lock size={14} /> PIN (4 chiffres)
                            </label>
                            <input
                                type="password"
                                name="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={4}
                                required
                                value={formData.password}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 4) handleChange({ target: { name: 'password', value: val } });
                                }}
                                style={{
                                    width: '100%', padding: '0.35rem', borderRadius: '4px',
                                    border: '1px solid #ddd', fontSize: '0.8rem', textAlign: 'center',
                                    letterSpacing: '3px', fontWeight: 'bold'
                                }}
                                placeholder="****"
                            />
                        </div>
                        <div style={{ marginBottom: '0.5rem', flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.1rem', fontWeight: '500', fontSize: '0.75rem' }}>
                                Confirmer PIN
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={4}
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 4) handleChange({ target: { name: 'confirmPassword', value: val } });
                                }}
                                style={{
                                    width: '100%', padding: '0.35rem', borderRadius: '4px',
                                    border: '1px solid #ddd', fontSize: '0.8rem', textAlign: 'center',
                                    letterSpacing: '3px', fontWeight: 'bold'
                                }}
                                placeholder="****"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.1rem', fontWeight: '500', fontSize: '0.75rem' }}>Ville</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Dakar"
                                style={{
                                    width: '100%', padding: '0.35rem', borderRadius: '4px',
                                    border: '1px solid #ddd', fontSize: '0.8rem'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.1rem', fontWeight: '500', fontSize: '0.75rem' }}>Quartier</label>
                            <input
                                type="text"
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                placeholder="Plateau"
                                style={{
                                    width: '100%', padding: '0.35rem', borderRadius: '4px',
                                    border: '1px solid #ddd', fontSize: '0.8rem'
                                }}
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.75rem' }}>
                            <Shield size={14} /> Je suis :
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <label style={{
                                flex: 1, cursor: 'pointer', padding: '0.35rem',
                                border: `2px solid ${formData.role === 'client' ? 'var(--primary-color)' : '#ddd'}`,
                                borderRadius: '4px', textAlign: 'center',
                                backgroundColor: formData.role === 'client' ? '#f0fdf4' : 'transparent',
                                fontSize: '0.75rem'
                            }}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="client"
                                    checked={formData.role === 'client'}
                                    onChange={handleChange}
                                    style={{ display: 'none' }}
                                />
                                <span style={{ fontWeight: '600' }}>Client</span>
                            </label>

                            <label style={{
                                flex: 1, cursor: 'pointer', padding: '0.35rem',
                                border: `2px solid ${formData.role === 'technician' ? 'var(--primary-color)' : '#ddd'}`,
                                borderRadius: '4px', textAlign: 'center',
                                backgroundColor: formData.role === 'technician' ? '#f0fdf4' : 'transparent',
                                fontSize: '0.75rem'
                            }}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="technician"
                                    checked={formData.role === 'technician'}
                                    onChange={handleChange}
                                    style={{ display: 'none' }}
                                />
                                <span style={{ fontWeight: '600' }}>Technicien</span>
                            </label>
                        </div>
                    </div>

                    {/* Specialty Select - Only for Technicians */}
                    {formData.role === 'technician' && (
                        <div style={{ marginBottom: '0.5rem' }}>
                            <select
                                name="specialty"
                                value={formData.specialty}
                                onChange={handleChange}
                                style={{
                                    width: '100%', padding: '0.35rem', borderRadius: '4px',
                                    border: '1px solid #ddd', fontSize: '0.8rem', backgroundColor: 'white'
                                }}
                            >
                                <option value="Informatique">Informatique</option>
                                <option value="Téléphonie">Téléphonie</option>
                                <option value="Imprimantes">Imprimantes</option>
                                <option value="Réseaux">Réseaux</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                    )}

                    {/* Custom Specialty Input */}
                    {formData.role === 'technician' && formData.specialty === 'Autre' && (
                        <div style={{ marginBottom: '0.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.1rem', fontWeight: '500', fontSize: '0.75rem' }}>Précisez votre métier</label>
                            <input
                                type="text"
                                name="otherSpecialty"
                                required
                                value={formData.otherSpecialty}
                                onChange={handleChange}
                                placeholder="Ex: Plombier, Menuisier..."
                                style={{
                                    width: '100%', padding: '0.35rem', borderRadius: '4px',
                                    border: '1px solid #ddd', fontSize: '0.8rem'
                                }}
                            />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}>
                        S'inscrire
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                    Compte existant ? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Se connecter</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
