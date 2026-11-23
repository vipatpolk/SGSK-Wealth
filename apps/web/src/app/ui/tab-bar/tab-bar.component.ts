import { Component, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { AssetTab, AppView } from '@shared/config/asset.constants';
import { NavIconComponent, NavIconName } from '@shared/components/nav-icon/nav-icon.component';
import { I18nService } from '@shared/services/i18n.service';

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, NavIconComponent],
  templateUrl: './tab-bar.component.html'
})
export class TabBarComponent {
  protected readonly i18n = inject(I18nService);

  currentView = input.required<AppView>();
  tabs = input.required<AssetTab[]>();
  activeTab = input.required<AssetTab>();
  isTabDropdownOpen = input.required<boolean>();
  tabCounts = input<Record<string, number>>({});

  tabSelect = output<AssetTab>();
  toggleDropdown = output<void>();

  resolveTabIconName(icon: string): NavIconName {
    switch (icon) {
      case 'flag-us':
        return 'flag-us';
      case 'flag-th':
        return 'flag-th';
      case 'bitcoin':
      case 'crypto':
        return 'crypto';
      case 'pie-chart':
      case 'fund':
        return 'fund';
      case 'landmark':
      case 'bond':
        return 'bond';
      case 'briefcase':
      case 'provident-fund':
        return 'pvd';
      case 'check-circle':
        return 'check-circle';
      default:
        return 'globe';
    }
  }

  getTabLabel(tab: AssetTab): string {
    switch (tab.id) {
      case 'all':
        return this.i18n.t('tab.allHoldings');
      case 'us-stock':
        return this.i18n.t('tab.usStock');
      case 'thai-stock':
        return this.i18n.t('tab.thaiStock');
      case 'mutual-fund':
        return this.i18n.t('tab.mutualFund');
      case 'crypto':
        return this.i18n.t('tab.crypto');
      case 'bond':
        return this.i18n.t('tab.bond');
      case 'provident-fund':
        return this.i18n.t('tab.pvd');
      case 'closed-position':
        return this.i18n.t('tab.closed');
      default:
        return tab.label;
    }
  }
}
