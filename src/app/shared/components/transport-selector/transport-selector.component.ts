import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransportMode } from '../../../core/models/session.model';
import { APP_STRINGS } from '../../../core/constants/app.constants';

interface TransportOption {
  value: TransportMode;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-transport-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transport-selector.component.html',
  styleUrl: './transport-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransportSelectorComponent {
  @Input() selected: TransportMode | null = null;
  @Output() selectedChange = new EventEmitter<TransportMode>();

  readonly options: TransportOption[] = [
    { value: TransportMode.CAR, label: APP_STRINGS.TRANSPORT_CAR, icon: '🚗' },
    { value: TransportMode.PUBLIC_TRANSPORT, label: APP_STRINGS.TRANSPORT_PUBLIC, icon: '🚌' },
  ];

  select(mode: TransportMode): void {
    this.selectedChange.emit(mode);
  }

  isSelected(mode: TransportMode): boolean {
    return this.selected === mode;
  }
}
