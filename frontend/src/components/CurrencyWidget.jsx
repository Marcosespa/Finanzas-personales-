import React, { useState, useEffect } from 'react';

const CurrencyWidget = ({ onConvert }) => {
    const [amount, setAmount] = useState('');
    const [fromCurrency, setFromCurrency] = useState('COP');
    const [toCurrency, setToCurrency] = useState('CZK');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showQuickRates, setShowQuickRates] = useState(true);

    const currencies = [
        { code: 'COP', name: 'Peso Colombiano', symbol: '$', flag: '🇨🇴' },
        { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
        { code: 'USD', name: 'Dólar', symbol: '$', flag: '🇺🇸' },
        { code: 'CZK', name: 'Corona Checa', symbol: 'Kč', flag: '🇨🇿' }
    ];

    // Tasas aproximadas actualizadas (Enero 2026)
    const mockRates = {
        'COP_EUR': 0.000225,
        'COP_USD': 0.000240,
        'COP_CZK': 0.00565,
        'EUR_COP': 4450,
        'EUR_USD': 1.08,
        'EUR_CZK': 25.1,
        'USD_COP': 4170,
        'USD_EUR': 0.93,
        'USD_CZK': 23.3,
        'CZK_COP': 177,
        'CZK_EUR': 0.0398,
        'CZK_USD': 0.043
    };

    // Quick conversion presets relevantes para estudiante en Praga
    const quickAmounts = {
        COP: [50000, 100000, 500000, 1000000],
        EUR: [10, 50, 100, 500],
        USD: [10, 50, 100, 500],
        CZK: [100, 500, 1000, 5000]
    };

    const handleConvert = async (customAmount = null) => {
        const amountToConvert = customAmount || amount;
        if (!amountToConvert || amountToConvert <= 0) return;

        setLoading(true);
        try {
            // Simular pequeño delay de API
            await new Promise(resolve => setTimeout(resolve, 300));

            const key = `${fromCurrency}_${toCurrency}`;
            const rate = mockRates[key] || 1;
            const converted = parseFloat(amountToConvert) * rate;

            setResult({
                original: parseFloat(amountToConvert),
                converted: converted,
                rate: rate
            });

            if (customAmount) {
                setAmount(customAmount.toString());
            }
        } catch (error) {
            console.error('Conversion error:', error);
        } finally {
            setLoading(false);
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

    return (
        <div className="card bg-gradient-to-br from-bg-secondary via-[#151b2e] to-bg-secondary border border-border-color/50 hover:border-accent-primary/30 transition-all duration-300 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Conversor</h3>
                        <p className="text-[10px] text-muted">COP ↔ CZK • EUR • USD</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent-success/10 border border-accent-success/20">
                    <span className="w-1.5 h-1.5 bg-accent-success rounded-full animate-pulse" />
                    <span className="text-[10px] text-accent-success">Live</span>
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
                                onChange={(e) => { setFromCurrency(e.target.value); setResult(null); }}
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
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleConvert()}
                        placeholder="0.00"
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
                    </div>
                )}

                {/* Quick Reference Rates */}
                <div className="pt-3 border-t border-border-color/30">
                    <button 
                        onClick={() => setShowQuickRates(!showQuickRates)}
                        className="flex items-center justify-between w-full text-xs text-muted hover:text-white transition-colors"
                    >
                        <span>Tasas de referencia para Praga</span>
                        <svg className={`w-4 h-4 transition-transform ${showQuickRates ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {showQuickRates && (
                        <div className="mt-3 grid grid-cols-2 gap-2 animate-fade-in">
                            <div className="p-2 rounded-lg bg-bg-tertiary/30 text-center">
                                <p className="text-[10px] text-muted">COP → CZK</p>
                                <p className="text-sm font-semibold text-white">1M = 5,650 Kč</p>
                            </div>
                            <div className="p-2 rounded-lg bg-bg-tertiary/30 text-center">
                                <p className="text-[10px] text-muted">EUR → CZK</p>
                                <p className="text-sm font-semibold text-white">1€ = 25.1 Kč</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CurrencyWidget;
