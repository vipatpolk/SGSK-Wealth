import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PluginListenerHandle } from '@capacitor/core';
import {
  IonApp,
  IonButtons,
  IonHeader,
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonToolbar,
} from '@ionic/angular';
import { LoadingScreenComponent } from '@shared/components/loading-screen/loading-screen.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  calculatorOutline,
  cashOutline,
  eyeOffOutline,
  eyeOutline,
  gridOutline,
  layersOutline,
  moonOutline,
  personCircleOutline,
  refreshOutline,
  sunnyOutline,
  timeOutline,
} from 'ionicons/icons';
import { MobileAuthModalComponent } from './modals/auth-modal/mobile-auth-modal.component';
import { MobileFactsheetModalComponent } from './modals/fund-factsheet-modal/mobile-factsheet-modal.component';
import { MobileLocalPortfolioModalComponent } from './modals/local-portfolio-modal/mobile-local-portfolio-modal.component';
import { MobileUserSettingsModalComponent } from './modals/user-settings-modal/mobile-user-settings-modal.component';
import { MobileStateService } from './services/mobile-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    TranslatePipe,
    LoadingScreenComponent,
    IonApp,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonIcon,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonLabel,
    MobileFactsheetModalComponent,
    MobileAuthModalComponent,
    MobileUserSettingsModalComponent,
    MobileLocalPortfolioModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnDestroy {
  readonly state = inject(MobileStateService);
  private readonly router = inject(Router);
  private backBtnHandle: PluginListenerHandle | null = null;

  readonly platformBadge = computed(() => {
    const p = this.state.nativePlatform.getPlatform();
    if (p === 'ios') return 'iOS';
    if (p === 'android') return 'Android';
    return 'Mobile';
  });

  readonly userInitial = computed(() => {
    const label =
      this.state.authService.displayName().trim() ||
      this.state.authService.userEmail() ||
      'G';
    return label.charAt(0).toUpperCase();
  });

  constructor() {
    addIcons({
      gridOutline,
      layersOutline,
      barChartOutline,
      cashOutline,
      timeOutline,
      calculatorOutline,
      eyeOutline,
      eyeOffOutline,
      sunnyOutline,
      moonOutline,
      refreshOutline,
      personCircleOutline,
    });

    void this.initHardwareBackHandler();
  }

  private async initHardwareBackHandler(): Promise<void> {
    this.backBtnHandle = await this.state.nativePlatform.registerBackButtonHandler(() => {
      if (this.state.isLocalPortfolioOpen()) {
        this.state.closeLocalPortfolio();
        return true;
      }
      if (this.state.isUserSettingsOpen()) {
        this.state.closeUserSettings();
        return true;
      }
      if (this.state.activeFactsheetTarget() !== null) {
        this.state.closeFactsheetModal();
        return true;
      }
      if (this.state.isAuthModalManualOpen() && !this.state.authService.showAuthGate()) {
        this.state.closeAuthModal();
        return true;
      }
      if (this.router.url !== '/dashboard') {
        void this.router.navigateByUrl('/dashboard');
        return true;
      }
      return false;
    });
  }

  onTabChange(): void {
    void this.state.nativePlatform.triggerHapticSelection();
  }

  ngOnDestroy(): void {
    void this.backBtnHandle?.remove();
  }
}
