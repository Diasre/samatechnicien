import React, { useState } from 'react';
import { Share2, Copy, MessageCircle, Mail, ArrowLeft, Users, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Invite = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [copied, setCopied] = useState(false);

    const appUrl = window.location.origin;
    const referralLink = `${appUrl}/register?ref=${user?.id || 'guest'}`;
    const inviteMessage = `Salut ! J'utilise SamaTechnicien pour trouver des experts en réparation certifiés. Inscris-toi ici : ${referralLink}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
        window.open(url, '_blank');
    };

    if (!user) return <div className="container" style={{ padding: '2rem' }}>Veuillez vous connecter.</div>;

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '600px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', textDecoration: 'none', color: '#666', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Retour
            </Link>

            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{
                    width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#e3f2fd',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary-color)'
                }}>
                    <Users size={35} />
                </div>

                <h2 style={{ marginBottom: '0.75rem' }}>Inviter des amis</h2>
                <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
                    Partagez SamaTechnicien avec vos proches pour les aider à trouver les meilleurs techniciens en cas de panne !
                </p>

                <div style={{
                    backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '12px',
                    border: '1px dashed #ccc', marginBottom: '2rem', wordBreak: 'break-all'
                }}>
                    <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Votre lien d'invitation</p>
                    <code style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>{referralLink}</code>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                    <button
                        onClick={shareWhatsApp}
                        className="btn"
                        style={{
                            backgroundColor: '#25D366', color: 'white', border: 'none',
                            padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                    >
                        <MessageCircle size={20} /> Partager sur WhatsApp
                    </button>

                    <button
                        onClick={copyToClipboard}
                        className="btn btn-outline"
                        style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        {copied ? <CheckCircle size={20} color="#28a745" /> : <Copy size={20} />}
                        {copied ? 'Lien copié !' : 'Copier le lien d\'invitation'}
                    </button>

                    <a
                        href={`mailto:?subject=Découvre SamaTechnicien&body=${encodeURIComponent(inviteMessage)}`}
                        className="btn"
                        style={{
                            backgroundColor: '#6c757d', color: 'white', border: 'none', textDecoration: 'none',
                            padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                    >
                        <Mail size={20} /> Envoyer par Email
                    </a>
                </div>

                <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#666', fontSize: '0.85rem' }}>
                        <Share2 size={16} />
                        <span>Partagez l'expérience SamaTechnicien</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Invite;
