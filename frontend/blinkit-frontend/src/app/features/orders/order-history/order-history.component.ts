import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { OrderDetailComponent } from '../order-detail/order-detail.component';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { IOrder } from '../../../core/models';
import { formatPrice, timeAgo } from '../../../shared/utils';

type StatusChip = { bg: string; text: string; label: string };

const STATUS_CHIP: Record<string, StatusChip> = {
  Placed:         { bg: 'bg-blue-100',          text: 'text-blue-700',      label: 'Placed' },
  Packed:         { bg: 'bg-orange-100',         text: 'text-orange-700',    label: 'Packed' },
  OutForDelivery: { bg: 'bg-[#673AB7]/10',       text: 'text-[#673AB7]',     label: 'On the Way' },
  Delivered:      { bg: 'bg-[#4CAF50]/10',       text: 'text-[#4CAF50]',     label: 'Delivered' },
  Cancelled:      { bg: 'bg-[#F44336]/10',       text: 'text-[#F44336]',     label: 'Cancelled' },
};

@Component({
  selector: 'app-order-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavbarComponent, FooterComponent, OrderDetailComponent, MatSnackBarModule],
  template: `
    <app-navbar />
    <main class="min-h-screen bg-[#F8F8F8]">
      <div class="max-w-2xl mx-auto px-4 py-6">
        <h1 class="text-2xl font-bold text-[#1A1A1A] mb-6">My Orders</h1>

        @if (loading()) {
          @for (_ of skeletons; track $index) {
            <div class="bg-white rounded-xl border border-[#E0E0E0] p-4 mb-4 animate-pulse">
              <div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div class="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          }
        } @else if (orders().length === 0) {
          <div class="text-center py-16">
            <span class="text-5xl">📦</span>
            <p class="text-[#666666] mt-4 text-sm">No orders yet. Start shopping!</p>
          </div>
        } @else {
          @for (order of orders(); track order.id) {
            <div class="bg-white rounded-xl border border-[#E0E0E0] p-4 mb-4">
              <!-- Header -->
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-semibold text-sm">Order #{{ order.id.slice(-8).toUpperCase() }}</p>
                  <p class="text-xs text-[#666666] mt-0.5">{{ ago(order.createdAt) }}</p>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
                  [class]="chipClass(order.status)">
                  {{ chipLabel(order.status) }}
                </span>
              </div>

              <!-- Summary -->
              <p class="text-sm text-[#666666] mt-2">{{ order.itemsSummary }}</p>

              <!-- Footer -->
              <div class="flex justify-between items-center mt-3">
                <span class="font-bold text-base">{{ fmt(order.totalAmount) }}</span>
                <div class="flex gap-2">
                  <button
                    class="border border-[#E0E0E0] text-sm px-3 py-1.5 rounded-lg hover:border-[#0C831F] transition-colors"
                    (click)="toggleDetail(order.id)">
                    {{ expandedId() === order.id ? 'Hide' : 'View Details' }}
                  </button>
                  <button
                    class="border border-[#0C831F] text-[#0C831F] text-sm px-3 py-1.5 rounded-lg hover:bg-[#0C831F] hover:text-white transition-colors disabled:opacity-50"
                    [disabled]="reorderingId() === order.id"
                    (click)="reorder(order.id)">
                    {{ reorderingId() === order.id ? 'Adding...' : 'Reorder' }}
                  </button>
                </div>
              </div>

              <!-- Expanded detail -->
              @if (expandedId() === order.id) {
                @if (detailOrder()) {
                  <app-order-detail [order]="detailOrder()!" />
                } @else {
                  <div class="mt-4 animate-pulse space-y-2">
                    <div class="h-3 bg-gray-200 rounded w-full"></div>
                    <div class="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                }
              }
            </div>
          }
        }
      </div>
    </main>
    <app-footer />
  `,
})
export class OrderHistoryComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly cartService = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);
  readonly router = inject(Router);

  readonly orders = signal<IOrder[]>([]);
  readonly loading = signal(true);
  readonly expandedId = signal<string | null>(null);
  readonly detailOrder = signal<IOrder | null>(null);
  readonly reorderingId = signal<string | null>(null);
  readonly skeletons = Array(4);

  fmt = formatPrice;
  ago = timeAgo;

  ngOnInit(): void {
    this.orderService.getOrders().subscribe({
      next: orders => { this.orders.set(orders); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleDetail(id: string): void {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      this.detailOrder.set(null);
      return;
    }
    this.expandedId.set(id);
    this.detailOrder.set(null);
    this.orderService.getOrderById(id).subscribe({
      next: order => this.detailOrder.set(order),
    });
  }

  reorder(id: string): void {
    this.reorderingId.set(id);
    this.orderService.getOrderById(id).subscribe({
      next: detail => {
        const items = detail.items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        }));
        this.cartService.reorderItems(items).subscribe({
          next: () => {
            this.reorderingId.set(null);
            this.snackBar.open(`✓ ${detail.items.length} items added to cart`, '', { duration: 2500 });
            this.cartService.openCart();
          },
          error: () => this.reorderingId.set(null),
        });
      },
      error: () => this.reorderingId.set(null),
    });
  }

  chipClass(status: string): string {
    const c = STATUS_CHIP[status];
    return c ? `${c.bg} ${c.text}` : 'bg-gray-100 text-gray-700';
  }

  chipLabel(status: string): string {
    return STATUS_CHIP[status]?.label ?? status;
  }
}
