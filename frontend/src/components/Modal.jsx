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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative bg-bg-secondary w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden border-t sm:border border-border-color/50 animate-modal-in max-h-[90vh] sm:max-h-[85vh] flex flex-col">
                {/* Glow effect */}
                <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
                
                {/* Mobile handle indicator */}
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-border-color rounded-full" />
                </div>
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-border-color/50 flex-shrink-0">
                    <h3 className="text-base sm:text-lg font-bold text-white">{title}</h3>
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
                <div className="p-4 sm:p-5 overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
            
            {/* Modal Animation Styles */}
            <style>{`
                @keyframes modal-in {
                    from {
                        opacity: 0;
                        transform: translateY(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @media (min-width: 640px) {
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
                }
                .animate-modal-in {
                    animation: modal-in 0.25s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Modal;
