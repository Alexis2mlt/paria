import React, { useState } from 'react';
import AuthModal from './AuthModal';

const AuthButton: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleAuthSuccess = (email?: string) => {
    if (email) setUserEmail(email);
    setShowModal(false);
  };

  const handleLogout = () => {
    setUserEmail(null);
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
