import React from 'react';
import { Trash2, CreditCard, X } from 'lucide-react';

const Cart = () => {
    const [cartItems, setCartItems] = React.useState([]);
    const [showWaveModal, setShowWaveModal] = React.useState(false);
    const [wavePhone, setWavePhone] = React.useState('');
    const [paymentStatus, setPaymentStatus] = React.useState('idle'); // idle, processing, success

    React.useEffect(() => {
        const items = JSON.parse(localStorage.getItem('cart')) || [];
        setCartItems(items);
    }, []);

    const removeFromCart = (index) => {
        const newCart = [...cartItems];
        newCart.splice(index, 1);
        setCartItems(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const total = cartItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    const finalTotal = total + 2000;

    const handlePayment = (e) => {
        e.preventDefault();
        setPaymentStatus('processing');
        // Simulate API call
        setTimeout(() => {
            setPaymentStatus('success');
            localStorage.removeItem('cart');
            setCartItems([]);
            window.dispatchEvent(new Event('cartUpdated'));
        }, 2000);
    };

    const closeWaveModal = () => {
        setShowWaveModal(false);
        setPaymentStatus('idle');
        setWavePhone('');
    };

    // ... (rest of the component until the button)

    return (
        <div className="container" style={{ padding: '2rem 1rem', minHeight: '60vh' }}>
            <h1>Votre Panier</h1>

            {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '2rem', color: '#666' }}>
                    <p>Votre panier est vide.</p>
                    {paymentStatus === 'success' && <p style={{ color: '#28a745', fontWeight: 'bold' }}>Merci pour votre achat !</p>}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                    {/* Cart Items */}
                    <div className="card" style={{ height: 'fit-content' }}>
                        {cartItems.map((item, index) => (
                            <div key={index} style={{
                                display: 'flex', gap: '1rem', borderBottom: '1px solid #eee',
                                paddingBottom: '1rem', marginBottom: '1rem'
                            }}>
                                <img
                                    src={item.image || 'https://via.placeholder.com/80'}
                                    alt={item.title}
                                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <h3 style={{ fontSize: '1rem', margin: '0 0 0.25rem 0' }}>{item.title}</h3>
                                        <p style={{ fontWeight: 'bold', margin: 0 }}>{Number(item.price).toLocaleString()} F</p>
                                    </div>
                                    <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>{item.category}</p>
                                    <button className="btn"
                                        onClick={() => removeFromCart(index)}
                                        style={{
                                            color: 'var(--error-color)', padding: 0, marginTop: '0.5rem',
                                            display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent'
                                        }}>
                                        <Trash2 size={16} /> Supprimer
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="card" style={{ height: 'fit-content' }}>
                        <h2>Total</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Sous-total</span>
                            <span>{total.toLocaleString()} FCFA</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: '#666' }}>
                            <span>Livraison</span>
                            <span>2 000 FCFA</span>
                        </div>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem',
                            fontWeight: 'bold', fontSize: '1.2rem', borderTop: '1px solid #eee', paddingTop: '1rem'
                        }}>
                            <span>Total à payer</span>
                            <span>{finalTotal.toLocaleString()} FCFA</span>
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowWaveModal(true)}>
                            <CreditCard size={18} /> Commander (Paiement à la livraison)
                        </button>
                    </div>
                </div>
            )}

            {/* Wave Modal */}
            {showWaveModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 2000
                }}>
                    <div className="animate-fade-in" style={{
                        backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
                        width: '90%', maxWidth: '400px', position: 'relative',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}>
                        <button onClick={closeWaveModal} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={24} color="#666" />
                        </button>

                        {paymentStatus === 'success' ? (
                            <div style={{ textAlign: 'center', color: '#28a745' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                                <h3>Commande Confirmée !</h3>
                                <p>Vous paierez à la livraison.</p>
                                <button className="btn btn-primary" onClick={closeWaveModal} style={{ marginTop: '1rem' }}>Fermer</button>
                            </div>
                        ) : (
                            <>
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                    <h2 style={{ color: 'var(--primary-color)', fontWeight: 'bold', margin: 0 }}>Paiement à la livraison</h2>
                                    <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>Réglez votre commande une fois reçue.</p>
                                </div>

                                <div style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#666' }}>Montant total à payer</span>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>{finalTotal.toLocaleString()} FCFA</div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Numéro de contact pour la livraison</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="77 000 00 00"
                                        value={wavePhone}
                                        onChange={e => setWavePhone(e.target.value)}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1.1rem', outlineColor: 'var(--primary-color)' }}
                                    />
                                </div>

                                <button
                                    onClick={handlePayment}
                                    className="btn btn-primary"
                                    disabled={paymentStatus === 'processing' || !wavePhone}
                                    style={{
                                        width: '100%', padding: '0.8rem', borderRadius: '25px', border: 'none',
                                        fontWeight: 'bold', fontSize: '1.1rem',
                                        cursor: paymentStatus === 'processing' || !wavePhone ? 'not-allowed' : 'pointer',
                                        opacity: paymentStatus === 'processing' || !wavePhone ? 0.7 : 1,
                                        boxShadow: 'var(--shadow-md)'
                                    }}
                                >
                                    {paymentStatus === 'processing' ? 'Confirmation en cours...' : 'Confirmer la commande'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
