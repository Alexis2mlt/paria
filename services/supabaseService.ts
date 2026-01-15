
export interface SupabaseMatch {
	id: number;
	match_date: string;
	home_name: string;
	home_score: number;
	away_name: string;
	away_score: number;
	data: string;
	broadcaster: string;
}

// Mock data based on user provided JSON (Fallback)
const MOCK_MATCHES: SupabaseMatch[] = [
	{
		"id": 579,
		"match_date": "2025-08-16T17:00:00+00:00",
		"home_name": "Monaco",
		"home_score": 3,
		"away_name": "Le Havre",
		"away_score": 1,
		"broadcaster": "Ligue 1+ 3",
		"data": "Match: Monaco 3 - 1 Le Havre\nDate (UTC): 2025-08-16T17:00:00.000Z\nStatut: period=fullTime, matchTime=90' +9, isLive=false, unknownMatch=false\nHome: Monaco (MCO) score=3 rankStart=9\n- Colors: #D70032 / #FFFFFF\n- Logo: https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_9_512x512_ad7dd146950eee8eb68ea9588a674fe8.png\nAway: Le Havre (LHV) score=1 rankStart=13\n- Colors: #79BDE8 / #183360\n- Logo: https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_5_512x512_e9bf970697e022dcbd3d51e245f3682d.png\nDiffuseurs (local): Ligue 1+ 3",
	},
	{
		"id": 580,
		"match_date": "2025-08-16T19:05:00+00:00",
		"home_name": "Nice",
		"home_score": 0,
		"away_name": "Toulouse",
		"away_score": 1,
		"broadcaster": "Ligue 1+ 2",
		"data": "Match: Nice 0 - 1 Toulouse\nDate (UTC): 2025-08-16T19:05:00.000Z\nStatut: period=fullTime, matchTime=90' +9, isLive=false, unknownMatch=false\nHome: Nice (NIC) score=0 rankStart=14\n- Colors: #DA2128 / #2C2A29\n- Logo: https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_30_512x512_2ccb89a2f1fbad23e693d1c5d101a25d.png\nAway: Toulouse (TOU) score=1 rankStart=8\n- Colors: #3E2B57 / #FFFFFF\n- Logo: https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_16_512x512_a7be4e575396227614acc0ed47083503.png\nDiffuseurs (local): Ligue 1+ 2",
	},
	{
		"id": 581,
		"match_date": "2025-08-17T13:00:00+00:00",
		"home_name": "Brest",
		"home_score": 3,
		"away_name": "Lille",
		"away_score": 3,
		"broadcaster": "Ligue 1+ 3",
		"data": "Match: Brest 3 - 3 Lille\nDate (UTC): 2025-08-17T13:00:00.000Z\nStatut: period=fullTime, matchTime=90' +9, isLive=false, unknownMatch=false\nHome: Brest (BRS) score=3 rankStart=11\n- Colors: #D10A11 / #FFFFFF\n- Logo: https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_44_512x512_b8930455bc938de7b9f4e128e1036989.png\nAway: Lille (LIL) score=3 rankStart=4\n- Colors: #E41B13 / #211E5F\n- Logo: https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_158_512x512_39a605746d9cf4eb12d9cd4f63adb27c.png\nDiffuseurs (local): Ligue 1+ 3",
	},
	{
		"id": 582,
		"match_date": "2025-08-17T15:15:00+00:00",
		"home_name": "Angers",
		"home_score": 1,
		"away_name": "Paris FC",
		"away_score": 0,
		"broadcaster": "Ligue 1+ 6",
		"data": "Match: Angers 1 - 0 Paris FC\nDate (UTC): 2025-08-17T15:15:00.000Z\nStatut: period=fullTime, matchTime=90' +7, isLive=false, unknownMatch=false\nHome: Angers (ANR) score=1 rankStart=10\n- Colors: #000000 / #FFFFFF\n- Logo: https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_4_37_512x512_b5149d8c4312c158b2975298205510eb.png\nAway: Paris FC (PFC) score=0 rankStart=15\n- Colors: #0A0E2D / #FFFFFF\n- Logo: https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_4_90_512x512_8b2bb52cf67eb9456c794509c7e58c46.png\nDiffuseurs (local): Ligue 1+ 6",
	},
	{
		"id": 583,
		"match_date": "2025-08-17T15:15:00+00:00",
		"home_name": "Auxerre",
		"home_score": 1,
		"away_name": "Lorient",
		"away_score": 0,
		"broadcaster": "Ligue 1+ 5",
		"data": "Match: Auxerre 1 - 0 Lorient\nDate (UTC): 2025-08-17T15:15:00.000Z\nStatut: period=fullTime, matchTime=90' +10, isLive=false, unknownMatch=false\nHome: Auxerre (AUX) score=1 rankStart=17\n- Colors: #164194 / #FFFFFF\n- Logo: https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_4_2_512x512_4bed22ddd777a8b0977284bee7f416a7.png\nAway: Lorient (LOR) score=0 rankStart=12\n- Colors: #EB740E / #2C2723\n- Logo: https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_7_512x512_7d0c497c5f41d0dcf5dabad2910699e3.png\nDiffuseurs (local): Ligue 1+ 5",
	},
	{
		"id": 584,
		"match_date": "2025-08-17T15:15:00+00:00",
		"home_name": "Metz",
		"home_score": 0,
		"away_name": "Strasbourg",
		"away_score": 1,
		"broadcaster": "Ligue 1+ 4",
		"data": "Match: Metz 0 - 1 Strasbourg\nDate (UTC): 2025-08-17T15:15:00.000Z\nStatut: period=fullTime, matchTime=90' +8, isLive=false, unknownMatch=false\nHome: Metz (MET) score=0 rankStart=18\n- Colors: #730F14 / #FFFFFF\n- Logo: https://s3.eu-west-1.amazonaws.com/image.mpg/2024_145_512x512.png\nAway: Strasbourg (SBG) score=1 rankStart=7\n- Colors: #009EE2 / #DB2F34\n- Logo: https://s3.eu-west-1.amazonaws.com/image.mpg/assets/clubs/logo/2023_1_15_512x512_e9553990e86d8098a3cf94febe8b4b96.png\nDiffuseurs (local): Ligue 1+ 4",
	}
];

