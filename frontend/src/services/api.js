// API URL: uses environment variable in production, fallback for development
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    get: async (endpoint) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: getHeaders()
        });
        if (response.status === 401 || response.status === 422) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
        }
        if (!response.ok) throw await response.json();
        return response.json();
    },

    post: async (endpoint, data) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw await response.json();
        return response.json();
    },

    put: async (endpoint, data) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw await response.json();
        return response.json();
    },

    delete: async (endpoint) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw await response.json();
        return response.json();
    }
};

export default api;
