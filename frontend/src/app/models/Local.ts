import { Compteur } from './Compteur';

export interface Local {
  id?: number;
  nom: string;
  adresse: string;
  ville: string;
  region: string;
  description: string;
  dateCreation?: Date | string;
  compteurs?: Compteur[];
}
