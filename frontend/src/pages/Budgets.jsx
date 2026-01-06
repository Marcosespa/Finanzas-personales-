import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [budgetStatus, setBudgetStatus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const toast = useToast();

    const [formData, setFormData] = useState({
        category_id: '',
        amount: '',
        period: 'monthly'
    });

    // Summary stats
    const [totalBudget, setTotalBudget] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [budgetsData, statusData, categoriesData] = await Promise.all([
                api.get('/budgets/'),
                api.get('/budgets/status'),
                api.get('/categories/')
            ]);

            setBudgets(budgetsData);
            setBudgetStatus(statusData);
            setCategories(categoriesData.filter(c => c.type === 'expense'));

            // Calculate totals
            const totalLimit = statusData.reduce((acc, s) => acc + s.limit, 0);
            const totalActual = statusData.reduce((acc, s) => acc + s.actual, 0);
            setTotalBudget(totalLimit);
            setTotalSpent(totalActual);
        } catch (error) {
            console.error('Error fetching budgets:', error);
            toast.error('Error al cargar presupuestos');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingBudget(null);
        setFormData({ category_id: '', amount: '', period: 'monthly' });
        setIsModalOpen(true);
    };

    const handleEdit = (budget) => {
        setEditingBudget(budget);
        setFormData({
            category_id: budget.category_id,
            amount: budget.amount,
            period: budget.period
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingBudget) {
                await api.put(`/budgets/${editingBudget.id}`, formData);
                toast.success('Presupuesto actualizado');
            } else {
                await api.post('/budgets/', formData);
                toast.success('Presupuesto creado');
            }

            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.msg || 'Error al guardar presupuesto');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar este presupuesto?')) return;

        try {
            await api.delete(`/budgets/${id}`);
            toast.success('Presupuesto eliminado');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar presupuesto');
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(val);

    const getStatusColor = (status) => {
        switch (status) {
            case 'good': return 'text-accent-success';
            case 'warning': return 'text-accent-warning';
            case 'over': return 'text-accent-danger';
            default: return 'text-muted';
        }
    };

    const getStatusGradient = (status) => {
        switch (status) {
            case 'good': return 'from-emerald-500 to-green-600';
            case 'warning': return 'from-amber-500 to-orange-600';
            case 'over': return 'from-rose-500 to-red-600';
            default: return 'from-accent-primary to-indigo-600';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'good':
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case 'over':
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
            </div>
        );
    }

    const overallUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-primary">
                        Presupuestos
                    </h1>
                    <p className="text-muted text-sm mt-1">Controla tus gastos con límites mensuales por categoría</p>
                </div>
                <button onClick={handleCreate} className="btn shadow-lg hover:shadow-accent-primary/20 transition-all">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nuevo Presupuesto
                </button>
            </div>

            {/* Overall Summary */}
            {budgetStatus.length > 0 && (
                <div className="card bg-gradient-to-br from-bg-secondary via-[#151b2e] to-bg-secondary border border-border-color/50">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        {/* Circular Progress */}
                        <div className="flex-shrink-0">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full -rotate-90">
                                    <circle
                                        cx="64" cy="64" r="56"
                                        fill="none" stroke="var(--bg-tertiary)" strokeWidth="8"
                                    />
                                    <circle
                                        cx="64" cy="64" r="56"
                                        fill="none" 
                                        stroke={overallUtilization > 100 ? '#f43f5e' : overallUtilization > 80 ? '#f59e0b' : '#6366f1'}
                                        strokeWidth="8"
                                        strokeDasharray={2 * Math.PI * 56}
                                        strokeDashoffset={2 * Math.PI * 56 * (1 - Math.min(overallUtilization, 100) / 100)}
                                        className="transition-all duration-1000"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-white">{overallUtilization.toFixed(0)}%</span>
                                    <span className="text-[10px] text-muted">Utilizado</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-bg-tertiary/30 border border-border-color/30">
                                <p className="text-xs text-muted mb-1">Presupuesto Total</p>
                                <p className="text-xl font-bold text-white">{formatCurrency(totalBudget)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-bg-tertiary/30 border border-border-color/30">
                                <p className="text-xs text-muted mb-1">Gastado</p>
                                <p className="text-xl font-bold text-accent-danger">{formatCurrency(totalSpent)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-bg-tertiary/30 border border-border-color/30">
                                <p className="text-xs text-muted mb-1">Disponible</p>
                                <p className={`text-xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                                    {formatCurrency(totalBudget - totalSpent)}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-bg-tertiary/30 border border-border-color/30">
                                <p className="text-xs text-muted mb-1">Categorías</p>
                                <p className="text-xl font-bold text-white">{budgetStatus.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Budget Cards Grid */}
            {budgetStatus.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {budgetStatus.map((status) => (
                        <div
                            key={status.budget_id}
                            className="card group relative overflow-hidden hover:translate-y-[-4px] transition-all duration-300"
                        >
                            {/* Status indicator bar */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getStatusGradient(status.status)}`} />
                            
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4 pt-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${getStatusGradient(status.status)} shadow-lg`}>
                                        {getStatusIcon(status.status)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{status.category}</h3>
                                        <p className="text-xs text-muted">Límite: {formatCurrency(status.limit)}</p>
                                    </div>
                                </div>
                                <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${
                                    status.status === 'over' ? 'bg-accent-danger/20 text-accent-danger' :
                                    status.status === 'warning' ? 'bg-accent-warning/20 text-accent-warning' :
                                    'bg-accent-success/20 text-accent-success'
                                }`}>
                                    {status.utilization.toFixed(0)}%
                                </span>
                            </div>

                            {/* Progress Section */}
                            <div className="space-y-3">
                                {/* Amount Display */}
                                <div className="flex justify-between items-baseline">
                                    <div>
                                        <span className="text-2xl font-bold text-white">{formatCurrency(status.actual)}</span>
                                        <span className="text-sm text-muted ml-2">/ {formatCurrency(status.limit)}</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="relative">
                                    <div className="w-full h-3 bg-bg-tertiary rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${getStatusGradient(status.status)}`}
                                            style={{ width: `${Math.min(status.utilization, 100)}%` }}
                                        />
                                    </div>
                                    {/* Limit marker at 100% */}
                                    {status.utilization > 100 && (
                                        <div className="absolute top-0 right-0 w-0.5 h-full bg-white/50" />
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex justify-between items-center pt-2">
                                    <span className={`text-sm font-medium ${getStatusColor(status.status)}`}>
                                        {status.remaining >= 0 ? (
                                            <>Quedan <span className="font-bold">{formatCurrency(status.remaining)}</span></>
                                        ) : (
                                            <>Excedido por <span className="font-bold">{formatCurrency(Math.abs(status.remaining))}</span></>
                                        )}
                                    </span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                const budget = budgets.find(b => b.id === status.budget_id);
                                                if (budget) handleEdit(budget);
                                            }}
                                            className="p-2 rounded-lg hover:bg-bg-tertiary text-muted hover:text-accent-primary transition-colors"
                                            title="Editar"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(status.budget_id)}
                                            className="p-2 rounded-lg hover:bg-accent-danger/10 text-muted hover:text-accent-danger transition-colors"
                                            title="Eliminar"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent-primary/20 to-indigo-600/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No tienes presupuestos configurados</h3>
                    <p className="text-muted mb-6 max-w-md mx-auto">
                        Los presupuestos te ayudan a controlar tus gastos por categoría. 
                        Crea tu primer presupuesto para comenzar a tener control de tus finanzas.
                    </p>
                    <button onClick={handleCreate} className="btn">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Crear Primer Presupuesto
                    </button>
                </div>
            )}

            {/* Tips Section */}
            {budgetStatus.length > 0 && budgetStatus.some(s => s.status === 'warning' || s.status === 'over') && (
                <div className="card bg-gradient-to-r from-accent-warning/5 to-amber-600/5 border border-accent-warning/20">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent-warning/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-accent-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-accent-warning mb-1">Consejo para tu viaje</h4>
                            <p className="text-sm text-muted">
                                Algunos presupuestos están cerca del límite o excedidos. Revisa tus gastos para 
                                asegurar que tengas suficiente para tu pasantía en Praga. Recuerda que necesitas 
                                ahorrar para el viaje.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-muted">Categoría</label>
                        <select
                            required
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            disabled={editingBudget}
                            className="w-full disabled:opacity-50"
                        >
                            <option value="">Selecciona una categoría</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        {editingBudget && (
                            <p className="text-xs text-muted mt-1 italic">La categoría no puede modificarse</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-muted">Límite de Gasto</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
                            <input
                                type="number"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="500,000"
                                min="0"
                                step="10000"
                                className="w-full pl-8"
                            />
                        </div>
                        <p className="text-xs text-muted mt-1">Monto máximo que deseas gastar en esta categoría</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-muted">Período</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, period: 'monthly' })}
                                className={`p-3 rounded-xl border transition-all text-center ${
                                    formData.period === 'monthly'
                                        ? 'bg-accent-primary/20 border-accent-primary text-white'
                                        : 'bg-bg-tertiary border-border-color/50 text-muted hover:border-accent-primary/50'
                                }`}
                            >
                                <span className="block font-semibold">Mensual</span>
                                <span className="text-xs opacity-70">Se reinicia cada mes</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, period: 'yearly' })}
                                className={`p-3 rounded-xl border transition-all text-center ${
                                    formData.period === 'yearly'
                                        ? 'bg-accent-primary/20 border-accent-primary text-white'
                                        : 'bg-bg-tertiary border-border-color/50 text-muted hover:border-accent-primary/50'
                                }`}
                            >
                                <span className="block font-semibold">Anual</span>
                                <span className="text-xs opacity-70">Límite para todo el año</span>
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn w-full mt-6">
                        {editingBudget ? 'Actualizar Presupuesto' : 'Crear Presupuesto'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Budgets;
