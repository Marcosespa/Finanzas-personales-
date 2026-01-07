import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/register', formData);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            // Handle error message - could be err.message or err.msg or err.data.msg
            const errorMessage = err.message || err.msg || (err.data && err.data.msg) || 'Error al crear la cuenta';
            setError(errorMessage);
            console.error('Register error:', err);
        } finally {
            setLoading(false);
        }
    };

    const particles = Array.from({ length: 15 }, (_, i) => i);

    return (
        <div className="relative min-h-screen overflow-hidden bg-bg-primary">
            {/* Animated Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-bg-primary via-[#1a1f35] to-bg-primary" />
                
                {/* Floating orbs */}
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-accent-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                
                {/* Grid pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}
                />

                {/* Floating particles */}
                {particles.map((i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-emerald-500/30 rounded-full animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${5 + Math.random() * 10}s`
                        }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-md">
                    {/* Logo & Header */}
                    <div className="text-center mb-8 animate-fade-in">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/30 mb-6">
                            <span className="text-4xl font-bold text-white">✦</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Crear Cuenta</h1>
                        <p className="text-muted">Comienza a gestionar tus finanzas</p>
                    </div>

                    {/* Card */}
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-600/20 to-emerald-500/20 rounded-2xl blur-xl opacity-50" />
                        
                        <div className="relative bg-bg-secondary/80 backdrop-blur-xl rounded-2xl border border-border-color/50 p-8 shadow-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            {success ? (
                                <div className="text-center py-8 animate-fade-in">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-success/20 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-accent-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">¡Cuenta Creada!</h3>
                                    <p className="text-muted">Redirigiendo al login...</p>
                                </div>
                            ) : (
                                <>
                                    {error && (
                                        <div className="mb-6 p-4 rounded-xl bg-accent-danger/10 border border-accent-danger/20 flex items-center gap-3 animate-shake">
                                            <svg className="w-5 h-5 text-accent-danger flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-sm text-accent-danger">{error}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-muted">Usuario</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                        <input
                            type="text"
                                                    className="w-full pl-12 pr-4 py-3 bg-bg-tertiary/50 border border-border-color/50 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                                    placeholder="Tu nombre de usuario"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                                            </div>
                    </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-muted">Email</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                        <input
                            type="email"
                                                    className="w-full pl-12 pr-4 py-3 bg-bg-tertiary/50 border border-border-color/50 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                                    placeholder="tu@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                                            </div>
                    </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-muted">Contraseña</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                </div>
                        <input
                            type="password"
                                                    className="w-full pl-12 pr-4 py-3 bg-bg-tertiary/50 border border-border-color/50 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                                    placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                                            </div>
                    </div>

                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                        >
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Creando cuenta...
                                                </span>
                                            ) : 'Crear Cuenta'}
                                        </button>
                </form>

                                    <div className="mt-6 pt-6 border-t border-border-color/50 text-center">
                                        <p className="text-sm text-muted">
                                            ¿Ya tienes cuenta?{' '}
                                            <Link to="/login" className="text-emerald-500 font-medium hover:text-emerald-400 transition-colors">
                                                Inicia sesión
                                            </Link>
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Prague destination badge */}
                    <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bg-secondary/50 border border-border-color/30 text-xs text-muted">
                            <span>🎓</span>
                            <span>Tu pasantía te espera</span>
                            <span>🇨🇿</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
