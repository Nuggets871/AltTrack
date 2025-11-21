import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotebookService } from '../../services/notebook.service';
import { Notebook } from '../../models/notebook.model';
import { NotebookFormComponent } from '../notebook-form/notebook-form.component';

@Component({
  selector: 'app-notebook-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NotebookFormComponent],
  templateUrl: './notebook-list.component.html',
  styleUrl: './notebook-list.component.css'
})
export class NotebookListComponent implements OnInit {
  readonly notebookService = inject(NotebookService);

  notebooks = this.notebookService.notebooks;
  loading = this.notebookService.loading;
  error = this.notebookService.error;
  showCreateModal = signal(false);

  constructor() {}

  ngOnInit(): void {
    this.notebookService.loadNotebooks().subscribe();
  }

  onSelectNotebook(notebook: Notebook): void {
    this.notebookService.selectNotebook(notebook);
  }

  onDeleteNotebook(notebook: Notebook, event: Event): void {
    event.stopPropagation();

    if (confirm(`Êtes-vous sûr de vouloir supprimer le notebook "${notebook.name}" ?`)) {
      this.notebookService.deleteNotebook(notebook.id).subscribe();
    }
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  formatDate(date: Date | string | null): string {
    if (!date) return 'Non définie';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getWeekPatternDisplay(pattern: string[]): string {
    const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    return pattern.map((type, index) => {
      const emoji = type === 'SCHOOL' ? '📚' : type === 'COMPANY' ? '💼' : '🏖️';
      return `${dayNames[index]}${emoji}`;
    }).join(' ');
  }
}