export const fetchFootballMatches = async (): Promise<SupabaseMatch[]> => {
	const SUPABASE_URL = "https://lfmdvopbdldxisnobwqj.supabase.co/rest/v1/matches?select=*";
	const API_KEY = "sb_publishable_jlz0JQrd76qt4mlnzs-uWA_WanyOsQR"; // Provided by user

	if (!SUPABASE_URL) {
		console.warn("Supabase URL is missing. Returning mock data.");
		return new Promise(resolve => setTimeout(() => resolve(MOCK_MATCHES), 500));
	}

	try {
		const response = await fetch(SUPABASE_URL, {
			method: "GET",
			headers: {
				"apikey": API_KEY,
				"Authorization": `Bearer ${API_KEY}`,
				"Content-Type": "application/json"
			}
		});

		if (!response.ok) {
			throw new Error(`Error fetching matches: ${response.statusText}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Failed to fetch matches:", error);
		// Fallback to mock data for demo purposes
		return MOCK_MATCHES;
	}
};

export const extractLogos = (matchData: string): { homeLogo: string, awayLogo: string } => {
	const homeLogoMatch = matchData.match(/Home:.*?- Logo: (http[^\n]+)/s);
	const awayLogoMatch = matchData.match(/Away:.*?- Logo: (http[^\n]+)/s);

	// Alternative regex if the first one fails due to newlines
	const homeLogo = homeLogoMatch ? homeLogoMatch[1].trim() : "";
	const awayLogo = awayLogoMatch ? awayLogoMatch[1].trim() : "";

	return { homeLogo, awayLogo };
};
