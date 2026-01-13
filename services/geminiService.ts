
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Tu es PARIA, un assistant d’analyse de paris sportifs football orienté VALUE BET, pensé comme un PRODUIT grand public premium, simple, clair et visuel.

OBJECTIF :
→ Aider l’utilisateur à choisir UN pari pertinent en quelques secondes.
→ Pas de jargon inutile, transparence sur les risques.
→ RÉPONSE SANS AUCUN MARQUAGE MARKDOWN (INTERDICTION ABSOLUE DE **, #, __, etc.).

STRUCTURE DE RÉPONSE OBLIGATOIRE (ZÉRO MARKDOWN) :

BLOCK 1: PARI SÛR
Pari : [Détail court]
Cote : [X.XX]
Confiance : [X]%

BLOCK 2: PARI ÉQUILIBRÉ
Pari : [Détail court]
Cote : [X.XX]
Confiance : [X]%

BLOCK 3: PARI AUDACIEUX
Pari : [Détail court]
Cote : [X.XX]
Confiance : [X]%

⬇️ JUSTIFICATION RAPIDE
• Séries & dynamique : [Texte fluide sans gras]
• Blessures & absences : [Texte fluide sans gras]
• Points de vigilance : [Texte fluide sans gras]
• Sources : Flashscore, Winamax, Parions Sport.

CONSIGNES :
- NE JAMAIS UTILISER DE SYMBOLES DE MISE EN FORME (PAS DE **).
- Utilise des tirets ou des puces simples.
- 3 BLOCS MAXIMUM.
- Répondre en français.
`;

export const analyzeMatch = async (input: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyse ce match avec des données EN DIRECT de ce jour : ${input}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const text = response.text || "Erreur de génération.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source",
      uri: chunk.web?.uri || "#"
    })) || [];

    return { text, sources };
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    throw error;
  }
};

export const getTodaysMatches = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: "Quels sont les 5 plus gros matchs de football européens (LDC, Ligue 1, Premier League, Liga, Serie A) prévus pour AUJOURD'HUI ou DEMAIN ? Donne uniquement les noms des matchs séparés par des virgules, sans aucun autre texte. Vérifie bien que les matchs ne sont pas déjà passés.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text?.split(',').map(s => s.trim()) || [];
  } catch (e) {
    return ["Manchester City vs United", "Liverpool vs Chelsea", "Inter vs Milan", "Bayern vs Leverkusen"];
  }
};

export interface Match {
  teams: string;
  date: string;
  time: string;
  competition?: string;
}

export const getUpcomingMatches = async (sport: string): Promise<Match[]> => {
  // Pour tester le design, on retourne directement les matchs fictifs
  // Décommenter le code ci-dessous pour utiliser l'API réelle
  return getDefaultMatches(sport);

  /* 
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const sportQueries: Record<string, string> = {
      'Football': 'football européen (Ligue 1, Premier League, Liga, Serie A, Bundesliga, LDC)',
      'Rugby': 'rugby (Top 14, Champions Cup, Six Nations)',
      'Tennis': 'tennis (ATP, WTA, Grand Chelem)',
      'MMA': 'MMA (UFC, Bellator)',
      'Basketball': 'basketball (NBA, EuroLeague, LNB)',
      'Boxe': 'boxe (combats professionnels)'
    };

    const query = sportQueries[sport] || sport;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Donne-moi les 10 prochains matchs/événements de ${query} à venir dans les 7 prochains jours. Pour chaque match, donne-moi le format exact suivant (une ligne par match) :
ÉQUIPE1 vs ÉQUIPE2 | DATE (format JJ/MM) | HEURE (format HH:MM) | COMPÉTITION

Exemple :
Paris Saint-Germain vs Marseille | 15/12 | 21:00 | Ligue 1

Réponds UNIQUEMENT avec ce format, sans texte supplémentaire.`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const text = response.text || '';
    const matches: Match[] = [];
    
    text.split('\n').forEach(line => {
      const match = line.trim();
      if (match && match.includes('|')) {
        const parts = match.split('|').map(p => p.trim());
        if (parts.length >= 3) {
          matches.push({
            teams: parts[0],
            date: parts[1] || '',
            time: parts[2] || '',
            competition: parts[3] || undefined
          });
        }
      }
    });

    return matches.length > 0 ? matches : getDefaultMatches(sport);
  } catch (e) {
    console.error("Error fetching matches:", e);
    return getDefaultMatches(sport);
  }
  */
};

