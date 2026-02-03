import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const WelcomeOverlay = ({ userName, duration = 5000 }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, duration);

        const removeTimer = setTimeout(() => {
            setShouldRender(false);
        }, duration + 800); // Allow time for exit animation

        return () => {
            clearTimeout(timer);
            clearTimeout(removeTimer);
        };
    }, [duration]);

    if (!shouldRender) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isVisible ? 1 : 0,
            pointerEvents: 'none',
            overflow: 'hidden'
        }}>
            <div style={{
                animation: 'scaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: 0,
                transform: 'scale(0.9)',
                maxWidth: '100%',
                padding: '0 1rem'
            }}>
                <div style={{
                    marginBottom: '1rem',
                    color: 'var(--primary-color)',
                    animation: 'spinSlow 10s linear infinite'
                }}>
                    <Sparkles size={48} fill="var(--primary-color)" fillOpacity={0.2} />
                </div>

                <h1 style={{
                    fontSize: '2rem',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                    textAlign: 'center',
                    fontWeight: '800',
                    letterSpacing: '-0.5px'
                }}>
                    Bienvenue
                </h1>

                <h2 style={{
                    fontSize: '2.2rem',
                    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    margin: '0 0 1rem 0',
                    fontWeight: '900',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    lineHeight: '1.2'
                }}>
                    {userName || 'Invité'}
                </h2>

                <p style={{
                    fontSize: '1.2rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '2rem',
                    opacity: 0.8,
                    textAlign: 'center'
                }}>
                    En quoi puis-je vous aider aujourd'hui ?
                </p>

                <div style={{
                    position: 'relative',
                    width: '200px',
                    height: '4px',
                    backgroundColor: '#eee',
                    borderRadius: '2px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        backgroundColor: 'var(--primary-color)',
                        borderRadius: '2px',
                        width: '100%',
                        animation: `progress ${duration}ms linear forwards`,
                        transformOrigin: 'left'
                    }}></div>
                </div>
            </div>

            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes progress {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }
                @keyframes spinSlow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default WelcomeOverlay;
