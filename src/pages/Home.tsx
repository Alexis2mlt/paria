import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllMatches, SupabaseMatch } from '../../services/supabaseService';

const Home = () => {
    const [sportCounts, setSportCounts] = useState<{ [key: number]: number }>({ 1: 0, 2: 0 });

    useEffect(() => {
        fetchAllMatches().then(data => {
            const counts: { [key: number]: number } = { 1: 0, 2: 0 };
            data.forEach(m => {
                if (m.sport_id === 1) counts[1] = (counts[1] || 0) + 1;
                if (m.sport_id === 2) counts[2] = (counts[2] || 0) + 1;
            });
            setSportCounts(counts);
        });
    }, []);

    const sports = [
        { name: 'Football', id: 1, count: sportCounts[1], icon: <><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></> },
        { name: 'Rugby', id: 2, count: sportCounts[2], icon: <><path d="M12 2c5 0 9 4 9 10s-4 10-9 10-9-4-9-10 4-10 9-10z" /><path d="M12 2c2 4 2 16 0 20" /><path d="M2 12h20" /></> }, 
        { name: 'Basketball', id: null, count: 0, icon: <><circle cx="12" cy="12" r="10"/><line x1="14.3" y1="2.1" x2="8.4" y2="21.5"/><path d="M5.6 5.6l12.8 12.8"/><path d="M18.4 5.6L5.6 18.4"/></> },
        { name: 'Tennis', id: null, count: 0, icon: <><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></> },
        { name: 'Natation', id: null, count: 0, icon: <><path d="M2 12c.6 0 1.2.5 2 1s1.4.5 2 0 1.2-.5 2-1 1.4-.5 2 0 1.2.5 2 1 1.4.5 2 0"/><path d="M2 16c.6 0 1.2.5 2 1s1.4.5 2 0 1.2-.5 2-1 1.4-.5 2 0 1.2.5 2 1 1.4.5 2 0"/><path d="M2 8c.6 0 1.2.5 2 1s1.4.5 2 0 1.2-.5 2-1 1.4-.5 2 0 1.2.5 2 1 1.4.5 2 0"/></> },
        { name: 'MMA', id: null, count: 0, icon: <><path d="M14.5 2L10 10l-4-4"/><path d="M8.5 2L12 10l5 5"/><path d="M12 22l-4-4"/><path d="M4 14l8 8"/></> },
    ];

    return (
        <div className="animate-in fade-in zoom-in duration-500">
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
              {sports.map((s) => (
                 s.id ? (
                    <Link
                        key={s.name}
                        to={`/sport/${s.id}`}
                        className="group relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-paria transition-all duration-300 hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] hover:shadow-paria/20 text-left block"
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
                    </Link>
                 ) : (
                    <div key={s.name} className="group h-full [perspective:1000px] cursor-default">
                        <div className="relative h-full w-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                            {/* Face Avant (Désactivée) */}
                            <div className="relative h-full bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 [backface-visibility:hidden]">
                                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        {s.icon}
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black font-spartan text-slate-500 mb-1">{s.name}</h3>
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{s.count ?? 0} matchs disponibles</p>
                                </div>
                            </div>
                            
                            {/* Face Arrière (Message) */}
                            <div className="absolute inset-0 h-full w-full bg-[#0B1120] border border-paria/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-[0_0_30px_-10px_rgba(34,197,94,0.2)]">
                                <div className="w-12 h-12 rounded-full bg-paria/10 flex items-center justify-center mb-3">
                                    <svg className="w-6 h-6 text-paria" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <h3 className="text-white font-bold font-spartan text-sm uppercase tracking-widest leading-relaxed">
                                    Arrive<br/>
                                    <span className="text-paria">Prochainement</span>
                                </h3>
                            </div>
                        </div>
                    </div>
                 )
              ))}
            </div>
        </div>
    );
};

export default Home;
