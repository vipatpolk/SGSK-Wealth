import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/mobile-dashboard.page').then((m) => m.MobileDashboardPage),
  },
  {
    path: 'holdings',
    loadComponent: () =>
      import('./pages/holdings/mobile-holdings.page').then((m) => m.MobileHoldingsPage),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./pages/analytics/mobile-analytics.page').then((m) => m.MobileAnalyticsPage),
  },
  {
    path: 'dividends',
    loadComponent: () =>
      import('./pages/dividends/mobile-dividends.page').then((m) => m.MobileDividendsPage),
  },
  {
    path: 'tools',
    loadComponent: () =>
      import('./pages/tools/mobile-tools.page').then((m) => m.MobileToolsPage),
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./pages/transactions/mobile-transactions.page').then(
        (m) => m.MobileTransactionsPage
      ),
  },
];
