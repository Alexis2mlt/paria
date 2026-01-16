import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchAllMatches, SupabaseMatch, extractLogos, extractLeague, isUpcomingMatch } from '../../services/supabaseService';

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

const MatchList = () => {
    const { sportId } = useParams<{ sportId: string }>();
    const navigate = useNavigate();
    const [matches, setMatches] = useState<SupabaseMatch[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [inputPage, setInputPage] = useState('');

    const handleInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const page = parseInt(inputPage);
        if (page >= 1 && page <= totalPages) {
            handlePageChange(page);
            setInputPage('');
        }
    };

    useEffect(() => {
        if (sportId) {
            fetchAllMatches().then(data => {
                // Filter by sport
                let filtered = data.filter(m => m.sport_id === parseInt(sportId));
                
                // Filter for upcoming matches (preMatch)
                filtered = filtered.filter(isUpcomingMatch);
                
                // Sort chronologically (soonest first)
                filtered.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

                setMatches(filtered);
            });
        }
    }, [sportId]);

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

    const sportName = sportId === '1' ? 'Football' : sportId === '2' ? 'Rugby' : 'Sport';

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
            {/* Header / Back */}
            <div className="mb-8">
                <Link 
                    to="/"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-medium group"
                >
                    <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    Retour aux sports
                </Link>
                <h2 className="text-3xl font-spartan font-black text-white">
                    Matchs de <span className="text-paria">{sportName}</span>
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                    {matches.length} matchs disponibles • Page {currentPage}/{totalPages}
                </p>
            </div>

            {/* Matches List */}
            <div className="space-y-4 mb-12">
                {paginatedMatches.map((match) => {
                    const { homeLogo, awayLogo } = extractLogos(match.data);
                    const league = extractLeague(match.data, match.sport_id);
                    return (
                        <Link 
                            key={match.id} 
                            to={`/match/${match.id}`}
                            className="block group bg-slate-900 border border-slate-800 hover:border-paria/50 rounded-2xl p-0 overflow-hidden transition-all cursor-pointer hover:shadow-lg hover:shadow-paria/5"
                        >
                            {/* Header: Competition */}
                            <div className="px-6 py-3 border-b border-slate-800/50 bg-slate-900/50 flex justify-between items-center bg-gradient-to-r from-slate-900 via-slate-900 to-transparent">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-paria transition-colors">
                                    {league}
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
                        </Link>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 pt-8 border-t border-slate-800/50">
                    
                    {/* Navigation Group */}
                    <div className="flex items-center gap-2">
                        {/* Prev */}
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)} 
                            disabled={currentPage === 1}
                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-paria disabled:opacity-50 disabled:hover:border-slate-800 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>

                        {/* First Pages (1, 2, 3) */}
                        {[1, 2, 3].map(page => page <= totalPages && (
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
                    </div>

                    {/* Input Group */}
                    <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800/50 backdrop-blur-sm">
                        <span className="text-slate-500 text-xs font-bold uppercase px-2 tracking-wider">
                            Page <span className="text-white">{currentPage}</span> / {totalPages}
                        </span>
                        <div className="h-4 w-px bg-slate-800"></div>
                        <form onSubmit={handleInputSubmit} className="flex grid-cols-1">
                            <input 
                                type="number" 
                                min="1" 
                                max={totalPages}
                                value={inputPage}
                                onChange={(e) => setInputPage(e.target.value)}
                                placeholder="Go..."
                                className="w-16 bg-slate-800 text-white rounded-lg px-2 py-1.5 text-xs font-bold text-center outline-none focus:ring-1 focus:ring-paria/50 transition-all placeholder:text-slate-600"
                            />
                        </form>
                    </div>

                    {/* End Group */}
                    <div className="flex items-center gap-2">
                        {totalPages > 3 && (
                             <>
                                {totalPages > 4 && <span className="text-slate-600 font-black tracking-widest text-xs">...</span>}
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
                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-paria disabled:opacity-50 disabled:hover:border-slate-800 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};

export default MatchList;
