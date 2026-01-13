
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
