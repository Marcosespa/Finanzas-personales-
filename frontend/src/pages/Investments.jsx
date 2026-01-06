import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';

const Investments = () => {
    const [portfolio, setPortfolio] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

    // Trade Form State
    const [tradeData, setTradeData] = useState({
        account_id: '',
        symbol: '',
        action: 'buy', // buy, sell
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
    });

    const fetchData = async () => {
        try {
            const [pfData, accData] = await Promise.all([
                api.get('/investments/'),
                api.get('/accounts/')
            ]);
            setPortfolio(pfData);
            // Filter only investment accounts
            const invAccounts = accData.filter(a => a.type === 'investment');
            setAccounts(invAccounts);
            if (invAccounts.length > 0 && !tradeData.account_id) {
                setTradeData(prev => ({ ...prev, account_id: invAccounts[0].id }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTradeParams = (e) => {
        const { name, value } = e.target;
        setTradeData({ ...tradeData, [name]: value });
    };

    const handleTradeSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/investments/trade', {
                ...tradeData,
                quantity: parseFloat(tradeData.quantity),
                price: parseFloat(tradeData.price)
            });
            setIsTradeModalOpen(false);
            fetchData();
        } catch (err) {
            alert("Trade failed: " + (err.msg || err));
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Investments</h1>
                <button onClick={() => setIsTradeModalOpen(true)} className="btn">Record Trade</button>
            </div>

            {/* Portfolio Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-tertiary text-muted text-sm uppercase tracking-wider">
                                <th className="p-4 font-medium">Symbol</th>
                                <th className="p-4 font-medium">Qty</th>
                                <th className="p-4 font-medium">Avg Price</th>
                                <th className="p-4 font-medium">Current Value</th>
                                <th className="p-4 font-medium">Unrealized P/L</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-tertiary">
                            {portfolio.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-4 text-center text-muted">No investments found.</td>
                                </tr>
                            ) : (
                                portfolio.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-bg-tertiary transition-colors">
                                        <td className="p-4 font-bold text-accent-primary">{item.symbol}</td>
                                        <td className="p-4">{item.quantity}</td>
                                        <td className="p-4">{formatCurrency(item.avg_buy_price)}</td>
                                        <td className="p-4 font-medium">{formatCurrency(item.current_value)}</td>
                                        <td className={`p-4 font-medium ${item.unrealized_profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {formatCurrency(item.unrealized_profit)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Trade Modal */}
            <Modal isOpen={isTradeModalOpen} onClose={() => setIsTradeModalOpen(false)} title="Record Trade">
                {accounts.length === 0 ? (
                    <p className="text-danger">You need an Investment Account first.</p>
                ) : (
                    <form onSubmit={handleTradeSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm mb-1 text-muted">Account</label>
                            <select name="account_id" className="w-full bg-tertiary text-primary" value={tradeData.account_id} onChange={handleTradeParams}>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm mb-1 text-muted">Action</label>
                                <select name="action" className="w-full bg-tertiary text-primary" value={tradeData.action} onChange={handleTradeParams}>
                                    <option value="buy">Buy</option>
                                    <option value="sell">Sell</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-muted">Date</label>
                                <input type="date" name="date" className="w-full bg-tertiary text-primary" value={tradeData.date} onChange={handleTradeParams} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm mb-1 text-muted">Symbol</label>
                            <input type="text" name="symbol" className="w-full bg-tertiary text-primary uppercase" required value={tradeData.symbol} onChange={handleTradeParams} placeholder="AAPL" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm mb-1 text-muted">Quantity</label>
                                <input type="number" step="any" name="quantity" className="w-full bg-tertiary text-primary" required value={tradeData.quantity} onChange={handleTradeParams} />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-muted">Price per unit</label>
                                <input type="number" step="any" name="price" className="w-full bg-tertiary text-primary" required value={tradeData.price} onChange={handleTradeParams} />
                            </div>
                        </div>

                        <button type="submit" className={`btn mt-4 ${tradeData.action === 'sell' ? 'bg-accent-danger hover:bg-red-600' : ''}`}>
                            {tradeData.action.toUpperCase()}
                        </button>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default Investments;
