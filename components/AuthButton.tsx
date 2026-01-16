import React from 'react';
import { useAuth } from '../src/context/AuthContext';

const AuthButton: React.FC = () => {
  const { user, openAuthModal, logout } = useAuth();

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
          {user.email?.split('@')[0]}
        </span>
        <button
          onClick={logout}
          className="text-[8px] font-black uppercase text-slate-400 hover:text-paria transition-colors tracking-widest"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={openAuthModal}
      className="flex items-center gap-2 text-[8px] font-black uppercase text-slate-400 hover:text-paria transition-colors tracking-widest"
    >
      <span>Login / Register</span>
    </button>
  );
};

export default AuthButton;
