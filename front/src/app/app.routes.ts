import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'notebooks',
    loadComponent: () =>
      import('./features/notebooks/components/notebook-list/notebook-list.component').then((m) => m.NotebookListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'notebooks/:id',
    loadComponent: () =>
      import('./features/notebooks/components/notebook-detail/notebook-detail.component').then((m) => m.NotebookDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
