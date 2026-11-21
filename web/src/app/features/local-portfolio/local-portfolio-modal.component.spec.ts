import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalPortfolioService } from '@shared/services/local-portfolio.service';
import { LocalPortfolioModalComponent } from './local-portfolio-modal.component';

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

describe('LocalPortfolioModalComponent', () => {
  let fixture: ComponentFixture<LocalPortfolioModalComponent>;
  let component: LocalPortfolioModalComponent;
  let localPortfolio: LocalPortfolioService;

  beforeEach(async () => {
    installMemoryLocalStorage();
    await TestBed.configureTestingModule({
      imports: [LocalPortfolioModalComponent],
    }).compileComponents();

    localPortfolio = TestBed.inject(LocalPortfolioService);
    localPortfolio.clearAll();

    fixture = TestBed.createComponent(LocalPortfolioModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('validates and saves a local transaction and allows deleting it from list tab', () => {
    let changedCount = 0;
    component.dataChanged.subscribe(() => changedCount++);

    component.symbolInput.set('nvda');
    component.quantityInput.set(4);
    component.priceInput.set(125);
    component.dateInput.set('2025-03-01');
    component.onSaveTransaction();
    fixture.detectChanges();

    expect(localPortfolio.transactionCount()).toBe(1);
    expect(localPortfolio.transactions()[0].symbol).toBe('NVDA');
    expect(changedCount).toBe(1);

    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('#local-tab-list') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.textContent).toContain('NVDA');
    component.onDelete(localPortfolio.transactions()[0].id);
    expect(localPortfolio.transactionCount()).toBe(0);
    expect(changedCount).toBe(2);
  });

  it('imports CSV rows and loads sample portfolio', () => {
    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('#local-tab-import') as HTMLButtonElement).click();
    fixture.detectChanges();

    component.csvText.set('Symbol,Date,Quantity,Price,Currency\nVOO,2025-01-20,3,510,USD');
    component.onImportCsv();
    expect(localPortfolio.transactionCount()).toBe(1);

    (el.querySelector('#local-load-sample-btn') as HTMLButtonElement).click();
    expect(localPortfolio.transactionCount()).toBeGreaterThan(3);
  });
});
