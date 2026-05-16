import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { OrderDetailComponent } from '../order-detail/order-detail.component';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { ImageService } from '../../../core/services/image.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthService } from '../../../core/services/auth.service';
import { IOrder, IOrderItem } from '../../../core/models';
import { formatPrice, timeAgo } from '../../../shared/utils';

interface StatusInfo {
  icon: string;
  label: string;
  iconBg: string;
  iconColor: string;
  labelColor: string;
}

const STATUS_MAP: Record<string, StatusInfo> = {
  Placed:         { icon: 'check_circle',   label: 'Order Placed',           iconBg: 'bg-[#E8F5E9]', iconColor: 'text-[#0C831F]', labelColor: 'text-[#1A1A1A]' },
  Packed:         { icon: 'inventory_2',    label: 'Being Packed',           iconBg: 'bg-[#FFF8E1]', iconColor: 'text-[#F57C00]', labelColor: 'text-[#1A1A1A]' },
  OutForDelivery: { icon: 'local_shipping', label: 'Out for Delivery',       iconBg: 'bg-[#F3E5F5]', iconColor: 'text-[#7B1FA2]', labelColor: 'text-[#1A1A1A]' },
  Delivered:      { icon: 'check_circle',   label: 'Arrived in ~10 minutes', iconBg: 'bg-[#E8F5E9]', iconColor: 'text-[#0C831F]', labelColor: 'text-[#1A1A1A]' },
  Cancelled:      { icon: 'cancel',         label: 'Order Cancelled',        iconBg: 'bg-[#FFEBEE]', iconColor: 'text-[#F44336]', labelColor: 'text-[#F44336]' },
};

