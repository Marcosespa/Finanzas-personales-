import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { formatCurrency, formatNumberWithThousands, parseFormattedNumber } from '../utils/currency';
import { useToast } from '../context/ToastContext';

const Accounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    const [formData, setFormData] = useState({
        name: '',
        type: 'bank', // cash, bank, credit, investment
        institution: '',
        currency_code: 'COP',
        balance: 0,
        // Credit Card specific
        credit_limit: 0,
        billing_day: 1,
        payment_due_day: 15,
        interest_rate: 0
    });

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/accounts/');
            setAccounts(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const [editingAccount, setEditingAccount] = useState(null);

    const handleEdit = (account) => {
        setEditingAccount(account);
        setFormData({
            name: account.name,
            type: account.type, // Note: type usually isn't editable to prevent data corruption, but we'll show it
            institution: account.institution || '',
            currency_code: account.currency_code,
            balance: formatNumberWithThousands(account.balance || 0, account.currency_code),
            // Pre-fill credit data if applicable
            credit_limit: formatNumberWithThousands(account.credit_card?.credit_limit || 0, account.currency_code),
            billing_day: account.credit_card?.billing_day || 1,
            payment_due_day: account.credit_card?.payment_due_day || 15,
            interest_rate: account.credit_card?.interest_rate || 0
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAccount(null);
        // Reset form to defaults
        setFormData({
            name: '', type: 'bank', institution: '', currency_code: 'COP', balance: '',
            credit_limit: '', billing_day: 1, payment_due_day: 15, interest_rate: 0
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Construct payload
        const payload = {
            name: formData.name,
            institution: formData.institution,
            // Balance, Type, Currency usually not editable via UPDATE for integrity, 
            // but we'll include them if it's creation. Backend ignores read-only fields on PUT.
        };

        if (formData.type === 'credit') {
            payload.credit_card = {
                credit_limit: parseFloat(parseFormattedNumber(formData.credit_limit)),
                billing_day: parseInt(formData.billing_day),
                payment_due_day: parseInt(formData.payment_due_day),
                interest_rate: parseFloat(formData.interest_rate)
            };
        }

        // For creation only
        if (!editingAccount) {
            payload.type = formData.type;
            payload.currency_code = formData.currency_code;
            payload.balance = parseFloat(parseFormattedNumber(formData.balance));
        }

        setSubmitting(true);
        try {
            if (editingAccount) {
                await api.put(`/accounts/${editingAccount.id}`, payload);
                toast.success('Cuenta actualizada exitosamente');
            } else {
                await api.post('/accounts/', payload);
                toast.success('Cuenta creada exitosamente');
            }
            handleCloseModal();
            fetchAccounts(); // Refresh list
        } catch (err) {
            toast.error(err.message || 'Error al guardar la cuenta');
        } finally {
            setSubmitting(false);
        }
    };

    // Grouping
    const grouped = {
        'Net Worth': accounts.filter(a => ['bank', 'cash', 'investment'].includes(a.type)),
        'Debt/Credit': accounts.filter(a => a.type === 'credit')
    };

    const getIcon = (type) => {
        const classes = "w-3 h-1 text-accent-primary"; // Smaller, professional size
        switch (type) {
            case 'bank': return (
                <div className="p-2 bg-bg-tertiary rounded-lg border border-border-color flex items-center justify-center">
                    <svg className={classes} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                </div>
            );
            case 'cash': return (
                <div className="p-2 bg-bg-tertiary rounded-lg border border-border-color flex items-center justify-center">
                    <svg className={classes} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
            );
            case 'credit': return (
                <div className="p-2 bg-bg-tertiary rounded-lg border border-border-color flex items-center justify-center">
                    <svg className={classes} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
            );
            case 'investment': return (
                <div className="p-2 bg-bg-tertiary rounded-lg border border-border-color flex items-center justify-center">
                    <svg className={classes} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Accounts</h1>
                <button onClick={() => setIsModalOpen(true)} className="btn">Add Account</button>
            </div>

            {/* Sections */}
            <div className="space-y-8">
                {Object.entries(grouped).map(([groupName, groupAccounts]) => (
                    <div key={groupName}>
                        <h2 className="text-xl font-semibold mb-4 text-muted border-b border-tertiary pb-2">{groupName}</h2>
                        {groupAccounts.length === 0 ? <p className="text-muted">No accounts.</p> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupAccounts.map(acc => (
                                    <div key={acc.id} onClick={() => handleEdit(acc)} className="card hover:border-accent-primary transition-colors cursor-pointer group relative flex flex-col justify-between">
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg className="w-5 h-5 text-muted hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </div>

                                        <div className="flex items-center gap-4 mb-4">
                                            {getIcon(acc.type)}
                                            <div>
                                                <h3 className="font-bold text-lg leading-tight group-hover:text-accent-primary transition-colors">{acc.name}</h3>
                                                <p className="text-xs text-muted uppercase tracking-wider">{acc.institution || acc.type}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-muted mb-1">Current Balance</p>
                                                <p className={`text-2xl font-bold tracking-tight ${acc.balance < 0 ? 'text-danger' : 'text-primary'}`}>
                                                    {formatCurrency(acc.balance)}
                                                </p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-md bg-bg-tertiary border border-border-color text-muted font-mono`}>
                                                {acc.currency_code}
                                            </span>
                                        </div>

                                        {acc.type === 'credit' && acc.credit_card && (
                                            <div className="mt-4 pt-3 border-t border-glass-border flex justify-between text-xs text-muted">
                                                <span>Limit: {formatCurrency(acc.credit_card.credit_limit, acc.currency_code)}</span>
                                                <span className={acc.credit_card.credit_limit < Math.abs(acc.balance) ? "text-danger" : "text-success"}>
                                                    {Math.round((Math.abs(acc.balance) / acc.credit_card.credit_limit) * 100)}% Util
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingAccount ? "Edit Account" : "Add New Account"}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm mb-1 text-muted">Account Name</label>
                        <input className="w-full bg-tertiary text-primary" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1 text-muted">Type</label>
                            <select disabled={!!editingAccount} className="w-full bg-tertiary text-primary disabled:opacity-50" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="cash">Cash</option>
                                <option value="bank">Bank</option>
                                <option value="credit">Credit Card</option>
                                <option value="investment">Investment</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-muted">Institution</label>
                            <input className="w-full bg-tertiary text-primary" value={formData.institution} onChange={e => setFormData({ ...formData, institution: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-muted">Divisa / Currency</label>
                        {!editingAccount ? (
                            <select 
                                className="w-full bg-tertiary text-primary" 
                                value={formData.currency_code} 
                                onChange={e => {
                                    const newCurrency = e.target.value;
                                    // Reformatear el balance si existe cuando se cambia la divisa
                                    if (formData.balance) {
                                        const parsed = parseFormattedNumber(formData.balance);
                                        if (parsed) {
                                            const reformatted = formatNumberWithThousands(parsed, newCurrency);
                                            setFormData({ ...formData, currency_code: newCurrency, balance: reformatted });
                                        } else {
                                            setFormData({ ...formData, currency_code: newCurrency });
                                        }
                                    } else {
                                        setFormData({ ...formData, currency_code: newCurrency });
                                    }
                                }}
                            >
                                <option value="COP">🇨🇴 Peso Colombiano (COP)</option>
                                <option value="CZK">🇨🇿 Corona Checa (CZK)</option>
                                <option value="EUR">🇪🇺 Euro (EUR)</option>
                                <option value="USD">🇺🇸 Dólar (USD)</option>
                            </select>
                        ) : (
                            <input 
                                type="text" 
                                className="w-full bg-tertiary text-primary disabled:opacity-50" 
                                value={`${formData.currency_code === 'COP' ? '🇨🇴' : formData.currency_code === 'CZK' ? '🇨🇿' : formData.currency_code === 'EUR' ? '🇪🇺' : '🇺🇸'} ${formData.currency_code}`}
                                disabled
                            />
                        )}
                    </div>

                    {!editingAccount && (
                        <div>
                            <label className="block text-sm mb-1 text-muted">Initial Balance</label>
                            <input 
                                type="text" 
                                className="w-full bg-tertiary text-primary" 
                                value={formData.balance} 
                                onChange={e => {
                                    const value = e.target.value;
                                    // Permitir solo números y punto decimal
                                    const cleaned = value.replace(/[^\d.]/g, '');
                                    if (cleaned === '' || cleaned === '.') {
                                        setFormData({ ...formData, balance: '' });
                                        return;
                                    }
                                    // Formatear con puntos para miles
                                    const formatted = formatNumberWithThousands(cleaned, formData.currency_code);
                                    setFormData({ ...formData, balance: formatted });
                                }} 
                            />
                        </div>
                    )}

                    {formData.type === 'credit' && (
                        <div className="border-t border-tertiary pt-4 mt-2 space-y-4">
                            <h4 className="font-semibold text-sm text-accent-primary">Credit Details</h4>
                            <div>
                                <label className="block text-sm mb-1 text-muted">Credit Limit</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-tertiary text-primary" 
                                    value={formData.credit_limit} 
                                    onChange={e => {
                                        const value = e.target.value;
                                        // Permitir solo números y punto decimal
                                        const cleaned = value.replace(/[^\d.]/g, '');
                                        if (cleaned === '' || cleaned === '.') {
                                            setFormData({ ...formData, credit_limit: '' });
                                            return;
                                        }
                                        // Formatear con puntos para miles
                                        const formatted = formatNumberWithThousands(cleaned, formData.currency_code);
                                        setFormData({ ...formData, credit_limit: formatted });
                                    }} 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm mb-1 text-muted">Billing Day</label>
                                    <input type="number" max="31" min="1" className="w-full bg-tertiary text-primary" value={formData.billing_day} onChange={e => setFormData({ ...formData, billing_day: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1 text-muted">Due Day</label>
                                    <input type="number" max="31" min="1" className="w-full bg-tertiary text-primary" value={formData.payment_due_day} onChange={e => setFormData({ ...formData, payment_due_day: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn mt-4">{editingAccount ? "Save Changes" : "Create Account"}</button>
                </form>
            </Modal>
        </div>
    );
};

export default Accounts;
