import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabaseService';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (email?: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }

      const { data, error } = isLogin 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (error) throw error;

      if (!data.user && !isLogin) {
         // Case where sign up requires email confirmation
         alert("Veuillez vérifier vos emails pour confirmer votre inscription.");
         onClose();
         return;
      }
      
      if (data.user) {
         onAuthSuccess(data.user.email);
         onClose();
      }

    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-[#0B1120] border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-black/50 overflow-hidden relative" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-paria/50 to-transparent opacity-50"></div>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black uppercase tracking-tight font-spartan italic text-white">
            {isLogin ? 'Connexion' : 'Inscription'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-paria focus:ring-1 focus:ring-paria/20 focus:outline-none transition-all font-medium text-white placeholder-slate-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-paria focus:ring-1 focus:ring-paria/20 focus:outline-none transition-all font-medium text-white placeholder-slate-600"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm font-bold border border-red-500/20 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-paria text-slate-950 font-black py-4 rounded-xl hover:bg-white transition-all disabled:opacity-50 uppercase tracking-tight mt-2 shadow-lg shadow-paria/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t border-slate-800/50">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm text-slate-400 hover:text-paria transition-colors font-medium"
          >
            {isLogin ? (
              <span>Pas de compte ? <strong className="text-white">S'inscrire</strong></span>
            ) : (
              <span>Déjà un compte ? <strong className="text-white">Se connecter</strong></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AuthModal;
