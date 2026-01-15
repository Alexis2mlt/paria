import React, { useState, useEffect } from 'react';
import AuthModal from './AuthModal';
import { supabase } from '../services/supabaseService';

const AuthButton: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });

    // Listen for auth changes (login, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = (email?: string) => {
    // State is now handled by onAuthStateChange, but we still close modal
    setShowModal(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('access_token'); // Clean up manual token if needed
    // State will clear via onAuthStateChange
  };

  if (userEmail) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
          {userEmail.split('@')[0]}
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
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
};

export default AuthButton;
