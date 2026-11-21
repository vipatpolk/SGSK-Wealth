import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  templateUrl: './filters.component.html'
})
export class FiltersComponent {
  isClosedTab = input.required<boolean>();
  closedAssetTypeOptions = input.required<any[]>();
  selectedClosedAssetType = input.required<string>();
  isMobileFilterDropdownOpen = input.required<boolean>();
  
  sortOptions = input.required<any[]>();
  sortField = input.required<string>();
  sortDirection = input.required<'asc' | 'desc'>();
  isMobileSortDropdownOpen = input.required<boolean>();
  
  toggleMobileFilter = output<void>();
  setClosedAssetType = output<string>();
  toggleMobileSort = output<void>();
  setSort = output<string>();
  toggleSortDir = output<void>();
}
