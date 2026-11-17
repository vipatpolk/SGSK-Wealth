import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  IonApp,
  IonBadge,
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { addIcons } from 'ionicons';
import {
  analyticsOutline,
  briefcaseOutline,
  calculatorOutline,
  cashOutline,
  contrastOutline,
  eyeOffOutline,
  eyeOutline,
  gridOutline,
  refreshOutline,
} from 'ionicons/icons';
import { MobileFactsheetModalComponent } from './modals/fund-factsheet-modal/mobile-factsheet-modal.component';
import { MobileStateService } from './services/mobile-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    IonApp,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonBadge,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonLabel,
    MobileFactsheetModalComponent,
  ],
  template: `
    <ion-app style="display:flex; flex-direction:column; height:100%;">
      <ion-header id="mobile-header" style="position:relative; flex:0 0 auto; z-index:20;">
        <ion-toolbar>
          <ion-title slot="start" style="position:static; width:auto; padding-inline:12px 4px; text-align:left;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-weight:800; letter-spacing:-0.02em; font-size:16px;">SGSK Wealth</span>
              <ion-badge color="primary" style="font-size:10px; text-transform:uppercase;">
                {{ platformBadge() }}
              </ion-badge>
            </div>
          </ion-title>
          <ion-buttons slot="end" style="position:relative; z-index:2;">
            <ion-button
              id="mobile-currency-toggle"
              size="small"
              fill="clear"
              (click)="state.toggleCurrency()"
              aria-label="Toggle Currency"
            >
              <span class="font-mono" style="font-weight:700;">{{ state.displayCurrency() }}</span>
            </ion-button>
            <ion-button
              id="mobile-lang-toggle"
              size="small"
              fill="clear"
              (click)="state.toggleLang()"
              aria-label="Toggle Language"
            >
              <span style="font-weight:700;">{{ state.i18n.lang().toUpperCase() }}</span>
            </ion-button>
            <ion-button
              id="mobile-privacy-toggle"
              size="small"
              fill="clear"
              (click)="state.togglePrivacyMode()"
              aria-label="Toggle Privacy Mode"
            >
              <ion-icon [name]="state.privacyMode() ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
            </ion-button>
            <ion-button
              id="mobile-theme-toggle"
              size="small"
              fill="clear"
              (click)="state.toggleTheme()"
              aria-label="Toggle Theme"
            >
              <ion-icon name="contrast-outline"></ion-icon>
            </ion-button>
            <ion-button
              id="mobile-refresh-btn"
              size="small"
              fill="clear"
              (click)="state.refresh()"
              aria-label="Refresh Portfolio"
            >
              <ion-icon name="refresh-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-tabs style="position:relative; flex:1 1 auto; min-height:0;">
        <ion-tab-bar slot="bottom" id="mobile-tab-bar">
          <ion-tab-button tab="dashboard" id="mobile-tab-dashboard">
            <ion-icon name="grid-outline"></ion-icon>
            <ion-label>{{ 'nav.dashboard' | t }}</ion-label>
          </ion-tab-button>

          <ion-tab-button tab="holdings" id="mobile-tab-holdings">
            <ion-icon name="briefcase-outline"></ion-icon>
            <ion-label>{{ 'nav.holdings' | t }}</ion-label>
          </ion-tab-button>

          <ion-tab-button tab="analytics" id="mobile-tab-analytics">
            <ion-icon name="analytics-outline"></ion-icon>
            <ion-label>{{ 'nav.analytics' | t }}</ion-label>
          </ion-tab-button>

          <ion-tab-button tab="dividends" id="mobile-tab-dividends">
            <ion-icon name="cash-outline"></ion-icon>
            <ion-label>{{ 'nav.dividends' | t }}</ion-label>
          </ion-tab-button>

          <ion-tab-button tab="tools" id="mobile-tab-tools">
            <ion-icon name="calculator-outline"></ion-icon>
            <ion-label>{{ 'nav.tools' | t }}</ion-label>
          </ion-tab-button>
        </ion-tab-bar>
      </ion-tabs>

      <app-mobile-factsheet-modal
        [target]="state.activeFactsheetTarget()"
        (closeModal)="state.closeFactsheetModal()"
      ></app-mobile-factsheet-modal>
    </ion-app>
  `,
})
export class AppComponent {
  readonly state = inject(MobileStateService);
  readonly platformBadge = computed(() => this.state.nativePlatform.getPlatform());

  constructor() {
    addIcons({
      gridOutline,
      briefcaseOutline,
      analyticsOutline,
      cashOutline,
      calculatorOutline,
      eyeOutline,
      eyeOffOutline,
      contrastOutline,
      refreshOutline,
    });
  }
}
