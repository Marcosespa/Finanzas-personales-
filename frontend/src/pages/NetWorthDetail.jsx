import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

const NetWorthDetail = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const accountsData = await api.get('/accounts/');
                setAccounts(accountsData);
            } catch (error) {
                console.error('Error:', error);
                toast.error('Error al cargar datos');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (val, currency = 'COP') => {
        return new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: currency, 
            maximumFractionDigits: 0 
        }).format(val);
    };

    // Categorize accounts
    const assets = accounts.filter(acc => acc.type !== 'credit' && acc.balance >= 0);
    const liabilities = accounts.filter(acc => acc.type === 'credit' || acc.balance < 0);
    
    const totalAssets = assets.reduce((sum, acc) => sum + Math.max(acc.balance, 0), 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + Math.abs(acc.balance < 0 ? acc.balance : (acc.credit_card ? acc.balance : 0)), 0);
    const netWorth = totalAssets - totalLiabilities;

    // Group by type
    const groupedAssets = {
        'Efectivo': assets.filter(a => a.type === 'cash'),
        'Bancos': assets.filter(a => a.type === 'bank'),
        'Inversiones': assets.filter(a => a.type === 'investment'),
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
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
                >
                    <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-primary">
                        Patrimonio Neto
                    </h1>
                    <p className="text-muted text-sm">Desglose completo de tus activos y pasivos</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Assets */}
                <div className="card bg-gradient-to-br from-accent-success/10 to-emerald-900/20 border-t-4 border-accent-success">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-accent-success/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-accent-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <p className="text-muted text-xs uppercase tracking-wider font-bold">Activos Totales</p>
                    </div>
                    <p className="text-3xl font-bold text-accent-success">{formatCurrency(totalAssets)}</p>
                    <p className="text-xs text-muted mt-2">{assets.length} cuentas</p>
                </div>

                {/* Total Liabilities */}
                <div className="card bg-gradient-to-br from-accent-danger/10 to-rose-900/20 border-t-4 border-accent-danger">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-accent-danger/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-accent-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                            </svg>
                        </div>
                        <p className="text-muted text-xs uppercase tracking-wider font-bold">Pasivos Totales</p>
                    </div>
                    <p className="text-3xl font-bold text-accent-danger">{formatCurrency(totalLiabilities)}</p>
                    <p className="text-xs text-muted mt-2">{liabilities.length} deudas</p>
                </div>

                {/* Net Worth */}
                <div className="card bg-gradient-to-br from-accent-primary/10 to-indigo-900/20 border-t-4 border-accent-primary">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-accent-primary/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-muted text-xs uppercase tracking-wider font-bold">Patrimonio Neto</p>
                    </div>
                    <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-accent-primary' : 'text-accent-danger'}`}>
                        {formatCurrency(netWorth)}
                    </p>
                    <p className="text-xs text-muted mt-2">Activos - Pasivos</p>
                </div>
            </div>

            {/* Visual Breakdown */}
            <div className="card">
                <h2 className="font-bold text-lg mb-6">Distribución del Patrimonio</h2>
                
                {/* Progress bar representation */}
                <div className="relative h-8 rounded-lg overflow-hidden bg-bg-tertiary mb-4">
                    <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent-success to-emerald-500 transition-all duration-1000"
                        style={{ width: `${totalAssets > 0 ? (totalAssets / (totalAssets + totalLiabilities)) * 100 : 50}%` }}
                    />
                    <div 
                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-accent-danger to-rose-500 transition-all duration-1000"
                        style={{ width: `${totalLiabilities > 0 ? (totalLiabilities / (totalAssets + totalLiabilities)) * 100 : 0}%` }}
                    />
                </div>
                
                <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-accent-success"></span>
                        <span className="text-muted">Activos ({((totalAssets / (totalAssets + totalLiabilities)) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted">Pasivos ({((totalLiabilities / (totalAssets + totalLiabilities)) * 100).toFixed(1)}%)</span>
                        <span className="w-3 h-3 rounded-full bg-accent-danger"></span>
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assets */}
                <div className="card">
                    <h2 className="font-bold text-lg mb-4 text-accent-success flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Activos
                    </h2>
                    
                    <div className="space-y-6">
                        {Object.entries(groupedAssets).map(([group, accs]) => (
                            accs.length > 0 && (
                                <div key={group}>
                                    <p className="text-xs text-muted uppercase tracking-wider font-bold mb-3">{group}</p>
                                    <div className="space-y-2">
                                        {accs.map(acc => (
                                            <div 
                                                key={acc.id} 
                                                className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary cursor-pointer transition-colors"
                                                onClick={() => navigate('/accounts')}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-success/20 flex items-center justify-center text-sm">
                                                        {acc.type === 'cash' ? '💵' : acc.type === 'bank' ? '🏦' : '📈'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{acc.name}</p>
                                                        <p className="text-xs text-muted">{acc.institution || acc.type}</p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-accent-success">{formatCurrency(acc.balance, acc.currency_code)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                        
                        {assets.length === 0 && (
                            <p className="text-muted text-center py-8">No tienes activos registrados</p>
                        )}
                    </div>
                </div>

                {/* Liabilities */}
                <div className="card">
                    <h2 className="font-bold text-lg mb-4 text-accent-danger flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        Pasivos (Deudas)
                    </h2>
                    
                    <div className="space-y-2">
                        {liabilities.map(acc => (
                            <div 
                                key={acc.id} 
                                className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary cursor-pointer transition-colors"
                                onClick={() => navigate('/accounts')}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-accent-danger/20 flex items-center justify-center text-sm">
                                        💳
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{acc.name}</p>
                                        <p className="text-xs text-muted">{acc.institution || 'Tarjeta de Crédito'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-accent-danger">{formatCurrency(Math.abs(acc.balance), acc.currency_code)}</p>
                                    {acc.credit_card && (
                                        <p className="text-xs text-muted">
                                            de {formatCurrency(acc.credit_card.credit_limit, acc.currency_code)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        {liabilities.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-accent-success font-medium mb-1">¡Sin deudas! 🎉</p>
                                <p className="text-muted text-sm">Excelente manejo financiero</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Financial Health Tips */}
            <div className="card bg-gradient-to-br from-bg-secondary via-[#151b2e] to-bg-secondary">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="text-2xl">💡</span>
                    Consejos de Salud Financiera
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {netWorth >= 0 ? (
                        <div className="p-4 rounded-lg bg-accent-success/10 border border-accent-success/20">
                            <p className="font-medium text-accent-success mb-1">Patrimonio Positivo</p>
                            <p className="text-sm text-muted">
                                Tu patrimonio es positivo, lo cual es excelente. Mantén este buen hábito y considera invertir para hacer crecer tu dinero.
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 rounded-lg bg-accent-danger/10 border border-accent-danger/20">
                            <p className="font-medium text-accent-danger mb-1">Patrimonio Negativo</p>
                            <p className="text-sm text-muted">
                                Tus deudas superan tus activos. Prioriza pagar las deudas con mayores intereses primero.
                            </p>
                        </div>
                    )}
                    
                    <div className="p-4 rounded-lg bg-accent-primary/10 border border-accent-primary/20">
                        <p className="font-medium text-accent-primary mb-1">Consejo de Ahorro</p>
                        <p className="text-sm text-muted">
                            Recuerda mantener un fondo de emergencia y ahorrar regularmente. Cada peso cuenta.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetWorthDetail;

