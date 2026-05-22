import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { VoteSummary } from '../../../core/models/collaboration.model';

interface Leader {
  name: string;
  votes: number;
  votesAhead: number;
}

@Component({
  selector: 'app-voting-winner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (leader) {
      <div class="winner-banner">
        <span class="winner-trophy">🏆</span>
        <div class="winner-info">
          <span class="winner-label">CURRENT LEADER</span>
          <span class="winner-name">{{ leader.name }}</span>
          @if (leader.votesAhead > 0) {
            <span class="winner-ahead">
              {{ leader.votesAhead }} vote{{ leader.votesAhead === 1 ? '' : 's' }} ahead
            </span>
          }
        </div>
        <div class="winner-score">
          <span class="winner-count">{{ leader.votes }}</span>
          <span class="winner-thumb">👍</span>
        </div>
      </div>
    } @else {
      <div class="winner-banner winner-banner--empty">
        <span>🗳️</span>
        <span class="no-votes-text">No votes yet — cast your vote!</span>
      </div>
    }
  `,
  styles: [`
    .winner-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 12px;
      padding: 14px 16px;
    }
    .winner-banner--empty {
      gap: 10px;
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
    }
    .winner-trophy { font-size: 22px; flex-shrink: 0; }
    .winner-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .winner-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #d97706;
      text-transform: uppercase;
    }
    .winner-name {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .winner-ahead {
      font-size: 12px;
      color: #6b7280;
    }
    .winner-score {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
    }
    .winner-count {
      font-size: 20px;
      font-weight: 700;
      color: #16a34a;
      line-height: 1;
    }
    .winner-thumb { font-size: 14px; }
    .no-votes-text { font-size: 14px; font-weight: 600; color: #92400e; }
  `],
})
export class VotingWinnerComponent {
  @Input({ required: true }) voteSummary!: Record<string, VoteSummary>;
  @Input({ required: true }) venueNames!: Record<string, string>;

  get leader(): Leader | null {
    const entries = Object.entries(this.voteSummary);
    if (!entries.length) return null;

    const sorted = [...entries].sort((a, b) => b[1].up - a[1].up);
    const [bestId, bestCounts] = sorted[0];
    if (bestCounts.up === 0) return null;

    const rawName = this.venueNames[bestId];
    const name = rawName ?? (bestId.length > 14 ? `${bestId.substring(0, 14)}…` : bestId);
    const votesAhead = sorted.length >= 2 ? bestCounts.up - sorted[1][1].up : bestCounts.up;
    return { name, votes: bestCounts.up, votesAhead };
  }
}
