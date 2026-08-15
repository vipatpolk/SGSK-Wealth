import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { AssetTab } from '../../config/asset.constants';

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './tab-bar.component.html'
})
export class TabBarComponent {
  currentView = input.required<'holdings' | 'transactions' | 'allocation' | 'performance' | 'dividends'>();
  tabs = input.required<AssetTab[]>();
  activeTab = input.required<AssetTab>();
  isTabDropdownOpen = input.required<boolean>();

  tabSelect = output<AssetTab>();
  toggleDropdown = output<void>();
}
