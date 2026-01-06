import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/register', formData);
            navigate('/login');
        } catch (err) {
            setError(err.msg || 'Registration failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-primary p-4">
            <div className="card w-full max-w-md animate-fade-in">
                <h1 className="text-2xl font-bold mb-6 text-center text-accent-primary">Create Account</h1>

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
                        <label className="block text-sm font-medium mb-1 text-muted">Email</label>
                        <input
                            type="email"
                            className="w-full bg-tertiary border-tertiary focus:border-accent-primary text-primary"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

                    <button type="submit" className="btn w-full mt-2">Sign Up</button>
                </form>

                <p className="mt-4 text-center text-sm text-muted">
                    Already have an account? <Link to="/login" className="text-accent-primary hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
