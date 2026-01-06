import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

const AccountAudit = () => {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingTx, setLoadingTx] = useState(false);
    const toast = useToast();

    // Filters
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of month
        endDate: new Date().toISOString().split('T')[0], // Today
        type: 'all', // all, income, expense
        categoryId: ''
    });

    const [categories, setCategories] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // list, summary

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [accountsData, categoriesData] = await Promise.all([
                api.get('/accounts/'),
                api.get('/categories/')
            ]);
            setAccounts(accountsData);
            setCategories(categoriesData);
            
            if (accountsData.length > 0) {
                setSelectedAccount(accountsData[0]);
            }
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedAccount) {
            loadTransactions();
        }
    }, [selectedAccount, filters]);

    const loadTransactions = async () => {
        if (!selectedAccount) return;
        
        setLoadingTx(true);
        try {
            let url = `/accounts/${selectedAccount.id}/transactions?`;
            url += `start_date=${filters.startDate}&end_date=${filters.endDate}`;
            
            if (filters.type !== 'all') {
                url += `&type=${filters.type}`;
            }
            if (filters.categoryId) {
                url += `&category_id=${filters.categoryId}`;
            }
            
            const data = await api.get(url);
            setTransactions(data.transactions);
            setSummary(data.summary);
        } catch (error) {
            toast.error('Error al cargar transacciones');
        } finally {
            setLoadingTx(false);
        }
    };

    const formatCurrency = (val, currency = 'COP') => {
        return new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: currency,
            maximumFractionDigits: 0 
        }).format(val);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('es-CO', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    // Quick date filters
    const setQuickDateRange = (range) => {
        const today = new Date();
        let start, end;

        switch (range) {
            case 'today':
                start = end = today.toISOString().split('T')[0];
                break;
            case 'week':
                const monday = new Date(today);
                monday.setDate(today.getDate() - today.getDay() + 1);
                start = monday.toISOString().split('T')[0];
                end = today.toISOString().split('T')[0];
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                end = today.toISOString().split('T')[0];
                break;
            case 'quarter':
                const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
                start = new Date(today.getFullYear(), quarterMonth, 1).toISOString().split('T')[0];
                end = today.toISOString().split('T')[0];
                break;
            case 'year':
                start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                end = today.toISOString().split('T')[0];
                break;
            default:
                return;
        }

        setFilters({ ...filters, startDate: start, endDate: end });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-primary">
                        Auditoría de Cuentas
                    </h1>
                    <p className="text-muted text-sm mt-1">Analiza los movimientos de cada cuenta en detalle</p>
                </div>
            </div>

            {/* Account Selector Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {accounts.map(acc => (
                    <button
                        key={acc.id}
                        onClick={() => setSelectedAccount(acc)}
                        className={`p-4 rounded-xl border transition-all duration-200 text-left group ${
                            selectedAccount?.id === acc.id
                                ? 'bg-gradient-to-br from-accent-primary/20 to-indigo-600/20 border-accent-primary shadow-lg shadow-accent-primary/20'
                                : 'bg-bg-secondary border-border-color/50 hover:border-accent-primary/50 hover:bg-bg-tertiary/50'
                        }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                selectedAccount?.id === acc.id ? 'bg-accent-primary' : 'bg-bg-tertiary'
                            }`}>
                                {acc.type === 'bank' && (
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                    </svg>
                                )}
                                {acc.type === 'cash' && (
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                )}
                                {acc.type === 'credit' && (
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                )}
                                {acc.type === 'investment' && (
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                )}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                selectedAccount?.id === acc.id ? 'bg-accent-primary/30 text-white' : 'bg-bg-tertiary text-muted'
                            }`}>
                                {acc.currency_code}
                            </span>
                        </div>
                        <p className={`font-semibold text-sm truncate ${selectedAccount?.id === acc.id ? 'text-white' : 'text-white group-hover:text-accent-primary'}`}>
                            {acc.name}
                        </p>
                        <p className={`text-lg font-bold mt-1 ${acc.balance < 0 ? 'text-accent-danger' : 'text-accent-success'}`}>
                            {formatCurrency(acc.balance, acc.currency_code)}
                        </p>
                    </button>
                ))}
            </div>

            {selectedAccount && (
                <>
                    {/* Filters Section */}
                    <div className="card">
                        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                            {/* Quick Date Filters */}
                            <div className="flex-1">
                                <label className="block text-xs text-muted mb-2 uppercase tracking-wider font-semibold">Período Rápido</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'today', label: 'Hoy' },
                                        { id: 'week', label: 'Esta Semana' },
                                        { id: 'month', label: 'Este Mes' },
                                        { id: 'quarter', label: 'Trimestre' },
                                        { id: 'year', label: 'Este Año' }
                                    ].map(range => (
                                        <button
                                            key={range.id}
                                            onClick={() => setQuickDateRange(range.id)}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-bg-tertiary border border-border-color/50 text-muted hover:text-white hover:border-accent-primary/50 hover:bg-accent-primary/10 transition-all"
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Date Range */}
                            <div className="flex gap-3">
                                <div>
                                    <label className="block text-xs text-muted mb-2">Desde</label>
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                        className="px-3 py-2 text-sm bg-bg-tertiary rounded-lg border border-border-color/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-muted mb-2">Hasta</label>
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                        className="px-3 py-2 text-sm bg-bg-tertiary rounded-lg border border-border-color/50"
                                    />
                                </div>
                            </div>

                            {/* Type Filter */}
                            <div>
                                <label className="block text-xs text-muted mb-2">Tipo</label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                    className="px-3 py-2 text-sm bg-bg-tertiary rounded-lg border border-border-color/50"
                                >
                                    <option value="all">Todos</option>
                                    <option value="income">Ingresos</option>
                                    <option value="expense">Gastos</option>
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label className="block text-xs text-muted mb-2">Categoría</label>
                                <select
                                    value={filters.categoryId}
                                    onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                                    className="px-3 py-2 text-sm bg-bg-tertiary rounded-lg border border-border-color/50 min-w-[150px]"
                                >
                                    <option value="">Todas</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    {summary && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="card bg-gradient-to-br from-accent-success/10 to-emerald-600/5 border border-accent-success/20">
                                <p className="text-xs text-muted uppercase tracking-wider mb-1">Total Ingresos</p>
                                <p className="text-2xl font-bold text-accent-success">
                                    {formatCurrency(summary.total_income, selectedAccount.currency_code)}
                                </p>
                            </div>
                            <div className="card bg-gradient-to-br from-accent-danger/10 to-rose-600/5 border border-accent-danger/20">
                                <p className="text-xs text-muted uppercase tracking-wider mb-1">Total Gastos</p>
                                <p className="text-2xl font-bold text-accent-danger">
                                    {formatCurrency(summary.total_expense, selectedAccount.currency_code)}
                                </p>
                            </div>
                            <div className={`card ${summary.net_change >= 0 ? 'bg-gradient-to-br from-accent-primary/10 to-indigo-600/5 border border-accent-primary/20' : 'bg-gradient-to-br from-accent-warning/10 to-amber-600/5 border border-accent-warning/20'}`}>
                                <p className="text-xs text-muted uppercase tracking-wider mb-1">Balance Neto</p>
                                <p className={`text-2xl font-bold ${summary.net_change >= 0 ? 'text-accent-primary' : 'text-accent-warning'}`}>
                                    {summary.net_change >= 0 ? '+' : ''}{formatCurrency(summary.net_change, selectedAccount.currency_code)}
                                </p>
                            </div>
                            <div className="card bg-bg-secondary border border-border-color/50">
                                <p className="text-xs text-muted uppercase tracking-wider mb-1">Transacciones</p>
                                <p className="text-2xl font-bold text-white">{summary.transaction_count}</p>
                            </div>
                        </div>
                    )}

                    {/* View Toggle & Content */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                viewMode === 'list' 
                                    ? 'bg-accent-primary text-white' 
                                    : 'bg-bg-tertiary text-muted hover:text-white'
                            }`}
                        >
                            Lista de Movimientos
                        </button>
                        <button
                            onClick={() => setViewMode('summary')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                viewMode === 'summary' 
                                    ? 'bg-accent-primary text-white' 
                                    : 'bg-bg-tertiary text-muted hover:text-white'
                            }`}
                        >
                            Por Categoría
                        </button>
                    </div>

                    {viewMode === 'list' ? (
                        /* Transactions List */
                        <div className="card">
                            {loadingTx ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                                </div>
                            ) : transactions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-muted text-xs uppercase tracking-wider border-b border-border-color/50">
                                                <th className="py-3 px-4 font-semibold">Fecha</th>
                                                <th className="py-3 px-4 font-semibold">Descripción</th>
                                                <th className="py-3 px-4 font-semibold">Categoría</th>
                                                <th className="py-3 px-4 font-semibold text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-color/30">
                                            {transactions.map(tx => (
                                                <tr key={tx.id} className="hover:bg-bg-tertiary/30 transition-colors group">
                                                    <td className="py-4 px-4">
                                                        <span className="text-sm text-muted">{formatDate(tx.date)}</span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="font-medium text-white">{tx.description || 'Sin descripción'}</span>
                                                        {tx.has_splits && (
                                                            <span className="ml-2 px-2 py-0.5 text-[10px] bg-accent-primary/20 text-accent-primary rounded-full">
                                                                Dividido
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="px-2.5 py-1 rounded-full bg-bg-tertiary text-xs border border-border-color/50 text-muted">
                                                            {tx.category}
                                                        </span>
                                                    </td>
                                                    <td className={`py-4 px-4 text-right font-bold ${
                                                        tx.type === 'income' ? 'text-accent-success' : 'text-white'
                                                    }`}>
                                                        {tx.type === 'income' ? '+' : '-'}
                                                        {formatCurrency(Math.abs(tx.amount), selectedAccount.currency_code)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 mx-auto text-muted/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p className="text-muted">No hay transacciones en este período</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Category Breakdown */
                        <div className="card">
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5 text-accent-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                </svg>
                                Desglose por Categoría
                            </h3>
                            {summary?.category_breakdown?.length > 0 ? (
                                <div className="space-y-4">
                                    {summary.category_breakdown.map((item, idx) => {
                                        const percentage = (item.amount / summary.total_expense) * 100;
                                        return (
                                            <div key={idx} className="group">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-white group-hover:text-accent-warning transition-colors">
                                                        {item.category}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-muted text-sm">{percentage.toFixed(1)}%</span>
                                                        <span className="font-bold text-white">
                                                            {formatCurrency(item.amount, selectedAccount.currency_code)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-accent-warning to-amber-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-muted text-center py-8">No hay datos de categorías para este período</p>
                            )}
                        </div>
                    )}
                </>
            )}

            {accounts.length === 0 && (
                <div className="card text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-muted/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="text-muted mb-4">No tienes cuentas registradas</p>
                    <a href="/accounts" className="btn">Crear Cuenta</a>
                </div>
            )}
        </div>
    );
};

export default AccountAudit;



