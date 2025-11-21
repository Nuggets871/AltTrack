import { Component, inject, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models';
import { LottieIconComponent } from '@shared/components/lottie-icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LottieIconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  @ViewChild('sunIcon') sunIcon?: LottieIconComponent;
  @ViewChild('moonIcon') moonIcon?: LottieIconComponent;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly loginForm: FormGroup;
  protected readonly isLoadingSignal = signal<boolean>(false);
  protected readonly errorMessageSignal = signal<string | null>(null);
  protected readonly isDarkMode = signal<boolean>(false);

  constructor() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(3)]],
    });
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

  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoadingSignal.set(true);
    this.errorMessageSignal.set(null);

    const credentials: LoginRequest = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password,
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoadingSignal.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigate([returnUrl]);
      },
      error: (error: Error) => {
        this.isLoadingSignal.set(false);
        this.errorMessageSignal.set(error.message);
      },
    });
  }

  protected hasError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  protected getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);

    if (!control || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'Ce champ est requis.';
    }

    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Minimum ${minLength} caractères requis.`;
    }

    return 'Champ invalide.';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}

