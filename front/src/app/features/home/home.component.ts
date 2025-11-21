import { Component, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { LottieIconComponent } from '@shared/components/lottie-icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LottieIconComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  @ViewChild('sunIcon') sunIcon?: LottieIconComponent;
  @ViewChild('moonIcon') moonIcon?: LottieIconComponent;

  protected readonly authService = inject(AuthService);
  protected readonly isDarkMode = signal<boolean>(false);

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const isDark = savedTheme === 'dark';
    this.isDarkMode.set(isDark);
    this.applyTheme(isDark);
  }

  protected onThemeChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isDark = checkbox.checked;
    this.isDarkMode.set(isDark);
    this.applyTheme(isDark);
    this.triggerLordiconAnimation(isDark);
  }

  private applyTheme(isDark: boolean): void {
    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.setAttribute('data-theme', 'valentine2');
      localStorage.setItem('theme', 'dark');
    } else {
      htmlElement.setAttribute('data-theme', 'emerald');
      localStorage.setItem('theme', 'light');
    }
  }

  private triggerLordiconAnimation(isDark: boolean): void {
    if (isDark) {
      this.moonIcon?.replay();
    } else {
      this.sunIcon?.replay();
    }
  }

  protected onLogout(): void {
    this.authService.logout();
  }
}

