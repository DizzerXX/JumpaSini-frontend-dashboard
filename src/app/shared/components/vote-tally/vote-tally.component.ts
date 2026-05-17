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
  upVotes: number;
  downVotes: number;
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

  @Input({ required: true })
  set voteSummary(val: Record<string, VoteSummary>) {
    this._voteSummary.set(val);
  }

  readonly rows = computed<TallyRow[]>(() => {
    const summary = this._voteSummary();
    return Object.entries(summary)
      .map(([key, v]) => ({
        placeId: v.placeId ?? key,
        upVotes: v.upVotes,
        downVotes: v.downVotes,
        total: v.total,
        ratio: v.total > 0 ? v.upVotes / v.total : 0,
        venueName: key,
      }))
      .sort((a, b) => b.upVotes - a.upVotes);
  });
}
