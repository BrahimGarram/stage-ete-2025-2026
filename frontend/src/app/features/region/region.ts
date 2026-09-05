import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FactureService } from '../../services/facture.service';
import { CompteurService } from '../../services/compteur.service';
import { Facture } from '../../models/Facture';
import { Compteur } from '../../models/Compteur';
import { OcrResult } from '../../models/OcrResult';
import { ForecastResult } from '../../models/ForecastResult';

interface StatutStat {
  statut: string;
  value: number;
  pct: number;
}

interface YearStat {
  annee: number;
  consommation: number;
  montant: number;
  count: number;
  pct: number;
  isMax: boolean;
}

@Component({
  selector: 'app-region',
  imports: [FormsModule, CommonModule],
  templateUrl: './region.html',
  styleUrl: './region.css',
})
export class Region implements OnInit {
  readonly statuts = ['Payée', 'En attente', 'Impayée'];

  factures: Facture[] = [];
  compteurs: Compteur[] = [];
  searchTerm = '';

  formVisible = false;
  editing: Facture | null = null;
  formNumeroFacture = '';
  formDateFacture = '';
  formPeriodeDebut = '';
  formPeriodeFin = '';
  formConsommation = 0;
  formMontant = 0;
  formStatut = 'Payée';
  formAncienIndex = 0;
  formNouveauIndex = 0;
  selectedCompteurId = 0;
  saving = false;
  message = '';
  error = '';
  ocrFile: File | null = null;
  ocrLoading = false;
  ocrMessage = '';
  ocrError = '';
  ocrResult: OcrResult | null = null;

  readonly forecastLocals = [
    { value: 'all', label: 'Tous les locaux' },
    { value: 'Local Tunis', label: 'Local Tunis' },
    { value: 'Local Bizerte', label: 'Local Bizerte' },
    { value: 'Local Ariana', label: 'Local Ariana' },
    { value: 'Local Manouba', label: 'Local Manouba' },
    { value: 'Local Nabeul', label: 'Local Nabeul' },
    { value: 'Local Cap Bon', label: 'Local Cap Bon' },
    { value: 'Local Sousse', label: 'Local Sousse' },
    { value: 'Local Monastir', label: 'Local Monastir' },
    { value: 'Local Sfax', label: 'Local Sfax' },
    { value: 'Local Gabès', label: 'Local Gabès' },
    { value: 'Local Kairouan', label: 'Local Kairouan' },
    { value: 'Local Kasserine', label: 'Local Kasserine' },
  ];

  activeTab: 'electricite' | 'eau' | 'gaz' = 'electricite';
  forecastAnnee = 2028;
  forecastLocal = 'all';

  forecastResults: ForecastResult[] = [];
  forecastLoading = false;
  forecastError = '';

  eauResults: ForecastResult[] = [];
  eauLoading = false;
  eauError = '';

  gazResults: ForecastResult[] = [];
  gazLoading = false;
  gazError = '';

  constructor(
    private service: FactureService,
    private compteurService: CompteurService
  ) {}

  ngOnInit(): void {
    this.load();
    this.compteurService.getAll().subscribe({
      next: (data) => (this.compteurs = data),
      error: () => (this.error = 'Impossible de charger les compteurs pour le formulaire.'),
    });
  }

  load(): void {
    this.service.getAll().subscribe({
      next: (data) => {
        this.factures = data;
        this.message = '';
        this.error = '';
      },
      error: () => (this.error = 'Impossible de charger les factures.'),
    });
  }

  get total(): number {
    return this.factures.length;
  }

  get montantTotal(): number {
    return this.factures.reduce((sum, f) => sum + (Number(f.montant) || 0), 0);
  }

  get payees(): number {
    return this.factures.filter((f) => f.statut === 'Payée').length;
  }

  get impayees(): number {
    return this.total - this.payees;
  }

  get consommationMoyenne(): number {
    if (this.total === 0) return 0;
    const sum = this.factures.reduce((acc, f) => acc + (Number(f.consommation) || 0), 0);
    return sum / this.total;
  }

