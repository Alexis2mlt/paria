
export interface AnalysisResult {
  matchInfo: {
    teams: string;
    venue: string;
    weather: string;
    marketTrend: string;
  };
  scenarios: {
    safe: Scenario;
    balanced: Scenario;
    risky: Scenario;
  };
  eyeOfParia: {
    factorX: string;
    keyMoment: string;
    turnoverAlert: string;
  };
  sources: Array<{ title: string; uri: string }>;
  rawContent: string;
}

export interface Scenario {
  title: string;
  bet: string;
  odds: string;
  probability: string;
  confidence: number;
  justification: string;
  kelly: string;
}

export enum AnalysisState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
