import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-halal-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './halal-manager.component.html',
  styleUrl: './halal-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HalalManagerComponent {}
