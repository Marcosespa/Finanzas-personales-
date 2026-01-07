import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from './Modal';
import { formatNumberWithThousands, parseFormattedNumber } from '../utils/currency';
import { useToast } from '../context/ToastContext';

const TransferModal = ({ isOpen, onClose, onSuccess }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const toast = useToast();

    const [formData, setFormData] = useState({
        from_account_id: '',
        to_account_id: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (isOpen) {
            loadAccounts();
        }
    }, [isOpen]);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const accRes = await api.get('/accounts/');
            setAccounts(accRes);
            // Pre-seleccionar las primeras dos cuentas si hay más de una
            if (accRes.length >= 2) {
                setFormData(prev => ({
                    ...prev,
                    from_account_id: accRes[0].id,
                    to_account_id: accRes[1].id
                }));
            } else if (accRes.length === 1) {
                setFormData(prev => ({
                    ...prev,
                    from_account_id: accRes[0].id
                }));
            }
        } catch (err) {
            console.error("Error loading accounts", err);
            toast.error('Error al cargar las cuentas');
        } finally {
            setLoading(false);
        }
    };

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

    // Obtener info de cuenta por ID
    const getAccountInfo = (accountId) => {
        return accounts.find(acc => acc.id === parseInt(accountId));
    };

    // Obtener la divisa de la cuenta origen
    const getFromAccountCurrency = () => {
        const account = getAccountInfo(formData.from_account_id);
        return account?.currency_code || 'COP';
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.from_account_id) {
            newErrors.from_account_id = 'Selecciona la cuenta de origen';
        }
        
        if (!formData.to_account_id) {
            newErrors.to_account_id = 'Selecciona la cuenta de destino';
        }
        
        if (formData.from_account_id && formData.to_account_id && 
            formData.from_account_id === formData.to_account_id) {
            newErrors.to_account_id = 'Las cuentas deben ser diferentes';
        }
        
        if (!formData.amount || parseFormattedNumber(formData.amount) === '') {
            newErrors.amount = 'Ingresa un monto válido';
        } else {
            const amount = parseFloat(parseFormattedNumber(formData.amount));
            if (isNaN(amount) || amount <= 0) {
                newErrors.amount = 'El monto debe ser mayor a 0';
            }
            
            // Verificar que hay suficiente saldo
            const fromAccount = getAccountInfo(formData.from_account_id);
            if (fromAccount && amount > fromAccount.balance) {
                newErrors.amount = `Saldo insuficiente. Disponible: ${formatNumberWithThousands(fromAccount.balance, fromAccount.currency_code)}`;
            }
        }
        
        if (!formData.date) {
            newErrors.date = 'Selecciona una fecha';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Por favor, completa todos los campos correctamente');
            return;
        }
        
        setSubmitting(true);
        try {
            const parsedAmount = parseFormattedNumber(formData.amount);
            const amount = parseFloat(parsedAmount);

            await api.post('/transfers/', {
                from_account_id: parseInt(formData.from_account_id),
                to_account_id: parseInt(formData.to_account_id),
                amount: amount,
                description: formData.description || `Transferencia entre cuentas`,
                date: formData.date
            });
            
            const fromAcc = getAccountInfo(formData.from_account_id);
            const toAcc = getAccountInfo(formData.to_account_id);
            toast.success(`Transferencia exitosa: ${fromAcc?.name} → ${toAcc?.name}`);
            
            onSuccess();
            onClose();
            
            // Reset form
            resetForm();
        } catch (err) {
            toast.error(err.message || 'Error al realizar la transferencia');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            from_account_id: accounts.length >= 1 ? accounts[0].id : '',
            to_account_id: accounts.length >= 2 ? accounts[1].id : '',
            amount: '',
            description: '',
            date: new Date().toISOString().split('T')[0]
        });
        setErrors({});
    };

    const swapAccounts = () => {
        setFormData(prev => ({
            ...prev,
            from_account_id: prev.to_account_id,
            to_account_id: prev.from_account_id
        }));
        setErrors({});
    };

    if (!isOpen) return null;

    const fromAccount = getAccountInfo(formData.from_account_id);
    const toAccount = getAccountInfo(formData.to_account_id);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Transferir entre Cuentas">
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                </div>
            ) : accounts.length < 2 ? (
                <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-muted/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="text-muted mb-2">Necesitas al menos 2 cuentas para hacer transferencias</p>
                    <a href="/accounts" className="text-accent-primary hover:underline text-sm">
                        Crear otra cuenta →
                    </a>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Cuentas de origen y destino */}
                    <div className="flex items-center gap-3">
                        {/* Cuenta Origen */}
                        <div className="flex-1">
                            <label className="block text-sm mb-1 text-muted">
                                De <span className="text-accent-danger">*</span>
                            </label>
                            <select 
                                className={`w-full bg-tertiary text-primary ${errors.from_account_id ? 'border border-accent-danger' : ''}`}
                                value={formData.from_account_id}
                                onChange={e => {
                                    setFormData({ ...formData, from_account_id: e.target.value });
                                    setErrors({ ...errors, from_account_id: null, amount: null });
                                }}
                            >
                                <option value="">Seleccionar</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.currency_code})
                                    </option>
                                ))}
                            </select>
                            {fromAccount && (
                                <p className="text-xs text-muted mt-1">
                                    Saldo: <span className={fromAccount.balance < 0 ? 'text-accent-danger' : 'text-accent-success'}>
                                        {getCurrencySymbol(fromAccount.currency_code)}{formatNumberWithThousands(fromAccount.balance, fromAccount.currency_code)}
                                    </span>
                                </p>
                            )}
                            {errors.from_account_id && <p className="text-xs text-accent-danger mt-1">{errors.from_account_id}</p>}
                        </div>

                        {/* Botón de intercambio */}
                        <button
                            type="button"
                            onClick={swapAccounts}
                            className="mt-4 w-10 h-10 rounded-full bg-bg-tertiary hover:bg-accent-primary/20 border border-border-color/30 hover:border-accent-primary/50 flex items-center justify-center transition-all duration-300 hover:rotate-180 group"
                            title="Intercambiar cuentas"
                        >
                            <svg className="w-4 h-4 text-muted group-hover:text-accent-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </button>

                        {/* Cuenta Destino */}
                        <div className="flex-1">
                            <label className="block text-sm mb-1 text-muted">
                                A <span className="text-accent-danger">*</span>
                            </label>
                            <select 
                                className={`w-full bg-tertiary text-primary ${errors.to_account_id ? 'border border-accent-danger' : ''}`}
                                value={formData.to_account_id}
                                onChange={e => {
                                    setFormData({ ...formData, to_account_id: e.target.value });
                                    setErrors({ ...errors, to_account_id: null });
                                }}
                            >
                                <option value="">Seleccionar</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.currency_code})
                                    </option>
                                ))}
                            </select>
                            {toAccount && (
                                <p className="text-xs text-muted mt-1">
                                    Saldo: <span className={toAccount.balance < 0 ? 'text-accent-danger' : 'text-accent-success'}>
                                        {getCurrencySymbol(toAccount.currency_code)}{formatNumberWithThousands(toAccount.balance, toAccount.currency_code)}
                                    </span>
                                </p>
                            )}
                            {errors.to_account_id && <p className="text-xs text-accent-danger mt-1">{errors.to_account_id}</p>}
                        </div>
                    </div>

                    {/* Aviso de divisas diferentes */}
                    {fromAccount && toAccount && fromAccount.currency_code !== toAccount.currency_code && (
                        <div className="p-3 rounded-lg bg-accent-warning/10 border border-accent-warning/30 flex items-start gap-2">
                            <svg className="w-5 h-5 text-accent-warning flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-xs text-accent-warning">
                                Las cuentas tienen divisas diferentes ({fromAccount.currency_code} → {toAccount.currency_code}). 
                                El monto se transferirá sin conversión automática.
                            </p>
                        </div>
                    )}

                    {/* Monto */}
                    <div>
                        <label className="block text-sm mb-1 text-muted">
                            Monto <span className="text-accent-danger">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-muted">
                                {getCurrencySymbol(getFromAccountCurrency())}
                            </span>
                            <input
                                type="text"
                                className={`w-full bg-tertiary text-primary pl-8 font-bold text-lg ${errors.amount ? 'border border-accent-danger' : ''}`}
                                value={formData.amount}
                                onChange={e => {
                                    const value = e.target.value;
                                    const currencyCode = getFromAccountCurrency();
                                    
                                    const cleaned = value.replace(/[^\d.]/g, '');
                                    if (cleaned === '' || cleaned === '.') {
                                        setFormData({ ...formData, amount: '' });
                                        setErrors({ ...errors, amount: null });
                                        return;
                                    }
                                    const formatted = formatNumberWithThousands(cleaned, currencyCode);
                                    setFormData({ ...formData, amount: formatted });
                                    setErrors({ ...errors, amount: null });
                                }}
                                placeholder="0"
                            />
                        </div>
                        {errors.amount && <p className="text-xs text-accent-danger mt-1">{errors.amount}</p>}
                    </div>

                    {/* Fecha y Descripción */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1 text-muted">
                                Fecha <span className="text-accent-danger">*</span>
                            </label>
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
                        <div>
                            <label className="block text-sm mb-1 text-muted">Descripción</label>
                            <input 
                                type="text" 
                                className="w-full bg-tertiary text-primary" 
                                value={formData.description} 
                                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                placeholder="Opcional"
                            />
                        </div>
                    </div>

                    {/* Preview de la transferencia */}
                    {fromAccount && toAccount && formData.amount && (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-accent-primary/10 to-indigo-600/10 border border-accent-primary/20">
                            <p className="text-xs text-muted mb-2">Resumen de la transferencia:</p>
                            <div className="flex items-center justify-between">
                                <div className="text-center">
                                    <p className="text-sm font-medium text-white">{fromAccount.name}</p>
                                    <p className="text-xs text-accent-danger">
                                        -{getCurrencySymbol(fromAccount.currency_code)}{formData.amount}
                                    </p>
                                </div>
                                <svg className="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-white">{toAccount.name}</p>
                                    <p className="text-xs text-accent-success">
                                        +{getCurrencySymbol(toAccount.currency_code)}{formData.amount}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botón de envío */}
                    <button 
                        type="submit" 
                        className="btn bg-gradient-to-r from-accent-primary to-indigo-600 mt-2"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Transfiriendo...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                Realizar Transferencia
                            </>
                        )}
                    </button>
                </form>
            )}
        </Modal>
    );
};

export default TransferModal;

