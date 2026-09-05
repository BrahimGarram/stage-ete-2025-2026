import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocalService } from '../../services/local.service';
import { Local } from '../../models/Local';

interface RegionStat {
  region: string;
  value: number;
  pct: number;
}

@Component({
  selector: 'app-locaux',
  imports: [FormsModule],
  templateUrl: './locaux.html',
  styleUrl: './locaux.css',
})
export class Locaux implements OnInit {
  locals: Local[] = [];
  searchTerm = '';

  formVisible = false;
  editing: Local | null = null;
  formNom = '';
  formAdresse = '';
  formVille = '';
  formRegion = '';
  formDescription = '';
  saving = false;
  message = '';
  error = '';

  constructor(private service: LocalService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getAll().subscribe({
      next: (data) => {
        this.locals = data;
        this.message = '';
        this.error = '';
      },
      error: () => (this.error = 'Impossible de charger les locaux.'),
    });
  }

  get total(): number {
    return this.locals.length;
  }

  get avecCompteur(): number {
    return this.locals.filter((l) => (l.compteurs?.length ?? 0) > 0).length;
  }

  get sansCompteur(): number {
    return this.total - this.avecCompteur;
  }

  get villesCouvertes(): number {
    return new Set(this.locals.map((l) => l.ville?.trim()).filter(Boolean)).size;
  }

  get regionStats(): RegionStat[] {
    const map = new Map<string, number>();
    this.locals.forEach((l) => {
      const region = l.region?.trim() || 'Non renseignée';
      map.set(region, (map.get(region) ?? 0) + 1);
    });
    const total = this.total || 1;
    return Array.from(map.entries())
      .map(([region, value]) => ({ region, value, pct: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value);
  }

  get filtered(): Local[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.locals;
    return this.locals.filter((l) =>
      [l.nom, l.adresse, l.ville, l.region, l.description]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }

  openCreate(): void {
    this.editing = null;
    this.resetForm();
    this.message = '';
    this.error = '';
    this.formVisible = true;
  }

  openEdit(local: Local): void {
    this.editing = local;
    this.formNom = local.nom ?? '';
    this.formAdresse = local.adresse ?? '';
    this.formVille = local.ville ?? '';
    this.formRegion = local.region ?? '';
    this.formDescription = local.description ?? '';
    this.message = '';
    this.error = '';
    this.formVisible = true;
  }

  closeForm(): void {
    this.formVisible = false;
    this.editing = null;
  }

  submit(): void {
    if (!this.formNom.trim() || !this.formVille.trim()) {
      this.error = 'Le nom et la ville sont obligatoires.';
      return;
    }

    const editing = this.editing;
    this.saving = true;
    this.message = '';
    this.error = '';

    const payload: Local = {
      nom: this.formNom.trim(),
      adresse: this.formAdresse.trim(),
      ville: this.formVille.trim(),
      region: this.formRegion.trim(),
      description: this.formDescription.trim(),
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
        next: () => onDone('Local mis à jour avec succès.'),
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || "Erreur lors de la mise à jour du local.";
        },
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => onDone('Local créé avec succès.'),
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || "Erreur lors de la création du local.";
        },
      });
    }
  }

  deleteLocal(local: Local): void {
    if (!local.id) return;
    if (!confirm(`Supprimer le local « ${local.nom} » et ses compteurs ?`)) return;
    this.service.delete(local.id).subscribe({
      next: () => {
        this.message = 'Local supprimé.';
        this.error = '';
        this.load();
      },
      error: () => (this.error = 'Impossible de supprimer ce local.'),
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

  private resetForm(): void {
    this.formNom = '';
    this.formAdresse = '';
    this.formVille = '';
    this.formRegion = '';
    this.formDescription = '';
  }
}
