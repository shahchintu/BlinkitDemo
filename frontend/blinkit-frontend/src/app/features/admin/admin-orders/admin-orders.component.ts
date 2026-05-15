import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { IOrder, OrderStatus } from '../../../core/models';
import { formatPrice, timeAgo } from '../../../shared/utils';
import { OrderDetailComponent } from '../../orders/order-detail/order-detail.component';

const ORDER_STATUSES: OrderStatus[] = ['Placed', 'Packed', 'OutForDelivery', 'Delivered', 'Cancelled'];

const STATUS_CHIP: Record<string, string> = {
  Placed:         'bg-[#E3F2FD] text-[#1976D2]',
  Packed:         'bg-[#FFF8E1] text-[#F57C00]',
  OutForDelivery: 'bg-[#F3E5F5] text-[#7B1FA2]',
  Delivered:      'bg-[#E8F5E9] text-[#0C831F]',
  Cancelled:      'bg-[#FFEBEE] text-[#F44336]',
};

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatSnackBarModule, OrderDetailComponent],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-[#1A1A1A]">Orders</h1>
      <select [(ngModel)]="selectedStatus" (ngModelChange)="onStatusFilter($event)"
        class="border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]">
        <option value="">All Statuses</option>
        @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
      </select>
    </div>

    @if (loading()) {
      <div class="space-y-3">
        @for (_ of skeletons; track $index) {
          <div class="bg-white rounded-xl border border-[#E0E0E0] p-4 h-16 animate-pulse"></div>
        }
      </div>
    } @else {
      <div class="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        <!-- Header -->
        <div class="grid grid-cols-[1fr_2fr_1fr_1fr_1.5fr_1fr] gap-4 px-4 py-3 bg-gray-50 text-xs font-semibold text-[#666666] border-b border-[#E0E0E0]">
          <span>Order ID</span>
          <span>Items</span>
          <span>Total</span>
          <span>Date</span>
          <span>Status</span>
          <span>Detail</span>
        </div>

        @for (order of orders(); track order.id) {
          <div class="grid grid-cols-[1fr_2fr_1fr_1fr_1.5fr_1fr] gap-4 px-4 py-3.5 border-b border-[#F0F0F0] last:border-0 items-center">
            <span class="font-mono text-xs text-[#666666]">#{{ order.id.slice(-8).toUpperCase() }}</span>
            <span class="text-sm text-[#666666] truncate">{{ order.itemsSummary }}</span>
            <span class="font-semibold text-sm">{{ fmt(order.totalAmount) }}</span>
            <span class="text-xs text-[#666666]">{{ ago(order.createdAt) }}</span>
            <select [ngModel]="order.status" (ngModelChange)="updateStatus(order.id, $event)"
              class="border border-[#E0E0E0] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#0C831F]"
              [class]="chipClass(order.status)">
              @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
            </select>
            <button class="text-[#0C831F] text-sm hover:underline" (click)="toggleDetail(order.id)">
              {{ expandedId() === order.id ? 'Hide' : 'View' }}
            </button>
          </div>
          @if (expandedId() === order.id) {
            <div class="px-4 pb-4 border-b border-[#F0F0F0]">
              <app-order-detail [order]="order" />
            </div>
          }
        }
      </div>

      <!-- Pagination -->
      <div class="flex justify-between items-center mt-4 text-sm text-[#666666]">
        <span>Page {{ page() }} of {{ totalPages() }}</span>
        <div class="flex gap-2">
          <button class="px-3 py-1.5 border border-[#E0E0E0] rounded-lg disabled:opacity-40 hover:border-[#0C831F] transition-colors"
            [disabled]="page() <= 1" (click)="changePage(page() - 1)">← Prev</button>
          <button class="px-3 py-1.5 border border-[#E0E0E0] rounded-lg disabled:opacity-40 hover:border-[#0C831F] transition-colors"
            [disabled]="page() >= totalPages()" (click)="changePage(page() + 1)">Next →</button>
        </div>
      </div>
    }
  `,
})
export class AdminOrdersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);

  readonly orders = signal<IOrder[]>([]);
  readonly loading = signal(true);
  readonly expandedId = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly skeletons = Array(5);

  readonly statuses = ORDER_STATUSES;
  selectedStatus = '';

  fmt = formatPrice;
  ago = timeAgo;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.adminService.getOrders(this.page(), 10, this.selectedStatus || undefined).subscribe({
      next: r => {
        this.orders.set(r.items);
        this.totalPages.set(r.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onStatusFilter(status: string): void {
    this.page.set(1);
    this.load();
  }

  changePage(p: number): void {
    this.page.set(p);
    this.load();
  }

  toggleDetail(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  updateStatus(orderId: string, status: string): void {
    this.adminService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.orders.update(list => list.map(o => o.id === orderId ? { ...o, status: status as OrderStatus } : o));
        this.snackBar.open('✓ Status updated', '', { duration: 2000 });
      },
    });
  }

  chipClass(status: string): string {
    return STATUS_CHIP[status] ?? 'bg-gray-100 text-gray-700';
  }
}
