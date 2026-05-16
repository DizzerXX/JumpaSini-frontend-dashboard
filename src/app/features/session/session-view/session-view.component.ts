import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GoogleMap, MapMarker } from '@angular/google-maps';

import { SessionService } from '../../../core/services/session.service';
import { SessionModel, TransportMode, VenueType } from '../../../core/models/session.model';
import { APP_STRINGS } from '../../../core/constants/app.constants';
import { AppError } from '../../../core/interceptors/error.interceptor';
import { ParticipantCardComponent } from '../../../shared/components/participant-card/participant-card.component';
import { ShortCodePipe } from '../../../shared/pipes/short-code.pipe';

@Component({
  selector: 'app-session-view',
  standalone: true,
  imports: [CommonModule, GoogleMap, MapMarker, ParticipantCardComponent, ShortCodePipe],
  templateUrl: './session-view.component.html',
  styleUrl: './session-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sessionService = inject(SessionService);

  readonly strings = APP_STRINGS;

  session = signal<SessionModel | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  mapCenter = computed<google.maps.LatLngLiteral>(() => {
    const participants = this.session()?.participants ?? [];
    if (participants.length === 0) return { lat: 3.1390, lng: 101.6869 }; // KL centre
    const avgLat = participants.reduce((s, p) => s + p.latitude, 0) / participants.length;
    const avgLng = participants.reduce((s, p) => s + p.longitude, 0) / participants.length;
    return { lat: avgLat, lng: avgLng };
  });

  markerPositions = computed<google.maps.LatLngLiteral[]>(() =>
    (this.session()?.participants ?? []).map((p) => ({
      lat: p.latitude,
      lng: p.longitude,
    })),
  );

  mapOptions: google.maps.MapOptions = {
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  ngOnInit(): void {
    const shortCode = this.route.snapshot.paramMap.get('shortCode') ?? '';
    this.sessionService.getSession(shortCode).subscribe({
      next: (session) => {
        this.session.set(session);
        this.isLoading.set(false);
      },
      error: (err: AppError) => {
        this.errorMessage.set(err?.message ?? APP_STRINGS.SESSION_NOT_FOUND);
        this.isLoading.set(false);
      },
    });
  }

  transportLabel(mode: TransportMode): string {
    return mode === TransportMode.CAR ? '🚗 Car' : '🚌 Public Transport';
  }

  venueLabel(type: VenueType): string {
    const map: Record<VenueType, string> = {
      [VenueType.MALL]:       '🏬 Mall',
      [VenueType.RESTAURANT]: '🍽️ Restaurant',
      [VenueType.CAFE]:       '☕ Cafe',
      [VenueType.PARK]:       '🌳 Park',
      [VenueType.BEACH]:      '🏖️ Beach',
      [VenueType.WATERFALL]:  '🌊 Waterfall',
      [VenueType.RIVER]:      '🏞️ River',
    };
    return map[type] ?? type;
  }
}
