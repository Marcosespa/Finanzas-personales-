import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const Reports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [exporting, setExporting] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportFilters, setExportFilters] = useState({
        type: 'transactions',
        startDate: '',
        endDate: '',
        year: new Date().getFullYear(),
        month: ''
    });
    const navigate = useNavigate();
    const toast = useToast();

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

    const handleExport = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('token');
            let url = '';
            let filename = '';
            
            const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
            
            if (exportFilters.type === 'transactions') {
                const params = new URLSearchParams();
                if (exportFilters.startDate) params.append('start_date', exportFilters.startDate);
                if (exportFilters.endDate) params.append('end_date', exportFilters.endDate);
                url = `${baseUrl}/export/transactions?${params.toString()}`;
                filename = `transacciones_${new Date().toISOString().split('T')[0]}.csv`;
            } else if (exportFilters.type === 'accounts') {
                url = `${baseUrl}/export/accounts`;
                filename = `cuentas_${new Date().toISOString().split('T')[0]}.csv`;
            } else if (exportFilters.type === 'full-report') {
                const params = new URLSearchParams();
                params.append('year', exportFilters.year);
                if (exportFilters.month) params.append('month', exportFilters.month);
                url = `${baseUrl}/export/full-report?${params.toString()}`;
                filename = `reporte_financiero_${exportFilters.year}${exportFilters.month ? '-' + exportFilters.month : ''}.csv`;
            }
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Error al exportar');
            
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
            
            toast.success('Exportación completada');
            setExportModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('Error al exportar datos');
        } finally {
            setExporting(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
    const formatPercent = (val) => `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
        </div>
    );

    const { metrics, debt_status, top_expenses, budget_status } = data;

    // Calculated metrics
    const monthlyBalance = metrics.monthly_income - metrics.monthly_expense;
    const expenseRatio = metrics.monthly_income > 0 ? (metrics.monthly_expense / metrics.monthly_income) * 100 : 0;
    const availableCredit = debt_status.reduce((sum, d) => sum + (d.limit - d.current_debt), 0);
    const totalCreditLimit = debt_status.reduce((sum, d) => sum + d.limit, 0);
    const avgUtilization = debt_status.length > 0 ? debt_status.reduce((sum, d) => sum + d.utilization, 0) / debt_status.length : 0;
    
    // Financial Health Score (0-100)
    const calculateHealthScore = () => {
        let score = 0;
        // Savings rate (max 30 points)
        score += Math.min(metrics.savings_rate, 30);
        // Low debt utilization (max 25 points)
        score += Math.max(0, 25 - (avgUtilization / 4));
        // Positive net worth (max 25 points)
        score += metrics.net_worth > 0 ? 25 : Math.max(0, 25 + (metrics.net_worth / 100000));
        // Emergency fund (3+ months expenses = 20 points)
        const monthsCovered = metrics.monthly_expense > 0 ? metrics.liquidity / metrics.monthly_expense : 0;
        score += Math.min(monthsCovered * 6.67, 20);
        return Math.min(Math.max(score, 0), 100);
    };
    const healthScore = calculateHealthScore();
    
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-accent-success';
        if (score >= 60) return 'text-accent-primary';
        if (score >= 40) return 'text-accent-warning';
        return 'text-accent-danger';
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excelente';
        if (score >= 60) return 'Bueno';
        if (score >= 40) return 'Regular';
        return 'Necesita Atención';
    };

    // Emergency fund months
    const emergencyMonths = metrics.monthly_expense > 0 ? metrics.liquidity / metrics.monthly_expense : 0;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-primary">
                        Reportes y Análisis
                    </h1>
                    <p className="text-muted mt-1 text-sm">Análisis profundo de tu salud financiera actual.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setExportModalOpen(true)}
                        className="btn btn-secondary text-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Exportar
                    </button>
                    <div className="flex gap-2">
                    {['week', 'month', 'quarter', 'year'].map(period => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                selectedPeriod === period 
                                    ? 'bg-accent-primary text-white' 
                                    : 'bg-bg-tertiary text-muted hover:text-white'
                            }`}
                        >
                            {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : period === 'quarter' ? 'Trimestre' : 'Año'}
                        </button>
                    ))}
                    </div>
                </div>
            </div>

            {/* Financial Health Score */}
            <div className="card bg-gradient-to-br from-bg-secondary via-[#151b2e] to-bg-secondary">
                <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                    {/* Score Circle */}
                    <div className="flex-shrink-0">
                        <div className="relative w-40 h-40 mx-auto lg:mx-0">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="80" cy="80" r="70" fill="none" stroke="var(--bg-tertiary)" strokeWidth="10" />
                                <circle
                                    cx="80" cy="80" r="70"
                                    fill="none"
                                    stroke={healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#6366f1' : healthScore >= 40 ? '#f59e0b' : '#f43f5e'}
                                    strokeWidth="10"
                                    strokeDasharray={2 * Math.PI * 70}
                                    strokeDashoffset={2 * Math.PI * 70 * (1 - healthScore / 100)}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-4xl font-bold ${getScoreColor(healthScore)}`}>{healthScore.toFixed(0)}</span>
                                <span className="text-xs text-muted">de 100</span>
                            </div>
                        </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-xl font-bold text-white">Score de Salud Financiera</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                healthScore >= 80 ? 'bg-accent-success/20 text-accent-success' :
                                healthScore >= 60 ? 'bg-accent-primary/20 text-accent-primary' :
                                healthScore >= 40 ? 'bg-accent-warning/20 text-accent-warning' :
                                'bg-accent-danger/20 text-accent-danger'
                            }`}>
                                {getScoreLabel(healthScore)}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 rounded-lg bg-bg-tertiary/30">
                                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Ahorro</p>
                                <p className={`text-lg font-bold ${metrics.savings_rate >= 20 ? 'text-accent-success' : 'text-accent-warning'}`}>
                                    {metrics.savings_rate.toFixed(0)}%
                                </p>
                                <p className="text-[10px] text-muted">Meta: 20%</p>
                            </div>
                            <div className="p-3 rounded-lg bg-bg-tertiary/30">
                                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Uso Crédito</p>
                                <p className={`text-lg font-bold ${avgUtilization <= 30 ? 'text-accent-success' : avgUtilization <= 50 ? 'text-accent-warning' : 'text-accent-danger'}`}>
                                    {avgUtilization.toFixed(0)}%
                                </p>
                                <p className="text-[10px] text-muted">Ideal: &lt;30%</p>
                            </div>
                            <div className="p-3 rounded-lg bg-bg-tertiary/30">
                                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Fondo Emergencia</p>
                                <p className={`text-lg font-bold ${emergencyMonths >= 3 ? 'text-accent-success' : emergencyMonths >= 1 ? 'text-accent-warning' : 'text-accent-danger'}`}>
                                    {emergencyMonths.toFixed(1)} meses
                                </p>
                                <p className="text-[10px] text-muted">Meta: 3-6 meses</p>
                            </div>
                            <div className="p-3 rounded-lg bg-bg-tertiary/30">
                                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Patrimonio</p>
                                <p className={`text-lg font-bold ${metrics.net_worth >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                                    {metrics.net_worth >= 0 ? '+' : ''}{(metrics.net_worth / 1000000).toFixed(1)}M
                                </p>
                                <p className="text-[10px] text-muted">Neto total</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Financial Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center">
                    <div className="w-12 h-12 rounded-xl bg-accent-success/20 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-accent-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Balance Mensual</p>
                    <p className={`text-xl font-bold ${monthlyBalance >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                        {formatCurrency(monthlyBalance)}
                    </p>
                    <p className="text-[10px] text-muted mt-1">Ingreso - Gasto</p>
                </div>

                <div className="card text-center">
                    <div className="w-12 h-12 rounded-xl bg-accent-primary/20 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Ratio de Gastos</p>
                    <p className={`text-xl font-bold ${expenseRatio <= 70 ? 'text-accent-success' : expenseRatio <= 90 ? 'text-accent-warning' : 'text-accent-danger'}`}>
                        {expenseRatio.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-muted mt-1">del ingreso</p>
                </div>

                <div className="card text-center">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Crédito Disponible</p>
                    <p className="text-xl font-bold text-cyan-400">{formatCurrency(availableCredit)}</p>
                    <p className="text-[10px] text-muted mt-1">de {formatCurrency(totalCreditLimit)}</p>
                </div>

                <div className="card text-center">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Capacidad de Ahorro</p>
                    <p className="text-xl font-bold text-purple-400">{formatCurrency(Math.max(monthlyBalance, 0))}</p>
                    <p className="text-[10px] text-muted mt-1">potencial/mes</p>
                </div>
            </div>

            {/* Cash Flow Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income vs Expenses Breakdown */}
                <div className="card">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Análisis de Flujo de Caja
                    </h3>

                    <div className="space-y-6">
                        {/* Income */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-muted">Ingresos Totales</span>
                                <span className="font-bold text-accent-success">{formatCurrency(metrics.monthly_income)}</span>
                            </div>
                            <div className="w-full h-3 bg-bg-tertiary rounded-full overflow-hidden">
                                <div className="h-full bg-accent-success rounded-full" style={{ width: '100%' }} />
                            </div>
                        </div>

                        {/* Expenses */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-muted">Gastos Totales</span>
                                <span className="font-bold text-accent-danger">{formatCurrency(metrics.monthly_expense)}</span>
                            </div>
                            <div className="w-full h-3 bg-bg-tertiary rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-accent-danger rounded-full transition-all duration-500" 
                                    style={{ width: `${expenseRatio}%` }} 
                                />
                            </div>
                        </div>

                        {/* Balance */}
                        <div className="pt-4 border-t border-border-color/30">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-white">Balance Neto</span>
                                <span className={`text-xl font-bold ${monthlyBalance >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                                    {formatCurrency(monthlyBalance)}
                                </span>
                            </div>
                        </div>

                        {/* Key Ratios */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="p-3 rounded-lg bg-bg-tertiary/30 text-center">
                                <p className="text-[10px] text-muted uppercase mb-1">Ratio 50/30/20</p>
                                <div className="flex justify-center gap-1 text-xs">
                                    <span className="px-2 py-0.5 rounded bg-accent-primary/20 text-accent-primary">
                                        {metrics.monthly_income > 0 ? ((metrics.monthly_expense / metrics.monthly_income) * 100).toFixed(0) : 0}%
                                    </span>
                                    <span className="text-muted">/</span>
                                    <span className="px-2 py-0.5 rounded bg-accent-warning/20 text-accent-warning">?%</span>
                                    <span className="text-muted">/</span>
                                    <span className="px-2 py-0.5 rounded bg-accent-success/20 text-accent-success">
                                        {metrics.savings_rate.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-bg-tertiary/30 text-center">
                                <p className="text-[10px] text-muted uppercase mb-1">Días de Runway</p>
                                <p className="text-lg font-bold text-white">
                                    {metrics.monthly_expense > 0 ? Math.floor((metrics.liquidity / metrics.monthly_expense) * 30) : '∞'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expense Distribution */}
                <div className="card">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-accent-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                        Distribución de Gastos
                    </h3>

                    <div className="space-y-3">
                        {top_expenses && top_expenses.map((exp, idx) => {
                            const percent = metrics.monthly_expense > 0 ? (exp.amount / metrics.monthly_expense) * 100 : 0;
                            const colors = ['from-violet-500 to-purple-600', 'from-cyan-500 to-blue-600', 'from-amber-500 to-orange-600', 'from-emerald-500 to-green-600', 'from-rose-500 to-pink-600'];
                            return (
                                <div key={idx} className="group">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors[idx % colors.length]}`} />
                                            <span className="text-sm text-white font-medium group-hover:text-accent-warning transition-colors">{exp.category}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-muted">{percent.toFixed(1)}%</span>
                                            <span className="text-sm font-bold text-white">{formatCurrency(exp.amount)}</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-bg-tertiary rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {(!top_expenses || top_expenses.length === 0) && (
                            <p className="text-muted text-center py-10 italic">Sin gastos registrados este período.</p>
                        )}
                    </div>

                    {metrics.monthly_expense > 0 && (
                        <div className="mt-6 pt-4 border-t border-border-color/30 flex justify-between items-center">
                            <span className="text-sm text-muted">Total Gastado</span>
                            <span className="text-xl font-bold text-white">{formatCurrency(metrics.monthly_expense)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Budget Performance */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Rendimiento de Presupuestos
                    </h3>
                    <button 
                        onClick={() => navigate('/budgets')}
                        className="text-xs text-accent-primary hover:underline flex items-center gap-1"
                    >
                        Administrar
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {budget_status && budget_status.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {budget_status.map((item, idx) => {
                            const remaining = item.limit - item.actual;
                            const daysInMonth = 30;
                            const today = new Date().getDate();
                            const dailyBudget = item.limit / daysInMonth;
                            const expectedSpent = dailyBudget * today;
                            const variance = expectedSpent - item.actual;
                            
                            return (
                                <div 
                                    key={idx} 
                                    className={`p-4 rounded-xl border transition-all hover:translate-y-[-2px] ${
                                        item.utilization > 100 
                                            ? 'bg-accent-danger/10 border-accent-danger/30' 
                                            : item.utilization > 80 
                                                ? 'bg-accent-warning/10 border-accent-warning/30'
                                                : 'bg-bg-tertiary/30 border-border-color/30'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-white text-sm">{item.category}</p>
                                            <p className="text-[10px] text-muted mt-0.5">
                                                {item.utilization > 100 ? '⚠️ Excedido' : item.utilization > 80 ? '⚡ Casi al límite' : '✓ En control'}
                                            </p>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            item.utilization > 100 ? 'bg-accent-danger/20 text-accent-danger' : 
                                            item.utilization > 80 ? 'bg-accent-warning/20 text-accent-warning' : 
                                            'bg-accent-success/20 text-accent-success'
                                        }`}>
                                            {item.utilization.toFixed(0)}%
                                        </span>
                                    </div>

                                    <div className="mb-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-muted">Gastado</span>
                                            <span className="font-medium text-white">{formatCurrency(item.actual)}</span>
                                        </div>
                                        <div className="w-full bg-bg-primary rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${
                                                    item.utilization > 100 ? 'bg-accent-danger' : 
                                                    item.utilization > 80 ? 'bg-accent-warning' : 
                                                    'bg-accent-success'
                                                }`}
                                                style={{ width: `${Math.min(item.utilization, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-[10px] text-muted">
                                        <span>Disponible: <span className={remaining >= 0 ? 'text-accent-success' : 'text-accent-danger'}>{formatCurrency(remaining)}</span></span>
                                        <span>Límite: {formatCurrency(item.limit)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-muted mb-3">No hay presupuestos configurados</p>
                        <button 
                            onClick={() => navigate('/budgets')}
                            className="btn btn-primary text-sm"
                        >
                            Crear Presupuesto
                        </button>
                    </div>
                )}
            </div>

            {/* Debt Analysis */}
            <div className="card">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-accent-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Análisis de Crédito y Deuda
                </h3>

                {debt_status.length > 0 ? (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-3 rounded-xl bg-accent-danger/10 border border-accent-danger/20 text-center">
                                <p className="text-[10px] text-muted uppercase mb-1">Deuda Total</p>
                                <p className="text-lg font-bold text-accent-danger">{formatCurrency(metrics.total_debt)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                                <p className="text-[10px] text-muted uppercase mb-1">Crédito Disponible</p>
                                <p className="text-lg font-bold text-cyan-400">{formatCurrency(availableCredit)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-accent-warning/10 border border-accent-warning/20 text-center">
                                <p className="text-[10px] text-muted uppercase mb-1">Utilización Promedio</p>
                                <p className={`text-lg font-bold ${avgUtilization > 30 ? 'text-accent-warning' : 'text-accent-success'}`}>
                                    {avgUtilization.toFixed(1)}%
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                                <p className="text-[10px] text-muted uppercase mb-1">Capacidad de Pago</p>
                                <p className="text-lg font-bold text-purple-400">
                                    {formatCurrency(Math.max(monthlyBalance * 0.5, 0))}
                                </p>
                            </div>
                        </div>

                        {/* Debt Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-muted text-[10px] uppercase tracking-wider border-b border-border-color/30">
                                        <th className="py-3 pl-2 font-semibold">Cuenta</th>
                                        <th className="py-3 font-semibold">Deuda</th>
                                        <th className="py-3 font-semibold">Límite</th>
                                        <th className="py-3 font-semibold">Utilización</th>
                                        <th className="py-3 font-semibold">Disponible</th>
                                        <th className="py-3 font-semibold text-right pr-2">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {debt_status.map((item, idx) => {
                                        const available = item.limit - item.current_debt;
                                        return (
                                            <tr key={idx} className="border-b border-border-color/20 hover:bg-bg-tertiary/30 transition-colors">
                                                <td className="py-4 pl-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                            {item.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">{item.name}</p>
                                                            <p className="text-[10px] text-muted">Corte: día {item.due_date || 15}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 font-bold text-accent-danger">{formatCurrency(item.current_debt)}</td>
                                                <td className="py-4 text-muted">{formatCurrency(item.limit)}</td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 bg-bg-tertiary rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${
                                                                    item.utilization > 80 ? 'bg-accent-danger' : 
                                                                    item.utilization > 50 ? 'bg-accent-warning' : 
                                                                    'bg-accent-success'
                                                                }`}
                                                                style={{ width: `${Math.min(item.utilization, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-muted w-12">{item.utilization.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 font-medium text-accent-success">{formatCurrency(available)}</td>
                                                <td className="py-4 text-right pr-2">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                                        item.utilization === 0 ? 'bg-accent-success/20 text-accent-success' :
                                                        item.utilization < 30 ? 'bg-accent-primary/20 text-accent-primary' :
                                                        item.utilization < 50 ? 'bg-cyan-500/20 text-cyan-400' :
                                                        item.utilization < 80 ? 'bg-accent-warning/20 text-accent-warning' :
                                                        'bg-accent-danger/20 text-accent-danger'
                                                    }`}>
                                                        {item.utilization === 0 ? 'Sin deuda' :
                                                         item.utilization < 30 ? 'Saludable' :
                                                         item.utilization < 50 ? 'Moderado' :
                                                         item.utilization < 80 ? 'Alto' : 'Crítico'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Credit Score Tips */}
                        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-accent-primary/10 to-purple-600/10 border border-accent-primary/20">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">💡</span>
                                <div>
                                    <p className="font-medium text-white mb-1">Consejo para tu Score Crediticio</p>
                                    <p className="text-sm text-muted">
                                        {avgUtilization > 30 
                                            ? `Tu utilización promedio es ${avgUtilization.toFixed(0)}%. Intenta mantenerla por debajo del 30% para mejorar tu score crediticio.`
                                            : `¡Excelente! Tu utilización de crédito está en ${avgUtilization.toFixed(0)}%, lo cual es ideal para mantener un buen score crediticio.`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-accent-success/20 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🎉</span>
                        </div>
                        <p className="text-accent-success font-medium mb-1">¡Sin deudas registradas!</p>
                        <p className="text-muted text-sm">Excelente manejo financiero</p>
                    </div>
                )}
            </div>

            {/* Financial Insights */}
            <div className="card bg-gradient-to-br from-bg-secondary via-[#151b2e] to-bg-secondary">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Insights Personalizados
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Positive Insights */}
                    {metrics.savings_rate > 20 && (
                        <div className="p-4 rounded-xl bg-accent-success/10 border border-accent-success/20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">✅</span>
                                <p className="font-medium text-accent-success">Excelente Tasa de Ahorro</p>
                            </div>
                            <p className="text-sm text-muted">
                                Estás ahorrando {metrics.savings_rate.toFixed(0)}% de tus ingresos. ¡Sigue así!
                            </p>
                        </div>
                    )}

                    {emergencyMonths >= 3 && (
                        <div className="p-4 rounded-xl bg-accent-success/10 border border-accent-success/20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">🛡️</span>
                                <p className="font-medium text-accent-success">Fondo de Emergencia Sólido</p>
                            </div>
                            <p className="text-sm text-muted">
                                Tienes {emergencyMonths.toFixed(1)} meses de gastos cubiertos. Esto te da tranquilidad financiera.
                            </p>
                        </div>
                    )}

                    {/* Warnings */}
                    {metrics.savings_rate < 10 && (
                        <div className="p-4 rounded-xl bg-accent-warning/10 border border-accent-warning/20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">⚠️</span>
                                <p className="font-medium text-accent-warning">Aumenta tu Ahorro</p>
                            </div>
                            <p className="text-sm text-muted">
                                Tu tasa de ahorro es {metrics.savings_rate.toFixed(0)}%. Intenta reducir gastos no esenciales para alcanzar al menos 20%.
                            </p>
                        </div>
                    )}

                    {avgUtilization > 50 && (
                        <div className="p-4 rounded-xl bg-accent-danger/10 border border-accent-danger/20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">🚨</span>
                                <p className="font-medium text-accent-danger">Alta Utilización de Crédito</p>
                            </div>
                            <p className="text-sm text-muted">
                                Tu utilización promedio es {avgUtilization.toFixed(0)}%. Paga más del mínimo para reducirla bajo 30%.
                            </p>
                        </div>
                    )}

                    {emergencyMonths < 1 && (
                        <div className="p-4 rounded-xl bg-accent-danger/10 border border-accent-danger/20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">🆘</span>
                                <p className="font-medium text-accent-danger">Sin Fondo de Emergencia</p>
                            </div>
                            <p className="text-sm text-muted">
                                Solo tienes {(emergencyMonths * 30).toFixed(0)} días de gastos cubiertos. Prioriza crear un colchón financiero.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Export Modal */}
            {exportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-bg-secondary rounded-2xl shadow-xl w-full max-w-md border border-border-color/50 animate-fade-in">
                        <div className="flex items-center justify-between p-6 border-b border-border-color/50">
                            <h2 className="text-xl font-bold text-white">Exportar Datos</h2>
                            <button 
                                onClick={() => setExportModalOpen(false)}
                                className="text-muted hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Export Type */}
                            <div>
                                <label className="block text-sm mb-2 text-muted">Tipo de exportación</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'transactions', label: 'Transacciones', icon: '📋' },
                                        { value: 'accounts', label: 'Cuentas', icon: '🏦' },
                                        { value: 'full-report', label: 'Reporte Completo', icon: '📊' }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setExportFilters({ ...exportFilters, type: opt.value })}
                                            className={`p-3 rounded-lg text-center transition-all ${
                                                exportFilters.type === opt.value
                                                    ? 'bg-accent-primary text-white'
                                                    : 'bg-bg-tertiary text-muted hover:text-white'
                                            }`}
                                        >
                                            <span className="text-xl block mb-1">{opt.icon}</span>
                                            <span className="text-xs">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Filters for Transactions */}
                            {exportFilters.type === 'transactions' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm mb-1 text-muted">Desde</label>
                                        <input
                                            type="date"
                                            className="w-full bg-bg-tertiary text-white rounded-lg px-3 py-2 border border-border-color/30"
                                            value={exportFilters.startDate}
                                            onChange={e => setExportFilters({ ...exportFilters, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1 text-muted">Hasta</label>
                                        <input
                                            type="date"
                                            className="w-full bg-bg-tertiary text-white rounded-lg px-3 py-2 border border-border-color/30"
                                            value={exportFilters.endDate}
                                            onChange={e => setExportFilters({ ...exportFilters, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Filters for Full Report */}
                            {exportFilters.type === 'full-report' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm mb-1 text-muted">Año</label>
                                        <select
                                            className="w-full bg-bg-tertiary text-white rounded-lg px-3 py-2 border border-border-color/30"
                                            value={exportFilters.year}
                                            onChange={e => setExportFilters({ ...exportFilters, year: e.target.value })}
                                        >
                                            {[2024, 2025, 2026].map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1 text-muted">Mes (opcional)</label>
                                        <select
                                            className="w-full bg-bg-tertiary text-white rounded-lg px-3 py-2 border border-border-color/30"
                                            value={exportFilters.month}
                                            onChange={e => setExportFilters({ ...exportFilters, month: e.target.value })}
                                        >
                                            <option value="">Año completo</option>
                                            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                                                <option key={i + 1} value={i + 1}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Export Button */}
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="w-full btn py-3 mt-4"
                            >
                                {exporting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Exportando...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Descargar CSV
                                    </span>
                                )}
                            </button>
                            <p className="text-xs text-muted text-center">
                                El archivo se descargará en formato CSV compatible con Excel
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
