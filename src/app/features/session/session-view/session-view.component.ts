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
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import {
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
  interval,
  of,
  switchMap,
} from 'rxjs';

import { CollaborationService } from '../../../core/services/collaboration.service';
import { SessionService } from '../../../core/services/session.service';
import { GeoService, PlaceSuggestion, ResolvedLocation } from '../../../core/services/geo.service';
import { SessionSummary, VoteSummary } from '../../../core/models/collaboration.model';
import { VoteButtonsComponent } from '../../../shared/components/vote-buttons/vote-buttons.component';
import { VoteTallyComponent } from '../../../shared/components/vote-tally/vote-tally.component';
import { ConfirmedVenueComponent } from '../../../shared/components/confirmed-venue/confirmed-venue.component';
import { ShortCodePipe } from '../../../shared/pipes/short-code.pipe';

@Component({
  selector: 'app-session-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GoogleMap,
    MapMarker,
    VoteButtonsComponent,
    VoteTallyComponent,
    ConfirmedVenueComponent,
    ShortCodePipe,
  ],
  templateUrl: './session-view.component.html',
  styleUrl: './session-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly collaborationService = inject(CollaborationService);
  private readonly sessionService = inject(SessionService);
  private readonly geoService = inject(GeoService);
  private readonly destroyRef = inject(DestroyRef);

  shortCode = '';

  summary = signal<SessionSummary | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  readonly isComplete = computed(() => this.summary()?.is_complete ?? false);
  readonly isPolling = computed(() => {
    const s = this.summary();
    return s !== null && !s.is_complete;
  });
  readonly participants = computed(() => this.summary()?.participants ?? []);
  readonly voteSummary = computed(() => this.summary()?.vote_summary ?? {});
  readonly topVenue = computed(() => this.summary()?.recommendation?.best_venue ?? null);
  readonly confirmedVenue = computed(() => this.summary()?.confirmed_venue ?? null);
  readonly hasMidpoint = computed(() => this.summary()?.midpoint !== null);

  readonly hoursUntilExpiry = computed(() => {
    const expiry = this.summary()?.expires_at;
    if (!expiry) return 0;
    const diff = new Date(expiry).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 3_600_000));
  });

  readonly participantInitials = computed(() =>
    this.participants().map((p) => {
      const name = p.name?.trim();
      if (!name) return '?';
      const parts = name.split(' ').filter(Boolean);
      return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
    }),
  );

  readonly confirmedMapCenter = computed<google.maps.LatLngLiteral>(() => {
    const venue = this.confirmedVenue();
    if (venue?.latitude != null && venue?.longitude != null) {
      return { lat: venue.latitude, lng: venue.longitude };
    }
    return { lat: 3.139, lng: 101.6869 };
  });

  readonly confirmedMarkerPosition = computed<google.maps.LatLngLiteral | null>(() => {
    const venue = this.confirmedVenue();
    if (venue?.latitude != null && venue?.longitude != null) {
      return { lat: venue.latitude, lng: venue.longitude };
    }
    return null;
  });

  readonly venueNames = computed<Record<string, string>>(() => {
    const venues = this.summary()?.recommendation?.venues as any[] | undefined;
    if (!venues) return {};
    return Object.fromEntries(venues.map((v: any) => [v.place_id, v.name]));
  });

  // Join form
  joinName = signal('');
  joinAddressQuery = signal('');
  joinLocation = signal<ResolvedLocation | null>(null);
  joinSuggestions = signal<PlaceSuggestion[]>([]);
  showJoinSuggestions = signal(false);
  isJoining = signal(false);
  isResolvingLocation = signal(false);
  joinError = signal<string | null>(null);

  readonly hasVotes = computed(() => Object.keys(this.voteSummary()).length > 0);
  readonly canJoin = computed(() => this.joinLocation() !== null && !this.isJoining());

  mapOptions: google.maps.MapOptions = {
    zoom: 15,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.shortCode = this.route.snapshot.paramMap.get('shortCode') ?? '';
    this.loadSummary();
    this.setupPolling();
    this.setupAddressSearch();
  }

  private loadSummary(): void {
    this.collaborationService.getSessionSummary(this.shortCode).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.errorMessage.set(err?.message ?? 'Session not found.');
        this.isLoading.set(false);
      },
    });
  }

  private setupPolling(): void {
    interval(10_000)
      .pipe(
        switchMap(() => {
          if (this.isComplete()) return EMPTY;
          return this.collaborationService
            .getSessionSummary(this.shortCode)
            .pipe(catchError(() => EMPTY));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((summary) => this.summary.set(summary));
  }

  private setupAddressSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.length < 3) {
            this.joinSuggestions.set([]);
            this.showJoinSuggestions.set(false);
            return EMPTY;
          }
          return this.geoService
            .getAddressSuggestions(query)
            .pipe(catchError(() => of([])));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        this.joinSuggestions.set(results);
        this.showJoinSuggestions.set(results.length > 0);
      });
  }

  onJoinAddressInput(value: string): void {
    this.joinAddressQuery.set(value);
    if (!value.trim()) this.joinLocation.set(null);
    this.searchSubject.next(value);
  }

  async selectJoinSuggestion(suggestion: PlaceSuggestion): Promise<void> {
    this.showJoinSuggestions.set(false);
    this.isResolvingLocation.set(true);
    try {
      const loc = await firstValueFrom(this.geoService.resolvePlaceId(suggestion.placeId));
      this.joinLocation.set(loc);
      this.joinAddressQuery.set(loc.address);
    } catch {
      this.joinError.set('Could not resolve address. Please try again.');
    } finally {
      this.isResolvingLocation.set(false);
    }
  }

  joinSession(): void {
    const loc = this.joinLocation();
    if (!loc) return;
    this.isJoining.set(true);
    this.joinError.set(null);
    this.sessionService
      .addParticipant(this.shortCode, {
        name: this.joinName().trim() || undefined,
        address: loc.address,
        latitude: loc.latitude,
        longitude: loc.longitude,
      })
      .subscribe({
        next: () => {
          this.joinName.set('');
          this.joinAddressQuery.set('');
          this.joinLocation.set(null);
          this.isJoining.set(false);
          this.loadSummary();
        },
        error: (err: any) => {
          this.joinError.set(err?.message ?? 'Failed to join. Please try again.');
          this.isJoining.set(false);
        },
      });
  }

  castVote(placeId: string, venueName: string, vote: string): void {
    this.collaborationService
      .castVote(this.shortCode, {
        googlePlaceId: placeId,
        venueName,
        vote: vote as 'up' | 'down',
      })
      .subscribe({
        next: ({ voteSummary }) => {
          const current = this.summary();
          if (current) {
            this.summary.set({ ...current, vote_summary: voteSummary });
          }
        },
        error: () => {},
      });
  }

  confirmVenue(placeId: string): void {
    this.collaborationService
      .confirmVenue(this.shortCode, { googlePlaceId: placeId })
      .subscribe({
        next: () => this.loadSummary(),
        error: () => {},
      });
  }

  getVoteData(placeId: string): VoteSummary {
    return this.voteSummary()[placeId] ?? { up: 0, down: 0, total: 0 };
  }
}
