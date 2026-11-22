import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../environments/environment';
import { NativePlatformService, resolveMobileApiBaseUrl } from './native-platform.service';

describe('resolveMobileApiBaseUrl', () => {
  const productionEndpoints = {
    ...environment,
    nativeApiBaseUrl: 'https://sgsk-wealth.vercel.app/api/backend',
  };

  it('routes production Android requests through the HTTPS gateway', () => {
    expect(resolveMobileApiBaseUrl('android', true, productionEndpoints)).toBe(
      'https://sgsk-wealth.vercel.app/api/backend',
    );
  });

  it('routes production iOS requests through the HTTPS gateway', () => {
    expect(resolveMobileApiBaseUrl('ios', true, productionEndpoints)).toBe(
      'https://sgsk-wealth.vercel.app/api/backend',
    );
  });

  it('keeps emulator and simulator endpoints for development', () => {
    expect(resolveMobileApiBaseUrl('android', false)).toBe('http://10.0.2.2:8000');
    expect(resolveMobileApiBaseUrl('ios', false)).toBe('http://127.0.0.1:8000');
  });

  it('keeps the relative proxy URL for the browser build', () => {
    expect(resolveMobileApiBaseUrl('web', true, productionEndpoints)).toBe('/api/backend');
  });
});

describe('NativePlatformService storage adapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes a KeyValueStorageAdapter that reads, writes, and removes items cleanly', async () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (key: string) => store.get(key) ?? null,
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      removeItem: (key: string) => {
        store.delete(key);
      },
      setItem: (key: string, value: string) => {
        store.set(key, String(value));
      },
    } as Storage);

    TestBed.configureTestingModule({});
    const nativePlatform = TestBed.inject(NativePlatformService);
    const adapter = nativePlatform.createKeyValueStorageAdapter();

    await adapter.setItem('m3_key', 'value-1');
    expect(adapter.getItemSync?.('m3_key')).toBe('value-1');
    expect(await adapter.getItem('m3_key')).toBe('value-1');

    await adapter.removeItem('m3_key');
    expect(adapter.getItemSync?.('m3_key')).toBeNull();
    expect(await adapter.getItem('m3_key')).toBeNull();
  });
});
