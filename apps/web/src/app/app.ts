import { Component, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { DecimalPipe, CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { AppStateFacade } from '@app/core/app-state.facade';
import { TransactionHistoryComponent } from '@app/features/transactions/transaction-history.component';
import { HeaderComponent } from '@app/ui/header/header.component';
import { TabBarComponent } from '@app/ui/tab-bar/tab-bar.component';
import { SearchBarComponent } from '@app/ui/search/search-bar.component';
import { FiltersComponent } from '@app/ui/filters/filters.component';
import { SummaryCardComponent } from '@app/ui/summary-card/summary-card.component';
import { DividendComponent } from '@app/features/dividends/dividend.component';
import { ToolsComponent } from '@app/features/tools/tools.component';
import { DashboardComponent } from '@app/features/dashboard/dashboard.component';
import { AnalyticsComponent } from '@app/features/analytics/analytics.component';
import { PvdHoldingsComponent } from '@app/features/holdings/pvd/pvd-holdings.component';
import { LoadingScreenComponent } from '@shared/components/loading-screen/loading-screen.component';
import { FundFactsheetModalComponent } from '@app/features/factsheets/fund-factsheet-modal.component';
import { AuthScreenComponent } from '@app/features/auth/auth-screen.component';
import { UserSettingsModalComponent } from '@app/features/settings/user-settings-modal.component';
import { LocalPortfolioModalComponent } from '@app/features/local-portfolio/local-portfolio-modal.component';
import { NavIconComponent } from '@shared/components/nav-icon/nav-icon.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    CurrencyPipe,
    NgTemplateOutlet,
    TransactionHistoryComponent,
    HeaderComponent,
    TabBarComponent,
    SearchBarComponent,
    FiltersComponent,
    SummaryCardComponent,
    DividendComponent,
    ToolsComponent,
    DashboardComponent,
    AnalyticsComponent,
    PvdHoldingsComponent,
    LoadingScreenComponent,
    FundFactsheetModalComponent,
    AuthScreenComponent,
    UserSettingsModalComponent,
    LocalPortfolioModalComponent,
    NavIconComponent,
    TranslatePipe,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None,
})
export class App extends AppStateFacade {}
