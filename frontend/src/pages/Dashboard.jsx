import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import TransactionModal from '../components/TransactionModal';
import CurrencyWidget from '../components/CurrencyWidget';
import TripCountdown from '../components/TripCountdown';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/dashboard/'); // Trailing slash might matter in Flask
                setData(res);
            } catch (err) {
                console.error("Dashboard error", err);
                toast.error('Error al cargar el dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const reloadData = () => {
        // Simple reload logic
        const fetchData = async () => {
            try {
                const res = await api.get('/dashboard/');
                setData(res);
                toast.success('Dashboard actualizado');
            } catch (err) {
                console.error(err);
                toast.error('Error al actualizar');
            }
        };
        fetchData();
    };

    if (loading) return <div className="p-8 text-center text-muted">Loading dashboard...</div>;
    if (!data) return (
        <div className="p-8 text-center">
            <p className="text-accent-danger font-bold mb-2">Error loading data.</p>
            <button onClick={() => window.location.reload()} className="btn btn-secondary">Retry</button>
        </div>
    );

    const { metrics, debt_status, cashflow_history, top_expenses, budget_status } = data;

    // Format currency
    const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-primary">Dashboard</h1>
                    <p className="text-muted text-sm">Resumen general de tu estado financiero.</p>
                </div>
                <div className="flex gap-3">
                    {/* <button className="btn btn-secondary">Download Report</button> */}
                    <button onClick={() => setIsTxModalOpen(true)} className="btn shadow-lg hover:shadow-accent-primary/20 transition-all">
                        <span className="mr-2">+</span> Nueva Transacción
                    </button>
                </div>
            </div>

            <TransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} onSuccess={reloadData} />

            {/* Top Metrics Grid - 4 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-white">
                <div className="card bg-gradient-to-br from-bg-secondary via-bg-tertiary to-bg-secondary border-t-4 border-accent-primary hover:translate-y-[-4px] hover:shadow-glow transition-all duration-300 cursor-pointer group">
                    <p className="text-muted text-xs font-bold uppercase tracking-widest mb-2 group-hover:text-accent-primary transition-colors">Patrimonio Neto</p>
                    <p className="text-3xl font-bold text-white transition-transform group-hover:scale-105">{formatCurrency(metrics.net_worth)}</p>
                    <p className="text-xs text-accent-success mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        Activos - Pasivos
                    </p>
                </div>
                <div className="card bg-gradient-to-br from-bg-secondary via-bg-tertiary to-bg-secondary border-t-4 border-success hover:translate-y-[-4px] hover:shadow-glow transition-all duration-300 cursor-pointer group">
                    <p className="text-muted text-xs font-bold uppercase tracking-widest mb-2 group-hover:text-success transition-colors">Liquidez (Efectivo)</p>
                    <p className="text-3xl font-bold text-white transition-transform group-hover:scale-105">{formatCurrency(metrics.liquidity)}</p>
                    <p className="text-xs text-muted mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                        Disponible ahora
                    </p>
                </div>
                <div className="card bg-gradient-to-br from-bg-secondary via-bg-tertiary to-bg-secondary border-t-4 border-accent-warning hover:translate-y-[-4px] hover:shadow-glow transition-all duration-300 cursor-pointer group">
                    <p className="text-muted text-xs font-bold uppercase tracking-widest mb-2 group-hover:text-accent-warning transition-colors">Inversiones</p>
                    <p className="text-3xl font-bold text-white transition-transform group-hover:scale-105">{formatCurrency(metrics.portfolio_value)}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${metrics.unrealized_profit >= 0 ? 'bg-accent-success/20 text-accent-success' : 'bg-accent-danger/20 text-accent-danger'}`}>
                            {metrics.unrealized_profit > 0 ? '+' : ''}{formatCurrency(metrics.unrealized_profit)}
                        </span>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-bg-secondary via-bg-tertiary to-bg-secondary border-t-4 border-primary hover:translate-y-[-4px] hover:shadow-glow transition-all duration-300 cursor-pointer group">
                    <p className="text-muted text-xs font-bold uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">Tasa de Ahorro</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-white transition-transform group-hover:scale-105">{metrics.savings_rate.toFixed(1)}%</p>
                        <span className="text-xs text-muted">del ingreso</span>
                    </div>
                    <div className="w-full bg-bg-primary rounded-full h-2 mt-3 overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${metrics.savings_rate > 20 ? 'bg-gradient-success' : 'bg-gradient-danger'}`} style={{ width: `${Math.min(metrics.savings_rate, 100)}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Row 2: Cashflow, Top Expenses & Currency Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cashflow Chart (2/3) */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                            Flujo de Caja
                        </h3>
                        <div className="flex gap-4 text-xs">
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-success"></span> Ingresos</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-danger"></span> Gastos</div>
                        </div>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-4 px-2">
                        {cashflow_history.map((item, idx) => {
                            const maxVal = Math.max(...cashflow_history.map(c => Math.max(c.income, c.expense))) || 1;
                            return (
                                <div key={idx} className="flex flex-col items-center flex-1 gap-2 group h-full justify-end">
                                    <div className="w-full flex gap-1 items-end justify-center h-full relative">
                                        <div
                                            className="w-4 lg:w-6 bg-accent-success rounded-t-sm hover:brightness-110 transition-all relative"
                                            style={{ height: `${(item.income / maxVal) * 100}%` }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-popover px-2 py-1 rounded text-xs whitespace-nowrap z-10 pointer-events-none shadow-xl border border-tertiary">
                                                +{formatCurrency(item.income)}
                                            </div>
                                        </div>
                                        <div
                                            className="w-4 lg:w-6 bg-accent-danger rounded-t-sm hover:brightness-110 transition-all relative"
                                            style={{ height: `${(item.expense / maxVal) * 100}%` }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-popover px-2 py-1 rounded text-xs whitespace-nowrap z-10 pointer-events-none shadow-xl border border-tertiary">
                                                -{formatCurrency(item.expense)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-muted w-full text-center">{item.month.split('-')[1]}</span>
                                </div>
                            );
                        })}
                        {cashflow_history.length === 0 && <p className="m-auto text-muted">No hay datos suficientes</p>}
                    </div>
                </div>

                {/* Sidebar: Trip Countdown, Top Expenses & Currency Widget */}
                <div className="space-y-6">
                    {/* Trip Countdown */}
                    <TripCountdown 
                        targetDate="2026-02-01"
                        destination="Praga"
                        savingsGoal={15000000}
                        currentSavings={metrics.liquidity + metrics.portfolio_value}
                    />

                    {/* Top Expenses */}
                    <div className="card">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <span className="text-accent-warning">Top Gastos</span>
                        </h3>
                        <div className="space-y-4">
                            {top_expenses && top_expenses.map((exp, idx) => (
                                <div key={idx} className="flex flex-col gap-1 group">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white font-medium group-hover:text-accent-warning transition-colors">{exp.category}</span>
                                        <span className="text-muted">{formatCurrency(exp.amount)}</span>
                                    </div>
                                    <div className="w-full bg-bg-tertiary rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all duration-500"
                                            style={{ width: `${(exp.amount / metrics.monthly_expense) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {(!top_expenses || top_expenses.length === 0) && <p className="text-muted text-sm text-center py-4">No hay gastos este mes.</p>}
                        </div>
                    </div>

                    {/* Currency Widget */}
                    <CurrencyWidget />
                </div>
            </div>

            {/* Row 3: Debt & Budgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Debt Status */}
                <div className="card">
                    <h3 className="font-bold mb-6 text-accent-danger flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Estado de Deuda
                    </h3>
                    <div className="flex items-center gap-6 mb-6">
                        <div>
                            <p className="text-3xl font-bold text-white">{formatCurrency(metrics.total_debt)}</p>
                            <p className="text-xs text-muted">Deuda Total</p>
                        </div>
                    </div>
                    <div className="space-y-5">
                        {debt_status.map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-white">{item.name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${item.utilization > 50 ? 'bg-accent-danger/10 text-accent-danger' : 'bg-success/10 text-success'}`}>
                                        {item.utilization.toFixed(0)}% uso
                                    </span>
                                </div>
                                <div className="w-full bg-bg-tertiary rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ease-out ${item.utilization > 80 ? 'bg-accent-danger' : item.utilization > 50 ? 'bg-accent-warning' : 'bg-success'}`}
                                        style={{ width: `${Math.min(item.utilization, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-muted mt-1">
                                    <span>{formatCurrency(item.current_debt)}</span>
                                    <span>Cupo: {formatCurrency(item.limit)}</span>
                                </div>
                            </div>
                        ))}
                        {debt_status.length === 0 && <p className="text-muted text-sm">No tienes deudas registradas.</p>}
                    </div>
                </div>

                {/* Budget Status (New) */}
                <div className="card">
                    <h3 className="font-bold mb-6 text-primary flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Presupuesto (Mes Actual)
                    </h3>
                    <div className="space-y-5">
                        {budget_status && budget_status.map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-white">{item.category}</span>
                                    <span className="text-xs text-muted">{formatCurrency(item.actual)} / {formatCurrency(item.limit)}</span>
                                </div>
                                <div className="w-full bg-bg-tertiary rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${item.utilization > 100 ? 'bg-accent-danger' : item.utilization > 80 ? 'bg-accent-warning' : 'bg-primary'}`}
                                        style={{ width: `${Math.min(item.utilization, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {(!budget_status || budget_status.length === 0) && (
                            <div className="text-center py-8">
                                <p className="text-muted text-sm mb-2">No hay presupuestos configurados.</p>
                                <button className="text-primary text-sm hover:underline" disabled>Configurar Presupuestos (Pronto)</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Transacciones Recientes</h3>
                    <button className="text-primary text-sm hover:underline">Ver todas</button>
                </div>
                {
                    data.recent_transactions && data.recent_transactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-muted text-xs uppercase tracking-wider border-b border-tertiary">
                                        <th className="py-3 pl-2">Fecha</th>
                                        <th className="py-3">Descripción</th>
                                        <th className="py-3">Categoría</th>
                                        <th className="py-3">Cuenta</th>
                                        <th className="py-3 text-right pr-2">Monto</th>
                                        <th className="py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-tertiary text-sm">
                                    {data.recent_transactions.map(tx => (
                                        <tr key={tx.id} className="group hover:bg-bg-tertiary/30 transition-colors">
                                            <td className="py-3 pl-2 text-muted">{tx.date.split('T')[0]}</td>
                                            <td className="py-3 font-medium text-white">{tx.description}</td>
                                            <td className="py-3">
                                                <span className="px-2.5 py-1 rounded-full bg-bg-tertiary text-xs border border-border-color/50 text-muted group-hover:border-primary/30 transition-colors">
                                                    {tx.category}
                                                </span>
                                            </td>
                                            <td className="py-3 text-muted">{tx.account}</td>
                                            <td className={`py-3 text-right font-bold pr-2 ${tx.amount > 0 ? 'text-accent-success' : 'text-white'}`}>
                                                {formatCurrency(tx.amount)}
                                            </td>
                                            <td className="py-3 text-right">
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('¿Eliminar esta transacción?')) {
                                                            api.delete(`/transactions/${tx.id}`)
                                                                .then(() => {
                                                                    toast.success('Transacción eliminada');
                                                                    reloadData();
                                                                })
                                                                .catch(() => toast.error('Error al eliminar'));
                                                        }
                                                    }}
                                                    className="text-muted hover:text-accent-danger transition-colors p-2 rounded hover:bg-accent-danger/10 opacity-0 group-hover:opacity-100"
                                                    title="Eliminar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted text-center py-8">Sin actividad reciente.</p>
                    )
                }
            </div>
        </div>
    );
};

export default Dashboard;
