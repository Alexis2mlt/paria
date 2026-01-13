
import React, { useState, useRef, useEffect } from 'react';
import { analyzeMatch, getUpcomingMatches, Match } from './services/geminiService';
import { AnalysisState } from './types';

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

const MascotLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-40 h-40 mb-8">
        {/* Container avec animation de mouvement en boucle */}
        <div className="absolute inset-0 mascot-loop">
          <img 
            src="/ia-paria.png" 
            alt="Paria" 
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 0 15px rgba(34, 197, 94, 0.6))' }}
          />
        </div>
      </div>
      
      {/* Texte de chargement */}
      <div className="text-center">
        <p className="text-sm font-black uppercase tracking-widest text-slate-400 font-spartan italic mascot-text-pulse">
          Analyse en cours...
        </p>
      </div>
      
      <style>{`
        @keyframes mascot-loop {
          0% {
            transform: translateX(0) translateY(0) rotate(0deg);
          }
          25% {
            transform: translateX(30px) translateY(-15px) rotate(8deg);
          }
          50% {
            transform: translateX(0) translateY(-30px) rotate(0deg);
          }
          75% {
            transform: translateX(-30px) translateY(-15px) rotate(-8deg);
          }
          100% {
            transform: translateX(0) translateY(0) rotate(0deg);
          }
        }
        
        @keyframes text-pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        
        .mascot-loop {
          animation: mascot-loop 3s ease-in-out infinite;
        }
        
        .mascot-text-pulse {
          animation: text-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

const SPORTS = [
  { id: 'foot', name: 'Football', emoji: '⚽' },
  { id: 'rugby', name: 'Rugby', emoji: '🏉' },
  { id: 'tennis', name: 'Tennis', emoji: '🎾' },
  { id: 'mma', name: 'MMA', emoji: '🥊' },
  { id: 'basket', name: 'Basketball', emoji: '🏀' },
  { id: 'boxe', name: 'Boxe', emoji: '🥊' },
];

interface Prediction {
  type: 'sûr' | 'moyen' | 'risqué';
  title: string;
  bet: string;
  odds: string;
  confidence: number;
  explanation: string;
}

interface MatchPrediction {
  match: Match;
  overallReliability: number;
  predictions: Prediction[];
  explanations: string;
  sources: Array<{ title: string; uri: string }>;
  vigilancePoints: string[];
}

const App: React.FC = () => {
  const [analysisState, setAnalysisState] = useState<AnalysisState>(AnalysisState.IDLE);
  const [result, setResult] = useState<{ text: string; sources: Array<{ title: string; uri: string }> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchPrediction, setMatchPrediction] = useState<MatchPrediction | null>(null);
  const [customPredictionInput, setCustomPredictionInput] = useState('');
  const [loadingCustomPrediction, setLoadingCustomPrediction] = useState(false);
  const [comingSoonSport, setComingSoonSport] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  
  const resultRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysisState === AnalysisState.SUCCESS && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [analysisState]);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  const handleSportClick = async (sportName: string) => {
    // Vérifier si c'est Tennis ou Basketball - afficher directement le message
    if (sportName === 'Tennis' || sportName === 'Basketball') {
      setComingSoonSport(sportName);
      setSelectedSport(null);
      setSelectedMatch(null);
      setMatches([]);
      setAnalysisState(AnalysisState.IDLE);
      setError(null);
      setResult(null);
      setMatchPrediction(null);
      return;
    }

    setSelectedSport(sportName);
    setComingSoonSport(null);
    setLoadingMatches(true);
    setError(null);
    setResult(null);
    setAnalysisState(AnalysisState.IDLE);
    
    try {
      const upcomingMatches = await getUpcomingMatches(sportName);
      setMatches(upcomingMatches);
      setLoadingMatches(false);
    } catch (err: any) {
      setError("Une erreur est survenue lors du chargement des matchs.");
      setLoadingMatches(false);
    }
  };

  const generateFictitiousPrediction = (match: Match): MatchPrediction => {
    const predictions: Prediction[] = [
      {
        type: 'sûr',
        title: 'Pari Sûr',
        bet: 'Double chance 1X',
        odds: '1.35',
        confidence: 78,
        explanation: 'L\'équipe à domicile est en excellente forme avec 5 victoires consécutives. Les statistiques montrent une forte probabilité de ne pas perdre ce match.'
      },
      {
        type: 'moyen',
        title: 'Pari Moyen',
        bet: 'Victoire à domicile',
        odds: '2.10',
        confidence: 58,
        explanation: 'Analyse des confrontations directes et de la forme récente. L\'équipe à domicile a un avantage significatif mais l\'adversaire reste dangereux.'
      },
      {
        type: 'risqué',
        title: 'Pari Risqué',
        bet: 'Score exact 2-1',
        odds: '8.50',
        confidence: 32,
        explanation: 'Scénario basé sur les tendances offensives des deux équipes. Pari à fort potentiel mais nécessite une analyse fine des compositions d\'équipe.'
      }
    ];

    return {
      match,
      overallReliability: 68,
      predictions,
      explanations: 'L\'analyse statistique révèle une confrontation équilibrée avec un léger avantage pour l\'équipe à domicile. Les dernières performances montrent une régularité dans les résultats, notamment en défense. Les blessures actuelles impactent légèrement la profondeur de l\'effectif mais ne compromettent pas les chances de succès.',
      sources: [
        { title: 'Flashscore - Statistiques Match', uri: 'https://www.flashscore.fr/match/' },
        { title: 'Winamax - Cotes en direct', uri: 'https://www.winamax.fr/' },
        { title: 'Parions Sport - Analyse', uri: 'https://www.parionssport.fdj.fr' },
        { title: 'L\'Équipe - Forme des équipes', uri: 'https://www.lequipe.fr' },
        { title: 'Transfermarkt - Compositions', uri: 'https://www.transfermarkt.fr' }
      ],
      vigilancePoints: [
        'Absence confirmée du titulaire en défense centrale',
        'Conditions météorologiques pouvant influencer le jeu',
        'Fatigue accumulée après 3 matchs en 8 jours',
        'Historique de matchs serrés entre ces deux équipes'
      ]
    };
  };

  const handleMatchClick = async (match: Match, sportName?: string) => {
    // Utiliser le sport passé en paramètre ou celui stocké
    const currentSport = sportName || selectedSport;
    
    // Vérifier si c'est Tennis ou Basketball
    if (currentSport === 'Tennis' || currentSport === 'Basketball') {
      setComingSoonSport(currentSport);
      setSelectedMatch(match);
      setSelectedSport(null);
      setAnalysisState(AnalysisState.IDLE);
      setError(null);
      setMatchPrediction(null);
      return;
    }

    // Réinitialiser comingSoonSport pour les autres sports
    setComingSoonSport(null);

    setSelectedMatch(match);
    setSelectedSport(null);
    setComingSoonSport(null);
    setAnalysisState(AnalysisState.LOADING);
    setError(null);
    
    // Simulation d'un chargement
    setTimeout(() => {
      const prediction = generateFictitiousPrediction(match);
      setMatchPrediction(prediction);
      setAnalysisState(AnalysisState.SUCCESS);
    }, 1000);
  };

  const handleCustomPrediction = async () => {
    if (!customPredictionInput.trim() || !selectedMatch) return;
    
    const userMessage = customPredictionInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setCustomPredictionInput('');
    setLoadingCustomPrediction(true);
    setChatOpen(true);
    
    // Simulation d'une réponse IA
    setTimeout(() => {
      const aiResponse = `Pour ${selectedMatch?.teams}, voici une analyse personnalisée basée sur votre demande : "${userMessage}". Les statistiques récentes montrent une tendance favorable avec un taux de réussite de 68%. Je recommande de considérer les facteurs de forme, les blessures et les confrontations directes pour affiner votre stratégie.`;
      setChatMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setLoadingCustomPrediction(false);
    }, 1500);
  };

  const handleChatInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loadingCustomPrediction && customPredictionInput.trim()) {
      handleCustomPrediction();
    }
  };

  const handleBackToSports = () => {
    setSelectedSport(null);
    setMatches([]);
    setResult(null);
    setSelectedMatch(null);
    setMatchPrediction(null);
    setAnalysisState(AnalysisState.IDLE);
    setError(null);
  };

  const handleBackToMatches = () => {
    setSelectedMatch(null);
    setMatchPrediction(null);
    setComingSoonSport(null);
    setSelectedSport(null);
    setAnalysisState(AnalysisState.IDLE);
    setError(null);
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
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center">
          <Logo />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Intro */}
        {!selectedSport && (
          <section className="text-center mb-12">
          <h2 className="text-4xl sm:text-6xl font-spartan font-black leading-[0.9] mb-4 tracking-tighter uppercase italic">
            Choisissez <br className="sm:hidden" /> le meilleur <span className="text-paria">Pari.</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium tracking-tight">Analyse statistique brute pour parieurs exigeants.</p>
        </section>
        )}

        {/* Sport Blocks or Matches List */}
        {!selectedSport ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-20">
            {SPORTS.map((sport) => (
              <button
                key={sport.id}
                onClick={() => handleSportClick(sport.name)}
                disabled={loadingMatches}
                className="border border-slate-100 rounded-2xl p-8 custom-shadow bg-white hover:border-paria/40 transition-all flex flex-col items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                  {sport.emoji}
                </div>
                <div className="text-xl font-black uppercase tracking-tight text-black font-spartan italic">
                  {sport.name}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-20">
            {/* Back Button */}
            <button
              onClick={handleBackToSports}
              className="mb-6 flex items-center gap-2 text-slate-400 hover:text-paria transition-colors font-bold text-xs uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Retour aux sports
            </button>

            {/* Sport Title */}
            <div className="text-center mb-8">
              <h3 className="text-3xl sm:text-4xl font-spartan font-black tracking-tighter uppercase italic mb-2">
                {selectedSport}
              </h3>
              <p className="text-slate-400 text-sm font-medium tracking-tight">Matchs à venir</p>
            </div>

            {/* Matches List */}
            {loadingMatches ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-20 bg-slate-50 rounded-2xl border border-slate-100"></div>
                ))}
              </div>
            ) : matches.length > 0 ? (
              <div className="space-y-3">
                {matches.map((match, index) => (
                  <button
                    key={index}
                    onClick={() => handleMatchClick(match, selectedSport || undefined)}
                    className="w-full border border-slate-100 rounded-2xl p-6 custom-shadow bg-white hover:border-paria/40 transition-all text-left group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-lg font-black text-black tracking-tight mb-2 group-hover:text-paria transition-colors">
                          {match.teams}
                        </div>
                        {match.competition && (
                          <div className="text-[10px] font-black uppercase text-slate-300 tracking-widest font-spartan italic">
                            {match.competition}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-1">Date</div>
                          <div className="text-sm font-black text-black">{match.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-1">Heure</div>
                          <div className="text-sm font-black text-paria">{match.time}</div>
                        </div>
                        <div className="text-paria group-hover:translate-x-1 transition-transform">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm font-medium">
                Aucun match à venir pour le moment.
            </div>
          )}
        </div>
        )}

        {/* Coming Soon Message for Tennis and Basketball */}
        {comingSoonSport && (
          <div className="mb-12">
            {/* Back Button */}
            <button
              onClick={handleBackToMatches}
              className="mb-6 flex items-center gap-2 text-slate-400 hover:text-paria transition-colors font-bold text-xs uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Retour aux sports
            </button>

            {/* Sport Title */}
            {!selectedMatch && (
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-spartan font-black tracking-tighter uppercase italic mb-2">
                  {comingSoonSport}
                </h2>
              </div>
            )}

            {/* Match Title (if match is selected) */}
            {selectedMatch && (
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-spartan font-black tracking-tighter uppercase italic mb-2">
                  {selectedMatch.teams}
                </h2>
                <div className="flex items-center justify-center gap-4 text-sm text-slate-400 font-medium">
                  <span>{selectedMatch.date}</span>
                  <span>•</span>
                  <span>{selectedMatch.time}</span>
                  {selectedMatch.competition && (
                    <>
                      <span>•</span>
                      <span className="uppercase tracking-widest text-[10px]">{selectedMatch.competition}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Coming Soon Message */}
            <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 custom-shadow text-center">
              <div className="max-w-md mx-auto space-y-6">
                <div>
                  <h3 className="text-2xl font-spartan font-black uppercase tracking-tight italic mb-3">
                    En cours de développement
                  </h3>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Notre équipe d'experts travaille dessus.<br />
                    Ça arrive bientôt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Match Prediction Interface */}
        {selectedMatch && matchPrediction && analysisState === AnalysisState.SUCCESS && !comingSoonSport && (
          <div ref={resultRef} className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 mb-12">
            {/* Back Button */}
            <button
              onClick={handleBackToMatches}
              className="flex items-center gap-2 text-slate-400 hover:text-paria transition-colors font-bold text-xs uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              Retour aux matchs
            </button>

            {/* Match Title */}
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-spartan font-black tracking-tighter uppercase italic mb-2">
                {selectedMatch.teams}
              </h2>
              <div className="flex items-center justify-center gap-4 text-sm text-slate-400 font-medium">
                <span>{selectedMatch.date}</span>
                <span>•</span>
                <span>{selectedMatch.time}</span>
                {selectedMatch.competition && (
                  <>
                    <span>•</span>
                    <span className="uppercase tracking-widest text-[10px]">{selectedMatch.competition}</span>
                  </>
                )}
              </div>
            </div>

            {/* Overall Reliability Bar */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 custom-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-spartan italic">Fiabilité Globale</span>
                <span className="text-xl font-black text-paria">{matchPrediction.overallReliability}%</span>
              </div>
              <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-paria transition-all duration-1000 ease-out" 
                  style={{ width: `${matchPrediction.overallReliability}%` }}
                ></div>
              </div>
            </div>

            {/* 3 Prediction Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {matchPrediction.predictions.map((pred, index) => (
                <div key={index} className="border border-slate-100 rounded-2xl p-6 custom-shadow bg-white hover:border-paria/40 transition-all flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 font-spartan italic">
                      {pred.title}
                    </span>
                    <div className="bg-paria text-white font-black px-2 py-0.5 rounded-md text-[10px]">
                      COTE {pred.odds}
                    </div>
                  </div>
                  <div className="text-xl font-bold leading-tight text-black tracking-tight">
                    {pred.bet}
                  </div>
                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Confidence</span>
                      <span className="text-xs font-black text-paria">{pred.confidence}%</span>
                    </div>
                    <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-paria transition-all duration-1000 ease-out" 
                        style={{ width: `${pred.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Explanations Section */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 custom-shadow">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1.5 h-10 bg-paria rounded-full"></div>
                <h3 className="font-spartan text-2xl font-black uppercase tracking-tight italic">Explications</h3>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed font-medium mb-8">
                {matchPrediction.explanations}
              </div>
              
              {/* Individual Predictions Explanations */}
              <div className="space-y-4 mb-8">
                {matchPrediction.predictions.map((pred, index) => (
                  <div key={index} className="border-l-2 border-paria/30 pl-4 py-2">
                    <div className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1 font-spartan italic">
                      {pred.title}
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed font-medium">
                      {pred.explanation}
                    </div>
                  </div>
                ))}
              </div>

              {/* Vigilance Points */}
              <div className="border-t border-slate-100 pt-8">
                <h4 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-4 font-spartan italic">Points de Vigilance</h4>
                <div className="space-y-2">
                  {matchPrediction.vigilancePoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                      <span className="text-paria mt-1">•</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
          </div>
        </div>

          </div>
        )}

        {/* Loading State with Mascot */}
        {analysisState === AnalysisState.LOADING && selectedMatch && (
          <div className="mb-12">
            <MascotLoader />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-center font-bold text-xs border border-red-100 mb-8">
            {error}
          </div>
        )}
      </main>

      {/* Chat Sidebar */}
      {selectedMatch && matchPrediction && analysisState === AnalysisState.SUCCESS && !comingSoonSport && chatOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div 
            className="flex-1 bg-black/20 backdrop-blur-sm"
            onClick={() => setChatOpen(false)}
          ></div>
          
          {/* Chat Panel */}
          <div className="w-full max-w-md bg-white border-l border-slate-100 flex flex-col shadow-2xl">
            {/* Chat Header */}
            <div className="border-b border-slate-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-paria/10 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src="/ia-paria.png" 
                    alt="Paria" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight font-spartan italic">Paria</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Assistant de prédiction</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-400 font-medium">Commencez une conversation pour obtenir des prédictions personnalisées</p>
                </div>
              ) : (
                <>
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-paria text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <p className="text-sm font-medium leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {loadingCustomPrediction && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-slate-100 p-4">
              <div className="bg-white border-2 border-slate-50 rounded-full p-2 custom-shadow flex items-center focus-within:border-paria/30 transition-all">
                <input
                  type="text"
                  placeholder="Tapez votre message..."
                  className="flex-1 bg-transparent px-4 py-2 outline-none font-semibold text-sm text-slate-800 placeholder:text-slate-300"
                  value={customPredictionInput}
                  onChange={(e) => setCustomPredictionInput(e.target.value)}
                  onKeyDown={handleChatInputKeyDown}
                />
                <button
                  onClick={handleCustomPrediction}
                  disabled={loadingCustomPrediction || !customPredictionInput.trim()}
                  className="w-10 h-10 bg-paria rounded-full flex items-center justify-center text-white hover:brightness-110 transition-all disabled:opacity-50 flex-shrink-0"
                >
                  {loadingCustomPrediction ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Prediction Chatbar */}
      {selectedMatch && matchPrediction && analysisState === AnalysisState.SUCCESS && !comingSoonSport && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-50 z-40">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="bg-white border-2 border-slate-50 rounded-full p-2 custom-shadow flex items-center focus-within:border-paria/30 transition-all">
              <input
                type="text"
                placeholder="Générer un prono personnalisé..."
                className="flex-1 bg-transparent px-6 py-3 outline-none font-semibold text-slate-800 placeholder:text-slate-300"
                value={customPredictionInput}
                onChange={(e) => setCustomPredictionInput(e.target.value)}
                onKeyDown={handleChatInputKeyDown}
                onFocus={() => setChatOpen(true)}
              />
              <button
                onClick={() => setChatOpen(true)}
                className="w-12 h-12 bg-paria rounded-full flex items-center justify-center text-white hover:brightness-110 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-16 pb-8 text-center border-t border-slate-50 pt-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-8 max-w-xl mx-auto mb-4 leading-relaxed">
          Les paris sportifs comportent des risques. Jouez de manière responsable. <br /> Paria analyse, vous décidez.
        </p>
      </footer>
    </div>
  );
};

export default App;
