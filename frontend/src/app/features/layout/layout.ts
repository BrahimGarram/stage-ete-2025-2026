import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  path: string;
  label: string;
  roles: string[];
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit, AfterViewInit, OnDestroy {
  private static readonly NAV_ITEMS: NavItem[] = [
    { path: 'admin', label: 'Tableau de bord', roles: ['admin'] },
    { path: 'locaux', label: 'Locaux', roles: ['chef_local', 'admin'] },
    { path: 'compteurs', label: 'Compteurs', roles: ['agent', 'admin'] },
    { path: 'factures', label: 'Factures', roles: ['chef_region', 'admin'] },
  ];

  readonly roleLabels: Record<string, string> = {
    admin: 'Administrateur',
    chef_region: 'Chef de région',
    chef_local: 'Chef local',
    agent: 'Agent',
  };

  role = 'agent';
  navItems: NavItem[] = [];
  userName = 'Utilisateur';
  userInitials = '--';
  roleLabel = '';

  private syncIntervalId?: ReturnType<typeof setInterval>;
  private secondsSinceSync = 0;

  constructor(
    private host: ElementRef<HTMLElement>,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const stored = this.authService.getStoredUser();
    this.role = this.normalizeRole(stored?.role);
    this.roleLabel = this.roleLabels[this.role] || this.role;
    this.navItems = Layout.NAV_ITEMS.filter((item) => item.roles.includes(this.role));

    const fullName = [stored?.prenom, stored?.name].filter(Boolean).join(' ').trim();
    if (fullName) {
      this.userName = fullName;
      const parts = fullName.split(/\s+/).filter(Boolean);
      this.userInitials =
        parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : fullName.slice(0, 2).toUpperCase();
    }
  }

  ngAfterViewInit(): void {
    this.setupSidebarCollapse();
    this.setupSpotlight();
    this.setupSyncBadge();
  }

  ngOnDestroy(): void {
    clearInterval(this.syncIntervalId);
  }

  isActive(path: string): boolean {
    return this.router.url === `/home/${path}`;
  }

  normalizeRole(role?: string): string {
    if (!role) return 'agent';

    const normalized = role.toLowerCase().replace(/[\s-]/g, '_');
    if (normalized === 'cheflocal') return 'chef_local';
    if (normalized === 'chefregion') return 'chef_region';
    if (['admin', 'agent', 'chef_local', 'chef_region'].includes(normalized)) {
      return normalized;
    }

    return 'agent';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private q<T extends Element = Element>(selector: string): T | null {
    return this.host.nativeElement.querySelector<T>(selector);
  }

  private setupSidebarCollapse(): void {
    const sidebar = this.q<HTMLElement>('#sidebar');
    const collapseBtn = this.q<HTMLButtonElement>('#collapseBtn');
    if (!sidebar || !collapseBtn) return;

    collapseBtn.addEventListener('click', () => {
      const collapsing = !sidebar.classList.contains('collapsed');
      sidebar.classList.toggle('collapsed');
      collapseBtn.setAttribute('aria-label', collapsing ? 'Déplier le menu' : 'Réduire le menu');
    });
  }

  private setupSpotlight(): void {
    const mainScroll = this.q<HTMLElement>('#mainScroll');
    if (!mainScroll) return;

    mainScroll.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = mainScroll.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top + mainScroll.scrollTop;
      mainScroll.style.setProperty('--mx', `${x}px`);
      mainScroll.style.setProperty('--my', `${y}px`);
    });
  }

  private setupSyncBadge(): void {
    const syncTimeEl = this.q<HTMLElement>('#syncTime');
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
