import { describe, expect, it } from 'vitest';
import {
  resolveNativeApiBaseUrl,
  statusBarBackgroundColor,
} from '../app/composables/useNativePlatform';

describe('Phase 5 Capacitor native platform helpers', () => {
  it('resolves API base URLs across web, Android emulator, iOS simulator, and production', () => {
    expect(resolveNativeApiBaseUrl('web', '/api/v1', false)).toBe('/api/v1');
    expect(resolveNativeApiBaseUrl('web', '/api/v1', true)).toBe('/api/v1');
    expect(resolveNativeApiBaseUrl('android', '/api/v1', false)).toBe('http://10.0.2.2:8000/api/v1');
    expect(resolveNativeApiBaseUrl('ios', '/api/v1', false)).toBe('http://127.0.0.1:8000/api/v1');
    expect(resolveNativeApiBaseUrl('android', '/api/v1', true)).toBe(
      'https://sgsk-wealth.vercel.app/api/backend',
    );
    expect(resolveNativeApiBaseUrl('ios', '/api/v1', true)).toBe(
      'https://sgsk-wealth.vercel.app/api/backend',
    );
    expect(
      resolveNativeApiBaseUrl('android', '/api/v1', true, 'https://custom.example.com/api/backend'),
    ).toBe('https://custom.example.com/api/backend');
    expect(resolveNativeApiBaseUrl('android', 'https://wealth.example.com/api/v1', true)).toBe(
      'https://wealth.example.com/api/v1',
    );
  });

  it('returns canonical status bar background colors for dark and light themes', () => {
    expect(statusBarBackgroundColor('dark')).toBe('#0B1220');
    expect(statusBarBackgroundColor('light')).toBe('#FFFFFF');
  });
});
