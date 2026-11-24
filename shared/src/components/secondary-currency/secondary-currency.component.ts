import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AppCurrency } from '../../models/user-settings.model';
import { convertToSecondaryCurrency, getSecondaryCurrency } from '../../utils/format.utils';

export type SecondaryCurrencyVariant = 'hero' | 'kpi' | 'inline' | 'table' | 'compact';

@Component({
  selector: 'app-secondary-currency',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe],
  templateUrl: './secondary-currency.component.html',
  styleUrls: ['./secondary-currency.component.css'],
  host: {
    '[class]': '"sec-curr-host variant-" + variant()',
  },
})
export class SecondaryCurrencyComponent {
  /** Monetary amount already converted to `displayCurrency`. */
  readonly amount = input<number | null | undefined>(null);
  readonly displayCurrency = input<AppCurrency>('THB');
  readonly exchangeRate = input<number>(0);
  readonly hasRate = input<boolean | undefined>(undefined);
  readonly digitsInfo = input<string>('1.2-2');
  readonly signed = input<boolean>(false);
  readonly variant = input<SecondaryCurrencyVariant>('inline');
  readonly privacy = input<boolean>(true);
  readonly parens = input<boolean>(false);

  readonly secondaryCurrency = computed<AppCurrency>(() =>
    getSecondaryCurrency(this.displayCurrency())
  );

  readonly secondaryAmount = computed<number | null>(() => {
    const amt = this.amount();
    const rate = this.exchangeRate();
    const rateOk = this.hasRate() ?? rate > 0;
    if (amt === null || amt === undefined || !rateOk || rate <= 0) {
      return null;
    }
    return convertToSecondaryCurrency(amt, this.displayCurrency(), rate);
  });
}
