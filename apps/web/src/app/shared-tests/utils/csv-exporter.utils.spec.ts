import { describe, it, expect, vi } from 'vitest';
import { triggerFileDownload } from '@shared/utils/csv-exporter.utils';

describe('triggerFileDownload (DOM helper)', () => {
  it('should trigger browser file download without error', () => {
    let clicked = false;
    const linkMock = {
      setAttribute: vi.fn(),
      click: () => {
        clicked = true;
      },
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, 'createElement').mockReturnValue(linkMock);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => linkMock);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => linkMock);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    triggerFileDownload('header\r\nrow1', 'test.csv');
    expect(clicked).toBe(true);
  });
});
