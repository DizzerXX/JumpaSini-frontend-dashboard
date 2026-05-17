import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vote-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vote-buttons.component.html',
  styleUrl: './vote-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteButtonsComponent implements OnChanges {
  @Input({ required: true }) placeId!: string;
  @Input({ required: true }) venueName!: string;
  @Input() upVotes = 0;
  @Input() downVotes = 0;
  @Input() myVote: string | null = null;

  @Output() voted = new EventEmitter<{ placeId: string; vote: string }>();

  optimisticVote = signal<string | null>(null);
  optimisticUp = signal(0);
  optimisticDown = signal(0);

  ngOnChanges(): void {
    this.optimisticVote.set(this.myVote ?? null);
    this.optimisticUp.set(this.upVotes);
    this.optimisticDown.set(this.downVotes);
  }

  vote(vote: 'up' | 'down'): void {
    const current = this.optimisticVote();
    if (current === vote) return;

    // Optimistic update
    if (current === 'up') this.optimisticUp.update((n) => Math.max(0, n - 1));
    if (current === 'down') this.optimisticDown.update((n) => Math.max(0, n - 1));
    if (vote === 'up') this.optimisticUp.update((n) => n + 1);
    if (vote === 'down') this.optimisticDown.update((n) => n + 1);
    this.optimisticVote.set(vote);

    this.voted.emit({ placeId: this.placeId, vote });
  }
}
