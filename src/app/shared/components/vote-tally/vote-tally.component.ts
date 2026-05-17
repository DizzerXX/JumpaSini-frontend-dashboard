import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { VoteSummary } from '../../../core/models/collaboration.model';

interface TallyRow {
  placeId: string;
  up: number;
  down: number;
  total: number;
  ratio: number;
  venueName: string;
}

@Component({
  selector: 'app-vote-tally',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vote-tally.component.html',
  styleUrl: './vote-tally.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteTallyComponent {
  private readonly _voteSummary = signal<Record<string, VoteSummary>>({});
  private readonly _venueNames = signal<Record<string, string>>({});

  @Input({ required: true })
  set voteSummary(val: Record<string, VoteSummary>) {
    this._voteSummary.set(val);
  }

  @Input()
  set venueNames(val: Record<string, string>) {
    this._venueNames.set(val);
  }

  readonly rows = computed<TallyRow[]>(() => {
    const summary = this._voteSummary();
    const names = this._venueNames();
    return Object.entries(summary)
      .map(([placeId, v]) => ({
        placeId,
        up: v.up,
        down: v.down,
        total: v.total,
        ratio: v.total > 0 ? v.up / v.total : 0,
        venueName: names[placeId] ?? placeId,
      }))
      .sort((a, b) => b.up - a.up);
  });
}
