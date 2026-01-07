import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { formatNumberWithThousands, parseFormattedNumber } from '../utils/currency';

const RecurringTransactions = () => {
    const [recurring, setRecurring] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [processing, setProcessing] = useState(false);
    const toast = useToast();

    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        description: '',
        frequency: 'monthly',
        day_of_month: 1,
        account_id: '',
        category_id: '',
        type: 'expense',
        end_date: ''
    });

    const frequencies = [
        { value: 'daily', label: 'Diario' },
        { value: 'weekly', label: 'Semanal' },
        { value: 'biweekly', label: 'Quincenal' },
        { value: 'monthly', label: 'Mensual' },
        { value: 'yearly', label: 'Anual' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [recurringRes, accountsRes, categoriesRes] = await Promise.all([
                api.get('/recurring/'),
                api.get('/accounts/'),
                api.get('/categories/')
            ]);
            setRecurring(recurringRes);
            setAccounts(accountsRes);
            setCategories(categoriesRes);
        } catch (err) {
            console.error(err);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            const type = item.amount < 0 ? 'expense' : 'income';
            const account = accounts.find(a => a.id === item.account_id);
            const currencyCode = account?.currency_code || 'COP';
            
            setFormData({
                name: item.name,
                amount: formatNumberWithThousands(Math.abs(item.amount), currencyCode),
                description: item.description || '',
                frequency: item.frequency,
                day_of_month: item.day_of_month,
                account_id: item.account_id,
                category_id: item.category_id || '',
                type: type,
                end_date: item.end_date ? item.end_date.split('T')[0] : ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                amount: '',
                description: '',
                frequency: 'monthly',
                day_of_month: new Date().getDate(),
                account_id: accounts.length > 0 ? accounts[0].id : '',
                category_id: '',
                type: 'expense',
                end_date: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const parsedAmount = parseFloat(parseFormattedNumber(formData.amount));
            const finalAmount = formData.type === 'expense' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);
            
            const payload = {
                name: formData.name,
                amount: finalAmount,
                description: formData.description,
                frequency: formData.frequency,
                day_of_month: parseInt(formData.day_of_month),
                account_id: parseInt(formData.account_id),
                category_id: formData.category_id ? parseInt(formData.category_id) : null,
                end_date: formData.end_date || null,
                is_active: true
            };

            if (editingItem) {
                await api.put(`/recurring/${editingItem.id}`, payload);
                toast.success('Transacción recurrente actualizada');
            } else {
                payload.start_date = new Date().toISOString();
                await api.post('/recurring/', payload);
                toast.success('Transacción recurrente creada');
            }
            
            setIsModalOpen(false);
            loadData();
        } catch (err) {
            toast.error(err.message || 'Error al guardar');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta transacción recurrente?')) return;
        
        try {
            await api.delete(`/recurring/${id}`);
            toast.success('Transacción recurrente eliminada');
            loadData();
        } catch (err) {
            toast.error(err.message || 'Error al eliminar');
        }
    };

    const handleToggleActive = async (item) => {
        try {
            await api.put(`/recurring/${item.id}`, { is_active: !item.is_active });
            toast.success(item.is_active ? 'Transacción pausada' : 'Transacción activada');
            loadData();
        } catch (err) {
            toast.error(err.message || 'Error al actualizar');
        }
    };

    const handleProcessAll = async () => {
        setProcessing(true);
        try {
            const res = await api.post('/recurring/process');
            toast.success(res.msg);
            loadData();
        } catch (err) {
            toast.error(err.message || 'Error al procesar');
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        maximumFractionDigits: 0 
    }).format(val);

    const getFrequencyLabel = (freq) => frequencies.find(f => f.value === freq)?.label || freq;

    const getCurrencyCode = () => {
        const account = accounts.find(a => a.id === parseInt(formData.account_id));
        return account?.currency_code || 'COP';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
            </div>
        );
    }

    const activeRecurring = recurring.filter(r => r.is_active);
    const pausedRecurring = recurring.filter(r => !r.is_active);
    const totalMonthlyExpenses = activeRecurring
        .filter(r => r.amount < 0 && r.frequency === 'monthly')
        .reduce((sum, r) => sum + Math.abs(r.amount), 0);
    const totalMonthlyIncome = activeRecurring
        .filter(r => r.amount > 0 && r.frequency === 'monthly')
        .reduce((sum, r) => sum + r.amount, 0);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-primary">
                        Transacciones Recurrentes
                    </h1>
                    <p className="text-muted mt-1 text-sm">Gestiona tus gastos e ingresos fijos</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleProcessAll}
                        disabled={processing}
                        className="btn btn-secondary text-sm"
                    >
                        {processing ? 'Procesando...' : '🔄 Procesar Pendientes'}
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="btn text-sm"
                    >
                        + Nueva Recurrente
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card bg-gradient-to-br from-accent-danger/10 to-red-600/5 border-accent-danger/20">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-accent-danger/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-accent-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-muted">Gastos Mensuales Fijos</p>
                            <p className="text-xl font-bold text-accent-danger">{formatCurrency(totalMonthlyExpenses)}</p>
                        </div>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-accent-success/10 to-green-600/5 border-accent-success/20">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-accent-success/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-accent-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-muted">Ingresos Mensuales Fijos</p>
                            <p className="text-xl font-bold text-accent-success">{formatCurrency(totalMonthlyIncome)}</p>
                        </div>
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-accent-primary/10 to-indigo-600/5 border-accent-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-accent-primary/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-muted">Transacciones Activas</p>
                            <p className="text-xl font-bold text-white">{activeRecurring.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recurring List */}
            {recurring.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-white mb-2">Sin transacciones recurrentes</h3>
                    <p className="text-sm text-muted mb-4">Programa tus gastos fijos como arriendo, Netflix, gimnasio, etc.</p>
                    <button onClick={() => openModal()} className="btn">
                        + Crear Primera Recurrente
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Active */}
                    {activeRecurring.length > 0 && (
                        <div className="card">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-accent-success"></span>
                                Activas ({activeRecurring.length})
                            </h3>
                            <div className="space-y-3">
                                {activeRecurring.map(item => (
                                    <div 
                                        key={item.id} 
                                        className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/30 border border-border-color/30 hover:border-accent-primary/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.amount < 0 ? 'bg-accent-danger/20' : 'bg-accent-success/20'}`}>
                                                <span className="text-lg">{item.amount < 0 ? '💸' : '💰'}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-white">{item.name}</h4>
                                                <div className="flex items-center gap-2 text-xs text-muted">
                                                    <span>{getFrequencyLabel(item.frequency)}</span>
                                                    <span>•</span>
                                                    <span>{item.account_name}</span>
                                                    {item.category_name && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="px-1.5 py-0.5 rounded bg-bg-tertiary">{item.category_name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className={`font-bold ${item.amount < 0 ? 'text-accent-danger' : 'text-accent-success'}`}>
                                                    {formatCurrency(item.amount)}
                                                </p>
                                                {item.next_due && (
                                                    <p className="text-xs text-muted">
                                                        Próximo: {new Date(item.next_due).toLocaleDateString('es-CO')}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleToggleActive(item)}
                                                    className="p-2 text-muted hover:text-accent-warning rounded hover:bg-accent-warning/10"
                                                    title="Pausar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => openModal(item)}
                                                    className="p-2 text-muted hover:text-accent-primary rounded hover:bg-accent-primary/10"
                                                    title="Editar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-muted hover:text-accent-danger rounded hover:bg-accent-danger/10"
                                                    title="Eliminar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Paused */}
                    {pausedRecurring.length > 0 && (
                        <div className="card opacity-60">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-muted"></span>
                                Pausadas ({pausedRecurring.length})
                            </h3>
                            <div className="space-y-3">
                                {pausedRecurring.map(item => (
                                    <div 
                                        key={item.id} 
                                        className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/20 border border-border-color/20 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-bg-tertiary/50 flex items-center justify-center">
                                                <span className="text-lg opacity-50">{item.amount < 0 ? '💸' : '💰'}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-muted">{item.name}</h4>
                                                <p className="text-xs text-muted">{getFrequencyLabel(item.frequency)} • {item.account_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-bold text-muted">{formatCurrency(item.amount)}</p>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleToggleActive(item)}
                                                    className="p-2 text-muted hover:text-accent-success rounded hover:bg-accent-success/10"
                                                    title="Activar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-muted hover:text-accent-danger rounded hover:bg-accent-danger/10"
                                                    title="Eliminar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingItem ? "Editar Recurrente" : "Nueva Transacción Recurrente"}
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Type Toggle */}
                    <div className="flex gap-2 p-1 bg-bg-tertiary rounded-lg">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'expense' })}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${formData.type === 'expense' ? 'bg-accent-danger text-white shadow' : 'text-muted hover:text-white'}`}
                        >
                            💸 Gasto
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'income' })}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${formData.type === 'income' ? 'bg-accent-success text-white shadow' : 'text-muted hover:text-white'}`}
                        >
                            💰 Ingreso
                        </button>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm mb-1 text-muted">Nombre</label>
                        <input
                            type="text"
                            className="w-full bg-tertiary text-primary"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Netflix, Arriendo, Salario..."
                            required
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm mb-1 text-muted">Monto</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-muted">$</span>
                            <input
                                type="text"
                                className="w-full bg-tertiary text-primary pl-6 font-bold"
                                value={formData.amount}
                                onChange={e => {
                                    const cleaned = e.target.value.replace(/[^\d.]/g, '');
                                    if (cleaned === '') {
                                        setFormData({ ...formData, amount: '' });
                                        return;
                                    }
                                    const formatted = formatNumberWithThousands(cleaned, getCurrencyCode());
                                    setFormData({ ...formData, amount: formatted });
                                }}
                                placeholder="50.000"
                                required
                            />
                        </div>
                    </div>

                    {/* Frequency & Day */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1 text-muted">Frecuencia</label>
                            <select
                                className="w-full bg-tertiary text-primary"
                                value={formData.frequency}
                                onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                            >
                                {frequencies.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>
                        </div>
                        {formData.frequency === 'monthly' && (
                            <div>
                                <label className="block text-sm mb-1 text-muted">Día del mes</label>
                                <select
                                    className="w-full bg-tertiary text-primary"
                                    value={formData.day_of_month}
                                    onChange={e => setFormData({ ...formData, day_of_month: e.target.value })}
                                >
                                    {[...Array(28)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Account & Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1 text-muted">Cuenta</label>
                            <select
                                className="w-full bg-tertiary text-primary"
                                value={formData.account_id}
                                onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-muted">Categoría</label>
                            <select
                                className="w-full bg-tertiary text-primary"
                                value={formData.category_id}
                                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                            >
                                <option value="">Sin categoría</option>
                                {categories.filter(c => c.type === formData.type).map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm mb-1 text-muted">Descripción (opcional)</label>
                        <input
                            type="text"
                            className="w-full bg-tertiary text-primary"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Notas adicionales..."
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm mb-1 text-muted">Fecha de fin (opcional)</label>
                        <input
                            type="date"
                            className="w-full bg-tertiary text-primary"
                            value={formData.end_date}
                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                        />
                        <p className="text-xs text-muted mt-1">Dejar vacío para indefinido</p>
                    </div>

                    <button type="submit" className="btn mt-4">
                        {editingItem ? 'Actualizar' : 'Crear Recurrente'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default RecurringTransactions;

