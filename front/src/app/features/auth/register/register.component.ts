import { Component, signal, inject, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models';
import { LottieIconComponent } from '@shared/components/lottie-icon';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LottieIconComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  @ViewChild('sunIcon') sunIcon?: LottieIconComponent;
  @ViewChild('moonIcon') moonIcon?: LottieIconComponent;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly username = signal<string>('');
  protected readonly password = signal<string>('');
  protected readonly confirmPassword = signal<string>('');
  protected readonly errorMessage = signal<string>('');
  protected readonly isLoading = signal<boolean>(false);
  protected readonly isDarkMode = signal<boolean>(false);

  protected readonly usernameValidation = computed(() => this.computeUsernameValidation());
  protected readonly passwordValidation = computed(() => this.computePasswordValidation());
  protected readonly confirmPasswordValidation = computed(() => this.computeConfirmPasswordValidation());

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
    this.triggerLordiconAnimation();
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

  private triggerLordiconAnimation(): void {
    this.sunIcon?.play();
    this.moonIcon?.play();
  }

  protected updateUsername(value: string): void {
    this.username.set(value);
  }

  protected updatePassword(value: string): void {
    this.password.set(value);
  }

  protected updateConfirmPassword(value: string): void {
    this.confirmPassword.set(value);
  }

  private computeUsernameValidation(): { isValid: boolean; message: string } {
    const val = this.username();
    if (!val) return { isValid: true, message: '' };

    if (val.length < 3) {
      return { isValid: false, message: 'Minimum 3 caractères requis' };
    }

    const regex = /^[a-zA-Z0-9_-]+$/;
    if (!regex.test(val)) {
      return { isValid: false, message: 'Lettres, chiffres, tirets et underscores uniquement' };
    }

    return { isValid: true, message: '' };
  }

  private computePasswordValidation(): { isValid: boolean; message: string } {
    const val = this.password();
    if (!val) return { isValid: true, message: '' };

    if (val.length < 4) {
      return { isValid: false, message: 'Minimum 4 caractères requis' };
    }

    return { isValid: true, message: '' };
  }

  private computeConfirmPasswordValidation(): { isValid: boolean; message: string } {
    const pwd = this.password();
    const confirmed = this.confirmPassword();

    if (!confirmed) return { isValid: true, message: '' };

    if (pwd !== confirmed) {
      return { isValid: false, message: 'Les mots de passe ne correspondent pas' };
    }

    return { isValid: true, message: '' };
  }

  protected onSubmit(): void {
    this.errorMessage.set('');

    if (!this.username() || !this.password() || !this.confirmPassword()) {
      this.errorMessage.set('Tous les champs sont requis.');
      return;
    }

    if (!this.usernameValidation().isValid || !this.passwordValidation().isValid || !this.confirmPasswordValidation().isValid) {
      this.errorMessage.set('Veuillez corriger les erreurs de validation.');
      return;
    }

    this.isLoading.set(true);

    const registerRequest: RegisterRequest = {
      username: this.username(),
      password: this.password(),
    };

    this.authService.register(registerRequest).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/login']);
      },
      error: (error: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      },
    });
  }
}
