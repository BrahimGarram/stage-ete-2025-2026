export interface Facture {
  id?: number;
  numeroFacture: string;
  dateFacture?: Date | string;
  periodeDebut?: Date | string;
  periodeFin?: Date | string;
  consommation: number;
  montant: number;
  statut: string;
  ancienIndex?: number;
  nouveauIndex?: number;
  compteur?: { id: number; numeroSerie?: string };
}
