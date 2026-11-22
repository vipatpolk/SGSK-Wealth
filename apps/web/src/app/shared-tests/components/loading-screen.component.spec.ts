import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { LoadingScreenComponent } from '@shared/components/loading-screen/loading-screen.component';

describe('LoadingScreenComponent', () => {
  let fixture: ComponentFixture<LoadingScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingScreenComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingScreenComponent);
  });

  it('should render fullscreen loading state with #loading-state and only brand logo + spinner', () => {
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
    expect(stage?.getAttribute('aria-label')).toBe('Loading All Positions');
    expect(stage?.classList.contains('loader-stage-fullscreen')).toBe(true);

    const logoImg = compiled.querySelector('img.loader-brand-logo') as HTMLImageElement | null;
    expect(logoImg).toBeTruthy();
    expect(logoImg?.getAttribute('src')).toBe('brand-logo.png');
    expect(compiled.querySelector('.loader-orbit')).toBeTruthy();
    expect(compiled.querySelector('.loader-orbit-outer')).toBeTruthy();
    expect(compiled.querySelector('.loader-orbit-inner')).toBeTruthy();

    expect(compiled.querySelector('.loader-wordmark')).toBeNull();
    expect(compiled.querySelector('.loader-tagline')).toBeNull();
    expect(compiled.querySelector('.loader-status-pill')).toBeNull();
    expect(compiled.querySelector('.loader-title')).toBeNull();
    expect(compiled.querySelector('.loader-subtext')).toBeNull();
    expect(compiled.querySelector('.loader-pipeline')).toBeNull();
  });

  it('should render compact inline logo spinner without #loading-state id', () => {
    fixture.componentRef.setInput('variant', 'inline');
    fixture.componentRef.setInput('statusTag', 'Loading Module');
    fixture.componentRef.setInput('title', 'Preparing Dashboard');
    fixture.componentRef.setInput('subtitle', 'Rendering executive KPIs and portfolio insights…');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#loading-state')).toBeNull();
    const stage = compiled.querySelector('.loader-stage-inline');
    expect(stage).toBeTruthy();
    expect(stage?.getAttribute('aria-label')).toBe('Preparing Dashboard');
    expect(compiled.querySelector('.loader-emblem-sm')).toBeTruthy();
    expect(compiled.querySelector('img.loader-brand-logo')?.getAttribute('src')).toBe(
      'brand-logo.png',
    );
    expect(compiled.querySelector('.loader-title')).toBeNull();
  });
});
