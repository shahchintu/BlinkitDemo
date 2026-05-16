import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderDetailComponent } from '../order-detail/order-detail.component';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { ImageService } from '../../../core/services/image.service';
import { IOrder, IOrderItem } from '../../../core/models';
import { formatPrice, timeAgo } from '../../../shared/utils';
import { AccountSidebarComponent } from '../../../shared/components/account-sidebar/account-sidebar.component';

interface StatusInfo {
  icon: string;
  label: string;
  iconBg: string;
  iconColor: string;
}

const STATUS_MAP: Record<string, StatusInfo> = {
  Placed:         { icon: 'check_circle',   label: 'Order Placed',     iconBg: 'bg-[#E8F5E9]', iconColor: 'text-[#0C831F]' },
  Packed:         { icon: 'inventory_2',    label: 'Being Packed',     iconBg: 'bg-[#FFF8E1]', iconColor: 'text-[#F57C00]' },
  OutForDelivery: { icon: 'local_shipping', label: 'Out for Delivery', iconBg: 'bg-[#F3E5F5]', iconColor: 'text-[#7B1FA2]' },
  Delivered:      { icon: 'check_circle',   label: 'Arrived ✓',        iconBg: 'bg-[#E8F5E9]', iconColor: 'text-[#0C831F]' },
  Cancelled:      { icon: 'cancel',         label: 'Order Cancelled',  iconBg: 'bg-[#FFEBEE]', iconColor: 'text-[#F44336]' },
};

@Component({
  selector: 'app-order-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrderDetailComponent, MatSnackBarModule, AccountSidebarComponent],
  template: `
    <div class="bg-[#F0F0F5] min-h-screen">
      <div class="max-w-[1100px] mx-auto px-4 py-6
                  grid grid-cols-[240px_1fr] gap-6
                  lg:grid-cols-[240px_1fr]">

        <!-- Left sidebar (shared component) -->
        <app-account-sidebar></app-account-sidebar>

        <!-- Right content -->
        <div>
          <h1 class="text-[22px] font-bold text-[#1A1A1A] mb-5">
            My Orders
          </h1>

          @if (loading()) {
            @for (_ of skeletons; track $index) {
              <div class="bg-white rounded-[16px] border border-[#E0E0E0] mb-4 overflow-hidden animate-pulse">
                <div class="px-5 py-4 flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-gray-200"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-gray-200 rounded w-32"></div>
                    <div class="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div class="px-5 pb-4 flex gap-2">
                  @for (_ of [1,2,3,4]; track $index) {
                    <div class="w-[72px] h-[72px] bg-gray-200 rounded-[10px]"></div>
                  }
                </div>
              </div>
            }
          } @else if (orders().length === 0) {
            <div class="bg-white rounded-[16px] border border-[#E0E0E0] text-center py-16">
              <p class="text-[56px]">📦</p>
              <p class="text-[18px] font-bold text-[#1A1A1A] mt-4">No orders yet</p>
              <p class="text-[14px] text-[#666666] mt-1">Start shopping to place your first order</p>
            </div>
          } @else {
            @for (order of orders(); track order.id) {
              <div class="bg-white rounded-[16px] border border-[#E0E0E0]
                          mb-4 overflow-hidden hover:shadow-md transition">

                <!-- Header -->
                <div class="px-5 py-4 flex items-center justify-between
                            border-b border-[#F5F5F5] cursor-pointer"
                     (click)="toggleDetail(order.id)">
                  <div class="flex items-center gap-3">
                    <!-- Status icon -->
                    <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                         [class]="statusInfo(order.status).iconBg">
                      <span class="material-icons text-[20px]"
                            [class]="statusInfo(order.status).iconColor">
                        {{ statusInfo(order.status).icon }}
                      </span>
                    </div>
                    <div>
                      <p class="text-[15px] font-bold text-[#1A1A1A]">
                        {{ statusInfo(order.status).label }}
                      </p>
                      <p class="text-[13px] text-[#666] mt-0.5">
                        {{ fmt(order.totalAmount) }} • {{ ago(order.createdAt) }}
                      </p>
                    </div>
                  </div>
                  <span class="material-icons text-[#CCC]">
                    {{ expandedId() === order.id ? 'expand_less' : 'chevron_right' }}
                  </span>
                </div>

                <!-- Product thumbnails -->
                <div class="px-5 py-4 flex items-center gap-2">
                  @for (item of thumbnails(order.items); track item.id) {
                    <img [src]="orderImages()[item.productId] || item.productImageUrl"
                         class="w-[72px] h-[72px] object-cover rounded-[10px]
                                border border-[#F0F0F0]"
                         loading="lazy" (error)="onImgError($event)">
                  }
                  @if (order.items.length > 4) {
                    <div class="w-[72px] h-[72px] bg-[#F8F8F8] rounded-[10px]
                                border border-[#F0F0F0] flex items-center justify-center">
                      <span class="text-[13px] font-semibold text-[#666]">
                        +{{order.items.length - 4}}
                      </span>
                    </div>
                  }
                  
                  <!-- Reorder button pushed to right -->
                  <button (click)="reorder(order.id); $event.stopPropagation()"
                          [disabled]="reorderingId() === order.id"
                          class="ml-auto border border-[#0C831F] text-[#0C831F]
                                 rounded-[8px] px-4 py-2 text-[13px] font-semibold
                                 hover:bg-[#F0FFF4] transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ reorderingId() === order.id ? 'Adding...' : 'Reorder' }}
                  </button>
                </div>

                <!-- Expanded detail -->
                @if (expandedId() === order.id) {
                  <div class="border-t border-[#F2F2F2] px-5 py-4">
                    @if (detailOrder()) {
                      <app-order-detail [order]="detailOrder()!" />
                    } @else {
                      <div class="animate-pulse space-y-2">
                        <div class="h-3 bg-gray-200 rounded w-full"></div>
                        <div class="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          }
        </div>

      </div>
    </div>
  `,
})
export class OrderHistoryComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly cartService = inject(CartService);
  private readonly imageService = inject(ImageService);
  private readonly snackBar = inject(MatSnackBar);
  readonly router = inject(Router);

  readonly orders = signal<IOrder[]>([]);
  readonly orderImages = signal<Record<string, string>>({});
  readonly loading = signal(true);
  readonly expandedId = signal<string | null>(null);
  readonly detailOrder = signal<IOrder | null>(null);
  readonly reorderingId = signal<string | null>(null);
  readonly skeletons = Array(4);

  fmt = formatPrice;
  ago = timeAgo;

  ngOnInit(): void {
    this.orderService.getOrders().subscribe({
      next: orders => {
        this.orders.set(orders);
        this.loading.set(false);
        orders.forEach(order => {
          order.items?.forEach(item => {
            this.imageService.getProductImage(item.productName, '', item.productId)
              .subscribe(url => {
                this.orderImages.update(imgs => ({ ...imgs, [item.productId]: url }));
              });
          });
        });
      },
      error: () => this.loading.set(false),
    });
  }

  statusInfo(status: string): StatusInfo {
    return STATUS_MAP[status] ?? { icon: 'check_circle', label: status, iconBg: 'bg-[#E8F5E9]', iconColor: 'text-[#0C831F]' };
  }

  thumbnails(items: IOrderItem[]): IOrderItem[] {
    return items.slice(0, 4);
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

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://picsum.photos/seed/product/80/80';
  }
}
