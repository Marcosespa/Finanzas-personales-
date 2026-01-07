// API URL: uses environment variable in production, fallback for development
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const handleAuthError = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

const handleError = async (response, endpoint) => {
    // Try to parse error message first
    let errorData;
    try {
        errorData = await response.json();
    } catch {
        errorData = { msg: `Error ${response.status}: ${response.statusText}` };
    }

    // Handle authentication errors - but NOT for login/register endpoints
    // Those should show the error message to the user, not redirect
    const isAuthEndpoint = endpoint && (endpoint.includes('/auth/login') || endpoint.includes('/auth/register'));
    
    if ((response.status === 401 || response.status === 422) && !isAuthEndpoint) {
        handleAuthError();
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    // Create error with user-friendly message
    const error = new Error(errorData.msg || errorData.message || 'Ocurrió un error');
    error.status = response.status;
    error.data = errorData;
    error.msg = errorData.msg; // Keep msg for backward compatibility
    throw error;
};

export const api = {
    get: async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: getHeaders()
            });
            
            if (!response.ok) {
                await handleError(response);
            }
            
            return await response.json();
        } catch (error) {
            // Re-throw if it's already our custom error
            if (error.status) throw error;
            // Network or other errors
            throw new Error('Error de conexión. Por favor, verifica tu internet.');
        }
    },

    post: async (endpoint, data) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                await handleError(response, endpoint);
            }
            
            return await response.json();
        } catch (error) {
            if (error.status) throw error;
            throw new Error('Error de conexión. Por favor, verifica tu internet.');
        }
    },

    put: async (endpoint, data) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                await handleError(response);
            }
            
            return await response.json();
        } catch (error) {
            if (error.status) throw error;
            throw new Error('Error de conexión. Por favor, verifica tu internet.');
        }
    },

    delete: async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            
            if (!response.ok) {
                await handleError(response);
            }
            
            // DELETE might return 204 No Content
            if (response.status === 204) {
                return { success: true };
            }
            
            return await response.json();
        } catch (error) {
            if (error.status) throw error;
            throw new Error('Error de conexión. Por favor, verifica tu internet.');
        }
    }
};

export default api;
