import React from 'react';
import { ArrowLeft, Shield, FileText, Lock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const Terms = () => {
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const element = document.querySelector(hash);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, []);
    return (
        <div className="container" style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
            <Link to={-1} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', textDecoration: 'none', color: '#64748b', fontSize: '0.9rem' }}>
                <ArrowLeft size={18} /> Retour
            </Link>

            <div className="card" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>samatechnicien.com</h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>La plateforme des techniciens du Sénégal</p>
                    <div style={{ height: '3px', width: '60px', backgroundColor: 'var(--primary-color)', margin: '1rem auto' }}></div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
                        CONDITIONS GÉNÉRALES D'UTILISATION & POLITIQUE DE CONFIDENTIALITÉ
                    </h2>
                </div>

                <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>Plateforme :</span> <span>samatechnicien.com</span>
                        <span style={{ fontWeight: 'bold' }}>Société :</span> <span>SamaTechnicien SAS</span>
                        <span style={{ fontWeight: 'bold' }}>Pays :</span> <span>République du Sénégal</span>
                        <span style={{ fontWeight: 'bold' }}>Version :</span> <span>2.0 — Édition 2025</span>
                        <span style={{ fontWeight: 'bold' }}>Mise à jour :</span> <span>Mars 2025</span>
                    </div>
                </div>

                <section id="cgu" style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={20} color="var(--primary-color)" /> PARTIE I : CGU
                    </h3>
                    
                    <h4 style={{ color: '#1e293b', marginTop: '1.5rem' }}>Art. 1 : Présentation</h4>
                    <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.95rem' }}>
                        SamaTechnicien est un service numérique mettant en relation des Clients avec des professionnels du secteur artisanal et technique (Techniciens) exerçant au Sénégal.
                    </p>

                    <h4 style={{ color: '#1e293b', marginTop: '1.5rem' }}>Art. 3 : Inscription et Vérification</h4>
                    <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.95rem' }}>
                        Chaque profil Technicien fait l'objet d'une vérification manuelle comprenant :
                        <ul style={{ marginTop: '0.5rem' }}>
                            <li>Contrôle de l'identité via document officiel (CNI/Passeport)</li>
                            <li>Vérification des qualifications et du numéro de téléphone</li>
                            <li>Attribution d'un badge de vérification</li>
                        </ul>
                    </p>

                    <h4 style={{ color: '#1e293b', marginTop: '1.5rem' }}>Art. 5 : Notation et Avis</h4>
                    <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.95rem' }}>
                        Après chaque prestation, le Client peut noter le Technicien de 1 à 5 étoiles. Les avis doivent être objectifs et basés sur une expérience réelle.
                    </p>

                    <h4 style={{ color: '#1e293b', marginTop: '1.5rem' }}>Art. 9 : Droit applicable</h4>
                    <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.95rem' }}>
                        Les présentes CGU sont régies par le <strong>droit sénégalais</strong>. Tout litige sera porté devant les tribunaux compétents de Dakar.
                    </p>
                </section>

                <section id="privacy" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Lock size={20} color="#059669" /> PARTIE II : CONFIDENTIALITÉ
                    </h3>
                    
                    <div style={{ backgroundColor: '#ecfdf5', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #059669', marginBottom: '1.5rem' }}>
                        <p style={{ margin: 0, color: '#065f46', fontSize: '0.9rem', fontWeight: '500' }}>
                            🔒 Chiffrement de bout en bout (E2EE) : Toutes vos données sont chiffrées et ne sont jamais vendues à des tiers.
                        </p>
                    </div>

                    <h4 style={{ color: '#1e293b', marginTop: '1.5rem' }}>Art. 10 : Cadre Réglementaire</h4>
                    <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.95rem' }}>
                        Conforme à la <strong>Loi n° 2008-12 du 25 janvier 2008</strong> sur la Protection des Données à Caractère Personnel du Sénégal (CDP).
                    </p>

                    <h4 style={{ color: '#1e293b', marginTop: '1.5rem' }}>Art. 13 : Sécurité Technique</h4>
                    <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.95rem' }}>
                        Nous utilisons des technologies de pointe :
                        <ul style={{ marginTop: '0.5rem' }}>
                            <li>Chiffrement en transit (TLS 1.3 / HTTPS)</li>
                            <li>Chiffrement au repos (AES-256)</li>
                            <li>Authentification forte (2FA par SMS)</li>
                        </ul>
                    </p>

                    <h4 style={{ color: '#1e293b', marginTop: '1.5rem' }}>Art. 15 : Vos Droits</h4>
                    <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.95rem' }}>
                        Vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Contact DPO : <strong>dias@samatechnicien.com</strong>
                    </p>
                </section>

                <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.85rem', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                    SamaTechnicien — Ensemble, valorisons l'artisanat sénégalais<br />
                    © 2025 SamaTechnicien SAS. Tous droits réservés.
                </div>
            </div>
        </div>
    );
};

export default Terms;
