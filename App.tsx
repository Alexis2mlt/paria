import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import AuthButton from './components/AuthButton';
import Home from './src/pages/Home';
import MatchList from './src/pages/MatchList';
import MatchDetail from './src/pages/MatchDetail';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthModal from './components/AuthModal';

const Logo = () => (
    <Link to="/" className="flex items-center">
        <img 
            src="/logo-paria.png" 
            alt="Paria Logo" 
            className="h-10 w-auto"
        />
    </Link>
);

const GlobalAuthModal = () => {
    const { isAuthModalOpen, closeAuthModal } = useAuth();
    if (!isAuthModalOpen) return null;
    return <AuthModal onClose={closeAuthModal} onAuthSuccess={closeAuthModal} />;
};

const AppContent = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-paria/20">
            {/* Navigation */}
            <nav className="bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-900">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Logo />
                    <AuthButton />
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/sport/:sportId" element={<MatchList />} />
                    <Route path="/match/:matchId" element={<MatchDetail />} />
                </Routes>
            </main>

            {/* Global Modals */}
            <GlobalAuthModal />
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
