import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';

const Settings = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [catForm, setCatForm] = useState({ name: '', type: 'expense' });
    const [editingCatId, setEditingCatId] = useState(null);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('/categories/');
            setCategories(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleCatSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCatId) {
                // Backend doesn't have PUT /categories yet, but we'll implement or just mock for now
                // Actually let's just implement the POST and list for now
                alert("Actualización de categorías próximamente");
            } else {
                await api.post('/categories/', catForm);
            }
            setIsCatModalOpen(false);
            setCatForm({ name: '', type: 'expense' });
            loadCategories();
        } catch (err) {
            alert("Error: " + (err.msg || err));
        }
    };

    const handleDeleteCat = async (id) => {
        if (!confirm("¿Eliminar esta categoría? Se desvinculará de sus transacciones.")) return;
        try {
            // Placeholder: Assume DELETE /categories/<id> exists
            await api.delete(`/categories/${id}`);
            loadCategories();
        } catch (err) {
            alert("Error al eliminar: " + (err.msg || err));
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Cargando...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-primary">
                    Configuración
                </h1>
                <p className="text-muted mt-1 text-sm">Gestiona tus preferencias y categorías.</p>
            </div>

            {/* Categorías Section */}
            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Categorías Personalizadas</h3>
                    <button
                        onClick={() => { setEditingCatId(null); setCatForm({ name: '', type: 'expense' }); setIsCatModalOpen(true); }}
                        className="btn btn-secondary text-xs flex items-center gap-2"
                    >
                        <span>+</span> Añadir Categoría
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Income Categories */}
                    <div>
                        <p className="text-xs font-bold text-accent-success uppercase tracking-widest mb-4">Ingresos</p>
                        <div className="space-y-2">
                            {categories.filter(c => c.type === 'income').map(cat => (
                                <div key={cat.id} className="flex justify-between items-center p-3 bg-bg-tertiary/20 rounded-lg border border-border-color/30 group">
                                    <span className="text-sm text-white">{cat.name}</span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleDeleteCat(cat.id)} className="text-muted hover:text-accent-danger">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Expense Categories */}
                    <div>
                        <p className="text-xs font-bold text-accent-danger uppercase tracking-widest mb-4">Gastos</p>
                        <div className="space-y-2">
                            {categories.filter(c => c.type === 'expense').map(cat => (
                                <div key={cat.id} className="flex justify-between items-center p-3 bg-bg-tertiary/20 rounded-lg border border-border-color/30 group">
                                    <span className="text-sm text-white">{cat.name}</span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleDeleteCat(cat.id)} className="text-muted hover:text-accent-danger">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Section (UI Placeholder) */}
            <div className="card opacity-60 pointer-events-none">
                <h3 className="font-bold text-lg mb-4">Perfil y Seguridad</h3>
                <p className="text-sm text-muted italic">Módulo bajo desarrollo...</p>
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
        </div>
    );
};

export default Settings;
