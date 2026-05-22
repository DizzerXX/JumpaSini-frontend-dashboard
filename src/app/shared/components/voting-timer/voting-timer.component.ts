import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
  selector: 'app-voting-timer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="voting-timer" [class]="colorClass()">
      <div class="timer-arc-wrap">
        <svg viewBox="0 0 64 64" class="timer-svg">
          <circle cx="32" cy="32" r="26" class="arc-bg" />
          <circle
            cx="32" cy="32" r="26"
            class="arc-fill"
            [style.stroke-dasharray]="circumference"
            [style.stroke-dashoffset]="dashOffset()"
            [attr.stroke]="arcColor()"
          />
        </svg>
        <div class="timer-center-text">{{ timeLabel() }}</div>
      </div>
      <div class="timer-info">
        <div class="timer-title">Voting in Progress</div>
        <div class="timer-subtitle">
          @if (isExpired()) { Confirming… } @else { {{ timeLabel() }} remaining }
        </div>
        <div class="timer-bar-track">
          <div
            class="timer-bar-fill"
            [style.width.%]="progress()"
            [style.background]="arcColor()"
          ></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .voting-timer {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #fff;
      border-radius: 14px;
      padding: 16px 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,.08);
      border: 1px solid #e5e7eb;
    }
    .timer-arc-wrap {
      position: relative;
      width: 72px;
      height: 72px;
      flex-shrink: 0;
    }
    .timer-svg {
      width: 72px;
      height: 72px;
      transform: rotate(-90deg);
    }
    .arc-bg { fill: none; stroke: #e5e7eb; stroke-width: 6; }
    .arc-fill { fill: none; stroke-width: 6; stroke-linecap: round; }
    .timer-center-text {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: #374151;
    }
    .timer-info { flex: 1; }
    .timer-title { font-size: 15px; font-weight: 700; color: #111827; }
    .timer-subtitle { font-size: 13px; color: #6b7280; margin-top: 2px; }
    .timer-bar-track {
      margin-top: 10px;
      height: 6px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    .timer-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.9s linear;
    }
  `],
})
export class VotingTimerComponent implements OnInit {
  @Input({ required: true }) endsAt!: string;
  @Output() readonly expired = new EventEmitter<void>();

  private readonly destroyRef = inject(DestroyRef);
  private emittedExpired = false;

  readonly circumference = 163.4; // 2 * π * 26
  readonly secondsRemaining = signal(0);
  readonly totalSeconds = signal(1);
  readonly isExpired = signal(false);

  readonly progress = computed(() => {
    const total = this.totalSeconds();
    return total > 0 ? Math.round((this.secondsRemaining() / total) * 100) : 0;
  });

  readonly arcColor = computed(() => {
    const f = this.secondsRemaining() / this.totalSeconds();
    if (f > 0.5) return '#16a34a';
    if (f > 0.25) return '#d97706';
    return '#dc2626';
  });

  readonly colorClass = computed(() => {
    const f = this.secondsRemaining() / this.totalSeconds();
    if (f > 0.5) return 'timer-green';
    if (f > 0.25) return 'timer-amber';
    return 'timer-red';
  });

  readonly dashOffset = computed(() => {
    return this.circumference - (this.progress() / 100) * this.circumference;
  });

  readonly timeLabel = computed(() => {
    if (this.isExpired()) return '0:00';
    const s = this.secondsRemaining();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  });

  ngOnInit(): void {
    const endMs = new Date(this.endsAt).getTime();
    const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
    this.totalSeconds.set(remaining > 0 ? remaining : 1);
    this.secondsRemaining.set(remaining);

    if (remaining <= 0) {
      this.isExpired.set(true);
      this.expired.emit();
      return;
    }

    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const secs = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
        this.secondsRemaining.set(secs);
        if (secs <= 0 && !this.emittedExpired) {
          this.emittedExpired = true;
          this.isExpired.set(true);
          this.expired.emit();
        }
      });
  }
}
