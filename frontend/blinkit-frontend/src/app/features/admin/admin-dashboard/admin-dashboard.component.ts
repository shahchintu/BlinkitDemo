import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService, DashboardStats } from '../../../core/services/admin.service';
import { ImageService } from '../../../core/services/image.service';
import { IOrder } from '../../../core/models';
import { formatPrice, timeAgo } from '../../../shared/utils';

const STATUS_CHIP: Record<string, string> = {
  Placed:         'bg-[#E3F2FD] text-[#1976D2]',
  Packed:         'bg-[#FFF8E1] text-[#F57C00]',
  OutForDelivery: 'bg-[#F3E5F5] text-[#7B1FA2]',
  Delivered:      'bg-[#E8F5E9] text-[#0C831F]',
  Cancelled:      'bg-[#FFEBEE] text-[#F44336]',
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1 class="text-[24px] font-bold text-[#1A1A1A] mb-6">Dashboard</h1>

    @if (loading()) {
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        @for (_ of skeletons; track $index) {
          <div class="bg-white rounded-[16px] border border-[#E0E0E0] p-5 animate-pulse h-32"></div>
        }
      </div>
    } @else {
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        @for (card of statCards(); track card.label) {
          <div class="bg-white rounded-[16px] border border-[#E0E0E0] p-5">
            <div class="w-12 h-12 rounded-[12px] flex items-center justify-center text-xl mb-3"
              [class]="card.iconBg">{{ card.icon }}</div>
            <p class="text-[28px] font-bold text-[#1A1A1A] mt-3">{{ card.value }}</p>
            <p class="text-[13px] text-[#666666] mt-1">{{ card.label }}</p>
            @if (card.trend) {
              <p class="text-[12px] text-[#0C831F] mt-1">{{ card.trend }}</p>
            }
          </div>
        }
      </div>
    }

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Recent Orders -->
      <div class="bg-white rounded-[16px] border border-[#E0E0E0] overflow-hidden">
        <div class="flex justify-between items-center px-4 py-4 border-b border-[#E0E0E0]">
          <h2 class="font-bold text-[#1A1A1A]">Recent Orders</h2>
          <a routerLink="/admin/orders" class="text-xs text-[#0C831F] font-semibold hover:underline">View All →</a>
        </div>
        @if (loadingOrders()) {
          <div class="p-4 space-y-2">
            @for (_ of [1,2,3]; track $index) {
              <div class="h-10 bg-gray-100 rounded animate-pulse"></div>
            }
          </div>
        } @else {
          <table class="w-full">
            <thead class="bg-[#F8F8F8] border-b border-[#E0E0E0]">
              <tr>
                <th class="px-4 py-3 text-[12px] font-semibold text-[#666666] uppercase tracking-wide text-left">Order</th>
                <th class="px-4 py-3 text-[12px] font-semibold text-[#666666] uppercase tracking-wide text-left">Amount</th>
                <th class="px-4 py-3 text-[12px] font-semibold text-[#666666] uppercase tracking-wide text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (order of recentOrders(); track order.id) {
                <tr class="border-b border-[#F2F2F2] hover:bg-[#F8FFFE] transition-colors">
                  <td class="px-4 py-4">
                    <p class="font-mono text-[13px] text-[#666666]">#{{ order.id.slice(-8).toUpperCase() }}</p>
                    <p class="text-[12px] text-[#999] truncate max-w-[160px]">{{ order.itemsSummary }}</p>
                  </td>
                  <td class="px-4 py-4 text-[14px] font-semibold text-[#1A1A1A]">{{ fmt(order.totalAmount) }}</td>
                  <td class="px-4 py-4">
                    <span class="text-[12px] font-semibold px-2 py-1 rounded-full" [class]="chipClass(order.status)">{{ order.status }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Top Products -->
      <div class="bg-white rounded-[16px] border border-[#E0E0E0] overflow-hidden">
        <div class="px-4 py-4 border-b border-[#E0E0E0]">
          <h2 class="font-bold text-[#1A1A1A]">Top Products</h2>
        </div>
        @if (loading()) {
          <div class="p-4 space-y-2">
            @for (_ of [1,2,3,4,5]; track $index) {
              <div class="h-10 bg-gray-100 rounded animate-pulse"></div>
            }
          </div>
        } @else {
          <div class="divide-y divide-[#F2F2F2]">
            @for (p of stats()?.topProducts ?? []; track p.productId; let i = $index) {
              <div class="flex items-center gap-3 px-4 py-4 hover:bg-[#F8FFFE] transition-colors">
                <span class="text-[13px] font-bold text-[#666666] w-5 flex-shrink-0 text-center">{{ i + 1 }}</span>
                <img [src]="topProductImages()[p.productId] || p.imageUrl" [alt]="p.name" class="w-10 h-10 object-contain rounded-lg bg-[#F8F8F8] p-1 flex-shrink-0" loading="lazy" />
                <span class="text-[14px] font-medium text-[#1A1A1A] flex-1 truncate">{{ p.name }}</span>
                <span class="text-[13px] text-[#666666] flex-shrink-0">{{ p.soldCount }} sold</span>
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
  private readonly imageService = inject(ImageService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly recentOrders = signal<IOrder[]>([]);
  readonly topProductImages = signal<Record<string, string>>({});
  readonly loading = signal(true);
  readonly loadingOrders = signal(true);
  readonly skeletons = Array(4);

  fmt = formatPrice;

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: s => {
        this.stats.set(s);
        this.loading.set(false);
        s.topProducts.forEach(p => {
          this.imageService.getProductImage(p.name, '', p.productId)
            .subscribe(url => this.topProductImages.update(imgs => ({ ...imgs, [p.productId]: url })));
        });
      },
      error: () => this.loading.set(false),
    });
    this.adminService.getOrders(1, 5).subscribe({
      next: r => { this.recentOrders.set(r.items); this.loadingOrders.set(false); },
      error: () => this.loadingOrders.set(false),
    });
  }

  statCards(): { icon: string; value: string; label: string; iconBg: string; trend?: string }[] {
    const s = this.stats();
    if (!s) return [];
    return [
      { icon: '📦', value: String(s.totalOrders),    label: 'Total Orders',    iconBg: 'bg-[#E3F2FD]', trend: '↑ 12% this week' },
      { icon: '💰', value: formatPrice(s.totalRevenue), label: 'Revenue',       iconBg: 'bg-[#E8F5E9]', trend: '↑ 8% this week' },
      { icon: '⏳', value: String(s.pendingOrders),   label: 'Pending',         iconBg: 'bg-[#FFF8E1]' },
      { icon: '✅', value: String(s.deliveredOrders), label: 'Delivered',       iconBg: 'bg-[#F3E5F5]' },
    ];
  }

  chipClass(status: string): string {
    return STATUS_CHIP[status] ?? 'bg-gray-100 text-gray-700';
  }
}
