import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { SessionService } from '../../../core/services/session.service';
import { APP_STRINGS } from '../../../core/constants/app.constants';
import { AppError } from '../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-join-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './join-session.component.html',
  styleUrl: './join-session.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinSessionComponent {
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  readonly strings = APP_STRINGS;

  sessionCode = signal('');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  onCodeInput(value: string): void {
    this.sessionCode.set(value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
    this.errorMessage.set(null);
  }

  join(): void {
    const code = this.sessionCode().trim();
    if (!code) {
      this.errorMessage.set(APP_STRINGS.SESSION_CODE_REQUIRED);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.sessionService.getSession(code).subscribe({
      next: (session) => {
        this.isLoading.set(false);
        this.router.navigate(['/session', session.shortCode]);
      },
      error: (err: AppError) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.message ?? APP_STRINGS.SESSION_NOT_FOUND);
      },
    });
  }

  goToCreate(): void {
    this.router.navigate(['/create']);
  }
}
