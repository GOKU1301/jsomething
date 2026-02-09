import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import { createSSEConnection } from '../services/api';
import './StudentDashboard.css';

const STATUS_COLORS = {
    UPLOADED: 'gray',
    PAYMENT_PENDING: 'warning',
    PAID: 'info',
    QUEUED: 'info',
    PRINTED: 'success',
    COLLECTED: 'success',
    CANCELLED: 'danger'
};

const STATUS_LABELS = {
    UPLOADED: 'Uploaded',
    PAYMENT_PENDING: 'Payment Pending',
    PAID: 'Paid',
    QUEUED: 'In Queue',
    PRINTED: 'Printed',
    COLLECTED: 'Collected',
    CANCELLED: 'Cancelled'
};

const StudentDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();

        // Establish SSE connection for real-time updates
        const eventSource = createSSEConnection(
            (data) => {
                console.log('SSE message:', data);

                if (data.type === 'orderStatusUpdate') {
                    // Update order in list
                    setOrders(prev => prev.map(order =>
                        order.id === data.orderId
                            ? { ...order, status: data.newStatus }
                            : order
                    ));

                    // Show notification
                    setNotification({
                        type: 'info',
                        message: `Order status updated to ${STATUS_LABELS[data.newStatus]}`
                    });
                    setTimeout(() => setNotification(null), 5000);
                } else if (data.type === 'paymentSuccess') {
                    fetchOrders(); // Refresh orders
                    setNotification({
                        type: 'success',
                        message: 'Payment successful! Your order is in the queue.'
                    });
                    setTimeout(() => setNotification(null), 5000);
                }
            },
            (error) => {
                console.error('SSE connection error:', error);
            }
        );

        return () => {
            eventSource.close();
        };
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await ordersAPI.getAll();
            setOrders(response.data.orders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="text-center">
                    <div className="spinner"></div>
                    <p className="mt-3">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="container">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1>🖨️ JayPrint</h1>
                            <p>Welcome, {user?.name}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/upload')}
                            >
                                + New Print Order
                            </button>
                            <button className="btn btn-secondary" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="dashboard-main container">
                {notification && (
                    <div className={`alert alert-${notification.type}`}>
                        {notification.message}
                    </div>
                )}

                <div className="card">
                    <h2>My Print Orders</h2>

                    {orders.length === 0 ? (
                        <div className="empty-state">
                            <p>No print orders yet</p>
                            <button
                                className="btn btn-primary mt-3"
                                onClick={() => navigate('/upload')}
                            >
                                Create Your First Order
                            </button>
                        </div>
                    ) : (
                        <div className="orders-grid">
                            {orders.map(order => (
                                <div key={order.id} className="order-card">
                                    <div className="order-header">
                                        <h3>{order.fileName}</h3>
                                        <span className={`badge badge-${STATUS_COLORS[order.status]}`}>
                                            {STATUS_LABELS[order.status]}
                                        </span>
                                    </div>

                                    <div className="order-details">
                                        <div className="detail-row">
                                            <span>Pages:</span>
                                            <strong>{order.pageCount}</strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>Copies:</span>
                                            <strong>{order.copies}</strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>Type:</span>
                                            <strong>{order.isColor ? 'Color' : 'Black & White'}</strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>Binding:</span>
                                            <strong>{order.isBinding ? 'Yes' : 'No'}</strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>Amount:</span>
                                            <strong>₹{order.amount}</strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>Created:</span>
                                            <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
                                        </div>
                                    </div>

                                    {order.status === 'PRINTED' && (
                                        <div className="order-action">
                                            <div className="alert alert-success">
                                                ✅ Your order is ready for collection!
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
