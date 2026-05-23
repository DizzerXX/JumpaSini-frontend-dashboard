import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConfirmedVenue } from '../../../core/models/collaboration.model';

@Component({
  selector: 'app-confirmed-venue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmed-venue.component.html',
  styleUrl: './confirmed-venue.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmedVenueComponent {
  @Input({ required: true }) venue!: ConfirmedVenue;

  get mapsUrl(): string {
    const { latitude: lat, longitude: lng, google_place_id: placeId } = this.venue;
    if (lat != null && lng != null) {
      const base = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      return placeId ? `${base}&query_place_id=${placeId}` : base;
    }
    return `https://www.google.com/maps/search/?api=1&query=place_id:${placeId}`;
  }
}
