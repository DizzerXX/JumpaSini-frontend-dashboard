import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-venue-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './venue-list.component.html',
  styleUrl: './venue-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VenueListComponent {}
