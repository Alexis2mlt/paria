import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchMatchById, SupabaseMatch } from '../../services/supabaseService';
import { analyzeMatch } from '../../services/geminiService';
import { AnalysisState } from '../../types';

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


const MatchDetail = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const [match, setMatch] = useState<SupabaseMatch | null>(null);
    const [loading, setLoading] = useState(true);

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
        setAnalysisState(AnalysisState.LOADING);
        setError(null);
        try {
            const analysis = await analyzeMatch(query);
            setResult(analysis);
            setAnalysisState(AnalysisState.SUCCESS);
        } catch (err: any) {
            setError("Une erreur est survenue lors de l'analyse.");
            setAnalysisState(AnalysisState.ERROR);
        }
    };

    const cleanText = (text: string) => text.replace(/\*\*/g, '').replace(/__/g, '').replace(/#/g, '').trim();

    const parseBlocks = (text: string) => {
        const blocks = text.split(/BLOCK \d: /i).filter(b => b.trim());
        const justificationPart = blocks[blocks.length - 1]?.split(/⬇️ JUSTIFICATION RAPIDE/i);
        
        if (justificationPart && justificationPart.length > 1) {
            blocks[blocks.length - 1] = justificationPart[0];
            return {
                blocks: blocks.map(b => cleanText(b)),
                justification: cleanText(justificationPart[1])
            };
        }
        return { blocks: blocks.map(b => cleanText(b)), justification: '' };
    };

    const renderBlock = (blockText: string, index: number) => {
        const lines = blockText.split('\n');
        const title = index === 0 ? "Pari Sûr" : index === 1 ? "Pari Équilibré" : "Pari Audacieux";
        const betLine = lines.find(l => l.toLowerCase().includes('pari :'))?.split(':')[1]?.trim() || "Analyse...";
        const coteLine = lines.find(l => l.toLowerCase().includes('cote :'))?.split(':')[1]?.trim() || "N/A";
        const confidenceLine = lines.find(l => l.toLowerCase().includes('confiance :'))?.split(':')[1]?.trim() || "0%";
        const confidenceVal = parseInt(confidenceLine) || 50;

        return (
            <div key={index} className="border border-slate-800 rounded-2xl p-6 bg-slate-900 hover:border-paria/40 transition-all flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-spartan italic">
                        {title}
                    </span>
                    <div className="bg-paria text-slate-950 font-black px-2 py-0.5 rounded-md text-[10px]">
                        COTE {coteLine}
                    </div>
                </div>
                <div className="text-xl font-bold leading-tight text-white tracking-tight">
                    {betLine}
                </div>
                <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Confidence</span>
                        <span className="text-xs font-black text-paria">{confidenceLine}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-paria transition-all duration-1000 ease-out" 
                            style={{ width: `${confidenceVal}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        );
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
    const sportName = match.sport_id === 1 ? 'Football' : 'Sport';

    return (
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

            {/* AI Analysis Generation Card */}
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

            {/* Results View */}
            {(result || analysisState === AnalysisState.SUCCESS) && (
                <div ref={resultRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 mb-8 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-paria/10 rounded-xl flex items-center justify-center text-paria">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">Analyse terminée</h3>
                                <p className="text-slate-400 text-sm">Basé sur les dernières données disponibles</p>
                            </div>
                        </div>

                        {/* Analysis Grid */}
                        {result && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {parseBlocks(result.text).blocks.map((block, i) => renderBlock(block, i))}
                            </div>
                        )}
                        
                        {/* Quick Justification */}
                        {result && parseBlocks(result.text).justification && (
                            <div className="mt-8 bg-slate-950/50 rounded-xl p-6 border border-slate-800/50">
                                <h4 className="text-sm font-black uppercase tracking-widest text-paria mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Justification Rapide
                                </h4>
                                <p className="text-slate-300 leading-relaxed text-sm">
                                    {parseBlocks(result.text).justification}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatchDetail;
