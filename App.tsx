
import React, { useState, useRef, useEffect } from 'react';
import { analyzeMatch } from './services/geminiService';
import { AnalysisState } from './types';
import AuthButton from './components/AuthButton';
import { fetchFootballMatches, SupabaseMatch, extractLogos } from './services/supabaseService';

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

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'football'>('home');
  const [matches, setMatches] = useState<SupabaseMatch[]>([]);
  const [footballCount, setFootballCount] = useState(0);

  useEffect(() => {
    fetchFootballMatches().then(data => setFootballCount(data.length));
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

  const handleSportClick = async (sport: string) => {
    if (sport === 'Football') {
      setView('football');
      setCurrentPage(1);
      // Fetch matches
      const data = await fetchFootballMatches();
      setMatches(data);
    }
  };

  const handleBack = () => {
    setView('home');
    setMatches([]);
    setCurrentPage(1);
  };

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
                onClick={() => handleSportClick('Football')}
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
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-paria/70 transition-colors">{footballCount} matchs disponibles</p>
                    </div>
                 </div>
              </button>

              {/* Other Sports Placeholders */}
              {[
                { name: 'Basketball', count: 0, icon: <><circle cx="12" cy="12" r="10"/><line x1="14.3" y1="2.1" x2="8.4" y2="21.5"/><path d="M5.6 5.6l12.8 12.8"/><path d="M18.4 5.6L5.6 18.4"/></> },
                { name: 'Tennis', count: 0, icon: <><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></> },
                { name: 'Cyclisme', count: 0, icon: <><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h-5a1 1 0 0 0-1 1v3"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></> },
                { name: 'Natation', count: 0, icon: <><path d="M2 12c.6 0 1.2.5 2 1s1.4.5 2 0 1.2-.5 2-1 1.4-.5 2 0 1.2.5 2 1 1.4.5 2 0"/><path d="M2 16c.6 0 1.2.5 2 1s1.4.5 2 0 1.2-.5 2-1 1.4-.5 2 0 1.2.5 2 1 1.4.5 2 0"/><path d="M2 8c.6 0 1.2.5 2 1s1.4.5 2 0 1.2-.5 2-1 1.4-.5 2 0 1.2.5 2 1 1.4.5 2 0"/></> },
                { name: 'MMA', count: 0, icon: <><path d="M14.5 2L10 10l-4-4"/><path d="M8.5 2L12 10l5 5"/><path d="M12 22l-4-4"/><path d="M4 14l8 8"/></> },
              ].map((s) => (
                <button key={s.name} className="group relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-paria transition-all duration-300 hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] hover:shadow-paria/20 text-left">
                  <div className="flex flex-col items-center justify-center text-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-paria/10 transition-colors">
                        <svg className="w-8 h-8 text-slate-400 group-hover:text-paria transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {s.icon}
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-black font-spartan text-white mb-1">{s.name}</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-paria/70 transition-colors">{s.count} matchs disponibles</p>
                      </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {view === 'football' && (
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
                Matchs de <span className="text-paria">Football</span>
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
                  <div key={match.id} className="group bg-slate-900 border border-slate-800 hover:border-paria/50 rounded-2xl p-0 overflow-hidden transition-all cursor-pointer hover:shadow-lg hover:shadow-paria/5">
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
                  // If few pages, show all
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
                  // If many pages, show 1, 2, 3 ... Input ... Last
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
                    
                    {/* Input for jumping */}
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
                                (e.target as HTMLInputElement).value = ""; // Clear after jump
                             }
                          }}
                       />
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-paria text-slate-950 text-[9px] font-black px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          Entrée pour valider
                       </div>
                    </div>

                    <span className="text-slate-600 font-black">...</span>

                    {/* Last Page */}
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
      </main>
    </div>
  );
};

export default App;
