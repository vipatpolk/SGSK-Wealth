import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type NavIconName =
  | 'dashboard'
  | 'holdings'
  | 'analytics'
  | 'dividends'
  | 'transactions'
  | 'tools'
  | 'sidebar-collapse'
  | 'eye'
  | 'eye-off'
  | 'refresh'
  | 'settings'
  | 'local-data'
  | 'sign-in'
  | 'sign-out'
  | 'market'
  | 'pvd'
  | 'allocation'
  | 'performance'
  | 'globe'
  | 'flag-us'
  | 'flag-th'
  | 'crypto'
  | 'fund'
  | 'bond'
  | 'check-circle';

@Component({
  selector: 'app-nav-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav-icon.component.html',
  styleUrl: './nav-icon.component.css',
  host: {
    '[class.is-active]': 'active()',
    'aria-hidden': '"true"',
  },
})
export class NavIconComponent {
  readonly name = input.required<NavIconName>();
  readonly active = input<boolean>(false);
}
