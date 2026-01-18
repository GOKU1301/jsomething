import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, filesAPI } from '../services/api';
import { createSSEConnection } from '../services/api';
import './AdminDashboard.css';

const STATUS_LABELS = {
    UPLOADED: 'Uploaded',
    PAYMENT_PENDING: 'Payment Pending',
    PAID: 'Paid',
    QUEUED: 'In Queue',
    PRINTED: 'Printed',
    COLLECTED: 'Collected',
    CANCELLED: 'Cancelled'
};

const AdminDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('QUEUED');
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();

        // Establish SSE connection for new orders
        const eventSource = createSSEConnection(
            (data) => {
                console.log('SSE message:', data);

                if (data.type === 'newOrder') {
                    fetchOrders(); // Refresh orders
                    setNotification({
                        type: 'info',
                        message: '🔔 New print order received!'
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
    }, [filter]);

    const fetchOrders = async () => {
        try {
            const response = await ordersAPI.getAll(filter);
            setOrders(response.data.orders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await ordersAPI.updateStatus(orderId, newStatus);
            fetchOrders(); // Refresh orders
            setNotification({
                type: 'success',
                message: `Order status updated to ${STATUS_LABELS[newStatus]}`
            });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.response?.data?.error || 'Failed to update status'
            });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleDownload = async (fileId, fileName) => {
        try {
            const response = await filesAPI.getDownloadUrl(fileId);
            window.open(response.data.downloadUrl, '_blank');
        } catch (error) {
            alert('Failed to download file');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
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
                            <h1>🖨️ JayPrint Admin</h1>
                            <p>Welcome, {user?.name}</p>
                        </div>
                        <button className="btn btn-secondary" onClick={handleLogout}>
                            Logout
                        </button>
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
                    <div className="flex justify-between items-center mb-4">
                        <h2>Print Queue</h2>
                        <select
                            className="input"
                            style={{ width: 'auto' }}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="">All Orders</option>
                            <option value="QUEUED">Queued</option>
                            <option value="PRINTED">Printed</option>
                            <option value="COLLECTED">Collected</option>
                        </select>
                    </div>

                    {orders.length === 0 ? (
                        <div className="empty-state">
                            <p>No orders in {filter ? STATUS_LABELS[filter] : 'the system'}</p>
                        </div>
                    ) : (
                        <div className="admin-orders-list">
                            {orders.map(order => (
                                <div key={order.id} className="admin-order-card">
                                    <div className="admin-order-header">
                                        <div>
                                            <h3>{order.fileName}</h3>
                                            <p className="order-meta">
                                                {order.userName} • {order.userEmail}
                                                {order.rollNumber && ` • ${order.rollNumber}`}
                                            </p>
                                        </div>
                                        <span className={`badge badge-info`}>
                                            {STATUS_LABELS[order.status]}
                                        </span>
                                    </div>

                                    <div className="admin-order-details">
                                        <div className="detail-grid">
                                            <div>
                                                <span className="detail-label">Pages:</span>
                                                <strong>{order.pageCount}</strong>
                                            </div>
                                            <div>
                                                <span className="detail-label">Copies:</span>
                                                <strong>{order.copies}</strong>
                                            </div>
                                            <div>
                                                <span className="detail-label">Type:</span>
                                                <strong>{order.isColor ? 'Color' : 'B&W'}</strong>
                                            </div>
                                            <div>
                                                <span className="detail-label">Binding:</span>
                                                <strong>{order.isBinding ? 'Yes' : 'No'}</strong>
                                            </div>
                                            <div>
                                                <span className="detail-label">Amount:</span>
                                                <strong>₹{order.amount}</strong>
                                            </div>
                                            <div>
                                                <span className="detail-label">Created:</span>
                                                <strong>{new Date(order.createdAt).toLocaleString()}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="admin-order-actions">
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handleDownload(order.fileId, order.fileName)}
                                        >
                                            📥 Download
                                        </button>

                                        {order.status === 'QUEUED' && (
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleStatusUpdate(order.id, 'PRINTED')}
                                            >
                                                ✅ Mark as Printed
                                            </button>
                                        )}

                                        {order.status === 'PRINTED' && (
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleStatusUpdate(order.id, 'COLLECTED')}
                                            >
                                                ✅ Mark as Collected
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
