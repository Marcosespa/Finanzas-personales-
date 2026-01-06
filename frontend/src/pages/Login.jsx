import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/login', formData);
            login(res.user, res.access_token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.msg || 'Login failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-primary p-4">
            <div className="card w-full max-w-md animate-fade-in">
                <h1 className="text-2xl font-bold mb-6 text-center text-accent-primary">Welcome Back</h1>

                {error && <div className="p-3 mb-4 text-sm text-red-200 bg-red-900/50 rounded border border-red-800">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-muted">Username</label>
                        <input
                            type="text"
                            className="w-full bg-tertiary border-tertiary focus:border-accent-primary text-primary"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-muted">Password</label>
                        <input
                            type="password"
                            className="w-full bg-tertiary border-tertiary focus:border-accent-primary text-primary"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <button type="submit" className="btn w-full mt-2">Login</button>
                </form>

                <p className="mt-4 text-center text-sm text-muted">
                    Don't have an account? <Link to="/register" className="text-accent-primary hover:underline">Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
