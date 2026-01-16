import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchMatchById, SupabaseMatch } from '../../services/supabaseService';
import { AnalysisState } from '../../types';
import ChatDrawer from '../components/ChatDrawer';
import { useAuth } from '../context/AuthContext';
import LoginAlertModal from '../components/LoginAlertModal';

// Format date to "15 Jan" format
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// Format time to "21:00" format
const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// Custom Markdown Formatter
const FormattedText = ({ text }: { text: string }) => {
    if (!text) return null;
    
    return (
        <div className="space-y-4">
            {text.split('\n').map((line, index) => {
                // Headers (###)
                if (line.trim().startsWith('###')) {
                    return (
                        <h5 key={index} className="text-lg font-bold text-white mt-6 mb-2">
                            {line.replace(/^###\s*/, '')}
                        </h5>
                    );
                }
                
                // Normal paragraph with bold parsing
                if (line.trim() === '') return <br key={index} />;

                const parts = line.split(/(\*\*.*?\*\*)/g);
                
                return (
                    <p key={index} className="min-h-[1rem]">
                        {parts.map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                        })}
                    </p>
                );
            })}
        </div>
    );
};

const MatchDetail = () => {
    const { user } = useAuth();
    const { matchId } = useParams<{ matchId: string }>();
    const [match, setMatch] = useState<SupabaseMatch | null>(null);
    const [loading, setLoading] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showLoginAlert, setShowLoginAlert] = useState(false);

    // Analysis State
    const [analysisState, setAnalysisState] = useState<AnalysisState>(AnalysisState.IDLE);
    const [result, setResult] = useState<{ text: string; sources: Array<{ title: string; uri: string }> } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const resultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (matchId) {
            setLoading(true);
            fetchMatchById(parseInt(matchId)).then(data => {
                setMatch(data);
                setLoading(false);
            });
        }
    }, [matchId]);

    useEffect(() => {
        if (analysisState === AnalysisState.SUCCESS && resultRef.current) {
            resultRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [analysisState]);

    const handleAnalyze = async (query: string) => {
        if (!user) {
            setShowLoginAlert(true);
            return;
        }

        setAnalysisState(AnalysisState.LOADING);
        setResult(null);
        setError(null);
        
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                // If user object exists but no token locally (edge case), prompt login
                setShowLoginAlert(true);
                return;
            }

            const sport = match?.sport_id === 1 ? 'Football' : match?.sport_id === 2 ? 'Rugby' : 'Sport';

            const response = await fetch('/api/webhook/c7efaf8e-a5d6-4233-a514-ce2c7ab9b1df', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: "button",
                    sport: sport,
                    message: "Quel est le prono de ce match",
                    matchId: match?.id
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur réseau: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Try to extract the text from various common properties
            const predictionText = data.prediction || data.content || data.output || data.text || data.message || (typeof data === 'string' ? data : JSON.stringify(data));

            setResult({
                text: predictionText,
                sources: [] 
            });
            setAnalysisState(AnalysisState.SUCCESS);

        } catch (err: any) {
            console.error("Analysis failed:", err);
            setError(err.message || "Impossible de générer la prédiction");
            setAnalysisState(AnalysisState.ERROR);
        }
    };

    if (loading) {
        return (
             <div className="flex items-center justify-center min-h-[50vh]">
                  <div className="w-16 h-16 border-4 border-slate-800 border-t-paria rounded-full animate-spin"></div>
             </div>
        );
    }

    if (!match) {
        return <div className="text-center text-white p-10">Match introuvable.</div>;
    }

    // Determine sport name (basic check for now)
    const sportName = match.sport_id === 1 ? 'Football' : match.sport_id === 2 ? 'Rugby' : 'Sport';

    return (
        <div className="relative">
            <LoginAlertModal isOpen={showLoginAlert} onClose={() => setShowLoginAlert(false)} />
            <ChatDrawer 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
                matchId={match?.id}
                sportName={sportName}
            />
            
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20 max-w-4xl mx-auto">
                {/* Back Button */}
                <Link 
                    to={`/sport/${match.sport_id}`}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm font-medium group"
                >
                    <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    Retour aux matchs
                </Link>

                {/* Match Title Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black font-spartan text-white mb-2">
                        {match.home_name} <span className="text-slate-600 text-2xl align-middle mx-2">vs</span> {match.away_name}
                    </h1>
                    <p className="text-slate-400 font-medium">
                        Ligue 1 • {formatDate(match.match_date)} à {formatTime(match.match_date)}
                    </p>
                </div>

                {/* AI Analysis Generation Card (Initial State) */}
                {!result && analysisState !== AnalysisState.LOADING && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-paria/50 to-transparent opacity-20"></div>
                        
                        <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-black/50">
                            <svg className="w-10 h-10 text-paria" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        
                        <h2 className="text-2xl font-black font-spartan text-white mb-4">Générer une prédiction IA</h2>
                        <p className="text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed">
                            Notre IA analyse les statistiques, l'historique et la forme actuelle des équipes pour vous proposer un scénario probable et des conseils de paris.
                        </p>
                        
                        <button 
                            onClick={() => handleAnalyze(`Analyse le match ${sportName} ${match.home_name} vs ${match.away_name}`)}
                            className="bg-paria text-slate-950 font-black font-spartan py-4 px-10 rounded-xl hover:bg-white hover:scale-105 transition-all duration-300 shadow-lg shadow-paria/20 flex items-center gap-3 mx-auto"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Générer le scénario
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {analysisState === AnalysisState.LOADING && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center animate-pulse">
                        <div className="w-16 h-16 border-4 border-slate-800 border-t-paria rounded-full animate-spin mx-auto mb-6"></div>
                        <h3 className="text-xl font-bold text-white mb-2">Analyse en cours...</h3>
                        <p className="text-slate-500">L'IA étudie les confrontations récentes et les stats.</p>
                    </div>
                )}

                {/* Results View - New Design */}
                {(result || analysisState === AnalysisState.SUCCESS) && (
                    <div ref={resultRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-[#0B1120] border border-slate-800 rounded-3xl p-8 shadow-2xl">
                            {/* Header Badge */}
                            <div className="flex items-center gap-4 mb-8">
                                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-900/20 flex items-center justify-center border border-teal-500/30">
                                    <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                 </div>
                                 <div>
                                     <h3 className="text-lg font-bold text-white leading-tight">Prédiction IA</h3>
                                     <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Basée sur les données récentes</p>
                                 </div>
                            </div>

                            {/* Content */}
                            <div className="mb-10 text-slate-300 leading-relaxed text-sm">
                                <FormattedText text={result?.text || ''} />
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-800/50">
                                <button 
                                    onClick={() => handleAnalyze(`Analyse le match ${sportName} ${match.home_name} vs ${match.away_name}`)}
                                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-900 border border-paria/30 hover:bg-paria hover:text-slate-950 text-paria font-black font-spartan transition-all group"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    Nouvelle prédiction
                                </button>
                                <button 
                                    onClick={() => setIsChatOpen(true)}
                                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-paria hover:bg-white text-slate-950 font-black font-spartan transition-all shadow-lg shadow-paria/20 hover:scale-[1.02]"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    Poser des questions
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchDetail;
