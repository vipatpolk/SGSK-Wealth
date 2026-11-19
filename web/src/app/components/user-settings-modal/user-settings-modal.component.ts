import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@shared/services/auth.service';
import { I18nService } from '@shared/services/i18n.service';
import { UserSettingsService } from '@shared/services/user-settings.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-user-settings-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './user-settings-modal.component.html',
  styleUrl: './user-settings-modal.component.css',
})
export class UserSettingsModalComponent {
  readonly authService = inject(AuthService);
  readonly settingsService = inject(UserSettingsService);
  readonly i18n = inject(I18nService);

  readonly closed = output<void>();
  readonly openSignIn = output<void>();

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

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
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
      this.feedbackError.set(res.error ?? 'Failed to update profile.');
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

  onOpenSignInClick(): void {
    this.openSignIn.emit();
    this.closed.emit();
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