@Component({
  selector: 'app-order-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrderDetailComponent, MatSnackBarModule, MatIconModule, RouterLink, RouterLinkActive],
  template: `
    <div class="bg-[#F0F0F5] min-h-screen">
      <div class="max-w-[1000px] mx-auto px-4 py-6 grid grid-cols-[280px_1fr] gap-6 items-start">

        <!-- Left sidebar (same layout as account shell) -->
        <aside class="bg-white rounded-[16px] border border-[#E0E0E0] self-start sticky top-24">
          <div class="px-5 py-5 border-b border-[#F2F2F2]">
            <p class="text-[16px] font-bold text-[#1A1A1A]">{{ displayName() }}</p>
            <p class="text-[13px] text-[#666666] mt-0.5">{{ authStore.currentUser()?.email }}</p>
          </div>
          <nav class="py-2">
            <a routerLink="/account/profile" routerLinkActive #s1="routerLinkActive"
              [class]="sideNavClass(s1.isActive)">
              <mat-icon class="text-[20px]">person_outline</mat-icon>
              My Profile
            </a>
            <a routerLink="/account/addresses" routerLinkActive #s2="routerLinkActive"
              [class]="sideNavClass(s2.isActive)">
              <mat-icon class="text-[20px]">location_on</mat-icon>
              My Addresses
            </a>
            <a routerLink="/orders" routerLinkActive #s3="routerLinkActive"
              [routerLinkActiveOptions]="{exact: true}"
              [class]="sideNavClass(s3.isActive)">
              <mat-icon class="text-[20px]">shopping_bag</mat-icon>
              My Orders
            </a>
            <a routerLink="/account/blinkit-plus" routerLinkActive #s4="routerLinkActive"
              [class]="sideNavClass(s4.isActive)">
              <mat-icon class="text-[20px]">star_border</mat-icon>
              Blinkit Plus
            </a>
            <a routerLink="/help" routerLinkActive #s5="routerLinkActive"
              [class]="sideNavClass(s5.isActive)">
              <mat-icon class="text-[20px]">help_outline</mat-icon>
              FAQ's
            </a>
            <a routerLink="/account" routerLinkActive #s6="routerLinkActive"
              [routerLinkActiveOptions]="{exact: true}"
              [class]="sideNavClass(s6.isActive)">
              <mat-icon class="text-[20px]">lock_outline</mat-icon>
              Account Privacy
            </a>
            @if (isAdmin()) {
              <div class="border-t border-[#F2F2F2] mt-2 pt-2">
                <button [class]="adminNavClass()" (click)="router.navigate(['/admin'])">
                  <mat-icon class="text-[20px] text-[#F57C00]">admin_panel_settings</mat-icon>
                  Admin Panel
                </button>
              </div>
            }
            <div class="border-t border-[#F2F2F2] mt-2 pt-2">
              <button [class]="logoutNavClass()" (click)="logout()">
                <mat-icon class="text-[20px] text-[#F44336]">logout</mat-icon>
                Logout
              </button>
            </div>
          </nav>
        </aside>

        <!-- Right: Orders list -->
        <div>
          <h1 class="text-[20px] font-bold text-[#1A1A1A] mb-4">My Orders</h1>

          @if (loading()) {
            @for (_ of skeletons; track $index) {
              <div class="bg-white rounded-[16px] border border-[#E0E0E0] mb-3 overflow-hidden animate-pulse">
                <div class="px-5 py-4 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gray-200"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-gray-200 rounded w-32"></div>
                    <div class="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div class="px-5 pb-4 flex gap-2">
                  @for (_ of [1,2,3,4]; track $index) {
                    <div class="w-[80px] h-[80px] bg-gray-200 rounded-[8px]"></div>
                  }
                </div>
              </div>
            }
          } @else if (orders().length === 0) {
            <div class="bg-white rounded-[16px] border border-[#E0E0E0] text-center py-16">
              <p class="text-[56px]">📦</p>
              <p class="text-[18px] font-bold text-[#1A1A1A] mt-4">No orders yet</p>
              <p class="text-[14px] text-[#666666] mt-1">Start shopping to place your first order</p>
              <a routerLink="/products"
                class="inline-block mt-5 bg-[#0C831F] text-white rounded-[12px] px-6 py-3 text-[14px] font-bold hover:bg-[#0a6b19] transition-colors">
                Shop Now
              </a>
            </div>
          } @else {
            @for (order of orders(); track order.id) {
              <div class="bg-white rounded-[16px] border border-[#E0E0E0] mb-3 overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">

                <!-- Card header (clickable to expand) -->
                <div class="px-5 py-4 flex items-center justify-between cursor-pointer"
                  (click)="toggleDetail(order.id)">
                  <div class="flex items-center gap-3">
                    <!-- Status icon circle -->
                    <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      [class]="statusInfo(order.status).iconBg">
                      <mat-icon class="text-[20px]" [class]="statusInfo(order.status).iconColor">
                        {{ statusInfo(order.status).icon }}
                      </mat-icon>
                    </div>
                    <div>
                      <p class="text-[15px] font-bold" [class]="statusInfo(order.status).labelColor">
                        {{ statusInfo(order.status).label }}
                      </p>
                      <p class="text-[13px] text-[#666666] mt-0.5">
                        {{ fmt(order.totalAmount) }} • {{ ago(order.createdAt) }}
                      </p>
                    </div>
                  </div>
                  <mat-icon class="text-[20px] text-[#999999]">
                    {{ expandedId() === order.id ? 'expand_less' : 'chevron_right' }}
                  </mat-icon>
                </div>

                <!-- Product thumbnails -->
                @if (order.items.length > 0) {
                  <div class="px-5 pb-3 flex gap-2 items-center overflow-x-auto">
                    @for (item of thumbnails(order.items); track item.id) {
                      <img [src]="orderImages()[item.productId] || item.productImageUrl" [alt]="item.productName"
                        class="w-[80px] h-[80px] border border-[#E0E0E0] rounded-[8px] bg-white object-contain p-1 flex-shrink-0"
                        loading="lazy" (error)="onImgError($event)" />
                    }
                    @if (order.items.length > 4) {
                      <div class="w-[80px] h-[80px] border border-[#E0E0E0] rounded-[8px] bg-[#F8F8F8] flex items-center justify-center flex-shrink-0">
                        <span class="text-[14px] font-semibold text-[#666666]">+{{ order.items.length - 4 }}</span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="px-5 pb-3">
                    <p class="text-[13px] text-[#666666]">{{ order.itemsSummary }}</p>
                  </div>
                }

                <!-- Reorder button -->
                <div class="px-5 pb-4">
                  <button
                    class="border border-[#0C831F] text-[#0C831F] rounded-[8px] px-4 py-2 text-[13px] font-semibold hover:bg-[#F0FFF4] transition-colors disabled:opacity-50"
                    [disabled]="reorderingId() === order.id"
                    (click)="reorder(order.id); $event.stopPropagation()">
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
  readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
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

  displayName(): string {
    const user = this.authStore.currentUser();
    return user?.fullName ?? user?.email ?? 'Account';
  }

  isAdmin(): boolean {
    return this.authStore.currentUser()?.role === 'Admin';
  }

  statusInfo(status: string): StatusInfo {
    return STATUS_MAP[status] ?? { icon: 'check_circle', label: status, iconBg: 'bg-gray-100', iconColor: 'text-gray-500', labelColor: 'text-[#1A1A1A]' };
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

  sideNavClass(isActive: boolean): string {
    const base = 'flex items-center gap-3 px-5 py-3 text-[14px] transition-colors border-l-[3px] w-full text-left';
    if (isActive) {
      return `${base} text-[#0C831F] font-semibold border-[#0C831F] bg-[#F0FFF4]`;
    }
    return `${base} text-[#1A1A1A] hover:bg-[#F8F8F8] border-transparent`;
  }

  adminNavClass(): string {
    return 'flex items-center gap-3 px-5 py-3 text-[14px] font-semibold text-[#F57C00] hover:bg-[#FFF8E1] transition-colors border-l-[3px] border-transparent w-full text-left';
  }

  logoutNavClass(): string {
    return 'flex items-center gap-3 px-5 py-3 text-[14px] text-[#F44336] hover:bg-[#FFEBEE] transition-colors border-l-[3px] border-transparent w-full text-left';
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