const getDefaultMatches = (sport: string): Match[] => {
  const defaults: Record<string, Match[]> = {
    'Football': [
      { teams: 'Paris Saint-Germain vs Marseille', date: 'Aujourd\'hui', time: '21:00', competition: 'Ligue 1' },
      { teams: 'Real Madrid vs Barcelona', date: 'Demain', time: '21:00', competition: 'La Liga' },
      { teams: 'Manchester City vs Liverpool', date: '20/12', time: '17:30', competition: 'Premier League' },
      { teams: 'Bayern Munich vs Borussia Dortmund', date: '21/12', time: '18:30', competition: 'Bundesliga' },
      { teams: 'Inter Milan vs AC Milan', date: '22/12', time: '20:45', competition: 'Serie A' },
      { teams: 'Atletico Madrid vs Sevilla', date: '23/12', time: '19:00', competition: 'La Liga' },
      { teams: 'Arsenal vs Chelsea', date: '24/12', time: '16:00', competition: 'Premier League' },
      { teams: 'Juventus vs Napoli', date: '25/12', time: '20:45', competition: 'Serie A' },
    ],
    'Rugby': [
      { teams: 'Toulouse vs La Rochelle', date: 'Aujourd\'hui', time: '15:00', competition: 'Top 14' },
      { teams: 'Racing 92 vs Stade Français', date: 'Demain', time: '16:00', competition: 'Top 14' },
      { teams: 'Leinster vs Munster', date: '20/12', time: '15:30', competition: 'Champions Cup' },
      { teams: 'Bordeaux-Bègles vs Lyon', date: '21/12', time: '18:00', competition: 'Top 14' },
      { teams: 'Clermont vs Montpellier', date: '22/12', time: '15:00', competition: 'Top 14' },
      { teams: 'Toulon vs Castres', date: '23/12', time: '16:30', competition: 'Top 14' },
    ],
    'Tennis': [
      { teams: 'Djokovic vs Alcaraz', date: 'Aujourd\'hui', time: '14:00', competition: 'ATP Masters 1000' },
      { teams: 'Swiatek vs Sabalenka', date: 'Demain', time: '15:00', competition: 'WTA Finals' },
      { teams: 'Medvedev vs Sinner', date: '20/12', time: '16:30', competition: 'ATP Masters 1000' },
      { teams: 'Gauff vs Pegula', date: '21/12', time: '14:00', competition: 'WTA Finals' },
      { teams: 'Tsitsipas vs Rublev', date: '22/12', time: '15:30', competition: 'ATP Masters 1000' },
      { teams: 'Rybakina vs Krejcikova', date: '23/12', time: '13:00', competition: 'WTA Finals' },
    ],
    'MMA': [
      { teams: 'Jon Jones vs Stipe Miocic', date: 'Demain', time: '23:00', competition: 'UFC 295' },
      { teams: 'Islam Makhachev vs Charles Oliveira', date: '20/12', time: '22:00', competition: 'UFC Fight Night' },
      { teams: 'Alex Pereira vs Jiri Prochazka', date: '21/12', time: '23:30', competition: 'UFC 296' },
      { teams: 'Leon Edwards vs Colby Covington', date: '22/12', time: '04:00', competition: 'UFC 296' },
      { teams: 'Amanda Nunes vs Julianna Pena', date: '23/12', time: '03:00', competition: 'UFC Fight Night' },
    ],
    'Basketball': [
      { teams: 'Lakers vs Warriors', date: 'Aujourd\'hui', time: '03:00', competition: 'NBA' },
      { teams: 'Celtics vs Heat', date: 'Demain', time: '01:30', competition: 'NBA' },
      { teams: 'ASVEL vs Monaco', date: '20/12', time: '20:00', competition: 'Betclic Élite' },
      { teams: 'Bucks vs Nuggets', date: '21/12', time: '02:00', competition: 'NBA' },
      { teams: 'Suns vs Mavericks', date: '22/12', time: '03:30', competition: 'NBA' },
      { teams: 'Bourg vs Paris', date: '23/12', time: '20:00', competition: 'Betclic Élite' },
      { teams: '76ers vs Knicks', date: '24/12', time: '01:00', competition: 'NBA' },
    ],
    'Boxe': [
      { teams: 'Tyson Fury vs Oleksandr Usyk', date: 'Demain', time: '22:00', competition: 'Championnat du monde' },
      { teams: 'Canelo vs Benavidez', date: '20/12', time: '04:00', competition: 'Championnat du monde' },
      { teams: 'Joshua vs Wilder', date: '21/12', time: '23:00', competition: 'Championnat du monde' },
      { teams: 'Inoue vs Tapales', date: '22/12', time: '12:00', competition: 'Championnat du monde' },
      { teams: 'Beterbiev vs Bivol', date: '23/12', time: '03:00', competition: 'Championnat du monde' },
    ],
  };

  return defaults[sport] || defaults['Football'];
};
