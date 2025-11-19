import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { User, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:3000/auth';
  private readonly tokenKey = 'alttrack_access_token';

  private currentUserSignal = signal<User | null>(null);
  private accessTokenSignal = signal<string | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor() {
    this.loadAuthenticationStateFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => this.handleAuthenticationSuccess(response)),
        catchError((error) => this.handleAuthenticationError(error))
      );
  }

  register(credentials: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<RegisterResponse>(`${this.apiUrl}/register`, credentials)
      .pipe(
        catchError((error) => this.handleRegistrationError(error))
      );
  }

  logout(): void {
    this.clearAuthenticationState();
    this.router.navigate(['/login']);
  }

  private handleAuthenticationSuccess(response: LoginResponse): void {
    this.accessTokenSignal.set(response.accessToken);
    this.currentUserSignal.set(response.user);
    this.saveTokenToStorage(response.accessToken);
    this.saveUserToStorage(response.user);
  }

  private handleAuthenticationError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de la connexion.';

    if (error.status === 401) {
      errorMessage = 'Identifiants invalides. Veuillez réessayer.';
    } else if (error.status === 0) {
      errorMessage = 'Impossible de contacter le serveur. Veuillez vérifier votre connexion.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => new Error(errorMessage));
  }

  private handleRegistrationError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de l\'inscription.';

    if (error.status === 409) {
      errorMessage = 'Ce nom d\'utilisateur existe déjà. Veuillez en choisir un autre.';
    } else if (error.status === 400) {
      errorMessage = 'Données invalides. Vérifiez vos informations.';
    } else if (error.status === 0) {
      errorMessage = 'Impossible de contacter le serveur. Veuillez vérifier votre connexion.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => new Error(errorMessage));
  }

  private loadAuthenticationStateFromStorage(): void {
    const storedToken = this.getTokenFromStorage();
    const storedUser = this.getUserFromStorage();

    if (storedToken && storedUser) {
      this.accessTokenSignal.set(storedToken);
      this.currentUserSignal.set(storedUser);
    }
  }

  private clearAuthenticationState(): void {
    this.accessTokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.removeTokenFromStorage();
    this.removeUserFromStorage();
  }

  private saveTokenToStorage(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private getTokenFromStorage(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private removeTokenFromStorage(): void {
    localStorage.removeItem(this.tokenKey);
  }

  private saveUserToStorage(user: User): void {
    localStorage.setItem('alttrack_current_user', JSON.stringify(user));
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('alttrack_current_user');
    if (!userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  }

  private removeUserFromStorage(): void {
    localStorage.removeItem('alttrack_current_user');
  }
}

