import { AnimationItem } from 'lottie-web';
import { Logger } from '@shared/utils/logger.util';

export class LottieAnimationManager {
  private static readonly CONTEXT = 'LottieAnimationManager';
  private animation: AnimationItem | null = null;

  get instance(): AnimationItem | null {
    return this.animation;
  }

  set instance(animation: AnimationItem | null) {
    this.animation = animation;
  }

  play(): void {
    if (!this.animation) {
      Logger.warn(this.getContext(), 'Tentative de lecture sans animation initialisée');
      return;
    }

    Logger.debug(this.getContext(), 'Lecture de l\'animation');
    this.animation.play();
  }

  stop(): void {
    if (!this.animation) {
      Logger.warn(this.getContext(), 'Tentative d\'arrêt sans animation initialisée');
      return;
    }

    Logger.debug(this.getContext(), 'Arrêt de l\'animation');
    this.animation.stop();
    this.animation.goToAndStop(0, true);
  }

  pause(): void {
    if (!this.animation) {
      Logger.warn(this.getContext(), 'Tentative de pause sans animation initialisée');
      return;
    }

    Logger.debug(this.getContext(), 'Pause de l\'animation');
    this.animation.pause();
  }

  replay(): void {
    if (!this.animation) {
      Logger.warn(this.getContext(), 'Tentative de replay sans animation initialisée');
      return;
    }

    Logger.debug(this.getContext(), 'Relecture de l\'animation');
    this.animation.goToAndStop(0, true);
    this.animation.play();
  }

  destroy(): void {
    if (this.animation) {
      Logger.debug(this.getContext(), 'Destruction de l\'animation');
      this.animation.destroy();
      this.animation = null;
    }
  }

  private getContext(): string {
    return LottieAnimationManager.CONTEXT;
  }
}

