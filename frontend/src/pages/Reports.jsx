import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Reports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const reloadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/dashboard/');
            setData(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        reloadData();
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
        </div>
    );

    const { metrics, debt_status, top_expenses, budget_status } = data;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-primary">
                    Reportes y Análisis
                </h1>
                <p className="text-muted mt-1 text-sm">Análisis profundo de tu salud financiera actual.</p>
            </div>

            {/* Top Analysis Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Savings Rate Analysis */}
                <div className="card">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        Tasa de Ahorro
                    </h3>
                    <div className="flex flex-col items-center justify-center py-6">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                                <circle
                                    cx="96" cy="96" r="80"
                                    fill="none" stroke="var(--bg-tertiary)" strokeWidth="12"
                                />
                                <circle
                                    cx="96" cy="96" r="80"
                                    fill="none" stroke="currentColor" strokeWidth="12"
                                    strokeDasharray={2 * Math.PI * 80}
                                    strokeDashoffset={2 * Math.PI * 80 * (1 - metrics.savings_rate / 100)}
                                    className="text-accent-primary transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold text-white">{metrics.savings_rate.toFixed(1)}%</span>
                                <span className="text-xs text-muted uppercase">Este mes</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8 mt-8 w-full text-center">
                            <div>
                                <p className="text-xs text-muted uppercase font-bold tracking-wider mb-1">Ingresos</p>
                                <p className="text-lg font-bold text-accent-success">{formatCurrency(metrics.monthly_income)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted uppercase font-bold tracking-wider mb-1">Gastos</p>
                                <p className="text-lg font-bold text-accent-danger">{formatCurrency(metrics.monthly_expense)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Expenses Pie Chart (Mock or Simple Visual representation) */}
                <div className="card">
                    <h3 className="font-bold text-lg mb-4 text-accent-warning">Distribución de Gastos</h3>
                    <div className="space-y-4">
                        {top_expenses && top_expenses.map((exp, idx) => (
                            <div key={idx} className="flex flex-col gap-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white font-medium">{exp.category}</span>
                                    <span className="text-muted">{formatCurrency(exp.amount)}</span>
                                </div>
                                <div className="w-full bg-bg-tertiary rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="h-full bg-accent-warning rounded-full transition-all duration-500"
                                        style={{ width: `${(exp.amount / metrics.monthly_expense) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {(!top_expenses || top_expenses.length === 0) && <p className="text-muted text-center py-10 italic">Sin gastos registrados este mes.</p>}
                    </div>
                    {metrics.monthly_expense > 0 && (
                        <div className="mt-8 pt-4 border-t border-tertiary text-center">
                            <p className="text-xs text-muted font-bold uppercase tracking-widest mb-1">Total Gastado</p>
                            <p className="text-2xl font-bold text-white">{formatCurrency(metrics.monthly_expense)}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Budgets Analysis */}
            <div className="card">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Seguimiento de Presupuesto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budget_status && budget_status.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-bg-tertiary/30 border border-border-color/50">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-bold text-white uppercase text-xs tracking-wider">{item.category}</p>
                                    <p className={`text-xl font-bold mt-1 ${item.utilization > 100 ? 'text-accent-danger' : 'text-white'}`}>
                                        {formatCurrency(item.actual)}
                                    </p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.utilization > 100 ? 'bg-accent-danger/20 text-accent-danger' : 'bg-primary/20 text-primary'}`}>
                                    {item.utilization.toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full bg-bg-primary rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-700 ${item.utilization > 100 ? 'bg-accent-danger' : item.utilization > 80 ? 'bg-accent-warning' : 'bg-primary'}`}
                                    style={{ width: `${Math.min(item.utilization, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-muted mt-2">Límite: {formatCurrency(item.limit)}</p>
                        </div>
                    ))}
                </div>
                {(!budget_status || budget_status.length === 0) && (
                    <div className="text-center py-12 text-muted italic">
                        No hay presupuestos activos. Puedes configurarlos en Configuración.
                    </div>
                )}
            </div>

            {/* Debt Detailed Analysis */}
            <div className="card">
                <h3 className="font-bold text-lg mb-6 text-accent-danger flex items-center gap-2">
                    <svg className="w-5 h-5 text-accent-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Análisis de Deuda Proyectada
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-muted text-xs uppercase tracking-wider border-b border-tertiary">
                                <th className="py-3 pl-2">Cuenta / Tarjeta</th>
                                <th className="py-3">Deuda Actual</th>
                                <th className="py-3">Límite Total</th>
                                <th className="py-3">Utilización</th>
                                <th className="py-3">Próximo Corte</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-tertiary text-sm">
                            {debt_status.map((item, idx) => (
                                <tr key={idx} className="hover:bg-bg-tertiary/20">
                                    <td className="py-4 pl-2 font-medium text-white">{item.name}</td>
                                    <td className="py-4 text-accent-danger font-bold">{formatCurrency(item.current_debt)}</td>
                                    <td className="py-4 text-muted">{formatCurrency(item.limit)}</td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-bg-tertiary rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full ${item.utilization > 80 ? 'bg-accent-danger' : item.utilization > 50 ? 'bg-accent-warning' : 'bg-success'}`}
                                                    style={{ width: `${Math.min(item.utilization, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] text-muted">{item.utilization.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-muted">{item.due_date || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {debt_status.length === 0 && <p className="text-center py-10 text-muted">No hay deudas activas registradas.</p>}
                </div>
            </div>
        </div>
    );
};

export default Reports;
