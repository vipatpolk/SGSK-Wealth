import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonContent,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular';
import { ToolId } from '@shared/models/tools.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { MobileStateService } from '../../services/mobile-state.service';
import { NativePlatformService } from '../../services/native-platform.service';
import { MobileAvgCostComponent } from './components/mobile-avg-cost.component';
import { MobileRebalanceComponent } from './components/mobile-rebalance.component';
import { MobileTvmComponent } from './components/mobile-tvm.component';

@Component({
  selector: 'app-mobile-tools',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    MobileAvgCostComponent,
    MobileRebalanceComponent,
    MobileTvmComponent,
  ],
  templateUrl: './mobile-tools.page.html',
  styleUrl: './mobile-tools.page.css',
})
export class MobileToolsPage {
  readonly state = inject(MobileStateService);
  private readonly nativePlatform = inject(NativePlatformService);

  readonly activeTool = this.state.selectedToolId;

  onToolChange(event: CustomEvent): void {
    const val = event.detail?.value as ToolId;
    if (val) {
      this.state.selectedToolId.set(val);
      void this.nativePlatform.triggerHapticSelection();
    }
  }

  onRefresh(event: CustomEvent): void {
    this.state.refresh();
    setTimeout(() => {
      const target = event.target as { complete?: () => void } | null;
      target?.complete?.();
    }, 350);
  }
}
