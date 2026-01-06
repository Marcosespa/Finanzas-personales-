import React, { useState } from 'react';

const CurrencyWidget = ({ onConvert }) => {
    const [amount, setAmount] = useState('');
    const [fromCurrency, setFromCurrency] = useState('COP');
    const [toCurrency, setToCurrency] = useState('EUR');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const currencies = [
        { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'USD', name: 'Dólar', symbol: '$' },
        { code: 'CZK', name: 'Corona Checa', symbol: 'Kč' }
    ];

    const handleConvert = async () => {
        if (!amount || amount <= 0) return;

        setLoading(true);
        try {
            // This will be implemented when exchange rate API is ready
            // For now, mock conversion
            const mockRates = {
                'COP_EUR': 0.00022,
                'COP_USD': 0.00024,
                'COP_CZK': 0.0055,
                'EUR_COP': 4500,
                'EUR_USD': 1.1,
                'EUR_CZK': 25,
                'USD_COP': 4200,
                'USD_EUR': 0.91,
                'USD_CZK': 23,
                'CZK_COP': 180,
                'CZK_EUR': 0.04,
                'CZK_USD': 0.043
            };

            const key = `${fromCurrency}_${toCurrency}`;
            const rate = mockRates[key] || 1;
            const converted = parseFloat(amount) * rate;

            setResult({
                original: parseFloat(amount),
                converted: converted,
                rate: rate
            });
        } catch (error) {
            console.error('Conversion error:', error);
        } finally {
            setLoading(false);
        }
    };

    const swap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
        setResult(null);
    };

    return (
        <div className="card bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-color hover:border-primary/30 transition-all">
            <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-bold text-white">Conversor de Moneda</h3>
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                    <div>
                        <label className="block text-xs text-muted mb-1">De</label>
                        <select
                            value={fromCurrency}
                            onChange={(e) => setFromCurrency(e.target.value)}
                            className="w-full text-sm"
                        >
                            {currencies.map(c => (
                                <option key={c.code} value={c.code}>{c.code}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={swap}
                        className="btn-ghost p-2 mb-1 hover:rotate-180 transition-transform duration-300"
                        title="Intercambiar"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </button>

                    <div>
                        <label className="block text-xs text-muted mb-1">A</label>
                        <select
                            value={toCurrency}
                            onChange={(e) => setToCurrency(e.target.value)}
                            className="w-full text-sm"
                        >
                            {currencies.map(c => (
                                <option key={c.code} value={c.code}>{c.code}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-muted mb-1">Cantidad</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleConvert()}
                        placeholder="0.00"
                        className="w-full"
                    />
                </div>

                <button
                    onClick={handleConvert}
                    disabled={loading || !amount}
                    className="btn w-full text-sm"
                >
                    {loading ? 'Convirtiendo...' : 'Convertir'}
                </button>

                {result && (
                    <div className="mt-4 p-3 bg-bg-primary rounded-lg border border-primary/20 animate-fade-in">
                        <div className="flex justify-between items-baseline">
                            <span className="text-muted text-xs">Resultado</span>
                            <span className="text-xs text-muted">Tasa: {result.rate}</span>
                        </div>
                        <p className="text-2xl font-bold text-primary mt-1">
                            {result.converted.toLocaleString('es-CO', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                            <span className="text-sm text-muted ml-2">{toCurrency}</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CurrencyWidget;
