import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('ShareLot');
  });

  it('should have closed position tab in tabs list', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const closedTab = app.tabs.find((t) => t.id === 'closed-position');
    expect(closedTab).toBeDefined();
    expect(closedTab?.sheetGid).toBe('273600915');
  });
});

