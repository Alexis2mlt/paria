import React from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';

interface LoginAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginAlertModal: React.FC<LoginAlertModalProps> = ({ isOpen, onClose }) => {
    const { openAuthModal } = useAuth();

    if (!isOpen) return null;

    const handleLoginClick = () => {
        onClose();
        openAuthModal();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-[#0B1120] border border-slate-800 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
                
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-6 text-paria">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>

                <h3 className="text-xl font-black font-spartan text-white mb-2">Connexion requise</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    Vous devez être connecté pour utiliser cette fonctionnalité d'intelligence artificielle.
                </p>

                <div className="flex flex-col w-full gap-3">
                    <button
                        onClick={handleLoginClick}
                        className="w-full py-3.5 rounded-xl bg-paria text-slate-950 font-black font-spartan hover:bg-white transition-all shadow-lg shadow-paria/20"
                    >
                        Se connecter
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 rounded-xl bg-transparent text-slate-500 font-bold hover:text-white transition-colors"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LoginAlertModal;
