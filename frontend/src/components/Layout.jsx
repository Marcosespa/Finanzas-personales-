import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinkClass = ({ isActive }) => `
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
        ${isActive
            ? 'bg-accent-primary text-white shadow-lg shadow-indigo-500/20 font-medium'
            : 'text-muted hover:bg-bg-tertiary hover:text-white'
        }
    `;

    return (
        <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden font-sans">
            {/* Sidebar - Desktop */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-bg-secondary border-r border-border-color 
                transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full p-4">
                    {/* Logo Area */}
                    <div className="px-4 py-6 mb-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center">
                            <span className="font-bold text-white">M</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Finanzas</h1>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4">
                        {/* Navigation */}
                        <nav className="space-y-2">
                            <NavLink to="/dashboard" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20 font-semibold' : 'text-muted hover:bg-bg-tertiary hover:text-primary'}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                <span className="font-medium">Inicio</span>
                            </NavLink>
                            <NavLink to="/accounts" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20 font-semibold' : 'text-muted hover:bg-bg-tertiary hover:text-primary'}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                <span className="font-medium">Cuentas</span>
                            </NavLink>
                            <NavLink to="/investments" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20 font-semibold' : 'text-muted hover:bg-bg-tertiary hover:text-primary'}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                <span className="font-medium">Inversiones</span>
                            </NavLink>

                            {/* Future modules */}
                            <div className="pt-4 mt-2 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                                Herramientas
                            </div>
                            <NavLink to="/reports" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20 font-semibold' : 'text-muted hover:bg-bg-tertiary hover:text-primary'}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                <span className="font-medium">Reportes</span>
                            </NavLink>

                            <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20 font-semibold' : 'text-muted hover:bg-bg-tertiary hover:text-primary'}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span className="font-medium">Configuración</span>
                            </NavLink>
                        </nav>

                        {/* Separate Logout Button in Nav Area */}
                        <div className="pt-4 mt-2 border-t border-border-color">
                            <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-muted hover:bg-accent-danger/10 hover:text-accent-danger">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                <span className="font-medium">Cerrar Sesión</span>
                            </button>
                        </div>
                    </div>

                    {/* User Profile */}
                    <div className="mt-auto pt-6 border-t border-border-color">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-tertiary">
                            <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-white">{user?.username}</p>
                                <p className="text-xs text-muted truncate">User</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-bg-secondary/80 backdrop-blur-md border-b border-border-color flex items-center justify-between px-4">
                <span className="font-bold text-lg">Finanzas</span>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-text-primary">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full pt-16 md:pt-0">
                <div className="min-h-full p-4 md:p-10 w-full max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
            )}
        </div>
    );
};

export default Layout;
