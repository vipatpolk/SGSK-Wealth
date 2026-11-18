import { describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { resolveMobileApiBaseUrl } from './native-platform.service';

describe('resolveMobileApiBaseUrl', () => {
  const productionEndpoints = {
    ...environment,
    nativeApiBaseUrl: 'https://sgsk-wealth-sgsk.vercel.app/api/backend',
  };

  it('routes production Android requests through the HTTPS gateway', () => {
    expect(resolveMobileApiBaseUrl('android', true, productionEndpoints)).toBe(
      'https://sgsk-wealth-sgsk.vercel.app/api/backend',
    );
  });

  it('routes production iOS requests through the HTTPS gateway', () => {
    expect(resolveMobileApiBaseUrl('ios', true, productionEndpoints)).toBe(
      'https://sgsk-wealth-sgsk.vercel.app/api/backend',
    );
  });

  it('keeps emulator and simulator endpoints for development', () => {
    expect(resolveMobileApiBaseUrl('android', false)).toBe('http://10.0.2.2:8000/api/backend');
    expect(resolveMobileApiBaseUrl('ios', false)).toBe('http://127.0.0.1:8000/api/backend');
  });

  it('keeps the relative proxy URL for the browser build', () => {
    expect(resolveMobileApiBaseUrl('web', true, productionEndpoints)).toBe('/api/backend');
  });
});
