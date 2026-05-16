import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'create',
    pathMatch: 'full',
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./features/session/create-session/create-session.component').then(
        (m) => m.CreateSessionComponent,
      ),
  },
  {
    path: 'join',
    loadComponent: () =>
      import('./features/session/join-session/join-session.component').then(
        (m) => m.JoinSessionComponent,
      ),
  },
  {
    path: 'session/:shortCode',
    loadComponent: () =>
      import('./features/session/session-view/session-view.component').then(
        (m) => m.SessionViewComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'create',
  },
];
