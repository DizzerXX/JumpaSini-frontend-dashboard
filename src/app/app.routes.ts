import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

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
  // ─── Admin (lazy chunk) ──────────────────────────────────────
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/admin-login.component').then(
        (m) => m.AdminLoginComponent,
      ),
  },
  {
    path: 'admin',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./shared/components/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'venues',
        loadComponent: () =>
          import('./features/admin/venues/venue-list.component').then(
            (m) => m.VenueListComponent,
          ),
      },
      {
        path: 'venues/new',
        loadComponent: () =>
          import('./features/admin/venues/venue-form.component').then(
            (m) => m.VenueFormComponent,
          ),
      },
      {
        path: 'venues/:id/edit',
        loadComponent: () =>
          import('./features/admin/venues/venue-form.component').then(
            (m) => m.VenueFormComponent,
          ),
      },
      {
        path: 'halal',
        loadComponent: () =>
          import('./features/admin/venues/halal-manager.component').then(
            (m) => m.HalalManagerComponent,
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/admin/analytics/analytics-overview.component').then(
            (m) => m.AnalyticsOverviewComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'create',
  },
];
