import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminAuthService } from '../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  readonly sidebarOpen = signal(true);
  readonly admin = toSignal(this.auth.admin$);

  readonly navItems = [
    { label: 'Dashboard', icon: '📊', path: '/admin/dashboard' },
    { label: 'Venues', icon: '🏢', path: '/admin/venues' },
    { label: 'Halal Manager', icon: '🥩', path: '/admin/halal' },
    { label: 'Analytics', icon: '📈', path: '/admin/analytics' },
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/admin/login']),
      error: () => this.router.navigate(['/admin/login']),
    });
  }
}
