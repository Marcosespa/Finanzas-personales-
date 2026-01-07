import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from './Modal';
import { formatNumberWithThousands, parseFormattedNumber } from '../utils/currency';
import { useToast } from '../context/ToastContext';

const TransactionModal = ({ isOpen, onClose, onSuccess, editTransaction = null }) => {
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [errors, setErrors] = useState({});
    const toast = useToast();

    const isEditMode = !!editTransaction;

    const getInitialFormData = () => ({
        account_id: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category_id: '',
        type: 'expense'
    });

    const [formData, setFormData] = useState(getInitialFormData());

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [accRes, catRes] = await Promise.all([
                        api.get('/accounts/'),
                        api.get('/categories/')
                    ]);
                    setAccounts(accRes);
                    setCategories(catRes);
                    
                    // Si estamos editando, cargar los datos de la transacción
                    if (editTransaction) {
                        const amount = Math.abs(editTransaction.amount);
                        const type = editTransaction.amount < 0 ? 'expense' : 'income';
                        const account = accRes.find(a => a.id === editTransaction.account_id);
                        const currencyCode = account?.currency_code || 'COP';
                        
                        setFormData({
                            account_id: editTransaction.account_id,
                            amount: formatNumberWithThousands(amount, currencyCode),
                            description: editTransaction.description || '',
                            date: editTransaction.date ? editTransaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
                            category_id: editTransaction.category_id || '',
                            type: type
                        });
                    } else {
                        // Modo creación
                        if (accRes.length > 0) {
                            setFormData(prev => ({ ...prev, account_id: accRes[0].id }));
                        }
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
            setErrors({});
        }
    }, [isOpen, editTransaction]);

    // Función helper para obtener el símbolo de la divisa
    const getCurrencySymbol = (currencyCode) => {
        const symbols = {
            'COP': '$',
            'EUR': '€',
            'USD': '$',
            'CZK': 'Kč'
        };
        return symbols[currencyCode] || '$';
    };

    // Obtener la divisa de la cuenta seleccionada
    const getSelectedAccountCurrency = () => {
        const selectedAccount = accounts.find(acc => acc.id === parseInt(formData.account_id));
        return selectedAccount?.currency_code || 'COP';
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.account_id) {
            newErrors.account_id = 'Selecciona una cuenta';
        }
        
        if (!formData.amount || parseFormattedNumber(formData.amount) === '') {
            newErrors.amount = 'Ingresa un monto válido';
        } else {
            const amount = parseFloat(parseFormattedNumber(formData.amount));
            if (isNaN(amount) || amount <= 0) {
                newErrors.amount = 'El monto debe ser mayor a 0';
            }
        }
        
        if (!formData.date) {
            newErrors.date = 'Selecciona una fecha';
        }
        
        if (isCreatingCategory && !newCategoryName.trim()) {
            newErrors.category = 'Ingresa un nombre para la categoría';
        } else if (!isCreatingCategory && !formData.category_id) {
            // Category is optional, but we can warn
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Por favor, completa todos los campos requeridos');
            return;
        }
        
        setSubmitting(true);
        try {
            let categoryIdToUse = formData.category_id;

            if (isCreatingCategory) {
                if (!newCategoryName.trim()) {
                    toast.error('Ingresa un nombre para la categoría');
                    setSubmitting(false);
                    return;
                }
                const newCat = await api.post('/categories/', {
                    name: newCategoryName,
                    type: formData.type
                });
                categoryIdToUse = newCat.id;
            }

            // Expenses are negative in backend logic
            const parsedAmount = parseFormattedNumber(formData.amount);
            let finalAmount = parseFloat(parsedAmount);
            if (formData.type === 'expense') {
                finalAmount = -Math.abs(finalAmount);
            } else {
                finalAmount = Math.abs(finalAmount);
            }

            if (isEditMode) {
                // Actualizar transacción existente
                await api.put(`/transactions/${editTransaction.id}`, {
                    account_id: parseInt(formData.account_id),
                    amount: finalAmount,
                    description: formData.description || '',
                    date: formData.date,
                    category_id: categoryIdToUse || null
                });
                toast.success('Transacción actualizada exitosamente');
            } else {
                // Crear nueva transacción
                await api.post('/transactions/', {
                    account_id: formData.account_id,
                    amount: finalAmount,
                    description: formData.description || '',
                    date: formData.date,
                    category_id: categoryIdToUse || null
                });
                toast.success('Transacción guardada exitosamente');
            }
            
            onSuccess();
            onClose();
            
            // Reset form
            setFormData(getInitialFormData());
            setErrors({});
        } catch (err) {
            toast.error(err.message || 'Error al guardar la transacción');
        } finally {
            setSubmitting(false);
        }
    };


    if (!isOpen) return null;

    return (

        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Editar Transacción" : "Nueva Transacción"}>
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
                    <label className="block text-sm mb-1 text-muted">Monto <span className="text-accent-danger">*</span></label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-muted">
                            {getCurrencySymbol(getSelectedAccountCurrency())}
                        </span>
                        <input
                            type="text"
                            className={`w-full bg-tertiary text-primary pl-6 font-bold text-lg ${errors.amount ? 'border border-accent-danger' : ''}`}
                            value={formData.amount}
                            onChange={e => {
                                const value = e.target.value;
                                const currencyCode = getSelectedAccountCurrency();
                                
                                // Permitir solo números y punto decimal
                                const cleaned = value.replace(/[^\d.]/g, '');
                                if (cleaned === '' || cleaned === '.') {
                                    setFormData({ ...formData, amount: '' });
                                    setErrors({ ...errors, amount: null });
                                    return;
                                }
                                // Formatear con puntos para miles
                                const formatted = formatNumberWithThousands(cleaned, currencyCode);
                                setFormData({ ...formData, amount: formatted });
                                setErrors({ ...errors, amount: null });
                            }}
                            placeholder="0"
                            required
                        />
                    </div>
                    {errors.amount && <p className="text-xs text-accent-danger mt-1">{errors.amount}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm mb-1 text-muted">Cuenta <span className="text-accent-danger">*</span></label>
                        <select 
                            className={`w-full bg-tertiary text-primary ${errors.account_id ? 'border border-accent-danger' : ''}`}
                            value={formData.account_id} 
                            onChange={e => {
                                const newAccountId = e.target.value;
                                const newAccount = accounts.find(acc => acc.id === parseInt(newAccountId));
                                const newCurrency = newAccount?.currency_code || 'COP';
                                
                                // Reformatear el monto si existe cuando se cambia la cuenta
                                if (formData.amount) {
                                    const parsed = parseFormattedNumber(formData.amount);
                                    if (parsed) {
                                        const reformatted = formatNumberWithThousands(parsed, newCurrency);
                                        setFormData({ ...formData, account_id: newAccountId, amount: reformatted });
                                    } else {
                                        setFormData({ ...formData, account_id: newAccountId });
                                    }
                                } else {
                                    setFormData({ ...formData, account_id: newAccountId });
                                }
                                setErrors({ ...errors, account_id: null });
                            }}
                        >
                            <option value="">Selecciona una cuenta</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency_code})</option>)}
                        </select>
                        {errors.account_id && <p className="text-xs text-accent-danger mt-1">{errors.account_id}</p>}
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-muted">Fecha <span className="text-accent-danger">*</span></label>
                        <input 
                            type="date" 
                            className={`w-full bg-tertiary text-primary ${errors.date ? 'border border-accent-danger' : ''}`}
                            value={formData.date} 
                            onChange={e => {
                                setFormData({ ...formData, date: e.target.value });
                                setErrors({ ...errors, date: null });
                            }}
                        />
                        {errors.date && <p className="text-xs text-accent-danger mt-1">{errors.date}</p>}
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
                        <div>
                            <input
                                type="text"
                                className={`w-full bg-tertiary text-primary ${errors.category ? 'border border-accent-danger' : ''}`}
                                placeholder="Nombre de nueva categoría"
                                value={newCategoryName}
                                onChange={e => {
                                    setNewCategoryName(e.target.value);
                                    setErrors({ ...errors, category: null });
                                }}
                                autoFocus
                            />
                            {errors.category && <p className="text-xs text-accent-danger mt-1">{errors.category}</p>}
                        </div>
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

                <button 
                    type="submit" 
                    className="btn mt-4"
                    disabled={submitting || loading}
                >
                    {submitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Guardando...
                        </>
                    ) : (
                        isEditMode ? 'Actualizar Transacción' : 'Guardar Transacción'
                    )}
                </button>
            </form>
        </Modal>
    );
};

export default TransactionModal;
