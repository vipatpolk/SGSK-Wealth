import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NavIconComponent, NavIconName } from '@shared/components/nav-icon/nav-icon.component';

const ALL_NAV_ICONS: NavIconName[] = [
  'dashboard',
  'holdings',
  'analytics',
  'dividends',
  'transactions',
  'tools',
  'sidebar-collapse',
  'eye',
  'eye-off',
  'refresh',
  'settings',
  'local-data',
  'sign-in',
  'sign-out',
  'market',
  'pvd',
  'allocation',
  'performance',
  'globe',
  'flag-us',
  'flag-th',
  'crypto',
  'fund',
  'bond',
  'check-circle',
];

describe('NavIconComponent', () => {
  it('renders valid SVG markup for every navigation icon name and toggles active state', async () => {
    await TestBed.configureTestingModule({
      imports: [NavIconComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(NavIconComponent);

    for (const iconName of ALL_NAV_ICONS) {
      fixture.componentRef.setInput('name', iconName);
      fixture.componentRef.setInput('active', false);
      fixture.detectChanges();

      const host = fixture.nativeElement as HTMLElement;
      const svg = host.querySelector('svg.nav-icon-svg');
      expect(svg, `Expected SVG for ${iconName}`).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg?.children.length, `Expected paths inside SVG for ${iconName}`).toBeGreaterThan(0);
      expect(host.classList.contains('is-active')).toBe(false);
    }

    fixture.componentRef.setInput('name', 'dashboard');
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('is-active')).toBe(true);
  });
});
