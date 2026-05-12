import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OrderStatus } from '../../../core/models';

interface Step {
  label: string;
  icon: string;
}

const STEPS: Step[] = [
  { label: 'Placed',    icon: 'shopping_cart' },
  { label: 'Packed',    icon: 'inventory_2' },
  { label: 'On the Way', icon: 'delivery_dining' },
  { label: 'Delivered', icon: 'check_circle' },
];

const STATUS_INDEX: Record<string, number> = {
  Placed: 0, Packed: 1, OutForDelivery: 2, Delivered: 3,
};

@Component({
  selector: 'app-order-status-tracker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .pulse-ring {
      animation: pulseRing 1.5s infinite;
    }
    @keyframes pulseRing {
      0%   { box-shadow: 0 0 0 0 rgba(12,131,31,.4); }
      70%  { box-shadow: 0 0 0 8px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }
  `],
  template: `
    @if (currentStatus === 'Cancelled') {
      <div class="bg-[#F44336]/10 text-[#F44336] rounded-xl p-3 text-center text-sm font-medium">
        Order Cancelled
      </div>
    } @else {
      <div class="flex items-start w-full">
        @for (step of steps; track $index; let last = $last) {
          <div class="flex flex-col items-center" [class]="last ? 'flex-shrink-0' : 'flex-1'">
            <!-- Circle -->
            <div class="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              [class]="circleClass($index)">
              @if ($index < currentIndex) {
                <span class="material-icons text-white" style="font-size:18px">check</span>
              } @else {
                <span class="material-icons text-white" style="font-size:18px">{{ step.icon }}</span>
              }
            </div>
            <!-- Label -->
            <span class="text-[10px] mt-1.5 font-medium text-center leading-tight"
              [class]="$index <= currentIndex ? 'text-[#0C831F]' : 'text-[#666666]'">
              {{ step.label }}
            </span>
          </div>
          <!-- Connector -->
          @if (!last) {
            <div class="flex-1 h-0.5 mt-[18px] transition-colors"
              [class]="$index < currentIndex ? 'bg-[#0C831F]' : 'bg-gray-200'">
            </div>
          }
        }
      </div>
    }
  `,
})
export class OrderStatusTrackerComponent {
  @Input() currentStatus: OrderStatus = 'Placed';

  readonly steps = STEPS;

  get currentIndex(): number {
    return STATUS_INDEX[this.currentStatus] ?? 0;
  }

  circleClass(index: number): string {
    if (index < this.currentIndex) return 'bg-[#0C831F]';
    if (index === this.currentIndex) return 'bg-[#0C831F] pulse-ring';
    return 'bg-gray-200';
  }
}
