import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats an 8-char session code into hyphenated display format.
 * Example: XK92MQ7P → XK92-MQ7P
 */
@Pipe({
  name: 'shortCode',
  standalone: true,
})
export class ShortCodePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value || value.length !== 8) return value ?? '';
    return `${value.slice(0, 4)}-${value.slice(4)}`;
  }
}
