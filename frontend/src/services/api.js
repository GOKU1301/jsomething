import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/me')
};

// Files API
export const filesAPI = {
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getMetadata: (id) => api.get(`/files/${id}`),
    getDownloadUrl: (id) => api.get(`/files/${id}/download`)
};

// Orders API
export const ordersAPI = {
    create: (data) => api.post('/orders', data),
    getAll: (status) => api.get('/orders', { params: { status } }),
    getById: (id) => api.get(`/orders/${id}`),
    updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
    getHistory: (id) => api.get(`/orders/${id}/history`)
};

// Payments API
export const paymentsAPI = {
    create: (orderId) => api.post('/payments/create', { orderId }),
    getStatus: (orderId) => api.get(`/payments/${orderId}`)
};

// SSE Connection
export const createSSEConnection = (onMessage, onError) => {
    const token = localStorage.getItem('token');
    const eventSource = new EventSource(`${API_BASE_URL}/sse/events`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch (error) {
            console.error('SSE parse error:', error);
        }
    };

    eventSource.addEventListener('orderStatusUpdate', (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage({ type: 'orderStatusUpdate', ...data });
        } catch (error) {
            console.error('SSE parse error:', error);
        }
    });

    eventSource.addEventListener('paymentSuccess', (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage({ type: 'paymentSuccess', ...data });
        } catch (error) {
            console.error('SSE parse error:', error);
        }
    });

    eventSource.addEventListener('newOrder', (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage({ type: 'newOrder', ...data });
        } catch (error) {
            console.error('SSE parse error:', error);
        }
    });

    eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        if (onError) onError(error);
    };

    return eventSource;
};

export default api;
