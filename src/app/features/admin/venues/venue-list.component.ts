import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VenueManagementService } from '../../../core/services/venue-management.service';
import { VenueModel, VenueType, VENUE_TYPES } from '../../../core/models/venue.model';
import { PaginationMeta } from '../../../core/models/paginated-response.model';

type HalalFilter = 'all' | 'true' | 'false' | 'unverified';

@Component({
  selector: 'app-venue-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './venue-list.component.html',
  styleUrl: './venue-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VenueListComponent implements OnInit {
  private readonly service = inject(VenueManagementService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly venues = signal<VenueModel[]>([]);
  readonly pagination = signal<PaginationMeta | null>(null);
  readonly loading = signal(true);
  readonly deletingId = signal<string | null>(null);

  readonly venueTypes = VENUE_TYPES;
  selectedType = '';
  selectedHalal: HalalFilter = 'all';
  searchTerm = '';
  currentPage = 1;

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage = 1;
        this.load();
      });

    this.load();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.search$.next(value);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.load();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.load();
  }

  editVenue(id: string): void {
    this.router.navigate(['/admin/venues', id, 'edit']);
  }

  manageHalal(id: string): void {
    this.router.navigate(['/admin/halal'], { queryParams: { venue: id } });
  }

  deleteVenue(venue: VenueModel): void {
    if (!confirm(`Deactivate "${venue.name}"? It will be hidden from users.`)) return;
    this.deletingId.set(venue.id);
    this.service.deleteVenue(venue.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.load();
      },
      error: () => this.deletingId.set(null),
    });
  }

  halalLabel(venue: VenueModel): string {
    if (venue.is_halal_verified) return '✅ JAKIM';
    if (venue.is_halal === true) return '✅ Halal';
    if (venue.is_halal === false) return '❌ Not Halal';
    return '⚪ Unverified';
  }

  halalClass(venue: VenueModel): string {
    if (venue.is_halal_verified) return 'badge-jakim';
    if (venue.is_halal === true) return 'badge-halal';
    if (venue.is_halal === false) return 'badge-not-halal';
    return 'badge-unverified';
  }

  stars(rating: number | null): string {
    if (rating === null) return '—';
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  }

  get pages(): number[] {
    const meta = this.pagination();
    if (!meta) return [];
    return Array.from({ length: meta.last_page }, (_, i) => i + 1);
  }

  private load(): void {
    this.loading.set(true);
    this.service
      .getVenues({
        search: this.searchTerm || undefined,
        type: (this.selectedType as VenueType) || undefined,
        halal: this.selectedHalal === 'all' ? undefined : (this.selectedHalal as any),
        page: this.currentPage,
      })
      .subscribe({
        next: (res) => {
          this.venues.set(res.data);
          this.pagination.set(res.meta);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
