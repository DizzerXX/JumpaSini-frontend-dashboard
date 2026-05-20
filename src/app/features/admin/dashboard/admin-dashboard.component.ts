import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AnalyticsOverview } from '../../../core/models/analytics.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);

  readonly overview = signal<AnalyticsOverview | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.analytics.getOverview().subscribe({
      next: (data) => {
        this.overview.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load analytics. Please try again.');
        this.loading.set(false);
      },
    });
  }

  maxCount(items: { count: number }[]): number {
    return Math.max(...items.map((i) => i.count), 1);
  }

  barWidth(count: number, max: number): string {
    return `${Math.round((count / max) * 100)}%`;
  }
}
