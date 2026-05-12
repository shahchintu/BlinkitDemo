import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService, DashboardStats } from '../../../core/services/admin.service';
import { IOrder } from '../../../core/models';
import { formatPrice, timeAgo } from '../../../shared/utils';

const STATUS_CHIP: Record<string, string> = {
  Placed: 'bg-blue-100 text-blue-700',
  Packed: 'bg-orange-100 text-orange-700',
  OutForDelivery: 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1 class="text-2xl font-bold text-[#1A1A1A] mb-6">Dashboard</h1>

    @if (loading()) {
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        @for (_ of skeletons; track $index) {
          <div class="bg-white rounded-xl border border-[#E0E0E0] p-5 animate-pulse h-28"></div>
        }
      </div>
    } @else {
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        @for (card of statCards(); track card.label) {
          <div class="bg-white rounded-xl border border-[#E0E0E0] p-5">
            <div class="w-10 h-10 rounded-full bg-[#0C831F]/10 flex items-center justify-center text-xl mb-3">{{ card.icon }}</div>
            <p class="text-3xl font-bold text-[#0C831F]">{{ card.value }}</p>
            <p class="text-sm text-[#666666] mt-1">{{ card.label }}</p>
          </div>
        }
      </div>
    }

    <div class="grid lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl border border-[#E0E0E0] p-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-bold text-[#1A1A1A]">Recent Orders</h2>
          <a routerLink="/admin/orders" class="text-xs text-[#0C831F] hover:underline">View All</a>
        </div>
        @if (loadingOrders()) {
          <div class="space-y-2">@for (_ of [1,2,3]; track $index) { <div class="h-10 bg-gray-100 rounded animate-pulse"></div> }</div>
        } @else {
          <div class="space-y-0">
            @for (order of recentOrders(); track order.id) {
              <div class="flex items-center justify-between text-sm py-2.5 border-b border-[#F0F0F0] last:border-0 gap-2">
                <span class="font-mono text-xs text-[#666666]">#{{ order.id.slice(-8).toUpperCase() }}</span>
                <span class="text-[#666666] text-xs truncate flex-1">{{ order.itemsSummary }}</span>
                <span class="font-semibold text-xs flex-shrink-0">{{ fmt(order.totalAmount) }}</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" [class]="chipClass(order.status)">{{ order.status }}</span>
              </div>
            }
          </div>
        }
      </div>

      <div class="bg-white rounded-xl border border-[#E0E0E0] p-4">
        <h2 class="font-bold text-[#1A1A1A] mb-4">Top Products</h2>
        @if (loading()) {
          <div class="space-y-2">@for (_ of [1,2,3,4,5]; track $index) { <div class="h-10 bg-gray-100 rounded animate-pulse"></div> }</div>
        } @else {
          <div class="space-y-3">
            @for (p of stats()?.topProducts ?? []; track p.productId; let i = $index) {
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-[#666666] w-4 flex-shrink-0">{{ i + 1 }}</span>
                <img [src]="p.imageUrl" [alt]="p.name" class="w-10 h-10 object-contain rounded-lg bg-gray-50 p-1 flex-shrink-0" loading="lazy" />
                <span class="text-sm font-medium flex-1 truncate">{{ p.name }}</span>
                <span class="text-xs text-[#666666] flex-shrink-0">{{ p.soldCount }} sold</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly recentOrders = signal<IOrder[]>([]);
  readonly loading = signal(true);
  readonly loadingOrders = signal(true);
  readonly skeletons = Array(4);

  fmt = formatPrice;

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.adminService.getOrders(1, 5).subscribe({
      next: r => { this.recentOrders.set(r.items); this.loadingOrders.set(false); },
      error: () => this.loadingOrders.set(false),
    });
  }

  statCards(): { icon: string; value: string; label: string }[] {
    const s = this.stats();
    if (!s) return [];
    return [
      { icon: '📦', value: String(s.totalOrders),   label: 'Total Orders' },
      { icon: '⏳', value: String(s.pendingOrders),  label: 'Pending' },
      { icon: '✅', value: String(s.deliveredOrders),label: 'Delivered' },
      { icon: '💰', value: formatPrice(s.totalRevenue), label: 'Revenue' },
    ];
  }

  chipClass(status: string): string {
    return STATUS_CHIP[status] ?? 'bg-gray-100 text-gray-700';
  }
}
