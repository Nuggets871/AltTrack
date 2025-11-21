import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NotebookService } from '../../services/notebook.service';

@Component({
  selector: 'app-notebook-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notebook-detail.component.html',
  styleUrl: './notebook-detail.component.css'
})
export class NotebookDetailComponent implements OnInit {
  private readonly notebookService = inject(NotebookService);
  private readonly route = inject(ActivatedRoute);

  notebook = this.notebookService.selectedNotebook;
  loading = this.notebookService.loading;
  error = this.notebookService.error;

  constructor() {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.notebookService.getNotebookById(id).subscribe();
    }
  }

  formatDate(date: Date | string | null): string {
    if (!date) return 'Non définie';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getDayTypeLabel(type: string): string {
    switch(type) {
      case 'SCHOOL': return '📚 École';
      case 'COMPANY': return '💼 Entreprise';
      case 'OFF': return '🏖️ Repos';
      default: return type;
    }
  }
}

