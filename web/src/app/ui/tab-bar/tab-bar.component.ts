import { Component, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { AssetTab, AppView } from '@shared/config/asset.constants';
import { I18nService } from '@shared/services/i18n.service';

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
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
