import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: email, 2: token+password
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [devToken, setDevToken] = useState(''); // For development only

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setSuccess(res.msg);
            // DEV: Show token for testing
            if (res.dev_token) {
                setDevToken(res.dev_token);
            }
            setStep(2);
        } catch (err) {
            setError(err.message || 'Error al procesar solicitud');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/auth/reset-password', {
                email,
                token,
                new_password: newPassword
            });
            setSuccess(res.msg);
            setStep(3); // Success step
        } catch (err) {
            setError(err.message || 'Error al restablecer contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent-primary to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-primary/30">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Recuperar Contraseña</h1>
                    <p className="text-muted text-sm">
                        {step === 1 && 'Ingresa tu email para recibir instrucciones'}
                        {step === 2 && 'Ingresa el código y tu nueva contraseña'}
                        {step === 3 && '¡Contraseña actualizada exitosamente!'}
                    </p>
                </div>

                {/* Card */}
                <div className="card">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-accent-danger/10 border border-accent-danger/30 text-accent-danger text-sm">
                            {error}
                        </div>
                    )}
                    {success && step !== 3 && (
                        <div className="mb-4 p-3 rounded-lg bg-accent-success/10 border border-accent-success/30 text-accent-success text-sm">
                            {success}
                        </div>
                    )}

                    {/* Step 1: Request Reset */}
                    {step === 1 && (
                        <form onSubmit={handleRequestReset} className="space-y-4">
                            <div>
                                <label className="block text-sm text-muted mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-bg-tertiary text-white rounded-lg px-4 py-3 border border-border-color/30 focus:border-accent-primary/50 focus:outline-none"
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn py-3"
                            >
                                {loading ? 'Enviando...' : 'Enviar Instrucciones'}
                            </button>
                        </form>
                    )}

                    {/* Step 2: Enter Token and New Password */}
                    {step === 2 && (
                        <>
                            {/* DEV: Show token for testing */}
                            {devToken && (
                                <div className="mb-4 p-3 rounded-lg bg-accent-warning/10 border border-accent-warning/30">
                                    <p className="text-xs text-accent-warning font-bold mb-1">🔧 MODO DESARROLLO</p>
                                    <p className="text-xs text-muted mb-2">En producción, este código se enviaría por email.</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-bg-primary text-white text-xs p-2 rounded break-all">
                                            {devToken}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setToken(devToken);
                                                navigator.clipboard?.writeText(devToken);
                                            }}
                                            className="px-2 py-1 text-xs bg-accent-warning/20 text-accent-warning rounded hover:bg-accent-warning/30 transition-colors"
                                        >
                                            Usar
                                        </button>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-muted mb-1">Código de recuperación</label>
                                    <input
                                        type="text"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        className="w-full bg-bg-tertiary text-white rounded-lg px-4 py-3 border border-border-color/30 focus:border-accent-primary/50 focus:outline-none font-mono text-sm"
                                        placeholder="Pega el código aquí"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-muted mb-1">Nueva contraseña</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-bg-tertiary text-white rounded-lg px-4 py-3 border border-border-color/30 focus:border-accent-primary/50 focus:outline-none"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                    <p className="text-xs text-muted mt-1">Mínimo 6 caracteres</p>
                                </div>
                                <div>
                                    <label className="block text-sm text-muted mb-1">Confirmar contraseña</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-bg-tertiary text-white rounded-lg px-4 py-3 border border-border-color/30 focus:border-accent-primary/50 focus:outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-xs text-accent-danger mt-1">Las contraseñas no coinciden</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || newPassword !== confirmPassword}
                                    className="w-full btn py-3"
                                >
                                    {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full text-sm text-muted hover:text-white transition-colors"
                                >
                                    ← Volver a solicitar código
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-accent-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-accent-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">¡Contraseña Actualizada!</h3>
                            <p className="text-sm text-muted mb-6">Ya puedes iniciar sesión con tu nueva contraseña.</p>
                            <Link to="/login" className="btn inline-block px-8">
                                Ir a Iniciar Sesión
                            </Link>
                        </div>
                    )}

                    {/* Back to Login */}
                    {step !== 3 && (
                        <div className="mt-6 text-center">
                            <Link to="/login" className="text-sm text-muted hover:text-accent-primary transition-colors">
                                ← Volver a Iniciar Sesión
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

