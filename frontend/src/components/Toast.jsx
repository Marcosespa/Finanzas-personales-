import React, { useEffect } from 'react';

const Toast = ({ type = 'info', message, onClose, duration = 3000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        warning: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    };

    const colors = {
        success: 'bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-500/30 text-green-100',
        error: 'bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/30 text-red-100',
        warning: 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-100',
        info: 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-100'
    };

    const iconColors = {
        success: 'text-green-400',
        error: 'text-red-400',
        warning: 'text-amber-400',
        info: 'text-blue-400'
    };

    return (
        <div className={`toast-notification ${colors[type]} border backdrop-blur-xl rounded-lg shadow-xl p-4 flex items-start gap-3 min-w-[300px] max-w-md`}>
            <div className={`flex-shrink-0 ${iconColors[type]}`}>
                {icons[type]}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{message}</p>
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default Toast;
