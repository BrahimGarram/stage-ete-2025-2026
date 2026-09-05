export interface OcrResult {
  numeroFacture?: string;
  dateFacture?: string;
  periodeDebut?: string;
  periodeFin?: string;
  consommation?: number;
  montant?: number;
  statut?: string;
  ancienIndex?: number;
  nouveauIndex?: number;
  rawText?: string;
  codePayeur?: string;
}
