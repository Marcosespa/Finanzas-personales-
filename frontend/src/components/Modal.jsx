import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative bg-bg-secondary rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-border-color/50 animate-modal-in">
                {/* Glow effect */}
                <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-border-color/50">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-white hover:bg-bg-tertiary transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Body */}
                <div className="p-5 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
            
            {/* Modal Animation Styles */}
            <style>{`
                @keyframes modal-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .animate-modal-in {
                    animation: modal-in 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Modal;
