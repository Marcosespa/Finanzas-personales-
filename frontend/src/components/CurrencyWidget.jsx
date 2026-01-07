import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatNumberWithThousands, parseFormattedNumber } from '../utils/currency';

const CurrencyWidget = ({ onConvert }) => {
    const [amount, setAmount] = useState('');
    const [fromCurrency, setFromCurrency] = useState('COP');
    const [toCurrency, setToCurrency] = useState('CZK');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showQuickRates, setShowQuickRates] = useState(true);
    const [ratesInfo, setRatesInfo] = useState({ source: 'fallback', lastUpdated: null });
    const [refreshing, setRefreshing] = useState(false);

    const currencies = [
        { code: 'COP', name: 'Peso Colombiano', symbol: '$', flag: '🇨🇴' },
        { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
        { code: 'USD', name: 'Dólar', symbol: '$', flag: '🇺🇸' },
        { code: 'CZK', name: 'Corona Checa', symbol: 'Kč', flag: '🇨🇿' }
    ];

    // Quick conversion presets
    const quickAmounts = {
        COP: [50000, 100000, 500000, 1000000],
        EUR: [10, 50, 100, 500],
        USD: [10, 50, 100, 500],
        CZK: [100, 500, 1000, 5000]
    };

    // Load rates info on mount
    useEffect(() => {
        loadRatesInfo();
    }, []);

    const loadRatesInfo = async () => {
        try {
            const res = await api.get('/exchange-rates/');
            setRatesInfo({
                source: res.source,
                lastUpdated: res.last_updated
            });
        } catch (e) {
            console.error('Error loading rates info:', e);
        }
    };

    const handleConvert = async (customAmount = null) => {
        const amountToConvert = customAmount || parseFormattedNumber(amount);
        if (!amountToConvert || parseFloat(amountToConvert) <= 0) return;

        setLoading(true);
        try {
            const res = await api.get(`/exchange-rates/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amountToConvert}`);
            
            setResult({
                original: res.amount,
                converted: res.converted,
                rate: res.rate,
                source: res.source
            });

            if (customAmount) {
                setAmount(formatNumberWithThousands(customAmount.toString(), fromCurrency));
            }
        } catch (error) {
            console.error('Conversion error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshRates = async () => {
        setRefreshing(true);
        try {
            await api.post('/exchange-rates/refresh');
            await loadRatesInfo();
        } catch (e) {
            console.error('Error refreshing rates:', e);
        } finally {
            setRefreshing(false);
        }
    };

    const swap = () => {
        const temp = fromCurrency;
        setFromCurrency(toCurrency);
        setToCurrency(temp);
        setResult(null);
        setAmount('');
    };

    const getCurrencyInfo = (code) => currencies.find(c => c.code === code);

    const formatNumber = (num, currency) => {
        const decimals = ['COP', 'CZK'].includes(currency) ? 0 : 2;
        return num.toLocaleString('es-CO', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };

    const formatLastUpdated = () => {
        if (!ratesInfo.lastUpdated) return null;
        const date = new Date(ratesInfo.lastUpdated);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'ahora';
        if (diffMins < 60) return `hace ${diffMins}m`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `hace ${diffHours}h`;
        return date.toLocaleDateString('es-CO');
    };

    return (
        <div className="card bg-gradient-to-br from-bg-secondary via-[#151b2e] to-bg-secondary border border-border-color/50 hover:border-accent-primary/30 transition-all duration-300 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm sm:text-base">Conversor</h3>
                        <p className="text-[9px] sm:text-[10px] text-muted">COP ↔ CZK • EUR • USD</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefreshRates}
                        disabled={refreshing}
                        className="p-1.5 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary text-muted hover:text-white transition-all"
                        title="Actualizar tasas"
                    >
                        <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full border flex-shrink-0 ${
                        ratesInfo.source === 'live' 
                            ? 'bg-accent-success/10 border-accent-success/20' 
                            : 'bg-accent-warning/10 border-accent-warning/20'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                            ratesInfo.source === 'live' 
                                ? 'bg-accent-success animate-pulse' 
                                : 'bg-accent-warning'
                        }`} />
                        <span className={`text-[9px] sm:text-[10px] ${
                            ratesInfo.source === 'live' ? 'text-accent-success' : 'text-accent-warning'
                        }`}>
                            {ratesInfo.source === 'live' ? 'Live' : 'Offline'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Currency Selectors */}
            <div className="space-y-3">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                    {/* From Currency */}
                    <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-color/30">
                        <label className="block text-[10px] text-muted mb-1 uppercase tracking-wider">De</label>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{getCurrencyInfo(fromCurrency)?.flag}</span>
                            <select
                                value={fromCurrency}
                                onChange={(e) => { 
                                    const newCurrency = e.target.value;
                                    setFromCurrency(newCurrency); 
                                    setResult(null);
                                    if (amount) {
                                        const parsed = parseFormattedNumber(amount);
                                        if (parsed) {
                                            setAmount(formatNumberWithThousands(parsed, newCurrency));
                                        }
                                    }
                                }}
                                className="bg-transparent border-none p-0 text-sm font-semibold text-white focus:ring-0 cursor-pointer"
                            >
                                {currencies.map(c => (
                                    <option key={c.code} value={c.code}>{c.code}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Swap Button */}
                    <button
                        onClick={swap}
                        className="w-10 h-10 rounded-full bg-bg-tertiary hover:bg-accent-primary/20 border border-border-color/30 hover:border-accent-primary/50 flex items-center justify-center transition-all duration-300 hover:rotate-180 group"
                        title="Intercambiar"
                    >
                        <svg className="w-4 h-4 text-muted group-hover:text-accent-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </button>

                    {/* To Currency */}
                    <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border-color/30">
                        <label className="block text-[10px] text-muted mb-1 uppercase tracking-wider">A</label>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{getCurrencyInfo(toCurrency)?.flag}</span>
                            <select
                                value={toCurrency}
                                onChange={(e) => { setToCurrency(e.target.value); setResult(null); }}
                                className="bg-transparent border-none p-0 text-sm font-semibold text-white focus:ring-0 cursor-pointer"
                            >
                                {currencies.map(c => (
                                    <option key={c.code} value={c.code}>{c.code}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-muted font-medium">{getCurrencyInfo(fromCurrency)?.symbol}</span>
                    </div>
                    <input
                        type="text"
                        value={amount}
                        onChange={(e) => {
                            const value = e.target.value;
                            const cleaned = value.replace(/[^\d.]/g, '');
                            if (cleaned === '' || cleaned === '.') {
                                setAmount('');
                                return;
                            }
                            const formatted = formatNumberWithThousands(cleaned, fromCurrency);
                            setAmount(formatted);
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleConvert()}
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-3 text-lg font-semibold bg-bg-tertiary/30 border border-border-color/30 rounded-xl focus:border-accent-primary/50 focus:ring-2 focus:ring-accent-primary/10"
                    />
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex gap-2 flex-wrap">
                    {quickAmounts[fromCurrency]?.map((quickAmount) => (
                        <button
                            key={quickAmount}
                            onClick={() => handleConvert(quickAmount)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-bg-tertiary/50 border border-border-color/30 text-muted hover:text-white hover:border-accent-primary/50 hover:bg-accent-primary/10 transition-all"
                        >
                            {formatNumber(quickAmount, fromCurrency)}
                        </button>
                    ))}
                </div>

                {/* Convert Button */}
                <button
                    onClick={() => handleConvert()}
                    disabled={loading || !amount}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Convirtiendo...
                        </span>
                    ) : 'Convertir'}
                </button>

                {/* Result */}
                {result && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-accent-primary/10 to-indigo-600/10 border border-accent-primary/20 animate-fade-in">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{getCurrencyInfo(fromCurrency)?.flag}</span>
                                <span className="text-sm text-muted">
                                    {formatNumber(result.original, fromCurrency)} {fromCurrency}
                                </span>
                            </div>
                            <span className="text-[10px] text-muted bg-bg-tertiary px-2 py-1 rounded-full">
                                1 {fromCurrency} = {result.rate.toFixed(result.rate < 1 ? 6 : 2)} {toCurrency}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{getCurrencyInfo(toCurrency)?.flag}</span>
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {formatNumber(result.converted, toCurrency)}
                                    <span className="text-sm font-normal text-muted ml-2">{toCurrency}</span>
                                </p>
                            </div>
                        </div>
                        {result.source && (
                            <p className="text-[9px] text-muted mt-2 text-right">
                                Tasa: {result.source === 'live' ? 'Tiempo real' : 'Aproximada (COP no soportado por BCE)'}
                            </p>
                        )}
                    </div>
                )}

                {/* Quick Reference & Last Updated */}
                <div className="pt-3 border-t border-border-color/30">
                    <div className="flex justify-between items-center">
                        <button 
                            onClick={() => setShowQuickRates(!showQuickRates)}
                            className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors"
                        >
                            <span>Tasas de referencia</span>
                            <svg className={`w-4 h-4 transition-transform ${showQuickRates ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {ratesInfo.lastUpdated && (
                            <span className="text-[9px] text-muted">
                                Actualizado {formatLastUpdated()}
                            </span>
                        )}
                    </div>
                    {showQuickRates && (
                        <div className="mt-3 grid grid-cols-2 gap-2 animate-fade-in">
                            <div className="p-2 rounded-lg bg-bg-tertiary/30 text-center">
                                <p className="text-[10px] text-muted">COP → CZK</p>
                                <p className="text-sm font-semibold text-white">1M ≈ 5.700 Kč</p>
                            </div>
                            <div className="p-2 rounded-lg bg-bg-tertiary/30 text-center">
                                <p className="text-[10px] text-muted">CZK → COP</p>
                                <p className="text-sm font-semibold text-white">1 Kč ≈ 175 COP</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CurrencyWidget;