  get statutStats(): StatutStat[] {
    const map = new Map<string, number>();
    this.factures.forEach((f) => {
      const statut = f.statut?.trim() || 'Inconnu';
      map.set(statut, (map.get(statut) ?? 0) + 1);
    });
    const total = this.total || 1;
    return Array.from(map.entries())
      .map(([statut, value]) => ({ statut, value, pct: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value);
  }

  get yearlyStats(): YearStat[] {
    const map = new Map<number, YearStat>();
    for (const f of this.factures) {
      const annee = this.anneeFacture(f);
      if (annee == null) continue;
      const cur =
        map.get(annee) ?? { annee, consommation: 0, montant: 0, count: 0, pct: 0, isMax: false };
      cur.consommation += Number(f.consommation) || 0;
      cur.montant += Number(f.montant) || 0;
      cur.count += 1;
      map.set(annee, cur);
    }
    const years = Array.from(map.values()).sort((a, b) => a.annee - b.annee);
    const max = years.reduce((m, y) => Math.max(m, y.consommation), 0);
    for (const y of years) {
      y.pct = max > 0 ? Math.round((y.consommation / max) * 100) : 0;
      y.isMax = max > 0 && y.consommation === max;
    }
    return years;
  }

  get yearlyTotal(): number {
    return this.yearlyStats.reduce((sum, y) => sum + y.consommation, 0);
  }

  get topYear(): YearStat | null {
    return this.yearlyStats.find((y) => y.isMax) ?? null;
  }

  get trendInfo(): { delta: number; prevAnnee: number } | null {
    const s = this.yearlyStats;
    if (s.length < 2) return null;
    const last = s[s.length - 1];
    const prev = s[s.length - 2];
    if (prev.consommation === 0) return null;
    return {
      delta: Math.round(((last.consommation - prev.consommation) / prev.consommation) * 100),
      prevAnnee: prev.annee,
    };
  }

  get filtered(): Facture[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.factures;
    return this.factures.filter((f) =>
      [f.numeroFacture, f.statut, f.compteur?.numeroSerie]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }

  compteurSerie(facture: Facture): string {
    return facture.compteur?.numeroSerie ?? '—';
  }

  openCreate(): void {
    this.editing = null;
    this.resetForm();
    this.resetOcrState();
    this.message = '';
    this.error = '';
    this.formVisible = true;
  }

  openEdit(facture: Facture): void {
    this.editing = facture;
    this.resetOcrState();
    this.formNumeroFacture = facture.numeroFacture ?? '';
    this.formDateFacture = this.toDateInput(facture.dateFacture);
    this.formPeriodeDebut = this.toDateInput(facture.periodeDebut);
    this.formPeriodeFin = this.toDateInput(facture.periodeFin);
    this.formConsommation = Number(facture.consommation) || 0;
    this.formMontant = Number(facture.montant) || 0;
    this.formStatut = facture.statut || 'Payée';
    this.formAncienIndex = Number(facture.ancienIndex) || 0;
    this.formNouveauIndex = Number(facture.nouveauIndex) || 0;
    this.selectedCompteurId = facture.compteur?.id ?? 0;
    this.message = '';
    this.error = '';
    this.formVisible = true;
  }

  closeForm(): void {
    this.formVisible = false;
    this.editing = null;
    this.resetOcrState();
  }

  onOcrFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.ocrFile = input.files?.[0] ?? null;
    this.ocrResult = null;
    this.ocrMessage = '';
    this.ocrError = '';
  }

  runOcr(): void {
    if (!this.ocrFile) {
      this.ocrError = "Choisissez d'abord une image de facture.";
      return;
    }
    this.ocrLoading = true;
    this.ocrMessage = '';
    this.ocrError = '';
    this.service.ocrExtract(this.ocrFile).subscribe({
      next: (result) => {
        this.ocrLoading = false;
        this.ocrResult = result;
        this.applyOcrResult(result);
        this.autoSelectCompteur(result.codePayeur, result.rawText);
        this.ocrMessage = result.rawText
          ? 'Analyse terminée. Vérifiez les champs ci-dessous.'
          : "Analyse terminée, mais aucun texte n'a été reconnu.";
      },
      error: (err) => {
        this.ocrLoading = false;
        this.ocrError = err.error?.message || "L'analyse de l'image a échoué.";
      },
    });
  }

  private applyOcrResult(result: OcrResult): void {
    if (result.numeroFacture) this.formNumeroFacture = result.numeroFacture;
    if (result.dateFacture) this.formDateFacture = result.dateFacture;
    if (result.periodeDebut) this.formPeriodeDebut = result.periodeDebut;
    if (result.periodeFin) this.formPeriodeFin = result.periodeFin;
    if (result.consommation != null) this.formConsommation = result.consommation;
    if (result.montant != null) this.formMontant = result.montant;
    if (result.statut && this.statuts.includes(result.statut)) this.formStatut = result.statut;
    if (result.ancienIndex != null) this.formAncienIndex = result.ancienIndex;
    if (result.nouveauIndex != null) this.formNouveauIndex = result.nouveauIndex;
  }

  private autoSelectCompteur(codePayeur?: string, rawText?: string): void {
    if (this.selectedCompteurId !== 0) return;

    if (codePayeur) {
      for (const compteur of this.compteurs) {
        if (compteur.id != null && compteur.numeroSerie === codePayeur) {
          this.selectedCompteurId = compteur.id;
          return;
        }
      }
    }

    if (rawText) {
      const normalized = rawText.toLowerCase();
      for (const compteur of this.compteurs) {
        if (compteur.id != null && compteur.numeroSerie && normalized.includes(compteur.numeroSerie.toLowerCase())) {
          this.selectedCompteurId = compteur.id;
          break;
        }
      }
    }
  }

  private resetOcrState(): void {
    this.ocrFile = null;
    this.ocrLoading = false;
    this.ocrMessage = '';
    this.ocrError = '';
    this.ocrResult = null;
  }

  runForecast(): void {
    if (!this.forecastAnnee || this.forecastAnnee < 2000) {
      this.forecastError = 'Année invalide.';
      return;
    }
    this.forecastLoading = true;
    this.forecastError = '';
    this.service
      .forecast({ annee: this.forecastAnnee, local: this.forecastLocal })
      .subscribe({
        next: (res) => { this.forecastLoading = false; this.forecastResults = res; },
        error: (err) => { this.forecastLoading = false; this.forecastError = err.error?.message || "Erreur."; },
      });
  }

  runForecastAll(): void {
    if (!this.forecastAnnee || this.forecastAnnee < 2000) {
      this.forecastError = 'Année invalide.';
      return;
    }
    this.forecastLocal = 'all';
    this.forecastLoading = true;
    this.forecastError = '';
    this.service
      .forecast({ annee: this.forecastAnnee, local: 'all' })
      .subscribe({
        next: (res) => { this.forecastLoading = false; this.forecastResults = res; },
        error: (err) => { this.forecastLoading = false; this.forecastError = err.error?.message || "Erreur."; },
      });
  }

  runEau(): void {
    if (!this.forecastAnnee || this.forecastAnnee < 2000) {
      this.eauError = 'Année invalide.';
      return;
    }
    this.eauLoading = true;
    this.eauError = '';
    this.service
      .forecastEau({ annee: this.forecastAnnee, local: this.forecastLocal })
      .subscribe({
        next: (res) => { this.eauLoading = false; this.eauResults = res; },
        error: (err) => { this.eauLoading = false; this.eauError = err.error?.message || "Erreur."; },
      });
  }

  runEauAll(): void {
    if (!this.forecastAnnee || this.forecastAnnee < 2000) {
      this.eauError = 'Année invalide.';
      return;
    }
    this.forecastLocal = 'all';
    this.eauLoading = true;
    this.eauError = '';
    this.service
      .forecastEau({ annee: this.forecastAnnee, local: 'all' })
      .subscribe({
        next: (res) => { this.eauLoading = false; this.eauResults = res; },
        error: (err) => { this.eauLoading = false; this.eauError = err.error?.message || "Erreur."; },
      });
  }

  runGaz(): void {
    if (!this.forecastAnnee || this.forecastAnnee < 2000) {
      this.gazError = 'Année invalide.';
      return;
    }
    this.gazLoading = true;
    this.gazError = '';
    this.service
      .forecastGaz({ annee: this.forecastAnnee, local: this.forecastLocal })
      .subscribe({
        next: (res) => { this.gazLoading = false; this.gazResults = res; },
        error: (err) => { this.gazLoading = false; this.gazError = err.error?.message || "Erreur."; },
      });
  }

  runGazAll(): void {
    if (!this.forecastAnnee || this.forecastAnnee < 2000) {
      this.gazError = 'Année invalide.';
      return;
    }
    this.forecastLocal = 'all';
    this.gazLoading = true;
    this.gazError = '';
    this.service
      .forecastGaz({ annee: this.forecastAnnee, local: 'all' })
      .subscribe({
        next: (res) => { this.gazLoading = false; this.gazResults = res; },
        error: (err) => { this.gazLoading = false; this.gazError = err.error?.message || "Erreur."; },
      });
  }

  bandPct(r: ForecastResult): number {
    if (!r || r.haut <= r.bas) return 50;
    const pct = ((r.estime - r.bas) / (r.haut - r.bas)) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  get forecastChartMax(): number {
    if (this.forecastResults.length === 0) return 1;
    return Math.max(...this.forecastResults.map(r => r.estime));
  }

  get forecastMontantMax(): number {
    if (this.forecastResults.length === 0) return 1;
    return Math.max(...this.forecastResults.map(r => r.montant));
  }

  get eauChartMax(): number {
    if (this.eauResults.length === 0) return 1;
    return Math.max(...this.eauResults.map(r => r.estime));
  }

  get eauMontantMax(): number {
    if (this.eauResults.length === 0) return 1;
    return Math.max(...this.eauResults.map(r => r.montant));
  }

  get gazChartMax(): number {
    if (this.gazResults.length === 0) return 1;
    return Math.max(...this.gazResults.map(r => r.estime));
  }

  get gazMontantMax(): number {
    if (this.gazResults.length === 0) return 1;
    return Math.max(...this.gazResults.map(r => r.montant));
  }

  submit(): void {
    if (!this.formNumeroFacture.trim() || !this.selectedCompteurId) {
      this.error = 'Le numéro de facture et le compteur sont obligatoires.';
      return;
    }

    const editing = this.editing;
    this.saving = true;
    this.message = '';
    this.error = '';

    const payload: Facture = {
      numeroFacture: this.formNumeroFacture.trim(),
      dateFacture: this.formDateFacture || undefined,
      periodeDebut: this.formPeriodeDebut || undefined,
      periodeFin: this.formPeriodeFin || undefined,
      consommation: this.formConsommation,
      montant: this.formMontant,
      statut: this.formStatut,
      ancienIndex: this.formAncienIndex || undefined,
      nouveauIndex: this.formNouveauIndex || undefined,
      compteur: { id: this.selectedCompteurId },
    };

    const onDone = (msg: string) => {
      this.saving = false;
      this.formVisible = false;
      this.editing = null;
      this.message = msg;
      this.load();
    };

    if (editing?.id) {
      this.service.update(editing.id, payload).subscribe({
        next: () => onDone('Facture mise à jour avec succès.'),
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || "Erreur lors de la mise à jour de la facture.";
        },
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => onDone('Facture créée avec succès.'),
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || "Erreur lors de la création de la facture.";
        },
      });
    }
  }

  deleteFacture(facture: Facture): void {
    if (!facture.id) return;
    if (!confirm(`Supprimer la facture « ${facture.numeroFacture} » ?`)) return;
    this.service.delete(facture.id).subscribe({
      next: () => {
        this.message = 'Facture supprimée.';
        this.error = '';
        this.load();
      },
      error: () => (this.error = 'Impossible de supprimer cette facture.'),
    });
  }

  formatDate(value?: Date | string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatMoney(value?: number): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND',
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatNumber(value?: number): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
  }

  isPayee(statut?: string): boolean {
    return (statut || '').trim().toLowerCase() === 'payée';
  }

  private toDateInput(value?: Date | string): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  private anneeFacture(f: Facture): number | null {
    const d = f.periodeFin
      ? new Date(f.periodeFin)
      : f.dateFacture
        ? new Date(f.dateFacture)
        : null;
    if (!d || Number.isNaN(d.getTime())) return null;
    return d.getFullYear();
  }

  private resetForm(): void {
    this.formNumeroFacture = '';
    this.formDateFacture = '';
    this.formPeriodeDebut = '';
    this.formPeriodeFin = '';
    this.formConsommation = 0;
    this.formMontant = 0;
    this.formStatut = 'Payée';
    this.formAncienIndex = 0;
    this.formNouveauIndex = 0;
    this.selectedCompteurId = 0;
  }
}
