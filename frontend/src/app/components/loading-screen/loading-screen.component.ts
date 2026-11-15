import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  templateUrl: './loading-screen.component.html',
  styleUrl: './loading-screen.component.css',
})
export class LoadingScreenComponent {
  variant = input<'fullscreen' | 'inline'>('fullscreen');
  title = input<string>('Loading Portfolio');
  subtitle = input<string>('');
  statusTag = input<string>('Portfolio Engine');
}
