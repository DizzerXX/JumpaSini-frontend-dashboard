import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-venue-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './venue-form.component.html',
  styleUrl: './venue-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VenueFormComponent {}
