import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { ComponentRef } from '@angular/core';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let componentRef: ComponentRef<HeaderComponent>;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;

    componentRef.setInput('loading', false);
    componentRef.setInput('error', null);
    componentRef.setInput('result', null);
    componentRef.setInput('totalCostConverted', 10000);
    componentRef.setInput('totalProceedsConverted', 0);
    componentRef.setInput('totalPL', 2500);
    componentRef.setInput('totalPLPercent', 25.0);
    componentRef.setInput('isClosedTab', false);
    componentRef.setInput('isAllTab', false);
    componentRef.setInput('totalHoldingConverted', 12500);
    componentRef.setInput('totalRealizedPLConverted', 0);
    componentRef.setInput('totalRealizedPLPercent', 0);
    componentRef.setInput('hasRate', true);
    componentRef.setInput('exchangeRate', 35.0);
    componentRef.setInput('currentView', 'holdings');
    componentRef.setInput('displayCurrency', 'USD');
    componentRef.setInput('theme', 'dark');

    fixture.detectChanges();
  });

  it('should create header component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle mobile view dropdown state', () => {
    expect(component.isViewDropdownOpen()).toBe(false);
    component.toggleViewDropdown();
    expect(component.isViewDropdownOpen()).toBe(true);
  });

  it('should emit viewChange output and close dropdown when selecting view', () => {
    let emittedView = '';
    component.viewChange.subscribe(v => emittedView = v);

    component.toggleViewDropdown();
    component.selectView('allocation');

    expect(emittedView).toBe('allocation');
    expect(component.isViewDropdownOpen()).toBe(false);
  });

  it('should format currency sign correctly via dc helper', () => {
    expect(component.dc('USD')).toBe('USD');
  });
});
