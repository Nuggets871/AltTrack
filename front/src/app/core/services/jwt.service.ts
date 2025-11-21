import { Injectable } from '@angular/core';
import { JwtPayload } from '../models/jwt-payload.model';

@Injectable({
  providedIn: 'root'
})
export class JwtService {
  private cachedPayload: JwtPayload | null = null;
  private cachedToken: string | null = null;

  decodeToken(token: string): JwtPayload | null {
    if (this.cachedToken === token && this.cachedPayload) {
      return this.cachedPayload;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));

      this.cachedToken = token;
      this.cachedPayload = decoded;

      return decoded;
    } catch (error) {
      this.cachedToken = null;
      this.cachedPayload = null;
      return null;
    }
  }

  getEnvironmentFromToken(token: string | null): 'development' | 'production' {
    if (!token) {
      return 'production';
    }

    const payload = this.decodeToken(token);
    return payload?.environment || 'production';
  }

  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload?.exp) {
      return true;
    }

    const expirationDate = new Date(payload.exp * 1000);
    return expirationDate < new Date();
  }

  clearCache(): void {
    this.cachedToken = null;
    this.cachedPayload = null;
  }
}

