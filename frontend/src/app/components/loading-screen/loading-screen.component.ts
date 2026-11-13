import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loading-screen.component.html',
  styleUrl: './loading-screen.component.css',
})
export class LoadingScreenComponent {
  variant = input<'fullscreen' | 'inline'>('fullscreen');
  title = input<string>('Loading Portfolio');
  subtitle = input<string>('');
  statusTag = input<string>('Portfolio Engine');
}
