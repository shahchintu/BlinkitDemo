import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IOrder } from '../../../core/models';
import { formatPrice } from '../../../shared/utils';
import { OrderStatusTrackerComponent } from '../order-status-tracker/order-status-tracker.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrderStatusTrackerComponent],
  template: `
    <div class="mt-4 space-y-4">
      <!-- Status tracker -->
      <app-order-status-tracker [currentStatus]="order.status" />

      <!-- Items -->
      <div class="space-y-2 mt-4">
        @for (item of order.items; track item.id) {
          <div class="flex items-center gap-3">
            <img [src]="orderImages[item.productId] || item.productImageUrl" [alt]="item.productName"
              class="w-10 h-10 rounded-lg object-contain bg-gray-50 p-1" loading="lazy"
              (error)="onImgError($event)" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ item.productName }}</p>
              <p class="text-xs text-[#666666]">{{ item.variantUnit }}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-xs text-[#666666]">x{{ item.quantity }}</p>
              <p class="text-sm font-bold">{{ fmt(item.quantity * item.unitPrice) }}</p>
            </div>
          </div>
        }
      </div>

      <!-- Delivery address -->
      @if (order.address) {
        <p class="text-sm text-[#666666]">
          📍 {{ order.address.label }}: {{ order.address.street }}, {{ order.address.city }} - {{ order.address.pincode }}
        </p>
      }

      <!-- Price breakdown -->
      <div class="space-y-1 text-sm border-t border-[#E0E0E0] pt-3">
        <div class="flex justify-between">
          <span class="text-[#666666]">Subtotal</span>
          <span>{{ fmt(order.subTotal) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[#666666]">Delivery fee</span>
          <span>{{ order.deliveryFee === 0 ? 'FREE' : fmt(order.deliveryFee) }}</span>
        </div>
        @if (order.couponDiscount > 0) {
          <div class="flex justify-between text-[#0C831F]">
            <span>Coupon ({{ order.couponCode }})</span>
            <span>-{{ fmt(order.couponDiscount) }}</span>
          </div>
        }
        <div class="flex justify-between font-bold text-base border-t border-[#E0E0E0] pt-1 mt-1">
          <span>Total</span>
          <span>{{ fmt(order.totalAmount) }}</span>
        </div>
      </div>

      <!-- Payment -->
      @if (order.razorpayPaymentId) {
        <p class="text-xs text-[#666666] font-mono">Payment ID: {{ order.razorpayPaymentId }}</p>
      }
    </div>
  `,
})
export class OrderDetailComponent {
  @Input({ required: true }) order!: IOrder;
  @Input() orderImages: Record<string, string> = {};

  fmt = formatPrice;

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://picsum.photos/seed/product/200/200';
  }
}
