import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from './Modal';

const TransactionModal = ({ isOpen, onClose, onSuccess }) => {
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const [formData, setFormData] = useState({
        account_id: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category_id: '',
        type: 'expense' // expense, income
    });

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [accRes, catRes] = await Promise.all([
                        api.get('/accounts/'),
                        api.get('/categories/')
                    ]);
                    setAccounts(accRes);
                    setCategories(catRes);
                    if (accRes.length > 0 && !formData.account_id) {
                        setFormData(prev => ({ ...prev, account_id: accRes[0].id }));
                    }
                } catch (err) {
                    console.error("Error loading transaction data", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
            setIsCreatingCategory(false);
            setNewCategoryName('');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let categoryIdToUse = formData.category_id;

            if (isCreatingCategory) {
                if (!newCategoryName.trim()) {
                    alert("Please enter a category name");
                    return;
                }
                const newCat = await api.post('/categories/', {
                    name: newCategoryName,
                    type: formData.type
                });
                categoryIdToUse = newCat.id;
            }

            // Expenses are negative in backend logic?
            // "The Transaction model supports negative amount for expense"
            let finalAmount = parseFloat(formData.amount);
            if (formData.type === 'expense') {
                finalAmount = -Math.abs(finalAmount);
            } else {
                finalAmount = Math.abs(finalAmount);
            }

            await api.post('/transactions/', {
                account_id: formData.account_id,
                amount: finalAmount,
                description: formData.description,
                date: formData.date,
                category_id: categoryIdToUse || null
            });
            onSuccess();
            onClose();
        } catch (err) {
            alert("Error saving transaction: " + (err.msg || err));
        }
    };


    if (!isOpen) return null;

    return (

        <Modal isOpen={isOpen} onClose={onClose} title="Nueva Transacción">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex gap-4 p-1 bg-bg-tertiary rounded-lg">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'expense' })}
                        className={`flex-1 py-1 rounded-md text-sm font-medium transition-colors ${formData.type === 'expense' ? 'bg-accent-danger text-white shadow' : 'text-muted hover:text-white'}`}
                    >
                        Gasto
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'income' })}
                        className={`flex-1 py-1 rounded-md text-sm font-medium transition-colors ${formData.type === 'income' ? 'bg-accent-success text-white shadow' : 'text-muted hover:text-white'}`}
                    >
                        Ingreso
                    </button>
                </div>

                <div>
                    <label className="block text-sm mb-1 text-muted">Monto</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-muted">$</span>
                        <input
                            type="number" step="0.01"
                            className="w-full bg-tertiary text-primary pl-6 font-bold text-lg"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm mb-1 text-muted">Cuenta</label>
                        <select className="w-full bg-tertiary text-primary" value={formData.account_id} onChange={e => setFormData({ ...formData, account_id: e.target.value })}>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency_code})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-muted">Fecha</label>
                        <input type="date" className="w-full bg-tertiary text-primary" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm text-muted">Categoría</label>
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreatingCategory(!isCreatingCategory);
                                setNewCategoryName('');
                            }}
                            className="text-xs text-accent-primary hover:underline"
                        >
                            {isCreatingCategory ? 'Seleccionar existente' : '+ Crear nueva'}
                        </button>
                    </div>

                    {isCreatingCategory ? (
                        <input
                            type="text"
                            className="w-full bg-tertiary text-primary"
                            placeholder="Nombre de nueva categoría"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            autoFocus
                        />
                    ) : (
                        <>
                            <select className="w-full bg-tertiary text-primary" value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                                <option value="">Seleccionar Categoría</option>
                                {categories.filter(c => c.type === formData.type).map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {categories.length === 0 && (
                                <div className="mt-2 p-3 bg-bg-tertiary rounded-lg border border-warning/20 flex flex-col items-start gap-2">
                                    <p className="text-xs text-warning">No hay categorías.</p>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (confirm("¿Cargar categorías por defecto?")) {
                                                try {
                                                    await api.post('/categories/seed');
                                                    // Refresh categories locally
                                                    const res = await api.get('/categories/');
                                                    setCategories(res);
                                                } catch (e) { alert("Error: " + e); }
                                            }
                                        }}
                                        className="text-xs text-primary underline hover:text-accent-primary"
                                    >
                                        Cargar categorías por defecto
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div>
                    <label className="block text-sm mb-1 text-muted">Descripción</label>
                    <input type="text" className="w-full bg-tertiary text-primary" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Almuerzo, Salario, etc." />
                </div>

                <button type="submit" className="btn mt-4">Guardar Transacción</button>
            </form>
        </Modal>
    );
};

export default TransactionModal;
