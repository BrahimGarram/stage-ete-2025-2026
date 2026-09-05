import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/User';
import { normalizeRole } from '../../guards/auth.guard';

interface RoleCounts {
  admin: number;
  agent: number;
  chef_local: number;
  chef_region: number;
}

interface RoleSegment {
  role: keyof RoleCounts;
  value: number;
  pct: number;
  color: string;
  dash: number;
  gap: number;
  offset: number;
}

const ROLE_ORDER: Array<keyof RoleCounts> = ['admin', 'chef_region', 'chef_local', 'agent'];
const ROLE_COLORS: Record<keyof RoleCounts, string> = {
  admin: '#0b2d5c',
  chef_region: '#123a72',
  chef_local: '#e8a33d',
  agent: '#3f7d5c',
};
const DONUT_RADIUS = 42;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

@Component({
  selector: 'app-admin',
  imports: [FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit, AfterViewInit, OnDestroy {
  readonly roleLabels: Record<string, string> = {
    admin: 'Administrateur',
    chef_region: 'Chef de région',
    chef_local: 'Chef local',
    agent: 'Agent',
  };

  readonly donutCircumference = DONUT_CIRCUMFERENCE;

  readonly cards: Array<{
    label: string;
    sub: string;
    chip: string;
    backTitle: string;
    color: string;
  }> = [
    {
      label: 'Total utilisateurs',
      sub: 'Tous rôles confondus',
      chip: 'Comptes',
      backTitle: 'Répartition totale',
      color: 'color-navy',
    },
    {
      label: 'Comptes actifs',
      sub: 'Comptes opérationnels',
      chip: 'Opérationnel',
      backTitle: 'Actifs par rôle',
      color: 'color-green',
    },
    {
      label: 'Comptes inactifs',
      sub: 'À réactiver',
      chip: 'À surveiller',
      backTitle: 'Inactifs par rôle',
      color: 'color-red',
    },
    {
      label: "Taux d'activation",
      sub: 'Plateforme opérationnelle',
      chip: 'Santé',
      backTitle: 'Résumé rapide',
      color: 'color-gold',
    },
  ];

  users: User[] = [];
  activeRoleFilter = 'all';
  activeStatusFilter = 'all';
  searchTerm = '';

  total = 0;
  actifs = 0;
  inactifs = 0;
  byRole: RoleCounts = { admin: 0, agent: 0, chef_local: 0, chef_region: 0 };
  activeByRole: RoleCounts = { admin: 0, agent: 0, chef_local: 0, chef_region: 0 };
  inactiveByRole: RoleCounts = { admin: 0, agent: 0, chef_local: 0, chef_region: 0 };

  flippedCard: number | null = null;
  activeRole: string | null = null;
  donutPop = false;

  editingUser: User | null = null;

  formNom = '';
  formPrenom = '';
  formEmail = '';
  formPassword = '';
  formPhone = 0;
  formActif = true;
  formRole = 'agent';
  formMessage = '';
  formError = '';
  submitting = false;

  private syncIntervalId?: ReturnType<typeof setInterval>;
  private secondsSinceSync = 0;

  constructor(
    private host: ElementRef<HTMLElement>,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    this.setupTilt();
    this.setupSyncBadge();
  }

  ngOnDestroy(): void {
    clearInterval(this.syncIntervalId);
  }

  private loadUsers(): void {
    this.authService.getAllusers().subscribe({
      next: (data) => {
        this.users = data.map((user) => ({
          ...user,
          role: normalizeRole(user.role),
        }));
        this.authService.setStoredUsers(this.users);
        this.computeStats();
      },
      error: () => {
        this.users = this.authService.getStoredUsers().map((user) => ({
          ...user,
          role: normalizeRole(user.role),
        }));
        this.computeStats();
      },
    });
  }

  private computeStats(): void {
    this.total = this.users.length;
    this.actifs = this.users.filter((user) => user.actif).length;
    this.inactifs = this.total - this.actifs;

    this.byRole = { admin: 0, agent: 0, chef_local: 0, chef_region: 0 };
    this.activeByRole = { admin: 0, agent: 0, chef_local: 0, chef_region: 0 };
    this.inactiveByRole = { admin: 0, agent: 0, chef_local: 0, chef_region: 0 };
    this.users.forEach((user) => {
      const role = normalizeRole(user.role);
      if (role in this.byRole) {
        this.byRole[role as keyof RoleCounts] += 1;
        if (user.actif) {
          this.activeByRole[role as keyof RoleCounts] += 1;
        } else {
          this.inactiveByRole[role as keyof RoleCounts] += 1;
        }
      }
    });

    this.animateCounts();
    this.animateBars();
  }

  cardBackItems(index: number): Array<{ label: string; value: number; color: string }> {
    const rows: Array<{ label: string; value: number; color: string }> = [];

    if (index === 0) {
      ROLE_ORDER.forEach((role) =>
        rows.push({ label: this.roleLabels[role], value: this.byRole[role], color: ROLE_COLORS[role] })
      );
    } else if (index === 1) {
      ROLE_ORDER.forEach((role) =>
        rows.push({ label: this.roleLabels[role], value: this.activeByRole[role], color: ROLE_COLORS[role] })
      );
    } else if (index === 2) {
      ROLE_ORDER.forEach((role) =>
        rows.push({ label: this.roleLabels[role], value: this.inactiveByRole[role], color: ROLE_COLORS[role] })
      );
    } else {
      rows.push({ label: 'Comptes actifs', value: this.actifs, color: '#3f7d5c' });
      rows.push({ label: 'Comptes inactifs', value: this.inactifs, color: '#b6543a' });
      rows.push({ label: "Taux d'activation", value: this.activationRate, color: '#e8a33d' });
    }

    return rows;
  }

  flipCard(event: Event, index: number): void {
    const card = (event.currentTarget as HTMLElement)?.closest('.kpi-card') as HTMLElement | null;
    if (card) {
      const clientX = 'clientX' in event ? (event as MouseEvent).clientX : rectCenter(card).x;
      const clientY = 'clientY' in event ? (event as MouseEvent).clientY : rectCenter(card).y;
      this.addRipple({ clientX, clientY } as MouseEvent, card);
    }
    this.flippedCard = this.flippedCard === index ? null : index;
  }

  onSelectRole(role: string): void {
    this.activeRole = role;
    this.activeRoleFilter = role;
    this.triggerDonutPop();
  }

  resetRoleFilter(): void {
    this.activeRole = null;
    this.activeRoleFilter = 'all';
    this.triggerDonutPop();
  }

  private triggerDonutPop(): void {
    this.donutPop = false;
    requestAnimationFrame(() => {
      this.donutPop = true;
    });
  }

  private addRipple(event: MouseEvent, card: HTMLElement): void {
    const rect = card.getBoundingClientRect();
    const diameter = Math.max(rect.width, rect.height) * 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = `${diameter}px`;
    ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - rect.left - diameter / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - diameter / 2}px`;
    card.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  get roleSegments(): RoleSegment[] {
    return this.donutSegments;
  }

  get donutSegments(): RoleSegment[] {
    const total = this.total || 1;
    let acc = 0;

    return ROLE_ORDER.map((role) => {
      const value = this.byRole[role];
      const frac = value / total;
      const seg: RoleSegment = {
        role,
        value,
        pct: Math.round(frac * 100),
        color: ROLE_COLORS[role],
        dash: frac * DONUT_CIRCUMFERENCE,
        gap: (1 - frac) * DONUT_CIRCUMFERENCE,
        offset: -acc * DONUT_CIRCUMFERENCE,
      };
      acc += frac;
      return seg;
    });
  }

  private animateCounts(): void {
    const targets: Record<string, number> = {
      '#statTotal': this.total,
      '#statActifs': this.actifs,
      '#statInactifs': this.inactifs,
      '#statRate': this.activationRate,
    };

    requestAnimationFrame(() => {
      Object.entries(targets).forEach(([selector, target]) => {
        const el = this.host.nativeElement.querySelector(selector);
        if (!el) return;

        const duration = 900;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(target * eased).toLocaleString('fr-FR');
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    });
  }

  private animateBars(): void {
    const total = this.total || 1;

    requestAnimationFrame(() => {
      ROLE_ORDER.forEach((role) => {
        const fill = this.host.nativeElement.querySelector<HTMLElement>(
          `.bar-fill[data-role="${role}"]`
        );
        if (!fill) return;

        const pct = (this.byRole[role] / total) * 100;
        fill.style.width = `${pct}%`;
      });
    });
  }

  getRoleLabel(role?: string): string {
    return this.roleLabels[normalizeRole(role)] || normalizeRole(role);
  }

  normalizeRole(role?: string): string {
    return normalizeRole(role);
  }

  pct(value: number): string {
    return this.total === 0 ? '0' : Math.round((value / this.total) * 100).toString();
  }

  get activationRate(): number {
    return this.total === 0 ? 0 : Math.round((this.actifs / this.total) * 100);
  }

  get activeSegValue(): number {
    return this.activeRole
      ? (this.byRole[this.activeRole as keyof RoleCounts] ?? 0)
      : this.total;
  }

  get activeSegColor(): string {
    return this.activeRole
      ? (ROLE_COLORS[this.activeRole as keyof RoleCounts] ?? '#0b2d5c')
      : '#0b2d5c';
  }

  getUserFullName(user: User): string {
    return [user.prenom, user.nom].filter(Boolean).join(' ').trim() || 'Utilisateur';
  }

  getUserInitials(user: User): string {
    const prenom = user.prenom?.trim() || '';
    const nom = user.nom?.trim() || '';

    if (prenom && nom) {
      return `${prenom[0]}${nom[0]}`.toUpperCase();
    }

    return (prenom || nom).slice(0, 2).toUpperCase() || '??';
  }

  formatUserDate(date?: Date | string): string {
    if (!date) return '—';

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';

    return parsed.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  get displayedUsers(): User[] {
    let list =
      this.activeRoleFilter === 'all'
        ? this.users
        : this.users.filter((user) => normalizeRole(user.role) === this.activeRoleFilter);

    if (this.activeStatusFilter === 'actif') {
      list = list.filter((user) => user.actif);
    } else if (this.activeStatusFilter === 'inactif') {
      list = list.filter((user) => !user.actif);
    }

    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return list;

    return list.filter((user) => {
      const text = [
        this.getUserFullName(user),
        user.email,
        user.phone,
        this.getRoleLabel(user.role),
        user.actif ? 'actif' : 'inactif',
        this.formatUserDate(user.dateCreation),
      ]
        .join(' ')
        .toLowerCase();

      return text.includes(term);
    });
  }

  setRoleFilter(filter: string): void {
    this.activeRoleFilter = filter;
  }

  setStatusFilter(filter: string): void {
    this.activeStatusFilter = filter;
  }

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  onSubmit(): void {
    this.formMessage = '';
    this.formError = '';

    const editing = this.editingUser;

    if (
      !this.formNom.trim() ||
      !this.formPrenom.trim() ||
      !this.formEmail.trim() ||
      !this.formPhone ||
      (!editing && !this.formPassword)
    ) {
      this.formError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    const payload: User = {
      nom: this.formNom.trim(),
      prenom: this.formPrenom.trim(),
      email: this.formEmail.trim(),
      password: this.formPassword || undefined,
      phone: this.formPhone,
      actif: this.formActif,
      role: this.formRole,
    };

    this.submitting = true;

    const onDone = (msg: string) => {
      this.submitting = false;
      this.formMessage = msg;
      this.cancelEdit();
      this.loadUsers();
    };

    if (editing?.id) {
      this.authService.updateUser(editing.id, payload).subscribe({
        next: () => onDone('Utilisateur mis à jour avec succès.'),
        error: (err) => {
          this.submitting = false;
          this.formError =
            err.error?.message || "Erreur lors de la mise à jour de l'utilisateur.";
        },
      });
    } else {
      this.authService.addUser(payload).subscribe({
        next: () => onDone('Utilisateur créé avec succès.'),
        error: (err) => {
          this.submitting = false;
          this.formError =
            err.error?.message || "Erreur lors de la création de l'utilisateur.";
        },
      });
    }
  }

  openEditUser(user: User): void {
    this.editingUser = user;
    this.formNom = user.nom;
    this.formPrenom = user.prenom;
    this.formEmail = user.email;
    this.formPassword = '';
    this.formPhone = user.phone;
    this.formActif = user.actif;
    this.formRole = normalizeRole(user.role) || 'agent';
    this.formMessage = '';
    this.formError = '';
  }

  cancelEdit(): void {
    this.editingUser = null;
    this.resetForm();
  }

  deleteUser(user: User): void {
    if (!user.id) return;
    if (!confirm(`Supprimer l'utilisateur « ${this.getUserFullName(user)} » ?`)) return;

    this.authService.deleteUser(user.id).subscribe({
      next: () => {
        if (this.editingUser?.id === user.id) {
          this.editingUser = null;
          this.resetForm();
        }
        this.formMessage = 'Utilisateur supprimé.';
        this.formError = '';
        this.loadUsers();
      },
      error: (err) => {
        this.formError =
          err.error?.message || 'Impossible de supprimer cet utilisateur.';
      },
    });
  }

  private resetForm(): void {
    this.formNom = '';
    this.formPrenom = '';
    this.formEmail = '';
    this.formPassword = '';
    this.formPhone = 0;
    this.formActif = true;
    this.formRole = 'agent';
  }

  private setupTilt(): void {
    this.host.nativeElement
      .querySelectorAll<HTMLElement>('.kpi-card')
      .forEach((el) => {
        el.addEventListener('mousemove', (e: MouseEvent) => {
          const rect = el.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          el.style.transform = `perspective(800px) rotateX(${(0.5 - py) * 5}deg) rotateY(${(px - 0.5) * 5}deg) translateY(-2px)`;
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = '';
        });
      });
  }

  private setupSyncBadge(): void {
    const syncTimeEl = this.host.nativeElement.querySelector<HTMLElement>('#syncTime');
    if (!syncTimeEl) return;

    this.syncIntervalId = setInterval(() => {
      this.secondsSinceSync += 1;
      syncTimeEl.textContent =
        this.secondsSinceSync < 60
          ? `il y a ${this.secondsSinceSync}s`
          : `il y a ${Math.floor(this.secondsSinceSync / 60)} min`;
    }, 1000);
  }
}

function rectCenter(card: HTMLElement): { x: number; y: number } {
  const rect = card.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
