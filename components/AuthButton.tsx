import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import AuthModal from './AuthModal';
import type { User } from '@supabase/supabase-js';

const AuthButton: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier l'utilisateur actuel
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-20 h-6 bg-slate-100 animate-pulse rounded-full"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
          {user.email?.split('@')[0]}
        </span>
        <button
          onClick={handleLogout}
          className="text-[8px] font-black uppercase text-slate-400 hover:text-paria transition-colors tracking-widest"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 text-[8px] font-black uppercase text-slate-400 hover:text-paria transition-colors tracking-widest"
      >
        <span>Login / Register</span>
      </button>
      {showModal && (
        <AuthModal
          onClose={() => setShowModal(false)}
          onAuthSuccess={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default AuthButton;
