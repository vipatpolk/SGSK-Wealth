import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { AuthService } from '@shared/services/auth.service';
import { AppLang, I18nService } from '@shared/services/i18n.service';
import { UserSettingsService } from '@shared/services/user-settings.service';
import { NativePlatformService } from '../../services/native-platform.service';

type MobileAuthMode = 'signin' | 'signup' | 'reset';

@Component({
  selector: 'app-mobile-auth-modal',
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
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
  templateUrl: './mobile-auth-modal.component.html',
  styleUrl: './mobile-auth-modal.component.css',
})
export class MobileAuthModalComponent {
  readonly authService = inject(AuthService);
  readonly i18n = inject(I18nService);
  private readonly userSettings = inject(UserSettingsService);
  private readonly nativePlatform = inject(NativePlatformService);

  readonly isOpen = input<boolean>(false);
  readonly allowDismiss = input<boolean>(false);

  readonly closed = output<void>();
  readonly authenticated = output<void>();
  readonly continueGuest = output<void>();

  readonly mode = signal<MobileAuthMode>('signin');
  readonly email = signal<string>('');
  readonly password = signal<string>('');
  readonly displayName = signal<string>('');
  readonly showPassword = signal<boolean>(false);
  readonly localError = signal<string | null>(null);

  setLanguage(lang: AppLang): void {
    void this.nativePlatform.triggerHapticSelection();
    this.userSettings.setLang(lang);
  }

  setMode(nextMode: MobileAuthMode): void {
    void this.nativePlatform.triggerHapticSelection();
    this.mode.set(nextMode);
    this.localError.set(null);
    this.authService.clearMessages();
  }

  onSegmentChange(event: CustomEvent): void {
    const val = event?.detail?.value;
    if (val === 'signin' || val === 'signup') {
      this.setMode(val);
    }
  }

  onDidDismiss(): void {
    if (this.allowDismiss()) {
      this.closed.emit();
    }
  }

  async onSubmit(): Promise<void> {
    this.localError.set(null);
    const emailVal = this.email().trim();
    const passwordVal = this.password();

    if (!emailVal || !emailVal.includes('@')) {
      this.localError.set('Please enter a valid email address.');
      return;
    }

    if (this.mode() === 'reset') {
      await this.authService.sendPasswordReset(emailVal);
      return;
    }

    if (passwordVal.length < 6) {
      this.localError.set('Password must be at least 6 characters.');
      return;
    }

    if (this.mode() === 'signin') {
      const res = await this.authService.signInWithEmail(emailVal, passwordVal);
      if (res.ok) {
        this.authenticated.emit();
      }
      return;
    }

    const res = await this.authService.signUpWithEmail(
      emailVal,
      passwordVal,
      this.displayName().trim() || undefined
    );
    if (res.ok && !res.requiresEmailConfirmation) {
      this.authenticated.emit();
    }
  }

  async onGoogleSignIn(): Promise<void> {
    this.localError.set(null);
    void this.nativePlatform.triggerHapticImpact('light');
    await this.authService.signInWithGoogle();
  }

  async onContinueAsGuest(): Promise<void> {
    this.localError.set(null);
    void this.nativePlatform.triggerHapticImpact('light');
    await this.authService.continueAsGuest();
    this.continueGuest.emit();
  }
}
