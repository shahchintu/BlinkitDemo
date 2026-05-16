import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-account-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
<div class="bg-white rounded-[16px] border border-[#E0E0E0]
            self-start sticky top-24 overflow-hidden w-[240px]">

  <!-- User Info -->
  <div class="px-5 py-5 border-b border-[#F5F5F5]">
    <p class="text-[16px] font-bold text-[#1A1A1A]">
      {{currentUser()?.fullName}}
    </p>
    <p class="text-[13px] text-[#666] mt-0.5">
      {{currentUser()?.email}}
    </p>
  </div>

  <!-- Nav Links -->
  <nav class="py-2">

    <!-- My Profile -->
    <a routerLink="/account/profile"
       routerLinkActive="bg-[#F0FFF4] text-[#0C831F] 
                         border-l-[3px] border-[#0C831F]"
       class="flex items-center gap-3 px-5 py-3
              hover:bg-[#F8F8F8] cursor-pointer transition
              text-[#1A1A1A] no-underline">
      <span class="material-icons text-[20px] text-[#666]">
        person_outline
      </span>
      <span class="text-[14px] font-medium">My Profile</span>
    </a>

    <!-- My Addresses -->
    <a routerLink="/account/addresses"
       routerLinkActive="bg-[#F0FFF4] text-[#0C831F]
                         border-l-[3px] border-[#0C831F]"
       class="flex items-center gap-3 px-5 py-3
              hover:bg-[#F8F8F8] cursor-pointer transition
              text-[#1A1A1A] no-underline">
      <span class="material-icons text-[20px] text-[#666]">
        location_on
      </span>
      <span class="text-[14px] font-medium">My Addresses</span>
    </a>

    <!-- My Orders -->
    <a routerLink="/orders"
       routerLinkActive="bg-[#F0FFF4] text-[#0C831F]
                         border-l-[3px] border-[#0C831F]"
       class="flex items-center gap-3 px-5 py-3
              hover:bg-[#F8F8F8] cursor-pointer transition
              text-[#1A1A1A] no-underline">
      <span class="material-icons text-[20px] text-[#666]">
        shopping_bag
      </span>
      <span class="text-[14px] font-medium">My Orders</span>
    </a>

    <!-- Blinkit Plus -->
    <a routerLink="/account/blinkit-plus"
       routerLinkActive="bg-[#F0FFF4] text-[#0C831F]
                         border-l-[3px] border-[#0C831F]"
       class="flex items-center gap-3 px-5 py-3
              hover:bg-[#F8F8F8] cursor-pointer transition
              text-[#1A1A1A] no-underline">
      <span class="material-icons text-[20px] text-[#F8C200]">
        star
      </span>
      <span class="text-[14px] font-medium">Blinkit Plus</span>
    </a>

    <!-- FAQ's -->
    <a routerLink="/help"
       routerLinkActive="bg-[#F0FFF4] text-[#0C831F]
                         border-l-[3px] border-[#0C831F]"
       class="flex items-center gap-3 px-5 py-3
              hover:bg-[#F8F8F8] cursor-pointer transition
              text-[#1A1A1A] no-underline">
      <span class="material-icons text-[20px] text-[#666]">
        help_outline
      </span>
      <span class="text-[14px] font-medium">FAQ's</span>
    </a>

    <!-- Account Privacy -->
    <a routerLink="/account"
       routerLinkActive="bg-[#F0FFF4] text-[#0C831F]
                         border-l-[3px] border-[#0C831F]"
       [routerLinkActiveOptions]="{exact: true}"
       class="flex items-center gap-3 px-5 py-3
              hover:bg-[#F8F8F8] cursor-pointer transition
              text-[#1A1A1A] no-underline">
      <span class="material-icons text-[20px] text-[#666]">
        lock_outline
      </span>
      <span class="text-[14px] font-medium">Account Privacy</span>
    </a>

    <!-- Admin Panel (Admin only) -->
    @if (currentUser()?.role === 'Admin') {
    <div class="border-t border-[#F5F5F5] mt-1 pt-1">
      <a routerLink="/admin"
         class="flex items-center gap-3 px-5 py-3
                hover:bg-[#FFF8E1] cursor-pointer transition
                no-underline">
        <span class="material-icons text-[20px] text-[#F57C00]">
          admin_panel_settings
        </span>
        <span class="text-[14px] font-semibold text-[#F57C00]">
          Admin Panel
        </span>
      </a>
    </div>
    }

    <!-- Logout -->
    <div class="border-t border-[#F5F5F5] mt-1 pt-1">
      <div (click)="onLogout()"
           class="flex items-center gap-3 px-5 py-3
                  hover:bg-[#FFEBEE] cursor-pointer transition">
        <span class="material-icons text-[20px] text-[#F44336]">
          logout
        </span>
        <span class="text-[14px] font-semibold text-[#F44336]">
          Logout
        </span>
      </div>
    </div>

  </nav>
</div>
  `
})
export class AccountSidebarComponent {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  currentUser = this.authStore.currentUser;

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
