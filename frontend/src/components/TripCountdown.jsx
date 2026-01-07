import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const TripCountdown = () => {
    const [goal, setGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState({});
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const loadGoal = async () => {
            try {
                const res = await api.get('/savings-goals/active');
                setGoal(res);
            } catch (err) {
                console.error('Error loading savings goal:', err);
            } finally {
                setLoading(false);
            }
        };
        loadGoal();
    }, []);

    useEffect(() => {
        if (!goal?.target_date) return;

        const calculateTimeLeft = () => {
            const difference = new Date(goal.target_date) - new Date();
            
            if (difference > 0) {
                return {
                    días: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutos: Math.floor((difference / 1000 / 60) % 60),
                    segundos: Math.floor((difference / 1000) % 60)
                };
            }
            return null;
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [goal?.target_date]);

    const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        maximumFractionDigits: 0 
    }).format(val);

    const getColorClasses = (colorName) => {
        const colors = {
            amber: { gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20', bg: 'from-amber-500/10 to-orange-600/10', border: 'border-amber-500/20' },
            emerald: { gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20', bg: 'from-emerald-500/10 to-teal-600/10', border: 'border-emerald-500/20' },
            blue: { gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20', bg: 'from-blue-500/10 to-indigo-600/10', border: 'border-blue-500/20' },
            purple: { gradient: 'from-purple-500 to-pink-600', shadow: 'shadow-purple-500/20', bg: 'from-purple-500/10 to-pink-600/10', border: 'border-purple-500/20' },
            rose: { gradient: 'from-rose-500 to-red-600', shadow: 'shadow-rose-500/20', bg: 'from-rose-500/10 to-red-600/10', border: 'border-rose-500/20' }
        };
        return colors[colorName] || colors.amber;
    };

    if (loading) {
        return (
            <div className="card animate-pulse">
                <div className="h-32 bg-bg-tertiary rounded-lg"></div>
            </div>
        );
    }

    // Si no hay meta activa, mostrar mensaje para crear una
    if (!goal) {
        return (
            <div className="card bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-color/30">
                <div className="text-center py-4">
                    <span className="text-4xl mb-3 block">🎯</span>
                    <h3 className="font-bold text-white mb-1">Sin metas de ahorro</h3>
                    <p className="text-sm text-muted mb-4">Crea una meta para hacer seguimiento</p>
                    <a 
                        href="/settings" 
                        className="btn btn-secondary text-sm inline-flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Crear Meta
                    </a>
                </div>
            </div>
        );
    }

    const colors = getColorClasses(goal.color);
    const savingsProgress = goal.progress_percentage || 0;
    const daysRemaining = goal.days_remaining || 0;
    const remaining = goal.target_amount - goal.current_amount;
    const dailySavingsNeeded = daysRemaining > 0 ? remaining / daysRemaining : 0;

    // Meta completada
    if (savingsProgress >= 100) {
        return (
            <div className={`card bg-gradient-to-br ${colors.bg} border ${colors.border}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                        <span className="text-2xl">🎉</span>
                    </div>
                    <div>
                        <p className="font-bold text-accent-success">¡Meta alcanzada!</p>
                        <p className="text-sm text-white">{goal.name}</p>
                        <p className="text-xs text-muted">{formatCurrency(goal.target_amount)}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Fecha ya pasada
    if (!timeLeft && goal.target_date) {
        return (
            <div className={`card bg-gradient-to-br ${colors.bg} border ${colors.border}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                        <span className="text-2xl">{goal.icon}</span>
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-white">{goal.name}</p>
                        <p className="text-sm text-accent-warning">Fecha objetivo pasada</p>
                        <div className="mt-2">
                            <div className="flex justify-between text-xs text-muted mb-1">
                                <span>{savingsProgress.toFixed(0)}% completado</span>
                            </div>
                            <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden">
                                <div 
                                    className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full`}
                                    style={{ width: `${savingsProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`card overflow-hidden transition-all duration-500 cursor-pointer group ${
                isExpanded 
                    ? 'bg-gradient-to-br from-bg-secondary via-[#1a1f35] to-bg-secondary' 
                    : 'bg-gradient-to-br from-bg-secondary to-bg-tertiary'
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg ${colors.shadow} flex-shrink-0`}>
                        <span className="text-base sm:text-xl">{goal.icon}</span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-white flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                            <span className="truncate">{goal.name}</span>
                        </h3>
                        <p className="text-[10px] sm:text-xs text-muted">
                            {goal.target_date 
                                ? `Meta: ${new Date(goal.target_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                : 'Sin fecha límite'
                            }
                        </p>
                    </div>
                </div>
                <div className={`transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Countdown Display (only if target_date exists) */}
            {timeLeft && Object.keys(timeLeft).length > 0 && (
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-4">
                    {Object.entries(timeLeft).map(([unit, value]) => (
                        <div 
                            key={unit} 
                            className={`text-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-bg-primary/50 border border-border-color/30 group-hover:${colors.border} transition-colors`}
                        >
                            <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tabular-nums">
                                {String(value).padStart(2, '0')}
                            </p>
                            <p className="text-[8px] sm:text-[10px] text-muted uppercase tracking-wider truncate">{unit}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Progress bar (always visible) */}
            {!timeLeft && (
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted mb-1">
                        <span>{formatCurrency(goal.current_amount)}</span>
                        <span className="font-bold text-white">{savingsProgress.toFixed(0)}%</span>
                        <span>{formatCurrency(goal.target_amount)}</span>
                    </div>
                    <div className="w-full h-3 bg-bg-primary rounded-full overflow-hidden">
                        <div 
                            className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-1000`}
                            style={{ width: `${savingsProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Expanded Content */}
            <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pt-4 border-t border-border-color/30 space-y-4">
                    {/* Savings Progress */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted">Meta de Ahorro</span>
                            <span className={`text-xs font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
                                {savingsProgress.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full h-3 bg-bg-primary rounded-full overflow-hidden">
                            <div 
                                className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-1000 relative`}
                                style={{ width: `${savingsProgress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted mt-1">
                            <span>{formatCurrency(goal.current_amount)}</span>
                            <span>{formatCurrency(goal.target_amount)}</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-color/20">
                            <p className="text-xs text-muted mb-1">Te falta ahorrar</p>
                            <p className="text-lg font-bold text-accent-warning">{formatCurrency(remaining)}</p>
                        </div>
                        {daysRemaining > 0 && (
                            <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-color/20">
                                <p className="text-xs text-muted mb-1">Ahorro diario sugerido</p>
                                <p className="text-lg font-bold text-accent-success">{formatCurrency(dailySavingsNeeded)}</p>
                            </div>
                        )}
                    </div>

                    {/* Motivational Message */}
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${colors.bg} border ${colors.border}`}>
                        <p className="text-xs text-center text-muted">
                            {savingsProgress >= 100 
                                ? '🎉 ¡Meta alcanzada!'
                                : savingsProgress >= 75 
                                    ? '🔥 ¡Casi lo logras! Solo un poco más'
                                    : savingsProgress >= 50 
                                        ? '💪 ¡Vas muy bien! Mantén el ritmo'
                                        : '🚀 ¡Cada peso cuenta! Sigue ahorrando'}
                        </p>
                    </div>

                    {/* Link to Settings */}
                    <div className="text-center">
                        <a 
                            href="/settings" 
                            className="text-xs text-muted hover:text-accent-primary transition-colors inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Gestionar metas
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TripCountdown;
