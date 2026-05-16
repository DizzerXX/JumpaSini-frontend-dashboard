import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { VenueType } from '../../../core/models/session.model';
import { APP_STRINGS } from '../../../core/constants/app.constants';

interface VenueOption {
  value: VenueType;
  label: string;
  emoji: string;
}

@Component({
  selector: 'app-venue-type-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './venue-type-selector.component.html',
  styleUrl: './venue-type-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VenueTypeSelectorComponent {
  @Input() selected: VenueType | null = null;
  @Output() selectedChange = new EventEmitter<VenueType>();

  readonly options: VenueOption[] = [
    { value: VenueType.MALL,       label: APP_STRINGS.VENUE_MALL,       emoji: '🏬' },
    { value: VenueType.RESTAURANT, label: APP_STRINGS.VENUE_RESTAURANT, emoji: '🍽️' },
    { value: VenueType.CAFE,       label: APP_STRINGS.VENUE_CAFE,       emoji: '☕' },
    { value: VenueType.PARK,       label: APP_STRINGS.VENUE_PARK,       emoji: '🌳' },
    { value: VenueType.BEACH,      label: APP_STRINGS.VENUE_BEACH,      emoji: '🏖️' },
    { value: VenueType.WATERFALL,  label: APP_STRINGS.VENUE_WATERFALL,  emoji: '🌊' },
    { value: VenueType.RIVER,      label: APP_STRINGS.VENUE_RIVER,      emoji: '🏞️' },
  ];

  select(type: VenueType): void {
    this.selectedChange.emit(type);
  }

  isSelected(type: VenueType): boolean {
    return this.selected === type;
  }
}
