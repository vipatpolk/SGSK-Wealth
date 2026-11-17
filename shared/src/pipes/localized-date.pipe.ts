import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

@Pipe({
  name: 'ldate',
  standalone: true,
  pure: false,
})
export class LocalizedDatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(
    value: string | Date | number | null | undefined,
    style: 'medium' | 'short' | 'monthYear' = 'medium'
  ): string {
    return this.i18n.formatDate(value, style);
  }
}
