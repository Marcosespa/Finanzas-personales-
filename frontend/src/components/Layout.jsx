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
            ? 'bg-gradient-to-r from-accent-primary to-indigo-600 text-white shadow-lg shadow-accent-primary/30 font-semibold'
            : 'text-muted hover:bg-bg-tertiary hover:text-white'
        }
    `;

    return (
        <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-bg-secondary border-r border-border-color 
                transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 
                flex flex-col
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo Area */}
                <div className="px-6 py-6 flex items-center gap-3 border-b border-border-color/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-accent-primary/30">
                        <span className="font-bold text-white text-lg">₿</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Finanzas</h1>
                        <p className="text-[10px] text-muted uppercase tracking-widest">Prague Edition</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                    <NavLink to="/dashboard" className={navLinkClass}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span>Dashboard</span>
                    </NavLink>
                    
                    <NavLink to="/accounts" className={navLinkClass}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span>Cuentas</span>
                    </NavLink>
                    
                    <NavLink to="/audit" className={navLinkClass}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <span>Auditoría</span>
                    </NavLink>
                    
                    <NavLink to="/budgets" className={navLinkClass}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Presupuestos</span>
                    </NavLink>
                    
                    <NavLink to="/investments" className={navLinkClass}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span>Inversiones</span>
                    </NavLink>
                    
                    <NavLink to="/reports" className={navLinkClass}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Reportes</span>
                    </NavLink>
                    
                    <NavLink to="/settings" className={navLinkClass}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Ajustes</span>
                    </NavLink>

                    {/* Divider */}
                    <div className="pt-4 mt-4 border-t border-border-color/50">
                        <button 
                            onClick={handleLogout} 
                            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-muted hover:bg-accent-danger/10 hover:text-accent-danger"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-medium">Cerrar Sesión</span>
                        </button>
                    </div>
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-border-color/50">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-bg-tertiary to-bg-tertiary/50">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary/30 to-indigo-600/30 flex items-center justify-center text-accent-primary font-bold ring-2 ring-accent-primary/20">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-white">{user?.username}</p>
                            <p className="text-[10px] text-accent-primary truncate">Estudiante • Praga 2026</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-bg-secondary/90 backdrop-blur-xl border-b border-border-color flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-indigo-600 flex items-center justify-center">
                        <span className="font-bold text-white text-sm">₿</span>
                    </div>
                    <span className="font-bold text-lg">Finanzas</span>
                </div>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
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
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" 
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default Layout;
