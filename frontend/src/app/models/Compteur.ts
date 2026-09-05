export interface Compteur {
  id?: number;
  numeroSerie: string;
  type: string;
  marque: string;
  dateInstallation?: Date | string;
  etat: string;
  local?: { id: number; nom?: string };
  factures?: unknown[];
}
