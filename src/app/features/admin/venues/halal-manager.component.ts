import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { VenueManagementService } from '../../../core/services/venue-management.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { VenueModel } from '../../../core/models/venue.model';

type Tab = 'pending' | 'all';

interface PendingVenue {
  venue: VenueModel;
  total: number;
  halal: number;
  not_halal: number;
  actioning: boolean;
}

interface ReportRow {
  id: string;
  venue_name: string;
  venue_id: string | null;
  reported_as_halal: boolean;
  participant_name: string | null;
  session_id: string;
  created_at: string;
}

@Component({
  selector: 'app-halal-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './halal-manager.component.html',
  styleUrl: './halal-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HalalManagerComponent implements OnInit {
  private readonly venueService = inject(VenueManagementService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly route = inject(ActivatedRoute);

  readonly activeTab = signal<Tab>('pending');
  readonly loading = signal(true);

  // Pending tab
  readonly pendingVenues = signal<PendingVenue[]>([]);

  // All reports tab
  readonly allReports = signal<ReportRow[]>([]);
  readonly allPage = signal(1);
  readonly allLastPage = signal(1);
  readonly allLoading = signal(false);

  ngOnInit(): void {
    this.loadPending();

    // If navigated with ?venue=id, switch to pending and highlight
    const venueId = this.route.snapshot.queryParamMap.get('venue');
    if (venueId) {
      this.activeTab.set('pending');
    }
  }

  switchTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (tab === 'all' && this.allReports().length === 0) {
      this.loadAllReports(1);
    }
  }

  markHalal(item: PendingVenue, isHalal: boolean, verified = false): void {
    item.actioning = true;
    this.venueService
      .overrideHalalStatus(item.venue.id, {
        is_halal: isHalal,
        is_halal_verified: verified,
      })
      .subscribe({
        next: () => {
          this.pendingVenues.update((list) => list.filter((v) => v.venue.id !== item.venue.id));
        },
        error: () => { item.actioning = false; },
      });
  }

  goToAllPage(page: number): void {
    this.allPage.set(page);
    this.loadAllReports(page);
  }

  get allPages(): number[] {
    return Array.from({ length: this.allLastPage() }, (_, i) => i + 1);
  }

  private loadPending(): void {
    this.loading.set(true);
    // Get venues with unverified halal status
    this.venueService.getVenues({ halal: 'unverified', per_page: 50 }).subscribe({
      next: (res) => {
        // For each unverified venue, fetch its halal reports
        const venues = res.data;
        if (venues.length === 0) {
          this.pendingVenues.set([]);
          this.loading.set(false);
          return;
        }

        let remaining = venues.length;
        const results: PendingVenue[] = [];

        venues.forEach((venue) => {
          this.venueService.getHalalReports(venue.id).subscribe({
            next: (data) => {
              if (data.summary.total > 0) {
                results.push({
                  venue,
                  total: data.summary.total,
                  halal: data.summary.halal,
                  not_halal: data.summary.not_halal,
                  actioning: false,
                });
              }
              remaining--;
              if (remaining === 0) {
                this.pendingVenues.set(results.sort((a, b) => b.total - a.total));
                this.loading.set(false);
              }
            },
            error: () => {
              remaining--;
              if (remaining === 0) {
                this.pendingVenues.set(results);
                this.loading.set(false);
              }
            },
          });
        });
      },
      error: () => this.loading.set(false),
    });
  }

  private loadAllReports(page: number): void {
    this.allLoading.set(true);
    this.analyticsService.getHalalReports({ page }).subscribe({
      next: (data: any) => {
        const items = data.data ?? data;
        const meta = data.meta ?? {};
        this.allReports.set(items);
        this.allLastPage.set(meta.last_page ?? 1);
        this.allLoading.set(false);
      },
      error: () => this.allLoading.set(false),
    });
  }
}
