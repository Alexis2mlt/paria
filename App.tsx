import React, { useState, useRef, useEffect } from 'react';
import { analyzeMatch } from './services/geminiService';
import { AnalysisState } from './types';
import AuthButton from './components/AuthButton';
import { fetchAllMatches, SupabaseMatch, extractLogos } from './services/supabaseService';

const MANDATORY_SOURCES = [
  { title: "Parions Sport", uri: "https://www.parionssport.fdj.fr" },
  { title: "Flashscore", uri: "https://www.flashscore.fr/" },
  { title: "Winamax", uri: "https://www.winamax.fr/" }
];

const Logo = () => (
  <div className="flex items-center">
    <img 
      src="/logo-paria.png" 
      alt="Paria Logo" 
      className="h-10 w-auto"
    />
  </div>
);

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

const App = () => {
  const [view, setView] = useState<'home' | 'matchList' | 'matchDetail'>('home');
  const [allMatches, setAllMatches] = useState<SupabaseMatch[]>([]);
  const [matches, setMatches] = useState<SupabaseMatch[]>([]);
  const [sportCounts, setSportCounts] = useState<{ [key: number]: number }>({ 1: 0, 2: 0 });
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<SupabaseMatch | null>(null);

  useEffect(() => {
    // Fetch all matches on load
    fetchAllMatches().then(data => {
      setAllMatches(data);
      const counts: { [key: number]: number } = { 1: 0, 2: 0 };
      data.forEach(m => {
        if (m.sport_id === 1) counts[1] = (counts[1] || 0) + 1;
        if (m.sport_id === 2) counts[2] = (counts[2] || 0) + 1;
      });
      setSportCounts(counts);
    });
  }, []);
  
  // Analysis State
  const [matchInput, setMatchInput] = useState('');
  const [analysisState, setAnalysisState] = useState<AnalysisState>(AnalysisState.IDLE);
  const [result, setResult] = useState<{ text: string; sources: Array<{ title: string; uri: string }> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysisState === AnalysisState.SUCCESS && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [analysisState]);

  /* Pagination Logic */
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(matches.length / ITEMS_PER_PAGE);
  const paginatedMatches = matches.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSportClick = (sportId: number, sportName: string) => {
    const filtered = allMatches.filter(m => m.sport_id === sportId);
    setMatches(filtered);
    setSelectedSport(sportName);
    setView('matchList');
    setCurrentPage(1);
  };

  const handleMatchClick = (match: SupabaseMatch) => {
    setSelectedMatch(match);
    setView('matchDetail');
    setAnalysisState(AnalysisState.IDLE); // Reset analysis on new match view
    setResult(null);
  };

  const handleBackToMatches = () => {
    setView('matchList');
    setSelectedMatch(null);
  };

  const handleBackToHome = () => {
    setView('home');
    setMatches([]);
    setSelectedSport('');
    setCurrentPage(1);
  };

  // Alias for compatibility if needed, or just use handleBackToHome
  const handleBack = handleBackToHome;

  const handleAnalyze = async (query?: string) => {
    const targetQuery = query || matchInput;
    if (!targetQuery.trim()) return;

    if (query) setMatchInput(query);
    
    setAnalysisState(AnalysisState.LOADING);
    setError(null);
    try {
      const analysis = await analyzeMatch(targetQuery);
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
        {view === 'home' && (
          <>
            {/* Hero Section */}
            <section className="text-center mb-16">
              <h2 className="text-4xl sm:text-6xl font-spartan font-black leading-[0.9] mb-6 tracking-tighter">
                Choisissez votre <span className="text-paria">sport</span>
              </h2>
              <p className="text-slate-400 text-lg font-medium tracking-tight max-w-2xl mx-auto leading-relaxed">
                Sélectionnez un sport pour découvrir les matchs à venir et générer des prédictions IA personnalisées.
              </p>
            </section>

            {/* Sports Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20 px-4 sm:px-0">
              {/* Football */}
              <button 
                onClick={() => handleSportClick(1, 'Football')}
                className="group relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-paria transition-all duration-300 hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] hover:shadow-paria/20 text-left"
              >
                 <div className="flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-paria/10 transition-colors">
                      <svg className="w-8 h-8 text-slate-400 group-hover:text-paria transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                        <path d="M2 12h20"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black font-spartan text-white mb-1">Football</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-paria/70 transition-colors">{sportCounts[1]} matchs disponibles</p>
                    </div>
                 </div>
              </button>

              {/* Rugby and Other Placeholders */}
               {[
                { name: 'Rugby', id: 2, count: sportCounts[2], icon: <><path d="M12 2c5 0 9 4 9 10s-4 10-9 10-9-4-9-10 4-10 9-10z" /><path d="M12 2c2 4 2 16 0 20" /><path d="M2 12h20" /></> }, 
                { name: 'Basketball', count: 0, icon: <><circle cx="12" cy="12" r="10"/><line x1="14.3" y1="2.1" x2="8.4" y2="21.5"/><path d="M5.6 5.6l12.8 12.8"/><path d="M18.4 5.6L5.6 18.4"/></> },
                { name: 'Tennis', count: 0, icon: <><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></> },
                { name: 'Natation', count: 0, icon: <><path d="M2 12c.6 0 1.2.5 2 1s1.4.5 2 0 1.2-.5 2-1 1.4-.5 2 0 1.2.5 2 1 1.4.5 2 0"/><path d="M2 16c.6 0 1.2.5 2 1s1.4.5 2 0 1.2-.5 2-1 1.4-.5 2 0 1.2.5 2 1 1.4.5 2 0"/><path d="M2 8c.6 0 1.2.5 2 1s1.4.5 2 0 1.2-.5 2-1 1.4-.5 2 0 1.2.5 2 1 1.4.5 2 0"/></> },
                { name: 'MMA', count: 0, icon: <><path d="M14.5 2L10 10l-4-4"/><path d="M8.5 2L12 10l5 5"/><path d="M12 22l-4-4"/><path d="M4 14l8 8"/></> },
              ].map((s) => (
                <button 
                    key={s.name} 
                    onClick={() => s.id ? handleSportClick(s.id, s.name) : undefined}
                    className={`group relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-paria transition-all duration-300 hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] hover:shadow-paria/20 text-left ${!s.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center justify-center text-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-paria/10 transition-colors">
                        <svg className="w-8 h-8 text-slate-400 group-hover:text-paria transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {s.icon}
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-black font-spartan text-white mb-1">{s.name}</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-paria/70 transition-colors">{s.count ?? 0} matchs disponibles</p>
                      </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {view === 'matchList' && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
            {/* Header / Back */}
            <div className="mb-8">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-medium group"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                Retour aux sports
              </button>
              <h2 className="text-3xl font-spartan font-black text-white">
                Matchs de <span className="text-paria">{selectedSport}</span>
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {matches.length} matchs disponibles • Page {currentPage}/{totalPages}
              </p>
            </div>

            {/* Matches List */}
            <div className="space-y-4 mb-12">
              {paginatedMatches.map((match) => {
                const { homeLogo, awayLogo } = extractLogos(match.data);
                return (
                  <div 
                    key={match.id} 
                    onClick={() => handleMatchClick(match)}
                    className="group bg-slate-900 border border-slate-800 hover:border-paria/50 rounded-2xl p-0 overflow-hidden transition-all cursor-pointer hover:shadow-lg hover:shadow-paria/5"
                  >
                    {/* Header: Competition */}
                    <div className="px-6 py-3 border-b border-slate-800/50 bg-slate-900/50 flex justify-between items-center bg-gradient-to-r from-slate-900 via-slate-900 to-transparent">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-paria transition-colors">
                        LIGUE 1
                      </span>
                      <svg className="w-4 h-4 text-slate-600 group-hover:text-paria transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="p-6 relative">
                       {/* Teams */}
                       <div className="flex flex-col gap-6">
                          {/* Home */}
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-white p-1 shrink-0">
                               <img src={homeLogo} alt={match.home_name} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-lg font-bold font-spartan">{match.home_name}</span>
                          </div>
                          
                          {/* Away */}
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-white p-1 shrink-0">
                               <img src={awayLogo} alt={match.away_name} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-lg font-bold font-spartan">{match.away_name}</span>
                          </div>
                      </div>

                      {/* Date/Time - Bottom Left */}
                      <div className="mt-6 flex items-center gap-4 text-slate-400 text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {formatDate(match.match_date)}
                        </div>
                        <div className="flex items-center gap-1.5">
                           <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           {formatTime(match.match_date)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                {/* Previous */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-paria hover:border-paria transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>

                {/* Pages Logic */}
                {totalPages <= 6 ? (
                  Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all font-bold text-sm ${
                        currentPage === page
                          ? 'bg-paria text-slate-950 border-paria'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-paria hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))
                ) : (
                  <>
                    {[1, 2, 3].map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all font-bold text-sm ${
                          currentPage === page
                            ? 'bg-paria text-slate-950 border-paria'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-paria hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <span className="text-slate-600 font-black">...</span>
                    
                    <div className="relative group">
                       <input 
                          type="number" 
                          min="1" 
                          max={totalPages}
                          placeholder={currentPage > 3 && currentPage < totalPages ? currentPage.toString() : "#"}
                          className={`w-14 h-10 bg-slate-900 border rounded-xl text-center font-bold text-sm focus:outline-none focus:border-paria transition-all appearance-none ${
                            currentPage > 3 && currentPage < totalPages 
                              ? 'border-paria text-paria placeholder:text-paria' 
                              : 'border-slate-800 text-white placeholder:text-slate-600'
                          }`}
                          onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                                const val = parseInt((e.target as HTMLInputElement).value);
                                if (!isNaN(val)) handlePageChange(val);
                                (e.target as HTMLInputElement).value = ""; 
                             }
                          }}
                       />
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-paria text-slate-950 text-[9px] font-black px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          Entrée pour valider
                       </div>
                    </div>

                    <span className="text-slate-600 font-black">...</span>

                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all font-bold text-sm ${
                        currentPage === totalPages
                          ? 'bg-paria text-slate-950 border-paria'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-paria hover:text-white'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* Next */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-paria hover:border-paria transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Match Detail View */}
        {view === 'matchDetail' && selectedMatch && (
           <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20 max-w-4xl mx-auto">
              {/* Back Button */}
              <button 
                onClick={handleBackToMatches}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm font-medium group"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                Retour aux matchs
              </button>

              {/* Match Title Header */}
              <div className="mb-8">
                  <h1 className="text-3xl sm:text-4xl font-black font-spartan text-white mb-2">
                    {selectedMatch.home_name} <span className="text-slate-600 text-2xl align-middle mx-2">vs</span> {selectedMatch.away_name}
                  </h1>
                  <p className="text-slate-400 font-medium">
                     Ligue 1 • {formatDate(selectedMatch.match_date)} à {formatTime(selectedMatch.match_date)}
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
                        onClick={() => handleAnalyze(`Analyse le match ${selectedSport} ${selectedMatch.home_name} vs ${selectedMatch.away_name}`)}
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
        )}
      </main>
    </div>
  );
};

export default App;
