import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../core/stores/auth.store';
import { AuthService } from '../../core/services/auth.service';
import { CartStore } from '../../core/stores/cart.store';
import { CartService } from '../../core/services/cart.service';
import { LocationSelectorComponent } from '../location-selector/location-selector.component';
import { LoginPromptDialogComponent } from '../login-prompt-dialog/login-prompt-dialog.component';
import { SearchBarComponent } from '../search-bar/search-bar.component';

interface UserLocation { city: string; state: string; pincode: string; }

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SearchBarComponent, MatIconModule],
  template: `
    <header class="sticky top-0 z-50 bg-white border-b border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div class="flex items-center gap-4 h-16 max-w-[1200px] mx-auto px-4">

        <!-- Logo -->
        <a routerLink="/" class="flex-shrink-0">
          <div class="bg-[#F8C200] px-3 py-1 rounded-lg">
            <span class="text-[#0C831F] italic font-black text-2xl tracking-tight">blinkit</span>
          </div>
        </a>

        <!-- Location pill -->
        <button
          class="flex flex-col items-start ml-1 cursor-pointer flex-shrink-0 hover:opacity-80 transition-opacity"
          (click)="openLocationSelector()"
        >
          <span class="text-[11px] font-bold text-[#1A1A1A] leading-none">Delivery in 8 minutes</span>
          <div class="flex items-center gap-0.5 mt-0.5">
            <span class="text-[13px] font-semibold text-[#1A1A1A] leading-none">{{ locationLabel() }}</span>
            <svg class="w-3 h-3 text-[#1A1A1A]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </div>
        </button>

        <!-- Search bar -->
        <div class="flex-1 max-w-[600px] mx-2 hidden md:block">
          <app-search-bar />
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-3 ml-auto">

          @if (!authStore.isAuthenticated()) {
            <!-- Not logged in -->
            <button
              class="border border-[#1A1A1A] rounded-[8px] px-5 h-[40px] text-[14px] font-semibold text-[#1A1A1A] hover:bg-[#F8F8F8] transition-colors"
              (click)="onLogin()"
            >Login</button>

          } @else {
            <!-- Logged in: Account dropdown -->
            <div class="relative">

              <!-- Click-outside backdrop -->
              @if (isDropdownOpen()) {
                <div class="fixed inset-0 z-[99]" (click)="closeDropdown()"></div>
              }

              <!-- Account trigger button -->
              <button
                class="flex items-center gap-1.5 cursor-pointer hover:text-[#0C831F] transition"
                (click)="toggleDropdown()"
              >
                <span class="text-[15px] font-semibold text-[#1A1A1A]">Account</span>
                <mat-icon class="text-[18px] leading-none text-[#666666]">expand_more</mat-icon>
              </button>

              <!-- Dropdown panel -->
              @if (isDropdownOpen()) {
                <div class="absolute right-0 top-[calc(100%+8px)] bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.15)] border border-[#F0F0F0] w-[280px] z-[100] overflow-hidden">

                  <!-- User info -->
                  <div class="px-5 py-4 border-b border-[#F5F5F5]">
                    <p class="text-[16px] font-bold text-[#1A1A1A] truncate">{{ currentUser()?.fullName }}</p>
                    <p class="text-[13px] text-[#666666] truncate mt-0.5">{{ currentUser()?.email }}</p>
                  </div>

                  <!-- Menu items -->
                  <div class="py-1">

                    <div (click)="navigate('/orders')"
                      class="flex items-center gap-3 px-5 py-3 hover:bg-[#F8F8F8] cursor-pointer transition">
                      <mat-icon class="text-[20px] text-[#666666]">shopping_bag</mat-icon>
                      <span class="text-[14px] text-[#1A1A1A] font-medium">My Orders</span>
                    </div>

                    <div (click)="navigate('/account/addresses')"
                      class="flex items-center gap-3 px-5 py-3 hover:bg-[#F8F8F8] cursor-pointer transition">
                      <mat-icon class="text-[20px] text-[#666666]">location_on</mat-icon>
                      <span class="text-[14px] text-[#1A1A1A] font-medium">Saved Addresses</span>
                    </div>

                    <div (click)="navigate('/account/blinkit-plus')"
                      class="flex items-center gap-3 px-5 py-3 hover:bg-[#F8F8F8] cursor-pointer transition">
                      <mat-icon class="text-[20px] text-[#F8C200]">star</mat-icon>
                      <span class="text-[14px] text-[#1A1A1A] font-medium">Blinkit Plus</span>
                    </div>

                    <div (click)="navigate('/help')"
                      class="flex items-center gap-3 px-5 py-3 hover:bg-[#F8F8F8] cursor-pointer transition">
                      <mat-icon class="text-[20px] text-[#666666]">help_outline</mat-icon>
                      <span class="text-[14px] text-[#1A1A1A] font-medium">FAQ's</span>
                    </div>

                    <div (click)="navigate('/account')"
                      class="flex items-center gap-3 px-5 py-3 hover:bg-[#F8F8F8] cursor-pointer transition">
                      <mat-icon class="text-[20px] text-[#666666]">lock_outline</mat-icon>
                      <span class="text-[14px] text-[#1A1A1A] font-medium">Account Privacy</span>
                    </div>

                    <!-- Admin Panel — only for Admin role -->
                    @if (currentUser()?.role === 'Admin') {
                      <div class="border-t border-[#F5F5F5]">
                        <div (click)="navigate('/admin')"
                          class="flex items-center gap-3 px-5 py-3 hover:bg-[#FFF8E1] cursor-pointer transition">
                          <mat-icon class="text-[20px] text-[#F57C00]">admin_panel_settings</mat-icon>
                          <span class="text-[14px] font-semibold text-[#F57C00]">Admin Panel</span>
                        </div>
                      </div>
                    }

                    <!-- Logout -->
                    <div class="border-t border-[#F5F5F5]">
                      <div (click)="onLogout()"
                        class="flex items-center gap-3 px-5 py-3 hover:bg-[#FFEBEE] cursor-pointer transition">
                        <mat-icon class="text-[20px] text-[#F44336]">logout</mat-icon>
                        <span class="text-[14px] font-semibold text-[#F44336]">Log Out</span>
                      </div>
                    </div>

                  </div>

                  <!-- App QR section -->
                  <div class="border-t border-[#F5F5F5] bg-[#FAFAFA] px-5 py-4 flex items-center gap-3">
                    <div class="w-[52px] h-[52px] bg-[#1A1A1A] rounded-[8px] flex-shrink-0 flex items-center justify-center">
                      <mat-icon class="text-white text-[28px]">qr_code</mat-icon>
                    </div>
                    <div>
                      <p class="text-[12px] font-semibold text-[#1A1A1A]">Simple way to get groceries</p>
                      <p class="text-[12px] font-semibold text-[#0C831F]">at your doorstep</p>
                      <p class="text-[11px] text-[#999999] mt-0.5">Scan QR and download blinkit app</p>
                    </div>
                  </div>

                </div>
              }
            </div>
          }

          <!-- Cart button -->
          <button
            class="relative flex items-center gap-2 bg-[#0C831F] text-white rounded-[8px] h-[44px] px-4 hover:bg-[#0a6b19] transition-colors"
            (click)="cartService.openCart()"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span class="text-[14px] font-semibold hidden md:block">My Cart</span>
            @if (cartStore.itemCount() > 0) {
              <span class="absolute -top-1 -right-1 w-5 h-5 bg-[#F8C200] text-[#1A1A1A] text-[11px] font-bold rounded-full flex items-center justify-center">
                {{ cartStore.itemCount() }}
              </span>
            }
          </button>

        </div>
      </div>
    </header>
  `,
})
export class NavbarComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly cartStore = inject(CartStore);
  readonly cartService = inject(CartService);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isDropdownOpen = signal(false);
  readonly locationLabel = signal('Select Location');
  readonly currentUser = this.authStore.currentUser;

  ngOnInit(): void {
    const stored = localStorage.getItem('userLocation');
    if (stored) {
      const loc: UserLocation = JSON.parse(stored);
      this.locationLabel.set(loc.city || 'Select Location');
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update(v => !v);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
    this.closeDropdown();
  }

  openLocationSelector(): void {
    const ref = this.dialog.open(LocationSelectorComponent, { panelClass: 'rounded-2xl' });
    ref.afterClosed().subscribe((loc: UserLocation | undefined) => {
      if (loc?.city) this.locationLabel.set(loc.city);
    });
  }

  onLogin(): void {
    if (this.cartStore.itemCount() > 0) {
      this.dialog.open(LoginPromptDialogComponent, { panelClass: 'rounded-2xl', width: '380px' });
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  onLogout(): void {
    this.closeDropdown();
    this.authService.logout().subscribe();
  }
}
