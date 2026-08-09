import { Component, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { AssetTab } from '../../config/asset.constants';

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './tab-bar.component.html'
})
export class TabBarComponent {
  currentView = input.required<'holdings' | 'transactions' | 'allocation'>();
  tabs = input.required<AssetTab[]>();
  activeTab = input.required<AssetTab>();
  isTabDropdownOpen = input.required<boolean>();

  tabSelect = output<AssetTab>();
  toggleDropdown = output<void>();
}
