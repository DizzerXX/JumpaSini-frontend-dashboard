import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipantModel } from '../../../core/models/participant.model';

@Component({
  selector: 'app-participant-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './participant-card.component.html',
  styleUrl: './participant-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantCardComponent {
  @Input({ required: true }) participant!: ParticipantModel;
  @Input() showRemove = false;
  @Output() remove = new EventEmitter<string>();

  get displayName(): string {
    return this.participant.name?.trim() || 'Anonymous';
  }

  get initials(): string {
    const name = this.participant.name?.trim();
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  get truncatedAddress(): string {
    const addr = this.participant.address;
    return addr.length > 40 ? addr.slice(0, 40) + '…' : addr;
  }

  onRemove(): void {
    this.remove.emit(this.participant.id);
  }
}
