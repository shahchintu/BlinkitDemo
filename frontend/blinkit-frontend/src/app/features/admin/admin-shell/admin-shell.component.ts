import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <aside class="w-[240px] bg-[#1A1A2E] min-h-screen flex flex-col flex-shrink-0">
        <!-- Logo area -->
        <div class="px-6 py-5 border-b border-white/10">
          <div class="flex items-center gap-2">
            <div class="bg-[#F8C200] px-2 py-0.5 rounded">
              <span class="text-[#0C831F] italic font-black text-lg">blinkit</span>
            </div>
            <span class="text-[11px] text-white/60 font-medium">Admin</span>
          </div>
        </div>

        <!-- Nav items -->
        <nav class="px-3 py-4 space-y-1 flex-1">
          @for (link of navLinks; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-[#0C831F] text-white"
              [routerLinkActiveOptions]="{ exact: link.exact ?? false }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-[10px] cursor-pointer text-white/60 hover:bg-white/10 hover:text-white transition-colors text-[14px] font-medium"
            >
              <span class="text-[18px]">{{ link.icon }}</span>
              <span>{{ link.label }}</span>
            </a>
          }
        </nav>

        <!-- Bottom -->
        <div class="mt-auto px-3 py-4 border-t border-white/10">
          <a routerLink="/" class="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-[13px]">
            ← Back to Store
          </a>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 bg-[#F8F8F8] overflow-auto p-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminShellComponent {
  readonly navLinks = [
    { icon: '📊', label: 'Dashboard',   path: '/admin',            exact: true },
    { icon: '📦', label: 'Orders',      path: '/admin/orders' },
    { icon: '🛍️', label: 'Products',    path: '/admin/products' },
    { icon: '📂', label: 'Categories',  path: '/admin/categories' },
    { icon: '👤', label: 'Users',       path: '/admin/users' },
    { icon: '🎟️', label: 'Coupons',     path: '/admin/coupons' },
  ];
}
