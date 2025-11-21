import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Notebook, CreateNotebookInput, UpdateNotebookInput } from '../models/notebook.model';

@Injectable({
  providedIn: 'root'
})
export class NotebookService {
  private readonly apiUrl = `${environment.apiUrl}/notebooks`;

  private notebooksSignal = signal<Notebook[]>([]);
  private selectedNotebookSignal = signal<Notebook | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  readonly notebooks = this.notebooksSignal.asReadonly();
  readonly selectedNotebook = this.selectedNotebookSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly hasNotebooks = computed(() => this.notebooksSignal().length > 0);

  constructor(private readonly http: HttpClient) {}

  loadNotebooks(): Observable<Notebook[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<Notebook[]>(this.apiUrl).pipe(
      tap({
        next: (notebooks) => {
          this.notebooksSignal.set(notebooks);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(error.message || 'Failed to load notebooks');
          this.loadingSignal.set(false);
        }
      })
    );
  }

  getNotebookById(id: string): Observable<Notebook> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<Notebook>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: (notebook) => {
          this.selectedNotebookSignal.set(notebook);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(error.message || 'Failed to load notebook');
          this.loadingSignal.set(false);
        }
      })
    );
  }

  createNotebook(input: CreateNotebookInput): Observable<Notebook> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<Notebook>(this.apiUrl, input).pipe(
      tap({
        next: (notebook) => {
          this.notebooksSignal.update(notebooks => [...notebooks, notebook]);
          this.selectedNotebookSignal.set(notebook);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(error.message || 'Failed to create notebook');
          this.loadingSignal.set(false);
        }
      })
    );
  }

  updateNotebook(id: string, input: UpdateNotebookInput): Observable<Notebook> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.put<Notebook>(`${this.apiUrl}/${id}`, input).pipe(
      tap({
        next: (updatedNotebook) => {
          this.notebooksSignal.update(notebooks =>
            notebooks.map(n => n.id === id ? updatedNotebook : n)
          );
          if (this.selectedNotebookSignal()?.id === id) {
            this.selectedNotebookSignal.set(updatedNotebook);
          }
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(error.message || 'Failed to update notebook');
          this.loadingSignal.set(false);
        }
      })
    );
  }

  deleteNotebook(id: string): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: () => {
          this.notebooksSignal.update(notebooks => notebooks.filter(n => n.id !== id));
          if (this.selectedNotebookSignal()?.id === id) {
            this.selectedNotebookSignal.set(null);
          }
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(error.message || 'Failed to delete notebook');
          this.loadingSignal.set(false);
        }
      })
    );
  }

  selectNotebook(notebook: Notebook | null): void {
    this.selectedNotebookSignal.set(notebook);
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}

