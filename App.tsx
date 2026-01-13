
import React, { useState, useRef, useEffect } from 'react';
import { analyzeMatch, getTodaysMatches } from './services/geminiService';
import { AnalysisState } from './types';
import AuthButton from './components/AuthButton';

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

const App: React.FC = () => {
  const [matchInput, setMatchInput] = useState('');
  const [analysisState, setAnalysisState] = useState<AnalysisState>(AnalysisState.IDLE);
  const [suggestedMatches, setSuggestedMatches] = useState<string[]>([]);
  const [result, setResult] = useState<{ text: string; sources: Array<{ title: string; uri: string }> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      const matches = await getTodaysMatches();
      // Filter out weird or empty responses
      setSuggestedMatches(matches.filter(m => m.length > 3).slice(0, 5));
    };
    fetchMatches();
  }, []);

  useEffect(() => {
    if (analysisState === AnalysisState.SUCCESS && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [analysisState]);

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
      <div key={index} className="border border-slate-100 rounded-2xl p-6 custom-shadow bg-white hover:border-paria/40 transition-all flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 font-spartan italic">
            {title}
          </span>
          <div className="bg-paria text-white font-black px-2 py-0.5 rounded-md text-[10px]">
            COTE {coteLine}
          </div>
        </div>
        <div className="text-xl font-bold leading-tight text-black tracking-tight">
          {betLine}
        </div>
        <div className="mt-auto">
          <div className="flex justify-between items-end mb-2">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Confidence</span>
             <span className="text-xs font-black text-paria">{confidenceLine}</span>
          </div>
          <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
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
    <div className="min-h-screen bg-white text-black font-sans selection:bg-paria/20">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <Logo />
          <AuthButton />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Intro */}
        <section className="text-center mb-10">
          <h2 className="text-4xl sm:text-6xl font-spartan font-black leading-[0.9] mb-4 tracking-tighter uppercase italic">
            Choisissez <br className="sm:hidden" /> le meilleur <span className="text-paria">Pari.</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium tracking-tight">Analyse statistique brute pour parieurs exigeants.</p>
        </section>

        {/* Dynamic Bubbles */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {suggestedMatches.length > 0 ? suggestedMatches.map((match) => (
            <button
              key={match}
              onClick={() => handleAnalyze(match)}
              className="px-5 py-2 rounded-full border border-slate-100 text-[11px] font-bold text-slate-500 hover:border-paria hover:text-paria transition-all bg-white custom-shadow"
            >
              {match}
            </button>
          )) : (
            <div className="flex gap-2">
              <div className="h-8 w-32 bg-slate-50 animate-pulse rounded-full"></div>
              <div className="h-8 w-32 bg-slate-50 animate-pulse rounded-full"></div>
            </div>
          )}
        </div>

        {/* Input (ChatGPT Style) */}
        <div className="relative max-w-xl mx-auto mb-20">
          <div className="bg-white border-2 border-slate-50 rounded-full p-2 custom-shadow flex items-center focus-within:border-paria/30 transition-all">
            <input
              type="text"
              placeholder="Match ou URL Flashscore..."
              className="flex-1 bg-transparent px-6 py-3 outline-none font-semibold text-slate-800 placeholder:text-slate-300"
              value={matchInput}
              onChange={(e) => setMatchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button
              onClick={() => handleAnalyze()}
              disabled={analysisState === AnalysisState.LOADING}
              className="w-12 h-12 bg-paria rounded-full flex items-center justify-center text-white hover:brightness-110 transition-all disabled:opacity-50"
            >
              {analysisState === AnalysisState.LOADING ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Loading / Results */}
        {analysisState === AnalysisState.LOADING && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-44 bg-slate-50 rounded-3xl border border-slate-100"></div>)}
            </div>
            <div className="h-32 bg-slate-50 rounded-3xl border border-slate-100"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-center font-bold text-xs border border-red-100 mb-8">
            {error}
          </div>
        )}

        {analysisState === AnalysisState.SUCCESS && result && (
          <div ref={resultRef} className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* 3 Blocks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {parseBlocks(result.text).blocks.slice(0, 3).map((b, i) => renderBlock(b, i))}
            </div>

            {/* Justification Section */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 custom-shadow">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1.5 h-10 bg-paria rounded-full"></div>
                <h3 className="font-spartan text-2xl font-black uppercase tracking-tight italic">Justification Rapide</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
                <div className="md:col-span-3 text-sm text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                  {parseBlocks(result.text).justification || "Analyse contextuelle approfondie."}
                </div>
                
                <div className="md:col-span-2 space-y-8">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-4">Sources Officielles</h4>
                    <div className="flex flex-col gap-2">
                      {MANDATORY_SOURCES.map((s, i) => (
                        <a key={`m-${i}`} href={s.uri} target="_blank" className="group flex items-center justify-between bg-slate-50 hover:bg-paria/5 px-4 py-3 rounded-2xl transition-all border border-transparent hover:border-paria/10">
                          <span className="text-[11px] font-bold text-slate-500 group-hover:text-paria">{s.title}</span>
                          <svg className="w-3 h-3 text-slate-300 group-hover:text-paria" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>
                  
                  {result.sources.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-3">Grounding Intelligence</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.sources.slice(0, 3).map((s, i) => (
                          <a key={i} href={s.uri} target="_blank" className="text-[9px] font-bold text-slate-400 bg-white border border-slate-100 px-3 py-1.5 rounded-full hover:text-paria transition-colors truncate max-w-[150px]">
                            {s.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-40 pb-20 text-center border-t border-slate-50 pt-16">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-8 max-w-xl mx-auto mb-6 leading-relaxed">
          Les paris sportifs comportent des risques. Jouez de manière responsable. <br /> Paria analyse, vous décidez.
        </p>
      </footer>
    </div>
  );
};

export default App;
