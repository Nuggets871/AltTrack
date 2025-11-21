import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { Logger } from '@shared/utils/logger.util';

@Injectable({
  providedIn: 'root'
})
export class LordiconService {
  private static readonly CONTEXT = 'LordiconService';
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment?.apiUrl || 'http://localhost:3000';

  constructor() {
    Logger.info(LordiconService.CONTEXT, `Service initialisé avec API URL: ${this.apiUrl}`);
  }

  getLordiconData(iconName: string): Observable<any> {
    const url = this.buildUrl(iconName);

    Logger.debug(LordiconService.CONTEXT, `Requête pour l'icône: ${iconName}`, { url });

    return this.http.get(url, { responseType: 'json' }).pipe(
      tap(() => Logger.info(LordiconService.CONTEXT, `Icône récupérée avec succès: ${iconName}`)),
      catchError((error) => this.handleError(iconName, error))
    );
  }

  private buildUrl(iconName: string): string {
    return `${this.apiUrl}/assets/lordicons/${iconName}`;
  }

  private handleError(iconName: string, error: HttpErrorResponse): Observable<never> {
    const errorDetails = {
      iconName,
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      url: error.url
    };

    if (error.status === 404) {
      Logger.error(LordiconService.CONTEXT, `Icône introuvable: ${iconName}`, errorDetails);
    } else if (error.status === 0) {
      Logger.error(LordiconService.CONTEXT, 'Erreur de connexion au serveur', errorDetails);
    } else {
      Logger.error(LordiconService.CONTEXT, `Erreur HTTP lors de la récupération de l'icône: ${iconName}`, errorDetails);
    }

    return throwError(() => error);
  }
}

