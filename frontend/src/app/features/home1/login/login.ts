import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  Renderer2
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { LoginRequest } from '../../../models/loginRequest';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-login',
   standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements AfterViewInit, OnDestroy {
  @ViewChild('tileGrid', { static: true })
  private tileGridRef!: ElementRef<HTMLDivElement>;

  constructor(private renderer: Renderer2,private authservice: AuthService,private router:Router) {}

  /** Taille d'un carreau en pixels */
  private readonly TILE_SIZE = 46;

  /** Minuteur associé à chaque carreau, pour annuler/relancer le retour à l'état par défaut */
  private tileTimers = new WeakMap<HTMLDivElement, ReturnType<typeof setTimeout>>();
  private resizeTimeout?: ReturnType<typeof setTimeout>;
  email = '';
  password = '';
  errorMessage = '';
  rememberMe = false;
  showPassword = false;
  ngAfterViewInit(): void {
    this.buildTiles();
  }

  ngOnDestroy(): void {
    clearTimeout(this.resizeTimeout);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => this.buildTiles(), 200);
  }

  /** Génère la grille de carreaux invisibles qui couvre le fond */
  private buildTiles(): void {
    const grid = this.tileGridRef.nativeElement;

    // Vider la grille existante (via Renderer2, pas innerHTML)
    while (grid.firstChild) {
      this.renderer.removeChild(grid, grid.firstChild);
    }

    const cols = Math.ceil(window.innerWidth / this.TILE_SIZE);
    const rows = Math.ceil(window.innerHeight / this.TILE_SIZE);
    this.renderer.setStyle(grid, 'grid-template-columns', `repeat(${cols}, ${this.TILE_SIZE}px)`);
    this.renderer.setStyle(grid, 'grid-template-rows', `repeat(${rows}, ${this.TILE_SIZE}px)`);

    for (let i = 0; i < cols * rows; i++) {
      // Renderer2.createElement stamp l'élément avec l'attribut d'encapsulation
      // du composant, ce qui permet aux styles scoped (.tile / .lit) de s'appliquer.
      const tile = this.renderer.createElement('div');
      this.renderer.addClass(tile, 'tile');
      this.renderer.appendChild(grid, tile);
    }
  }

  /**
   * Au survol d'un carreau : le carreau devient bleu immédiatement,
   * puis revient à son état par défaut après 1 seconde.
   */
  onTileHover(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const tile = target.closest('.tile') as HTMLDivElement | null;
    if (!tile) return;

    tile.classList.add('lit');
    clearTimeout(this.tileTimers.get(tile));
    const timer = setTimeout(() => tile.classList.remove('lit'), 1000);
    this.tileTimers.set(tile, timer);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    const loginRequest: LoginRequest = {
      email: this.email,
      password: this.password
    };

    this.authservice.login(loginRequest).subscribe({
      next: (response) => {
        this.authservice.setSession(response);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Email ou mot de passe incorrect';
        console.error(err);
      },
    });
  }
}