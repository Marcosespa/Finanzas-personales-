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

    const getStatusBg = (utilization) => {
        if (utilization > 100) return 'bg-accent-danger';
        if (utilization > 80) return 'bg-accent-warning';
        return 'bg-primary';
    };

    if (loading) return <div className="p-8 text-center text-muted">Cargando...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-primary">
                        Presupuestos
                    </h1>
                    <p className="text-muted text-sm mt-1">Gestiona tus límites de gasto mensuales</p>
                </div>
                <button onClick={handleCreate} className="btn shadow-lg">
                    <span className="mr-2">+</span> Nuevo Presupuesto
                </button>
            </div>

            {/* Budget Status Overview */}
            {budgetStatus.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {budgetStatus.map((status) => (
                        <div
                            key={status.budget_id}
                            className="card bg-gradient-to-br from-bg-secondary via-bg-tertiary to-bg-secondary border-t-4 border-primary hover:translate-y-[-2px] transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-white">{status.category}</h3>
                                    <p className="text-xs text-muted mt-1">Límite mensual: {formatCurrency(status.limit)}</p>
                                </div>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.status === 'over' ? 'bg-accent-danger/20 text-accent-danger' :
                                        status.status === 'warning' ? 'bg-accent-warning/20 text-accent-warning' :
                                            'bg-accent-success/20 text-accent-success'
                                    }`}>
                                    {status.utilization.toFixed(1)}%
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Gastado</span>
                                    <span className="text-white font-medium">{formatCurrency(status.actual)}</span>
                                </div>
                                <div className="w-full bg-bg-primary rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${getStatusBg(status.utilization)}`}
                                        style={{ width: `${Math.min(status.utilization, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className={getStatusColor(status.status)}>
                                        {status.remaining >= 0 ? 'Restante' : 'Excedido'}: {formatCurrency(Math.abs(status.remaining))}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const budget = budgets.find(b => b.id === status.budget_id);
                                            if (budget) handleEdit(budget);
                                        }}
                                        className="text-primary hover:text-accent-primary transition-colors"
                                    >
                                        Editar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-white mb-2">No tienes presupuestos configurados</h3>
                    <p className="text-muted mb-4">Crea tu primer presupuesto para controlar tus gastos</p>
                    <button onClick={handleCreate} className="btn">
                        Crear Presupuesto
                    </button>
                </div>
            )}

            {/* Budget List */}
            {budgets.length > 0 && (
                <div className="card">
                    <h3 className="font-bold text-lg mb-4">Todos los Presupuestos</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-muted text-xs uppercase tracking-wider border-b border-tertiary">
                                    <th className="py-3 px-4">Categoría</th>
                                    <th className="py-3 px-4">Límite</th>
                                    <th className="py-3 px-4">Período</th>
                                    <th className="py-3 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tertiary">
                                {budgets.map((budget) => (
                                    <tr key={budget.id} className="hover:bg-bg-tertiary/30 transition-colors">
                                        <td className="py-3 px-4 text-white font-medium">{budget.category_name}</td>
                                        <td className="py-3 px-4">{formatCurrency(budget.amount)}</td>
                                        <td className="py-3 px-4 capitalize">{budget.period}</td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleEdit(budget)}
                                                className="text-primary hover:text-accent-primary mr-3 transition-colors"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(budget.id)}
                                                className="text-accent-danger hover:brightness-110 transition-colors"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1 text-muted">Categoría</label>
                        <select
                            required
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            disabled={editingBudget}
                            className="w-full"
                        >
                            <option value="">Selecciona una categoría</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        {editingBudget && <p className="text-xs text-muted mt-1">No puedes cambiar la categoría de un presupuesto existente</p>}
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-muted">Límite de Gasto</label>
                        <input
                            type="number"
                            required
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="500000"
                            min="0"
                            step="1000"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-muted">Período</label>
                        <select
                            value={formData.period}
                            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                            className="w-full"
                        >
                            <option value="monthly">Mensual</option>
                            <option value="yearly">Anual</option>
                        </select>
                    </div>

                    <button type="submit" className="btn w-full">
                        {editingBudget ? 'Actualizar' : 'Crear'} Presupuesto
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Budgets;
