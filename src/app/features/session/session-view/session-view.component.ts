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
  BehaviorSubject,
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

import { AppError } from '../../../core/interceptors/error.interceptor';
import { CollaborationService } from '../../../core/services/collaboration.service';
import { RecommendationService } from '../../../core/services/recommendation.service';
import { SessionService } from '../../../core/services/session.service';
import { GeoService, PlaceSuggestion, ResolvedLocation } from '../../../core/services/geo.service';
import {
  RecommendedVenue,
  SessionSummary,
  VoteSummary,
} from '../../../core/models/collaboration.model';
import { VoteButtonsComponent } from '../../../shared/components/vote-buttons/vote-buttons.component';
import { VoteTallyComponent } from '../../../shared/components/vote-tally/vote-tally.component';
import { ConfirmedVenueComponent } from '../../../shared/components/confirmed-venue/confirmed-venue.component';
import { ShortCodePipe } from '../../../shared/pipes/short-code.pipe';
import { VotingTimerComponent } from '../../../shared/components/voting-timer/voting-timer.component';
import { VotingWinnerComponent } from '../../../shared/components/voting-winner/voting-winner.component';

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
    VotingTimerComponent,
    VotingWinnerComponent,
  ],
  templateUrl: './session-view.component.html',
  styleUrl: './session-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly collaborationService = inject(CollaborationService);
  private readonly recommendationService = inject(RecommendationService);
  private readonly sessionService = inject(SessionService);
  private readonly geoService = inject(GeoService);
  private readonly destroyRef = inject(DestroyRef);
  private _venuesFetched = false;

  shortCode = '';

  summary = signal<SessionSummary | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  isUpdating = signal(false);
  isCopied = signal(false);
  joinSuccessMessage = signal<string | null>(null);
  /** Transient failure banner for vote/confirm actions. */
  actionError = signal<string | null>(null);
  /** True once this browser has joined; the backend rejects votes without it. */
  hasJoined = signal(false);

  private updateTimer: ReturnType<typeof setTimeout> | null = null;
  private joinSuccessTimer: ReturnType<typeof setTimeout> | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;
  private actionErrorTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly pollInterval$ = new BehaviorSubject<number>(10_000);

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
  readonly isSingleParticipant = computed(() => this.participants().length === 1);

  readonly votingState = computed(() => this.summary()?.voting_state ?? null);
  readonly isVotingActive = computed(() => this.votingState()?.active ?? false);
  readonly votingEndsAt = computed(() => this.votingState()?.ends_at ?? null);
  readonly votingConfirmedVenue = computed(() => this.votingState()?.voting_confirmed_venue ?? null);
  readonly isStartingVoting = signal(false);
  readonly isVotingExpired = signal(false);

  readonly showStartVoting = computed(
    () =>
      this.hasMidpoint() &&
      !!this.topVenue() &&
      !this.isVotingActive() &&
      !this.votingConfirmedVenue() &&
      !this.isComplete(),
  );

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

  readonly venueNames = signal<Record<string, string>>({});

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
    this.destroyRef.onDestroy(() => {
      if (this.updateTimer) clearTimeout(this.updateTimer);
      if (this.joinSuccessTimer) clearTimeout(this.joinSuccessTimer);
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
      if (this.expiryTimer) clearTimeout(this.expiryTimer);
      if (this.actionErrorTimer) clearTimeout(this.actionErrorTimer);
    });
    this.hasJoined.set(this.collaborationService.canVote(this.shortCode));
    this.loadSummary();
    this.setupPolling();
    this.setupAddressSearch();
  }

  private loadSummary(): void {
    this.collaborationService.getSessionSummary(this.shortCode).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.isLoading.set(false);
        this.updateVenueNames(summary);
      },
      error: (err: AppError) => {
        this.errorMessage.set(err?.message ?? 'Session not found.');
        this.isLoading.set(false);
      },
    });
  }

  private updateVenueNames(summary: SessionSummary): void {
    // Seed from best_venue immediately (no network call needed)
    const bestVenue = summary.recommendation?.best_venue;
    if (bestVenue?.place_id && bestVenue?.name) {
      this.venueNames.update((names) =>
        names[bestVenue.place_id]
          ? names
          : { ...names, [bestVenue.place_id]: bestVenue.name },
      );
    }
    // Fetch all 5 venue names once midpoint is available
    if (summary.midpoint && !this._venuesFetched) {
      this._venuesFetched = true;
      this.recommendationService
        .getVenues(this.shortCode)
        .pipe(catchError(() => of([])), takeUntilDestroyed(this.destroyRef))
        .subscribe((venues: RecommendedVenue[]) => {
          const names: Record<string, string> = {};
          for (const v of venues) {
            if (v.place_id && v.name) names[v.place_id] = v.name;
          }
          if (Object.keys(names).length > 0) {
            this.venueNames.set(names);
          }
        });
    }
  }

  private setupPolling(): void {
    this.pollInterval$
      .pipe(
        switchMap((ms) =>
          interval(ms).pipe(
            switchMap(() => {
              if (this.isComplete()) return EMPTY;
              return this.collaborationService.getSessionSummary(this.shortCode).pipe(
                catchError((err: AppError) => {
                  // A 404 means the session expired or was removed — say so instead of
                  // leaving the user staring at silently stale data forever.
                  if (err?.statusCode === 404) {
                    this.errorMessage.set(
                      'This session has expired or is no longer available.',
                    );
                  }
                  return EMPTY;
                }),
              );
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((summary) => {
        const prevCount = this.participants().length;
        this.summary.set(summary);
        this.updateVenueNames(summary);
        if (summary.participants.length > prevCount && prevCount > 0) {
          this.isUpdating.set(true);
          if (this.updateTimer) clearTimeout(this.updateTimer);
          this.updateTimer = setTimeout(() => this.isUpdating.set(false), 2000);
        }
        const desiredMs = (summary.voting_state?.active ?? false) ? 5_000 : 10_000;
        if (desiredMs !== this.pollInterval$.value) {
          this.pollInterval$.next(desiredMs);
        }
      });
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
          // The access_token was persisted by SessionService — voting is now allowed.
          this.hasJoined.set(this.collaborationService.canVote(this.shortCode));
          this.joinSuccessMessage.set("You've been added! Results will update shortly.");
          if (this.joinSuccessTimer) clearTimeout(this.joinSuccessTimer);
          this.joinSuccessTimer = setTimeout(() => this.joinSuccessMessage.set(null), 3000);
          this.loadSummary();
        },
        error: (err: AppError) => {
          this.joinError.set(err?.message ?? 'Failed to join. Please try again.');
          this.isJoining.set(false);
        },
      });
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
        next: ({ voteSummary }) => {
          const current = this.summary();
          if (current) {
            this.summary.set({ ...current, vote_summary: voteSummary });
          }
        },
        error: (err: AppError) => {
          this.showActionError(err?.message ?? 'Could not save your vote. Please try again.');
        },
      });
  }

  confirmVenue(placeId: string): void {
    this.actionError.set(null);

    this.collaborationService
      .confirmVenue(this.shortCode, { googlePlaceId: placeId })
      .subscribe({
        next: () => this.loadSummary(),
        error: (err: AppError) => {
          this.showActionError(err?.message ?? 'Could not confirm the venue. Please try again.');
        },
      });
  }

  /** Surfaces a transient failure banner; previously these errors were swallowed. */
  private showActionError(message: string): void {
    this.actionError.set(message);
    if (this.actionErrorTimer) clearTimeout(this.actionErrorTimer);
    this.actionErrorTimer = setTimeout(() => this.actionError.set(null), 5000);
  }

  startVoting(): void {
    this.isStartingVoting.set(true);
    this.collaborationService.startVoting(this.shortCode).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.isStartingVoting.set(false);
        if (summary.voting_state?.active) {
          this.pollInterval$.next(5_000);
        }
      },
      error: () => {
        this.isStartingVoting.set(false);
      },
    });
  }

  onVotingExpired(): void {
    this.isVotingExpired.set(true);
    this.loadSummary();
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    this.expiryTimer = setTimeout(() => {
      this.isVotingExpired.set(false);
      this.loadSummary();
    }, 3000);
  }

  getVoteData(placeId: string): VoteSummary {
    return this.voteSummary()[placeId] ?? { up: 0, down: 0, total: 0 };
  }

  async copyCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.shortCode);
      this.isCopied.set(true);
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => this.isCopied.set(false), 1500);
    } catch {
      // Clipboard API unavailable — fail silently
    }
  }
}
