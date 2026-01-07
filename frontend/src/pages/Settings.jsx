import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { formatNumberWithThousands, parseFormattedNumber } from '../utils/currency';

const Settings = () => {
    const [categories, setCategories] = useState([]);
    const [savingsGoals, setSavingsGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [catForm, setCatForm] = useState({ name: '', type: 'expense' });
    const [editingCatId, setEditingCatId] = useState(null);
    const [editingGoal, setEditingGoal] = useState(null);
    const toast = useToast();
    const navigate = useNavigate();

    // Profile state
    const [profile, setProfile] = useState(null);
    const [profileForm, setProfileForm] = useState({ username: '', email: '' });
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);

    // Password state
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [passwordSaving, setPasswordSaving] = useState(false);

    const [goalForm, setGoalForm] = useState({
        name: '',
        target_amount: '',
        current_amount: '',
        target_date: '',
        icon: '🎯',
        color: 'amber'
    });

    const iconOptions = ['🎯', '✈️', '🏠', '🚗', '💰', '🎓', '💼', '🏝️', '🎁', '📱', '💻', '🏥'];
    const colorOptions = [
        { name: 'amber', class: 'from-amber-500 to-orange-600' },
        { name: 'emerald', class: 'from-emerald-500 to-teal-600' },
        { name: 'blue', class: 'from-blue-500 to-indigo-600' },
        { name: 'purple', class: 'from-purple-500 to-pink-600' },
        { name: 'rose', class: 'from-rose-500 to-red-600' }
    ];

    const loadData = async () => {
        setLoading(true);
        try {
            const [categoriesRes, goalsRes, profileRes] = await Promise.all([
                api.get('/categories/'),
                api.get('/savings-goals/'),
                api.get('/auth/me')
            ]);
            setCategories(categoriesRes);
            setSavingsGoals(goalsRes);
            setProfile(profileRes);
            setProfileForm({ username: profileRes.username, email: profileRes.email });
        } catch (err) {
            console.error(err);
            toast.error('Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Category handlers
    const handleCatSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCatId) {
                toast.info("Actualización de categorías próximamente");
            } else {
                await api.post('/categories/', catForm);
                toast.success('Categoría creada');
            }
            setIsCatModalOpen(false);
            setCatForm({ name: '', type: 'expense' });
            loadData();
        } catch (err) {
            toast.error(err.message || "Error al crear categoría");
        }
    };

    const handleDeleteCat = async (id) => {
        if (!confirm("¿Eliminar esta categoría? Se desvinculará de sus transacciones.")) return;
        try {
            await api.delete(`/categories/${id}`);
            toast.success('Categoría eliminada');
            loadData();
        } catch (err) {
            toast.error(err.message || "Error al eliminar");
        }
    };

    // Savings Goal handlers
    const openGoalModal = (goal = null) => {
        if (goal) {
            setEditingGoal(goal);
            setGoalForm({
                name: goal.name,
                target_amount: formatNumberWithThousands(goal.target_amount, 'COP'),
                current_amount: formatNumberWithThousands(goal.current_amount, 'COP'),
                target_date: goal.target_date ? goal.target_date.split('T')[0] : '',
                icon: goal.icon,
                color: goal.color
            });
        } else {
            setEditingGoal(null);
            setGoalForm({
                name: '',
                target_amount: '',
                current_amount: '',
                target_date: '',
                icon: '🎯',
                color: 'amber'
            });
        }
        setIsGoalModalOpen(true);
    };

    const handleGoalSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: goalForm.name,
                target_amount: parseFloat(parseFormattedNumber(goalForm.target_amount)) || 0,
                current_amount: parseFloat(parseFormattedNumber(goalForm.current_amount)) || 0,
                target_date: goalForm.target_date || null,
                icon: goalForm.icon,
                color: goalForm.color
            };

            if (editingGoal) {
                await api.put(`/savings-goals/${editingGoal.id}`, payload);
                toast.success('Meta actualizada');
            } else {
                await api.post('/savings-goals/', payload);
                toast.success('Meta creada');
            }
            setIsGoalModalOpen(false);
            loadData();
        } catch (err) {
            toast.error(err.message || "Error al guardar meta");
        }
    };

    const handleDeleteGoal = async (id) => {
        if (!confirm("¿Eliminar esta meta de ahorro?")) return;
        try {
            await api.delete(`/savings-goals/${id}`);
            toast.success('Meta eliminada');
            loadData();
        } catch (err) {
            toast.error(err.message || "Error al eliminar");
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        maximumFractionDigits: 0 
    }).format(val);

    const getColorGradient = (colorName) => {
        const color = colorOptions.find(c => c.name === colorName);
        return color ? color.class : colorOptions[0].class;
    };

    // Profile handlers
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileSaving(true);
        try {
            const res = await api.put('/auth/profile', profileForm);
            setProfile({ ...profile, ...res.user });
            setIsEditingProfile(false);
            // Update localStorage
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...storedUser, ...res.user }));
            toast.success('Perfil actualizado');
        } catch (err) {
            toast.error(err.message || 'Error al actualizar perfil');
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast.error('Las contraseñas no coinciden');
            return;
        }
        
        if (passwordForm.new_password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        setPasswordSaving(true);
        try {
            await api.post('/auth/change-password', {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password
            });
            toast.success('Contraseña actualizada');
            setIsPasswordModalOpen(false);
            setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            toast.error(err.message || 'Error al cambiar contraseña');
        } finally {
            setPasswordSaving(false);
        }
    };

    const handleLogout = () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-primary">
                    Configuración
                </h1>
                <p className="text-muted mt-1 text-sm">Gestiona tus metas de ahorro, categorías y preferencias.</p>
            </div>

            {/* Savings Goals Section */}
            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <span className="text-xl">🎯</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Metas de Ahorro</h3>
                            <p className="text-xs text-muted">Define tus objetivos financieros</p>
                        </div>
                    </div>
                    <button
                        onClick={() => openGoalModal()}
                        className="btn text-sm flex items-center gap-2"
                    >
                        <span>+</span> Nueva Meta
                    </button>
                </div>

                {savingsGoals.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-border-color/30 rounded-xl">
                        <span className="text-4xl mb-4 block">🎯</span>
                        <p className="text-muted mb-2">No tienes metas de ahorro</p>
                        <p className="text-xs text-muted mb-4">Crea una meta para visualizarla en el dashboard</p>
                        <button
                            onClick={() => openGoalModal()}
                            className="btn btn-secondary text-sm"
                        >
                            Crear mi primera meta
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {savingsGoals.map(goal => (
                            <div 
                                key={goal.id} 
                                className="p-4 rounded-xl bg-bg-tertiary/30 border border-border-color/30 hover:border-accent-primary/30 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColorGradient(goal.color)} flex items-center justify-center`}>
                                            <span className="text-2xl">{goal.icon}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{goal.name}</h4>
                                            <p className="text-xs text-muted">
                                                {goal.target_date && `Fecha: ${new Date(goal.target_date).toLocaleDateString('es-CO')}`}
                                                {goal.days_remaining !== null && goal.days_remaining > 0 && (
                                                    <span className="ml-2 text-accent-warning">({goal.days_remaining} días)</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => openGoalModal(goal)}
                                            className="p-2 text-muted hover:text-accent-primary rounded hover:bg-accent-primary/10"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteGoal(goal.id)}
                                            className="p-2 text-muted hover:text-accent-danger rounded hover:bg-accent-danger/10"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted">Progreso</span>
                                        <span className="font-medium text-white">{goal.progress_percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full bg-gradient-to-r ${getColorGradient(goal.color)} rounded-full transition-all duration-500`}
                                            style={{ width: `${goal.progress_percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted">
                                        <span>{formatCurrency(goal.current_amount)}</span>
                                        <span>{formatCurrency(goal.target_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Categorías Section */}
            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Categorías</h3>
                            <p className="text-xs text-muted">Organiza tus transacciones</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setEditingCatId(null); setCatForm({ name: '', type: 'expense' }); setIsCatModalOpen(true); }}
                        className="btn btn-secondary text-sm flex items-center gap-2"
                    >
                        <span>+</span> Añadir
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Income Categories */}
                    <div>
                        <p className="text-xs font-bold text-accent-success uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-accent-success"></span>
                            Ingresos
                        </p>
                        <div className="space-y-2">
                            {categories.filter(c => c.type === 'income').length === 0 ? (
                                <p className="text-xs text-muted italic py-4 text-center">Sin categorías de ingreso</p>
                            ) : (
                                categories.filter(c => c.type === 'income').map(cat => (
                                    <div key={cat.id} className="flex justify-between items-center p-3 bg-bg-tertiary/20 rounded-lg border border-border-color/30 group hover:border-accent-success/30 transition-colors">
                                    <span className="text-sm text-white">{cat.name}</span>
                                        <button onClick={() => handleDeleteCat(cat.id)} className="text-muted hover:text-accent-danger opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Expense Categories */}
                    <div>
                        <p className="text-xs font-bold text-accent-danger uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-accent-danger"></span>
                            Gastos
                        </p>
                        <div className="space-y-2">
                            {categories.filter(c => c.type === 'expense').length === 0 ? (
                                <p className="text-xs text-muted italic py-4 text-center">Sin categorías de gasto</p>
                            ) : (
                                categories.filter(c => c.type === 'expense').map(cat => (
                                    <div key={cat.id} className="flex justify-between items-center p-3 bg-bg-tertiary/20 rounded-lg border border-border-color/30 group hover:border-accent-danger/30 transition-colors">
                                    <span className="text-sm text-white">{cat.name}</span>
                                        <button onClick={() => handleDeleteCat(cat.id)} className="text-muted hover:text-accent-danger opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile & Security Section */}
            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Perfil y Seguridad</h3>
                            <p className="text-xs text-muted">Gestiona tu cuenta y seguridad</p>
                        </div>
                    </div>
                </div>

                {profile && (
                    <div className="space-y-6">
                        {/* Profile Info */}
                        <div className="p-4 rounded-xl bg-bg-tertiary/30 border border-border-color/30">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-primary to-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                                        {profile.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        {isEditingProfile ? (
                                            <form onSubmit={handleProfileSubmit} className="space-y-3">
                                                <div>
                                                    <label className="block text-xs text-muted mb-1">Usuario</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-bg-tertiary text-white text-sm rounded-lg px-3 py-2 border border-border-color/30 focus:border-accent-primary/50 focus:outline-none"
                                                        value={profileForm.username}
                                                        onChange={e => setProfileForm({ ...profileForm, username: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-muted mb-1">Email</label>
                                                    <input
                                                        type="email"
                                                        className="w-full bg-bg-tertiary text-white text-sm rounded-lg px-3 py-2 border border-border-color/30 focus:border-accent-primary/50 focus:outline-none"
                                                        value={profileForm.email}
                                                        onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="submit"
                                                        disabled={profileSaving}
                                                        className="btn text-xs py-1.5 px-3"
                                                    >
                                                        {profileSaving ? 'Guardando...' : 'Guardar'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsEditingProfile(false);
                                                            setProfileForm({ username: profile.username, email: profile.email });
                                                        }}
                                                        className="btn btn-secondary text-xs py-1.5 px-3"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <>
                                                <h4 className="font-bold text-white text-lg">{profile.username}</h4>
                                                <p className="text-sm text-muted">{profile.email}</p>
                                                <p className="text-xs text-muted mt-1">
                                                    Miembro desde {profile.created_at ? new Date(profile.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' }) : 'N/A'}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {!isEditingProfile && (
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="text-muted hover:text-accent-primary transition-colors p-2 rounded-lg hover:bg-accent-primary/10"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Security Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="p-4 rounded-xl bg-bg-tertiary/20 border border-border-color/30 hover:border-accent-primary/30 transition-all group text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-accent-warning/20 flex items-center justify-center group-hover:bg-accent-warning/30 transition-colors">
                                        <svg className="w-5 h-5 text-accent-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white text-sm">Cambiar Contraseña</h4>
                                        <p className="text-xs text-muted">Actualiza tu contraseña de acceso</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="p-4 rounded-xl bg-bg-tertiary/20 border border-border-color/30 hover:border-accent-danger/30 transition-all group text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-accent-danger/20 flex items-center justify-center group-hover:bg-accent-danger/30 transition-colors">
                                        <svg className="w-5 h-5 text-accent-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white text-sm">Cerrar Sesión</h4>
                                        <p className="text-xs text-muted">Salir de tu cuenta</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for Categories */}
            <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title="Nueva Categoría">
                <form onSubmit={handleCatSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm mb-1 text-muted">Nombre</label>
                        <input
                            type="text" className="w-full bg-tertiary text-primary"
                            value={catForm.name}
                            onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                            placeholder="Ej: Transporte, Entretenimiento..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-muted">Tipo</label>
                        <select
                            className="w-full bg-tertiary text-primary"
                            value={catForm.type}
                            onChange={e => setCatForm({ ...catForm, type: e.target.value })}
                        >
                            <option value="expense">Gasto</option>
                            <option value="income">Ingreso</option>
                        </select>
                    </div>
                    <button type="submit" className="btn mt-4">Crear Categoría</button>
                </form>
            </Modal>

            {/* Modal for Savings Goals */}
            <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={editingGoal ? "Editar Meta" : "Nueva Meta de Ahorro"}>
                <form onSubmit={handleGoalSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm mb-1 text-muted">Nombre de la meta</label>
                        <input
                            type="text" 
                            className="w-full bg-tertiary text-primary"
                            value={goalForm.name}
                            onChange={e => setGoalForm({ ...goalForm, name: e.target.value })}
                            placeholder="Ej: Viaje a Europa, Fondo de emergencia..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1 text-muted">Monto objetivo</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-muted">$</span>
                                <input
                                    type="text"
                                    className="w-full bg-tertiary text-primary pl-6"
                                    value={goalForm.target_amount}
                                    onChange={e => {
                                        const cleaned = e.target.value.replace(/[^\d.]/g, '');
                                        if (cleaned === '') {
                                            setGoalForm({ ...goalForm, target_amount: '' });
                                            return;
                                        }
                                        const formatted = formatNumberWithThousands(cleaned, 'COP');
                                        setGoalForm({ ...goalForm, target_amount: formatted });
                                    }}
                                    placeholder="15.000.000"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-muted">Ahorrado actualmente</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-muted">$</span>
                                <input
                                    type="text"
                                    className="w-full bg-tertiary text-primary pl-6"
                                    value={goalForm.current_amount}
                                    onChange={e => {
                                        const cleaned = e.target.value.replace(/[^\d.]/g, '');
                                        if (cleaned === '') {
                                            setGoalForm({ ...goalForm, current_amount: '' });
                                            return;
                                        }
                                        const formatted = formatNumberWithThousands(cleaned, 'COP');
                                        setGoalForm({ ...goalForm, current_amount: formatted });
                                    }}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-muted">Fecha objetivo (opcional)</label>
                        <input
                            type="date"
                            className="w-full bg-tertiary text-primary"
                            value={goalForm.target_date}
                            onChange={e => setGoalForm({ ...goalForm, target_date: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2 text-muted">Ícono</label>
                        <div className="flex flex-wrap gap-2">
                            {iconOptions.map(icon => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setGoalForm({ ...goalForm, icon })}
                                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                                        goalForm.icon === icon 
                                            ? 'bg-accent-primary ring-2 ring-accent-primary/50' 
                                            : 'bg-bg-tertiary hover:bg-bg-tertiary/70'
                                    }`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm mb-2 text-muted">Color del tema</label>
                        <div className="flex gap-2">
                            {colorOptions.map(color => (
                                <button
                                    key={color.name}
                                    type="button"
                                    onClick={() => setGoalForm({ ...goalForm, color: color.name })}
                                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color.class} transition-all ${
                                        goalForm.color === color.name 
                                            ? 'ring-2 ring-white/50 scale-110' 
                                            : 'opacity-60 hover:opacity-100'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn mt-4">
                        {editingGoal ? 'Actualizar Meta' : 'Crear Meta'}
                    </button>
                </form>
            </Modal>

            {/* Modal for Password Change */}
            <Modal isOpen={isPasswordModalOpen} onClose={() => {
                setIsPasswordModalOpen(false);
                setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
            }} title="Cambiar Contraseña">
                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm mb-1 text-muted">Contraseña actual</label>
                        <input
                            type="password"
                            className="w-full bg-tertiary text-primary"
                            value={passwordForm.current_password}
                            onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-muted">Nueva contraseña</label>
                        <input
                            type="password"
                            className="w-full bg-tertiary text-primary"
                            value={passwordForm.new_password}
                            onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                        <p className="text-xs text-muted mt-1">Mínimo 6 caracteres</p>
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-muted">Confirmar nueva contraseña</label>
                        <input
                            type="password"
                            className="w-full bg-tertiary text-primary"
                            value={passwordForm.confirm_password}
                            onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                            placeholder="••••••••"
                            required
                        />
                        {passwordForm.new_password && passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
                            <p className="text-xs text-accent-danger mt-1">Las contraseñas no coinciden</p>
                        )}
                    </div>
                    <button 
                        type="submit" 
                        className="btn mt-4"
                        disabled={passwordSaving || passwordForm.new_password !== passwordForm.confirm_password}
                    >
                        {passwordSaving ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Settings;
