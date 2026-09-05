export interface ForecastResult {
  annee: number;
  type: string;
  local: string;
  region: string;
  estime: number;
  bas: number;
  haut: number;
  montant: number;
  montantBas: number;
  montantHaut: number;
  warn: boolean;
  meteo: number;
  growth: number;
  activite: number;
}
