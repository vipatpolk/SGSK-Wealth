import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from '@shared/services/auth.service';
import { I18nService } from '@shared/services/i18n.service';
import { UserSettingsService } from '@shared/services/user-settings.service';
import { AuthScreenComponent } from '@app/features/auth/auth-screen.component';

describe('AuthScreenComponent', () => {
  let fixture: ComponentFixture<AuthScreenComponent>;
  let component: AuthScreenComponent;
  let authService: AuthService;
  let i18n: I18nService;
  let userSettings: UserSettingsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthScreenComponent],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    i18n = TestBed.inject(I18nService);
    userSettings = TestBed.inject(UserSettingsService);
    userSettings.setLang('en');

    fixture = TestBed.createComponent(AuthScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    userSettings.setLang('en');
  });

  it('switches cleanly between Sign In, Sign Up, and Reset Password modes', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(component.mode()).toBe('signin');

    (el.querySelector('#auth-tab-signup') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.mode()).toBe('signup');
    expect(el.querySelector('#auth-name-input')).toBeTruthy();

    (el.querySelector('#auth-tab-signin') as HTMLButtonElement).click();
    fixture.detectChanges();
    (el.querySelector('#auth-forgot-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.mode()).toBe('reset');
    expect(el.querySelector('#auth-password-input')).toBeNull();
  });

  it('validates email format and minimum password length before calling AuthService', async () => {
    const spy = vi.spyOn(authService, 'signInWithEmail');
    component.email.set('invalid-email');
    await component.onSubmit();
    fixture.detectChanges();
    expect(component.localError()).toContain('valid email');
    expect(spy).not.toHaveBeenCalled();

    component.email.set('user@example.com');
    component.password.set('123');
    await component.onSubmit();
    fixture.detectChanges();
    expect(component.localError()).toContain('6 characters');
    expect(spy).not.toHaveBeenCalled();
  });

  it('calls continueAsGuest and emits continueGuest output', async () => {
    const spy = vi.spyOn(authService, 'continueAsGuest').mockResolvedValue();
    let emitted = false;
    component.continueGuest.subscribe(() => (emitted = true));

    const btn = fixture.nativeElement.querySelector('#auth-guest-btn') as HTMLButtonElement;
    btn.click();
    await fixture.whenStable();

    expect(spy).toHaveBeenCalled();
    expect(emitted).toBe(true);
  });

  it('toggles language between English (EN) and Thai (ไทย) directly on the Sign-In screen', () => {
    const setLangSpy = vi.spyOn(userSettings, 'setLang');
    const el = fixture.nativeElement as HTMLElement;
    const enBtn = el.querySelector('#auth-lang-en') as HTMLButtonElement;
    const thBtn = el.querySelector('#auth-lang-th') as HTMLButtonElement;
    const signInTab = el.querySelector('#auth-tab-signin') as HTMLButtonElement;

    expect(enBtn).toBeTruthy();
    expect(thBtn).toBeTruthy();
    expect(i18n.lang()).toBe('en');
    expect(enBtn.classList.contains('active')).toBe(true);
    expect(signInTab.textContent?.trim()).toBe('Sign In');

    thBtn.click();
    fixture.detectChanges();

    expect(setLangSpy).toHaveBeenCalledWith('th');
    expect(i18n.lang()).toBe('th');
    expect(thBtn.classList.contains('active')).toBe(true);
    expect(enBtn.classList.contains('active')).toBe(false);
    expect(signInTab.textContent?.trim()).toBe('เข้าสู่ระบบ');

    enBtn.click();
    fixture.detectChanges();

    expect(setLangSpy).toHaveBeenCalledWith('en');
    expect(i18n.lang()).toBe('en');
    expect(enBtn.classList.contains('active')).toBe(true);
    expect(signInTab.textContent?.trim()).toBe('Sign In');
  });
});
