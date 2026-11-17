import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { LoadingScreenComponent } from './loading-screen.component';

describe('LoadingScreenComponent', () => {
  let fixture: ComponentFixture<LoadingScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingScreenComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingScreenComponent);
  });

  it('should render fullscreen branded loading state with #loading-state and SGSK Wealth lockup', () => {
    fixture.componentRef.setInput('variant', 'fullscreen');
    fixture.componentRef.setInput('statusTag', 'FIFO Engine');
    fixture.componentRef.setInput('title', 'Loading All Positions');
    fixture.componentRef.setInput(
      'subtitle',
      'Consolidating asset types and computing FIFO share lots…',
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const stage = compiled.querySelector('#loading-state');
    expect(stage).toBeTruthy();
    expect(stage?.getAttribute('role')).toBe('status');
    expect(stage?.classList.contains('loader-stage-fullscreen')).toBe(true);

    expect(compiled.querySelector('.loader-wordmark')?.textContent).toContain('SGSK');
    expect(compiled.querySelector('.loader-wordmark')?.textContent).toContain('Wealth');
    expect(compiled.querySelector('.loader-tagline')?.textContent).toContain(
      'Investment Portfolio & Wealth Analytics',
    );
    expect(compiled.querySelector('.loader-status-pill')?.textContent).toContain('FIFO Engine');
    expect(compiled.querySelector('.loader-title')?.textContent).toContain('Loading All Positions');
    expect(compiled.querySelector('.loader-subtext')?.textContent).toContain(
      'Consolidating asset types',
    );
    expect(compiled.querySelector('.loader-pipeline')).toBeTruthy();
    expect(compiled.querySelector('h1')).toBeNull();
  });

  it('should render compact inline placeholder without #loading-state id', () => {
    fixture.componentRef.setInput('variant', 'inline');
    fixture.componentRef.setInput('statusTag', 'Loading Module');
    fixture.componentRef.setInput('title', 'Preparing Dashboard');
    fixture.componentRef.setInput('subtitle', 'Rendering executive KPIs and portfolio insights…');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#loading-state')).toBeNull();
    const stage = compiled.querySelector('.loader-stage-inline');
    expect(stage).toBeTruthy();
    expect(compiled.querySelector('.loader-card-inline')).toBeTruthy();
    expect(compiled.querySelector('.loader-tagline')).toBeNull();
    expect(compiled.querySelector('.loader-pipeline')).toBeNull();
    expect(compiled.querySelector('.loader-title')?.textContent).toContain('Preparing Dashboard');
  });
});
