import { Injectable, inject } from '@angular/core';
import { signal, computed } from '@angular/core';
import { JwtService } from './jwt.service';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private readonly jwtService = inject(JwtService);
  private readonly defaultEnvironment: 'development' | 'production' = environment.production ? 'production' : 'development';
  private readonly environmentSignal = signal<'development' | 'production'>(this.defaultEnvironment);

  readonly environment = this.environmentSignal.asReadonly();
  readonly isDevelopment = computed(() => this.environmentSignal() === 'development');
  readonly isProduction = computed(() => this.environmentSignal() === 'production');

  updateFromToken(token: string | null): void {
    if (!token) {
      this.environmentSignal.set(this.defaultEnvironment);
      return;
    }

    const env = this.jwtService.getEnvironmentFromToken(token);
    this.environmentSignal.set(env);
  }

  setEnvironment(env: 'development' | 'production'): void {
    this.environmentSignal.set(env);
  }

  getEnvironment(): 'development' | 'production' {
    return this.environmentSignal();
  }
}

