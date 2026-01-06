import React, { useState, useEffect } from 'react';

const TripCountdown = ({ targetDate = '2026-02-01', destination = 'Praga', savingsGoal = 15000000, currentSavings = 0 }) => {
    const [timeLeft, setTimeLeft] = useState({});
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate) - new Date();
            
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
    }, [targetDate]);

    const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        maximumFractionDigits: 0 
    }).format(val);

    const savingsProgress = Math.min((currentSavings / savingsGoal) * 100, 100);
    const daysRemaining = timeLeft?.días || 0;
    const dailySavingsNeeded = daysRemaining > 0 ? (savingsGoal - currentSavings) / daysRemaining : 0;

    if (!timeLeft) {
        return (
            <div className="card bg-gradient-to-br from-accent-success/20 to-emerald-600/10 border border-accent-success/30">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🎉</span>
                    <div>
                        <p className="font-bold text-accent-success">¡Tu aventura en {destination} comenzó!</p>
                        <p className="text-sm text-muted">Disfruta tu pasantía</p>
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
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <span className="text-xl">✈️</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-white flex items-center gap-2">
                            Countdown a {destination}
                            <span className="text-lg">🇨🇿</span>
                        </h3>
                        <p className="text-xs text-muted">Tu pasantía te espera</p>
                    </div>
                </div>
                <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Countdown Display */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {Object.entries(timeLeft).map(([unit, value]) => (
                    <div 
                        key={unit} 
                        className="text-center p-3 rounded-xl bg-bg-primary/50 border border-border-color/30 group-hover:border-accent-primary/30 transition-colors"
                    >
                        <p className="text-2xl lg:text-3xl font-bold text-white tabular-nums">
                            {String(value).padStart(2, '0')}
                        </p>
                        <p className="text-[10px] text-muted uppercase tracking-wider">{unit}</p>
                    </div>
                ))}
            </div>

            {/* Expanded Content */}
            <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pt-4 border-t border-border-color/30 space-y-4">
                    {/* Savings Progress */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted">Meta de Ahorro</span>
                            <span className="text-xs font-bold text-accent-primary">{savingsProgress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-bg-primary rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-accent-primary to-indigo-500 rounded-full transition-all duration-1000 relative"
                                style={{ width: `${savingsProgress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted mt-1">
                            <span>{formatCurrency(currentSavings)}</span>
                            <span>{formatCurrency(savingsGoal)}</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-color/20">
                            <p className="text-xs text-muted mb-1">Te falta ahorrar</p>
                            <p className="text-lg font-bold text-accent-warning">{formatCurrency(savingsGoal - currentSavings)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-color/20">
                            <p className="text-xs text-muted mb-1">Ahorro diario sugerido</p>
                            <p className="text-lg font-bold text-accent-success">{formatCurrency(dailySavingsNeeded)}</p>
                        </div>
                    </div>

                    {/* Motivational Message */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-accent-primary/10 to-indigo-600/10 border border-accent-primary/20">
                        <p className="text-xs text-center text-muted">
                            {savingsProgress >= 100 
                                ? '🎉 ¡Meta alcanzada! Estás listo para Praga'
                                : savingsProgress >= 75 
                                    ? '🔥 ¡Casi lo logras! Solo un poco más'
                                    : savingsProgress >= 50 
                                        ? '💪 ¡Vas muy bien! Mantén el ritmo'
                                        : '🚀 ¡Cada peso cuenta! Sigue ahorrando'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TripCountdown;



