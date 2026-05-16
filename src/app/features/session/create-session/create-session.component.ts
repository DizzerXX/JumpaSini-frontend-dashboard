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
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, EMPTY, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import * as QRCode from 'qrcode';

import { SessionService } from '../../../core/services/session.service';
import { GeoService, PlaceSuggestion, ResolvedLocation } from '../../../core/services/geo.service';
import { TransportMode, VenueType, CreateSessionPayload } from '../../../core/models/session.model';
import { APP_STRINGS, MAX_PARTICIPANTS, MIN_PARTICIPANTS } from '../../../core/constants/app.constants';
import { AppError } from '../../../core/interceptors/error.interceptor';
import { TransportSelectorComponent } from '../../../shared/components/transport-selector/transport-selector.component';
import { VenueTypeSelectorComponent } from '../../../shared/components/venue-type-selector/venue-type-selector.component';
import { ParticipantCardComponent } from '../../../shared/components/participant-card/participant-card.component';
import { ShortCodePipe } from '../../../shared/pipes/short-code.pipe';

interface LocalParticipant {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TransportSelectorComponent,
    VenueTypeSelectorComponent,
    ParticipantCardComponent,
    ShortCodePipe,
  ],
  templateUrl: './create-session.component.html',
  styleUrl: './create-session.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSessionComponent implements OnInit {
  private readonly sessionService = inject(SessionService);
  private readonly geoService = inject(GeoService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly strings = APP_STRINGS;
  readonly VenueType = VenueType;

  // Step state
  currentStep = signal<1 | 2 | 3>(1);

  // Step 1 state
  transportMode = signal<TransportMode | null>(null);
  venueType = signal<VenueType | null>(null);
  halalFilter = signal(true);

  showHalalFilter = computed(() =>
    this.venueType() === VenueType.RESTAURANT || this.venueType() === VenueType.CAFE,
  );
  canProceedStep1 = computed(
    () => this.transportMode() !== null && this.venueType() !== null,
  );

  // Step 2 state
  localParticipants = signal<LocalParticipant[]>([]);
  participantName = signal('');
  selectedLocation = signal<ResolvedLocation | null>(null);
  suggestions = signal<PlaceSuggestion[]>([]);
  showSuggestions = signal(false);
  isLoadingLocation = signal(false);
  isFull = computed(() => this.localParticipants().length >= MAX_PARTICIPANTS);
  canProceedStep2 = computed(() => this.localParticipants().length >= MIN_PARTICIPANTS);

  // Step 3 state
  createdShortCode = signal('');
  shareableUrl = signal('');
  qrCodeDataUrl = signal('');

  // UI state
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  linkCopied = signal(false);

  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.length < 3) {
            this.suggestions.set([]);
            this.showSuggestions.set(false);
            return EMPTY;
          }
          return this.geoService.getAddressSuggestions(query).pipe(
            catchError(() => of([])),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        this.suggestions.set(results);
        this.showSuggestions.set(results.length > 0);
      });
  }

  // Step 1
  onTransportChange(mode: TransportMode): void {
    this.transportMode.set(mode);
  }

  onVenueChange(type: VenueType): void {
    this.venueType.set(type);
    if (type !== VenueType.RESTAURANT && type !== VenueType.CAFE) {
      this.halalFilter.set(true);
    }
  }

  goToStep2(): void {
    if (this.canProceedStep1()) this.currentStep.set(2);
  }

  // Step 2 — address search
  onSearchInput(query: string): void {
    if (!query.trim()) {
      this.selectedLocation.set(null);
    }
    this.searchSubject.next(query);
  }

  async selectSuggestion(suggestion: PlaceSuggestion): Promise<void> {
    this.showSuggestions.set(false);
    this.isLoadingLocation.set(true);
    try {
      const location = await firstValueFrom(
        this.geoService.resolvePlaceId(suggestion.placeId),
      );
      this.selectedLocation.set(location);
    } catch {
      this.errorMessage.set(APP_STRINGS.SERVER_ERROR);
    } finally {
      this.isLoadingLocation.set(false);
    }
  }

  async useCurrentLocation(): Promise<void> {
    this.isLoadingLocation.set(true);
    this.errorMessage.set(null);
    try {
      const coords = await firstValueFrom(this.geoService.getCurrentPosition());
      const address = await firstValueFrom(
        this.geoService.reverseGeocode(coords.latitude, coords.longitude),
      );
      this.selectedLocation.set({
        address,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch {
      this.errorMessage.set(APP_STRINGS.LOCATION_UNAVAILABLE);
    } finally {
      this.isLoadingLocation.set(false);
    }
  }

  addParticipant(): void {
    const location = this.selectedLocation();
    if (!location || this.isFull()) return;

    this.localParticipants.update((list) => [
      ...list,
      {
        name: this.participantName().trim(),
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
      },
    ]);

    this.participantName.set('');
    this.selectedLocation.set(null);
    this.suggestions.set([]);
    this.showSuggestions.set(false);
    this.errorMessage.set(null);
  }

  removeLocalParticipant(index: number): void {
    this.localParticipants.update((list) => list.filter((_, i) => i !== index));
  }

  async findMeetupSpot(): Promise<void> {
    if (!this.canProceedStep2() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      const payload: CreateSessionPayload = {
        transportMode: this.transportMode()!,
        venueType: this.venueType()!,
        halalFilter: this.halalFilter(),
      };

      let session = await firstValueFrom(this.sessionService.createSession(payload));

      for (const p of this.localParticipants()) {
        session = await firstValueFrom(
          this.sessionService.addParticipant(session.shortCode, {
            name: p.name || undefined,
            address: p.address,
            latitude: p.latitude,
            longitude: p.longitude,
          }),
        );
      }

      const url = `${window.location.origin}/session/${session.shortCode}`;
      this.createdShortCode.set(session.shortCode);
      this.shareableUrl.set(url);

      const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 2 });
      this.qrCodeDataUrl.set(dataUrl);

      this.currentStep.set(3);
    } catch (err) {
      const appError = err as AppError;
      this.errorMessage.set(appError?.message ?? APP_STRINGS.SERVER_ERROR);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Step 3
  async copyLink(): Promise<void> {
    await navigator.clipboard.writeText(this.shareableUrl());
    this.linkCopied.set(true);
    setTimeout(() => this.linkCopied.set(false), 2000);
  }

  continueToResults(): void {
    this.router.navigate(['/session', this.createdShortCode()]);
  }

  navigateToJoin(): void {
    this.router.navigate(['/join']);
  }
}
