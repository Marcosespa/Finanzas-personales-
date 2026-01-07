import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Investments from './pages/Investments'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Budgets from './pages/Budgets'
import AccountAudit from './pages/AccountAudit'
import NetWorthDetail from './pages/NetWorthDetail'
import RecurringTransactions from './pages/RecurringTransactions'

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />

                        <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<Layout />}>
                                <Route index element={<Navigate to="/dashboard" replace />} />
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="accounts" element={<Accounts />} />
                                <Route path="audit" element={<AccountAudit />} />
                                <Route path="budgets" element={<Budgets />} />
                                <Route path="investments" element={<Investments />} />
                                <Route path="reports" element={<Reports />} />
                                <Route path="settings" element={<Settings />} />
                                <Route path="net-worth" element={<NetWorthDetail />} />
                                <Route path="recurring" element={<RecurringTransactions />} />
                            </Route>
                        </Route>
                    </Routes>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App
