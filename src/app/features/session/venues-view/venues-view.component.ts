import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { catchError, of } from 'rxjs';

import { AppError } from '../../../core/interceptors/error.interceptor';
import { CollaborationService } from '../../../core/services/collaboration.service';
import { RecommendationService } from '../../../core/services/recommendation.service';
import { RecommendedVenue, VoteSummary } from '../../../core/models/collaboration.model';
import { VoteButtonsComponent } from '../../../shared/components/vote-buttons/vote-buttons.component';

type ViewMode = 'list' | 'map';

/**
 * All discovered venues for a session, as a list or on a map.
 *
 * The session view shows only the top pick plus runner-ups; this is the "see
 * everything" screen, mirroring the mobile app's VenuesPage list/map tabs.
 */
@Component({
  selector: 'app-venues-view',
  standalone: true,
  imports: [CommonModule, GoogleMap, MapMarker, VoteButtonsComponent],
  templateUrl: './venues-view.component.html',
  styleUrl: './venues-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VenuesViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recommendationService = inject(RecommendationService);
  private readonly collaborationService = inject(CollaborationService);
  private readonly destroyRef = inject(DestroyRef);

  shortCode = '';

  readonly venues = signal<RecommendedVenue[]>([]);
  readonly voteSummary = signal<Record<string, VoteSummary>>({});
  readonly midpoint = signal<google.maps.LatLngLiteral | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly mode = signal<ViewMode>('list');
  readonly halalOnly = signal(false);

  readonly canVote = computed(() => this.collaborationService.canVote(this.shortCode));

  readonly visibleVenues = computed(() =>
    this.halalOnly()
      ? this.venues().filter((v) => v.is_halal === true)
      : this.venues(),
  );

  /** Falls back to KL city centre until the session's midpoint is known. */
  readonly mapCenter = computed<google.maps.LatLngLiteral>(
    () => this.midpoint() ?? { lat: 3.139, lng: 101.6869 },
  );

  readonly markers = computed(() =>
    this.visibleVenues()
      .filter((v) => v.lat != null && v.lng != null)
      .map((v) => ({
        position: { lat: v.lat as number, lng: v.lng as number },
        title: v.name,
        options: { label: { text: v.is_best_pick ? '★' : '•', color: '#fff' } },
      })),
  );

  readonly mapOptions: google.maps.MapOptions = {
    zoom: 13,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  private actionErrorTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.shortCode = this.route.snapshot.paramMap.get('shortCode') ?? '';
    this.destroyRef.onDestroy(() => {
      if (this.actionErrorTimer) clearTimeout(this.actionErrorTimer);
    });
    this.load();
  }

  private load(): void {
    this.recommendationService
      .getVenues(this.shortCode)
      .pipe(catchError(() => of([])))
      .subscribe((venues) => {
        this.venues.set(venues);
        this.isLoading.set(false);
        if (venues.length === 0) {
          this.errorMessage.set('No venues found for this session yet.');
        }
      });

    // Summary supplies the midpoint to centre the map, and the vote tallies.
    this.collaborationService.getSessionSummary(this.shortCode).subscribe({
      next: (summary) => {
        this.voteSummary.set(summary.vote_summary ?? {});
        if (summary.midpoint) {
          this.midpoint.set({ lat: summary.midpoint.lat, lng: summary.midpoint.lng });
        }
      },
      error: () => {
        // Non-fatal: the venue list is the point of this screen, the map just
        // falls back to a default centre.
      },
    });
  }

  getVoteData(placeId: string): VoteSummary {
    return this.voteSummary()[placeId] ?? { up: 0, down: 0, total: 0, my_vote: null };
  }

  castVote(placeId: string, venueName: string, vote: string): void {
    this.actionError.set(null);

    this.collaborationService
      .castVote(this.shortCode, {
        googlePlaceId: placeId,
        venueName,
        vote: vote as 'up' | 'down',
      })
      .subscribe({
        next: ({ voteSummary }) => this.voteSummary.set(voteSummary),
        error: (err: AppError) =>
          this.showActionError(err?.message ?? 'Could not save your vote.'),
      });
  }

  confirmVenue(placeId: string): void {
    this.actionError.set(null);

    this.collaborationService
      .confirmVenue(this.shortCode, { googlePlaceId: placeId })
      .subscribe({
        next: () => this.back(),
        error: (err: AppError) =>
          this.showActionError(err?.message ?? 'Could not confirm the venue.'),
      });
  }

  toggleHalal(): void {
    this.halalOnly.update((v) => !v);
  }

  setMode(mode: ViewMode): void {
    this.mode.set(mode);
  }

  back(): void {
    this.router.navigate(['/session', this.shortCode]);
  }

  private showActionError(message: string): void {
    this.actionError.set(message);
    if (this.actionErrorTimer) clearTimeout(this.actionErrorTimer);
    this.actionErrorTimer = setTimeout(() => this.actionError.set(null), 5000);
  }
}
