import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import lottie from 'lottie-web';
import { LordiconService } from '@core/services/lordicon.service';
import { Logger } from '@shared/utils/logger.util';
import { LottieAnimationManager } from './lottie-animation.manager';
import { DEFAULT_LOTTIE_CONFIG, LottieIconConfig } from './lottie-icon.config';

@Component({
  selector: 'app-lottie-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container class="lottie-container" [style.width.px]="width" [style.height.px]="height"></div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    .lottie-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class LottieIconComponent implements AfterViewInit, OnDestroy {
  private static readonly CONTEXT = 'LottieIconComponent';
  private static readonly ANIMATION_LOAD_DELAY = 50;

  @Input() iconName: string = '';
  @Input() width: number = DEFAULT_LOTTIE_CONFIG.width!;
  @Input() height: number = DEFAULT_LOTTIE_CONFIG.height!;
  @Input() loop: boolean = DEFAULT_LOTTIE_CONFIG.loop!;
  @Input() autoplay: boolean = DEFAULT_LOTTIE_CONFIG.autoplay!;

  @ViewChild('container', { static: false }) containerRef!: ElementRef<HTMLDivElement>;

  private readonly lordiconService = inject(LordiconService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly animationManager = new LottieAnimationManager();

  ngAfterViewInit(): void {
    Logger.debug(LottieIconComponent.CONTEXT, 'Initialisation du composant', {
      iconName: this.iconName,
      width: this.width,
      height: this.height,
      loop: this.loop,
      autoplay: this.autoplay
    });

    if (this.isValidSetup()) {
      setTimeout(() => this.loadAnimation(), LottieIconComponent.ANIMATION_LOAD_DELAY);
    }
  }

  private isValidSetup(): boolean {
    if (!this.iconName) {
      Logger.warn(LottieIconComponent.CONTEXT, 'Aucun nom d\'icône fourni');
      return false;
    }

    if (!this.containerRef?.nativeElement) {
      Logger.error(LottieIconComponent.CONTEXT, 'Conteneur non disponible');
      return false;
    }

    return true;
  }

  private loadAnimation(): void {
    Logger.info(LottieIconComponent.CONTEXT, `Chargement de l'icône: ${this.iconName}`);

    if (!this.isValidSetup()) {
      return;
    }

    this.clearContainer();
    this.fetchAndRenderAnimation();
  }

  private clearContainer(): void {
    const container = this.containerRef.nativeElement;
    container.innerHTML = '';
    Logger.debug(LottieIconComponent.CONTEXT, 'Conteneur nettoyé');
  }

  private fetchAndRenderAnimation(): void {
    this.lordiconService.getLordiconData(this.iconName).subscribe({
      next: (animationData) => this.onAnimationDataReceived(animationData),
      error: (error) => this.onAnimationError(error)
    });
  }

  private onAnimationDataReceived(animationData: any): void {
    Logger.info(LottieIconComponent.CONTEXT, `Données d'animation reçues pour: ${this.iconName}`);

    const container = this.containerRef.nativeElement;

    if (!this.isContainerReady(container)) {
      return;
    }

    try {
      this.renderAnimation(container, animationData);
    } catch (error) {
      Logger.error(LottieIconComponent.CONTEXT, 'Erreur lors du rendu de l\'animation', error);
    }
  }

  private isContainerReady(container: HTMLDivElement): boolean {
    if (!container || !container.parentElement) {
      Logger.warn(LottieIconComponent.CONTEXT, 'Conteneur non prêt pour le rendu');
      return false;
    }
    return true;
  }

  private renderAnimation(container: HTMLDivElement, animationData: any): void {
    Logger.debug(LottieIconComponent.CONTEXT, 'Rendu de l\'animation Lottie', {
      loop: this.loop,
      autoplay: this.autoplay
    });

    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: this.loop,
      autoplay: this.autoplay,
      animationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
        progressiveLoad: true,
      }
    });

    this.animationManager.instance = animation;

    if (!this.autoplay) {
      animation.goToAndStop(0, true);
    }

    this.cdr.markForCheck();
    Logger.info(LottieIconComponent.CONTEXT, `Animation ${this.iconName} chargée avec succès`);
  }

  private onAnimationError(error: any): void {
    Logger.error(LottieIconComponent.CONTEXT, `Échec du chargement de l'icône: ${this.iconName}`, {
      error,
      iconName: this.iconName
    });
  }

  play(): void {
    this.animationManager.play();
  }

  stop(): void {
    this.animationManager.stop();
  }

  pause(): void {
    this.animationManager.pause();
  }

  replay(): void {
    this.animationManager.replay();
  }

  ngOnDestroy(): void {
    Logger.debug(LottieIconComponent.CONTEXT, `Destruction du composant: ${this.iconName}`);

    this.animationManager.destroy();

    if (this.containerRef?.nativeElement) {
      this.containerRef.nativeElement.innerHTML = '';
    }
  }
}

