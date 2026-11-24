import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SecondaryCurrencyComponent } from '@shared/components/secondary-currency/secondary-currency.component';

describe('SecondaryCurrencyComponent', () => {
  let fixture: ComponentFixture<SecondaryCurrencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecondaryCurrencyComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SecondaryCurrencyComponent);
  });

  it('renders USD approximation when displayCurrency is THB', () => {
    fixture.componentRef.setInput('amount', 3500);
    fixture.componentRef.setInput('displayCurrency', 'THB');
    fixture.componentRef.setInput('exchangeRate', 35);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent?.trim();
    expect(text).toBe('≈ $100.00');
  });

  it('renders THB approximation when displayCurrency is USD', () => {
    fixture.componentRef.setInput('amount', 100);
    fixture.componentRef.setInput('displayCurrency', 'USD');
    fixture.componentRef.setInput('exchangeRate', 35);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent?.trim();
    expect(text).toBe('≈ ฿3,500.00');
  });

  it('renders zero amount cleanly', () => {
    fixture.componentRef.setInput('amount', 0);
    fixture.componentRef.setInput('displayCurrency', 'THB');
    fixture.componentRef.setInput('exchangeRate', 35);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent?.trim();
    expect(text).toBe('≈ $0.00');
  });

  it('supports signed formatting for positive and negative values', () => {
    fixture.componentRef.setInput('amount', 700);
    fixture.componentRef.setInput('displayCurrency', 'THB');
    fixture.componentRef.setInput('exchangeRate', 35);
    fixture.componentRef.setInput('signed', true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('≈ +$20.00');

    fixture.componentRef.setInput('amount', -700);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('≈ -$20.00');
  });

  it('supports parens wrapper', () => {
    fixture.componentRef.setInput('amount', 350);
    fixture.componentRef.setInput('displayCurrency', 'THB');
    fixture.componentRef.setInput('exchangeRate', 35);
    fixture.componentRef.setInput('parens', true);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('(≈ $10.00)');
  });

  it('renders nothing when exchangeRate <= 0 or hasRate is false', () => {
    fixture.componentRef.setInput('amount', 3500);
    fixture.componentRef.setInput('displayCurrency', 'THB');
    fixture.componentRef.setInput('exchangeRate', 0);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('');

    fixture.componentRef.setInput('exchangeRate', 35);
    fixture.componentRef.setInput('hasRate', false);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('');
  });

  it('toggles privacy-mask class based on privacy input', () => {
    fixture.componentRef.setInput('amount', 3500);
    fixture.componentRef.setInput('displayCurrency', 'THB');
    fixture.componentRef.setInput('exchangeRate', 35);
    fixture.detectChanges();

    const span = (fixture.nativeElement as HTMLElement).querySelector('.sec-curr');
    expect(span?.classList.contains('privacy-mask')).toBe(true);

    fixture.componentRef.setInput('privacy', false);
    fixture.detectChanges();
    expect(span?.classList.contains('privacy-mask')).toBe(false);
  });
});
