import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { AuthService } from '@shared/services/auth.service';
import { LocalPortfolioService } from '@shared/services/local-portfolio.service';
import { AppTheme } from '@sgsk-wealth/contracts';
import { UserSettingsService } from '@shared/services/user-settings.service';
import { NativePlatformService } from '../../services/native-platform.service';

@Component({
  selector: 'app-mobile-user-settings-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslatePipe,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
  ],
  templateUrl: './mobile-user-settings-modal.component.html',
  styleUrl: './mobile-user-settings-modal.component.css',
})
export class MobileUserSettingsModalComponent {
  readonly authService = inject(AuthService);
  readonly settingsService = inject(UserSettingsService);
  readonly localPortfolio = inject(LocalPortfolioService);
  private readonly nativePlatform = inject(NativePlatformService);

  readonly isOpen = input<boolean>(false);

  readonly closed = output<void>();
  readonly openSignIn = output<void>();
  readonly openLocalPortfolio = output<void>();
  readonly signOut = output<void>();

  readonly displayNameDraft = signal<string>('');
  readonly showSetPasswordForm = signal<boolean>(false);
  readonly newPasswordDraft = signal<string>('');
  readonly feedbackMsg = signal<string | null>(null);
  readonly feedbackError = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.displayNameDraft.set(this.authService.displayName());
    });
  }

  onThemeSelect(theme: AppTheme): void {
    void this.nativePlatform.triggerHapticSelection();
    this.settingsService.setTheme(theme);
  }

  async onSaveProfile(): Promise<void> {
    this.feedbackMsg.set(null);
    this.feedbackError.set(null);
    this.authService.clearMessages();
    const trimmed = this.displayNameDraft().trim();
    if (!trimmed) {
      this.feedbackError.set('Display name cannot be empty.');
      return;
    }
    const res = await this.authService.updateDisplayName(trimmed);
    if (res.ok) {
      this.feedbackMsg.set('Profile updated.');
    } else {
      this.feedbackError.set(res.error ?? 'Unable to update profile.');
    }
  }

  async onSavePassword(): Promise<void> {
    this.feedbackMsg.set(null);
    this.feedbackError.set(null);
    this.authService.clearMessages();
    const pw = this.newPasswordDraft();
    if (pw.length < 6) {
      this.feedbackError.set('Password must be at least 6 characters.');
      return;
    }
    const res = await this.authService.setPassword(pw);
    if (res.ok) {
      this.newPasswordDraft.set('');
      this.showSetPasswordForm.set(false);
      this.feedbackMsg.set('Password saved. Email sign-in is now active.');
    } else {
      this.feedbackError.set(res.error ?? 'Failed to set password.');
    }
  }

  async onLinkGoogle(): Promise<void> {
    this.feedbackMsg.set(null);
    this.feedbackError.set(null);
    this.authService.clearMessages();
    void this.nativePlatform.triggerHapticImpact('light');
    const res = await this.authService.linkGoogleAccount();
    if (!res.ok) {
      this.feedbackError.set(res.error ?? 'Unable to link Google account.');
    }
  }

  async onUnlinkGoogle(): Promise<void> {
    this.feedbackMsg.set(null);
    this.feedbackError.set(null);
    this.authService.clearMessages();
    const res = await this.authService.unlinkGoogleAccount();
    if (res.ok) {
      this.feedbackMsg.set('Google account unlinked.');
    } else {
      this.feedbackError.set(res.error ?? 'Unable to unlink Google account.');
    }
  }

  onOpenLocalClick(): void {
    this.closed.emit();
    this.openLocalPortfolio.emit();
  }

  onOpenSignInClick(): void {
    this.closed.emit();
    this.openSignIn.emit();
  }

  onSignOutClick(): void {
    this.closed.emit();
    this.signOut.emit();
  }

  getSyncLabelKey(): 'settings.syncLocal' | 'settings.syncSyncing' | 'settings.syncSynced' | 'settings.syncError' {
    switch (this.settingsService.syncStatus()) {
      case 'syncing':
        return 'settings.syncSyncing';
      case 'synced':
        return 'settings.syncSynced';
      case 'error':
        return 'settings.syncError';
      default:
        return 'settings.syncLocal';
    }
  }
}
