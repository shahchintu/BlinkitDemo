import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService, AdminUserDto } from '../../../core/services/admin.service';
import { IOrder } from '../../../core/models';
import { formatPrice, timeAgo } from '../../../shared/utils';
import { OrderDetailComponent } from '../../orders/order-detail/order-detail.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OrderDetailComponent],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-[#1A1A1A]">Users</h1>
      <input [formControl]="searchCtrl" placeholder="Search by name or email..."
        class="border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F] w-64" />
    </div>

    @if (loading()) {
      <div class="space-y-2">@for (_ of skeletons; track $index) { <div class="h-14 bg-white rounded-xl border border-[#E0E0E0] animate-pulse"></div> }</div>
    } @else {
      <div class="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        <div class="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 bg-gray-50 text-xs font-semibold text-[#666666] border-b border-[#E0E0E0]">
          <span>Name</span><span>Email</span><span>Role</span><span>Orders</span><span>Joined</span><span>Actions</span>
        </div>
        @for (user of users(); track user.id) {
          <div class="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-[#F0F0F0] last:border-0 items-start">
            <span class="text-sm font-medium">{{ user.fullName }}</span>
            <span class="text-sm text-[#666666] truncate">{{ user.email }}</span>
            <span class="text-xs font-semibold px-2 py-1 rounded-full w-fit"
              [class]="user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'">
              {{ user.role }}
            </span>
            <span class="text-sm">{{ user.orderCount }}</span>
            <span class="text-xs text-[#666666]">{{ ago(user.createdAt) }}</span>
            <button class="text-[#0C831F] text-xs hover:underline text-left"
              (click)="viewOrders(user)">
              {{ expandedUserId() === user.id ? 'Hide' : 'View Orders' }}
            </button>
          </div>
          @if (expandedUserId() === user.id) {
            <div class="px-4 pb-4 border-b border-[#F0F0F0]">
              @if (userOrders().length === 0) {
                <p class="text-sm text-[#666666] py-2">No orders yet.</p>
              } @else {
                <div class="space-y-3 mt-2">
                  @for (order of userOrders(); track order.id) {
                    <div class="border border-[#E0E0E0] rounded-xl p-3">
                      <div class="flex justify-between items-center mb-2">
                        <span class="font-mono text-xs text-[#666666]">#{{ order.id.slice(-8).toUpperCase() }}</span>
                        <span class="text-sm font-bold">{{ fmt(order.totalAmount) }}</span>
                      </div>
                      <app-order-detail [order]="order" />
                    </div>
                  }
                </div>
              }
            </div>
          }
        }
      </div>

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
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly users = signal<AdminUserDto[]>([]);
  readonly userOrders = signal<IOrder[]>([]);
  readonly loading = signal(true);
  readonly expandedUserId = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly skeletons = Array(5);

  readonly searchCtrl = new FormControl('');

  fmt = formatPrice;
  ago = timeAgo;

  ngOnInit(): void {
    this.load();
    this.searchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    const search = this.searchCtrl.value ?? undefined;
    this.adminService.getUsers(this.page(), 20, search || undefined).subscribe({
      next: r => { this.users.set(r.items); this.totalPages.set(r.totalPages); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  changePage(p: number): void { this.page.set(p); this.load(); }

  viewOrders(user: AdminUserDto): void {
    if (this.expandedUserId() === user.id) {
      this.expandedUserId.set(null);
      return;
    }
    this.expandedUserId.set(user.id);
    this.userOrders.set([]);
    this.adminService.getUserOrders(user.id).subscribe({
      next: orders => this.userOrders.set(orders),
    });
  }
}
