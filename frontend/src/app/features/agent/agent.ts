import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CompteurService } from '../../services/compteur.service';
import { LocalService } from '../../services/local.service';
import { Compteur } from '../../models/Compteur';
import { Local } from '../../models/Local';

interface EtatStat {
  etat: string;
  value: number;
  pct: number;
}

@Component({
  selector: 'app-agent',
  imports: [FormsModule],
  templateUrl: './agent.html',
  styleUrl: './agent.css',
})
export class Agent implements OnInit {
  readonly etats = ['Actif', 'Panne', 'Maintenance', 'Retiré'];

  compteurs: Compteur[] = [];
  locals: Local[] = [];
  searchTerm = '';

  formVisible = false;
  editing: Compteur | null = null;
  formNumeroSerie = '';
  formType = '';
  formMarque = '';
  formDateInstallation = '';
  formEtat = 'Actif';
  selectedLocalId = 0;
  saving = false;
  message = '';
  error = '';

  constructor(
    private service: CompteurService,
    private localService: LocalService
  ) {}

  ngOnInit(): void {
    this.load();
    this.localService.getAll().subscribe({
      next: (data) => (this.locals = data),
      error: () => (this.error = 'Impossible de charger les locaux pour le formulaire.'),
    });
  }

  load(): void {
    this.service.getAll().subscribe({
      next: (data) => {
        this.compteurs = data;
        this.message = '';
        this.error = '';
      },
      error: () => (this.error = 'Impossible de charger les compteurs.'),
    });
  }

  get total(): number {
    return this.compteurs.length;
  }

  get actifs(): number {
    return this.compteurs.filter((c) => c.etat === 'Actif').length;
  }

  get horsService(): number {
    return this.total - this.actifs;
  }

  get marques(): number {
    return new Set(this.compteurs.map((c) => c.marque?.trim()).filter(Boolean)).size;
  }

  get etatStats(): EtatStat[] {
    const map = new Map<string, number>();
    this.compteurs.forEach((c) => {
      const etat = c.etat?.trim() || 'Inconnu';
      map.set(etat, (map.get(etat) ?? 0) + 1);
    });
    const total = this.total || 1;
    return Array.from(map.entries())
      .map(([etat, value]) => ({ etat, value, pct: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value);
  }

  get filtered(): Compteur[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.compteurs;
    return this.compteurs.filter((c) =>
      [c.numeroSerie, c.type, c.marque, c.etat, c.local?.nom]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }

  localName(compteur: Compteur): string {
    const nom = compteur.local?.nom;
    return nom ? nom : '—';
  }

  openCreate(): void {
    this.editing = null;
    this.resetForm();
    this.message = '';
    this.error = '';
    this.formVisible = true;
  }

  openEdit(compteur: Compteur): void {
    this.editing = compteur;
    this.formNumeroSerie = compteur.numeroSerie ?? '';
    this.formType = compteur.type ?? '';
    this.formMarque = compteur.marque ?? '';
    this.formDateInstallation = this.toDateInput(compteur.dateInstallation);
    this.formEtat = compteur.etat || 'Actif';
    this.selectedLocalId = compteur.local?.id ?? 0;
    this.message = '';
    this.error = '';
    this.formVisible = true;
  }

  closeForm(): void {
    this.formVisible = false;
    this.editing = null;
  }

  submit(): void {
    if (!this.formNumeroSerie.trim() || !this.formMarque.trim()) {
      this.error = 'Le numéro de série et la marque sont obligatoires.';
      return;
    }

    const editing = this.editing;
    this.saving = true;
    this.message = '';
    this.error = '';

    const payload: Compteur = {
      numeroSerie: this.formNumeroSerie.trim(),
      type: this.formType.trim(),
      marque: this.formMarque.trim(),
      dateInstallation: this.formDateInstallation || undefined,
      etat: this.formEtat,
      local: this.selectedLocalId ? { id: this.selectedLocalId } : undefined,
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
        next: () => onDone('Compteur mis à jour avec succès.'),
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || "Erreur lors de la mise à jour du compteur.";
        },
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => onDone('Compteur créé avec succès.'),
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || "Erreur lors de la création du compteur.";
        },
      });
    }
  }

  deleteCompteur(compteur: Compteur): void {
    if (!compteur.id) return;
    if (!confirm(`Supprimer le compteur « ${compteur.numeroSerie} » ?`)) return;
    this.service.delete(compteur.id).subscribe({
      next: () => {
        this.message = 'Compteur supprimé.';
        this.error = '';
        this.load();
      },
      error: () => (this.error = 'Impossible de supprimer ce compteur.'),
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

  isActif(etat?: string): boolean {
    return (etat || '').trim().toLowerCase() === 'actif';
  }

  private toDateInput(value?: Date | string): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  private resetForm(): void {
    this.formNumeroSerie = '';
    this.formType = '';
    this.formMarque = '';
    this.formDateInstallation = '';
    this.formEtat = 'Actif';
    this.selectedLocalId = 0;
  }
}
