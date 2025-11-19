import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  username = signal<string>('');
  password = signal<string>('');
  confirmPassword = signal<string>('');
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  updateUsername(value: string): void {
    this.username.set(value);
  }

  updatePassword(value: string): void {
    this.password.set(value);
  }

  updateConfirmPassword(value: string): void {
    this.confirmPassword.set(value);
  }

  onSubmit(): void {
    this.errorMessage.set('');

    if (!this.username() || !this.password() || !this.confirmPassword()) {
      this.errorMessage.set('Tous les champs sont requis.');
      return;
    }

    if (this.username().length < 3) {
      this.errorMessage.set('Le nom d\'utilisateur doit contenir au moins 3 caractères.');
      return;
    }

    if (this.password().length < 4) {
      this.errorMessage.set('Le mot de passe doit contenir au moins 4 caractères.');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Les mots de passe ne correspondent pas.');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(this.username())) {
      this.errorMessage.set('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores.');
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
