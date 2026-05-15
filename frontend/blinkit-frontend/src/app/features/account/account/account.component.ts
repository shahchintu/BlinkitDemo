import {
  ChangeDetectionStrategy, Component, inject,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="bg-[#F0F0F5] min-h-screen">
      <div class="max-w-[1000px] mx-auto px-4 py-6 grid grid-cols-[280px_1fr] gap-6 items-start">

        <!-- Left sidebar -->
        <aside class="bg-white rounded-[16px] border border-[#E0E0E0] self-start sticky top-24">

          <!-- User info -->
          <div class="px-5 py-5 border-b border-[#F2F2F2]">
            <p class="text-[16px] font-bold text-[#1A1A1A]">{{ displayName() }}</p>
            <p class="text-[13px] text-[#666666] mt-0.5">{{ authStore.currentUser()?.email }}</p>
          </div>

          <!-- Nav links -->
          <nav class="py-2">
            <a routerLink="/account/profile" routerLinkActive #p1="routerLinkActive"
              [class]="sideNavClass(p1.isActive)">
              <mat-icon class="text-[20px]">person_outline</mat-icon>
              My Profile
            </a>

            <a routerLink="/account/addresses" routerLinkActive #p2="routerLinkActive"
              [class]="sideNavClass(p2.isActive)">
              <mat-icon class="text-[20px]">location_on</mat-icon>
              My Addresses
            </a>

            <a routerLink="/orders" routerLinkActive #p3="routerLinkActive"
              [routerLinkActiveOptions]="{exact: true}"
              [class]="sideNavClass(p3.isActive)">
              <mat-icon class="text-[20px]">shopping_bag</mat-icon>
              My Orders
            </a>

            <a routerLink="/account/blinkit-plus" routerLinkActive #p4="routerLinkActive"
              [class]="sideNavClass(p4.isActive)">
              <mat-icon class="text-[20px]">star_border</mat-icon>
              Blinkit Plus
            </a>

            <a routerLink="/help" routerLinkActive #p5="routerLinkActive"
              [class]="sideNavClass(p5.isActive)">
              <mat-icon class="text-[20px]">help_outline</mat-icon>
              FAQ's
            </a>

            <a routerLink="/account" routerLinkActive #p6="routerLinkActive"
              [routerLinkActiveOptions]="{exact: true}"
              [class]="sideNavClass(p6.isActive)">
              <mat-icon class="text-[20px]">lock_outline</mat-icon>
              Account Privacy
            </a>

            <!-- Admin Panel — only for Admin role -->
            @if (isAdmin()) {
              <div class="border-t border-[#F2F2F2] mt-2 pt-2">
                <button [class]="adminNavClass()"
                  (click)="router.navigate(['/admin'])">
                  <mat-icon class="text-[20px] text-[#F57C00]">admin_panel_settings</mat-icon>
                  Admin Panel
                </button>
              </div>
            }

            <!-- Logout -->
            <div class="border-t border-[#F2F2F2] mt-2 pt-2">
              <button [class]="logoutNavClass()" (click)="logout()">
                <mat-icon class="text-[20px] text-[#F44336]">logout</mat-icon>
                Logout
              </button>
            </div>
          </nav>
        </aside>

        <!-- Right content: child route renders here -->
        <div>
          <router-outlet />
        </div>

      </div>
    </div>
  `,
})
export class AccountComponent {
  readonly authStore = inject(AuthStore);
  readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  displayName(): string {
    const user = this.authStore.currentUser();
    return user?.fullName ?? user?.email ?? 'Account';
  }

  isAdmin(): boolean {
    return this.authStore.currentUser()?.role === 'Admin';
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
