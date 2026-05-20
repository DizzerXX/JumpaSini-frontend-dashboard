import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, VenueStatsData } from '../../../core/services/analytics.service';
import { AnalyticsOverview } from '../../../core/models/analytics.model';

interface SessionRow {
  id: string;
  created_at: string;
  venue_type: string;
  participants_count: number;
  status: string;
}

@Component({
  selector: 'app-analytics-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-overview.component.html',
  styleUrl: './analytics-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsOverviewComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);

  readonly overview = signal<AnalyticsOverview | null>(null);
  readonly venueStats = signal<VenueStatsData | null>(null);
  readonly recentSessions = signal<SessionRow[]>([]);
  readonly recentReports = signal<any[]>([]);
  readonly pendingReportCount = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    let pending = 3;
    const done = () => { if (--pending === 0) this.loading.set(false); };

    this.analytics.getOverview().subscribe({
      next: (data) => { this.overview.set(data); done(); },
      error: () => { this.error.set('Failed to load analytics.'); done(); },
    });

    this.analytics.getSessions({ page: 1 }).subscribe({
      next: (res) => { this.recentSessions.set((res.data as any[]).slice(0, 10)); done(); },
      error: () => done(),
    });

    this.analytics.getHalalReports({ page: 1 }).subscribe({
      next: (data: any) => {
        const items: any[] = data.data ?? data ?? [];
        this.recentReports.set(items.slice(0, 10));
        // Count pending (reported but venue has no halal verdict)
        this.pendingReportCount.set(items.filter((r: any) => r.is_halal === null).length);
        done();
      },
      error: () => done(),
    });
  }

  maxCount(items: { count: number }[]): number {
    return Math.max(...items.map((i) => i.count), 1);
  }

  barWidth(count: number, max: number): string {
    return `${Math.round((count / max) * 100)}%`;
  }

  statusClass(status: string): string {
    if (status === 'active') return 'status-active';
    if (status === 'completed') return 'status-completed';
    return 'status-pending';
  }
}
