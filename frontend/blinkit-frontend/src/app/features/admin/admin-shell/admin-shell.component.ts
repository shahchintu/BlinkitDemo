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
      <aside class="w-60 bg-[#1A1A1A] text-white flex-shrink-0 flex flex-col p-4">
        <div class="text-[#F8C200] font-black text-lg mb-6">⚡ Blinkit Admin</div>

        <nav class="space-y-1 flex-1">
          @for (link of navLinks; track link.path) {
            <a [routerLink]="link.path" routerLinkActive="bg-[#0C831F] text-white"
              [routerLinkActiveOptions]="{ exact: link.exact ?? false }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-colors">
              <span>{{ link.icon }}</span>
              <span>{{ link.label }}</span>
            </a>
          }
        </nav>

        <a routerLink="/" class="flex items-center gap-2 text-gray-400 text-xs hover:text-white transition-colors mt-4">
          ← Back to Store
        </a>
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
