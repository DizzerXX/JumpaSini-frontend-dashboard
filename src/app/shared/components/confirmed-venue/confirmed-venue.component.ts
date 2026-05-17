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
    return `https://www.google.com/maps/place/?q=place_id:${this.venue.google_place_id}`;
  }
}
