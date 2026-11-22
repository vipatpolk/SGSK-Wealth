import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@shared/services/auth.service';
import { I18nService } from '@shared/services/i18n.service';
import { UserSettingsService } from '@shared/services/user-settings.service';
import { UserSettingsModalComponent } from '@app/features/settings/user-settings-modal.component';

function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, value: string) => store.set(key, String(value)),
  } as Storage);
}

describe('UserSettingsModalComponent', () => {
  let fixture: ComponentFixture<UserSettingsModalComponent>;
  let authService: AuthService;
  let settingsService: UserSettingsService;
  let i18n: I18nService;

  beforeEach(async () => {
    installMemoryLocalStorage();
    await TestBed.configureTestingModule({
      imports: [UserSettingsModalComponent],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    settingsService = TestBed.inject(UserSettingsService);
    i18n = TestBed.inject(I18nService);
    i18n.setLang('en');
    authService.session.set(null);
    authService.identities.set([]);

    fixture = TestBed.createComponent(UserSettingsModalComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders theme toggle in modal while currency, language, and privacy live in the top header', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('#settings-currency-usd')).toBeNull();
    expect(el.querySelector('#settings-lang-th')).toBeNull();
    expect(el.querySelector('#settings-privacy-toggle')).toBeNull();

    (el.querySelector('#settings-theme-light') as HTMLButtonElement).click();
    expect(settingsService.theme()).toBe('light');

    (el.querySelector('#settings-theme-dark') as HTMLButtonElement).click();
    expect(settingsService.theme()).toBe('dark');
  });

  it('shows Sign In CTA for guest users and emits openSignIn when clicked', () => {
    const el = fixture.nativeElement as HTMLElement;
    const signInBtn = el.querySelector('#settings-signin-btn') as HTMLButtonElement;
    expect(signInBtn).toBeTruthy();

    let openSignInEmitted = false;
    let closedEmitted = false;
    fixture.componentInstance.openSignIn.subscribe(() => (openSignInEmitted = true));
    fixture.componentInstance.closed.subscribe(() => (closedEmitted = true));

    signInBtn.click();
    expect(openSignInEmitted).toBe(true);
    expect(closedEmitted).toBe(true);
  });

  it('renders link/unlink Google controls based on authenticated user identities', () => {
    authService.session.set({
      access_token: 'tok',
      user: { id: 'u1', email: 'user@example.com' },
    } as any);
    authService.identities.set([
      { identityId: 'e1', provider: 'email', email: 'user@example.com', createdAt: null },
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const linkBtn = el.querySelector('#settings-link-google-btn') as HTMLButtonElement;
    expect(linkBtn).toBeTruthy();
    const linkSpy = vi.spyOn(authService, 'linkGoogleAccount').mockResolvedValue({ ok: true });
    linkBtn.click();
    expect(linkSpy).toHaveBeenCalled();

    authService.identities.set([
      { identityId: 'g1', provider: 'google', email: 'user@gmail.com', createdAt: null },
    ]);
    fixture.detectChanges();
    const unlinkDisabled = el.querySelector('#settings-unlink-google-btn') as HTMLButtonElement;
    expect(unlinkDisabled.disabled).toBe(true);

    authService.identities.set([
      { identityId: 'g1', provider: 'google', email: 'user@gmail.com', createdAt: null },
      { identityId: 'e1', provider: 'email', email: 'user@gmail.com', createdAt: null },
    ]);
    fixture.detectChanges();
    const unlinkEnabled = el.querySelector('#settings-unlink-google-btn') as HTMLButtonElement;
    expect(unlinkEnabled.disabled).toBe(false);
  });

  it('renders AuthService notice banner and deduplicates error banners', () => {
    authService.authNotice.set('Google account linked successfully.');
    authService.authError.set('Manual linking is disabled');
    fixture.componentInstance.feedbackError.set('Manual linking is disabled');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const noticeBanner = el.querySelector('#settings-notice-banner') as HTMLElement;
    const errorBanners = el.querySelectorAll('.settings-alert-error');
    expect(noticeBanner?.textContent).toContain('Google account linked successfully.');
    expect(errorBanners.length).toBe(1);
  });
});
