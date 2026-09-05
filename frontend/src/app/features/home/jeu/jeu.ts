import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-jeu',
  imports: [],
  templateUrl: './jeu.html',
  styleUrl: './jeu.css',
})
export class Jeu implements AfterViewInit, OnDestroy {
  @ViewChild('zone') zone!: ElementRef<HTMLElement>;
  @ViewChild('pink') pink!: ElementRef<HTMLElement>;
  @ViewChild('blue') blue!: ElementRef<HTMLElement>;

  private mouseX = 0;
  private mouseY = 0;
  private pinkX = 0;
  private pinkY = 0;
  private blueX = 0;
  private blueY = 0;
  private readonly pinkEase = 0.15;
  private readonly blueEase = 0.08;
  private rafId = 0;

  ngAfterViewInit(): void {
    const zone = this.zone.nativeElement;
    this.mouseX = zone.clientWidth / 2;
    this.mouseY = zone.clientHeight / 2;
    this.pinkX = this.mouseX;
    this.pinkY = this.mouseY;
    this.blueX = this.mouseX;
    this.blueY = this.mouseY;
    this.animate();
  }

  onMouseMove(event: MouseEvent): void {
    const rect = this.zone.nativeElement.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
  }

  onMouseLeave(): void {
    const zone = this.zone.nativeElement;
    this.mouseX = zone.clientWidth / 2;
    this.mouseY = zone.clientHeight / 2;
  }

  private animate = (): void => {
    this.pinkX += (this.mouseX - this.pinkX) * this.pinkEase;
    this.pinkY += (this.mouseY - this.pinkY) * this.pinkEase;
    this.blueX += (this.mouseX - this.blueX) * this.blueEase;
    this.blueY += (this.mouseY - this.blueY) * this.blueEase;

    this.pink.nativeElement.style.left = `${this.pinkX}px`;
    this.pink.nativeElement.style.top = `${this.pinkY}px`;
    this.blue.nativeElement.style.left = `${this.blueX}px`;
    this.blue.nativeElement.style.top = `${this.blueY}px`;

    this.rafId = requestAnimationFrame(this.animate);
  };

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
  }
}
