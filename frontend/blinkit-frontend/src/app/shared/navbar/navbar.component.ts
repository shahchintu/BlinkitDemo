import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthStore } from '../../core/stores/auth.store';
import { AuthService } from '../../core/services/auth.service';
import { LocationSelectorComponent } from '../location-selector/location-selector.component';

interface UserLocation { city: string; state: string; pincode: string; }

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <header class="sticky top-0 z-50 bg-white border-b border-[#E0E0E0] shadow-sm">
      <div class="flex items-center gap-3 px-4 py-3 max-w-screen-xl mx-auto">

        <!-- Logo -->
        <a routerLink="/" class="flex-shrink-0">
          <div class="bg-[#0C831F] px-3 py-1 rounded-lg">
            <span class="text-[#F8C200] italic font-black text-xl tracking-tight">blinkit</span>
          </div>
        </a>

        <!-- Location pill -->
        <button
          class="flex items-center gap-1 text-sm font-medium border border-[#E0E0E0] rounded-lg px-3 py-2 hover:border-[#0C831F] transition-colors flex-shrink-0"
          (click)="openLocationSelector()"
        >
          <svg class="w-4 h-4 text-[#0C831F]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <div class="text-left">
            <div class="text-[10px] text-[#0C831F] font-bold leading-none">Delivery in 8 minutes</div>
            <div class="text-xs text-gray-700 leading-none">{{ locationLabel() }}</div>
          </div>
          <svg class="w-3 h-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>

        <!-- Search placeholder -->
        <div class="flex-1 hidden md:block">
          <div class="flex items-center bg-[#F8F8F8] border border-[#E0E0E0] rounded-xl px-4 py-2 gap-2">
            <svg class="w-4 h-4 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <span class="text-sm text-[#666666]">Search for products...</span>
          </div>
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-2 ml-auto">
          @if (!authStore.isAuthenticated()) {
            <a
              routerLink="/auth/login"
              class="border border-[#E0E0E0] rounded-lg px-4 py-2 text-sm font-medium hover:border-[#0C831F] hover:text-[#0C831F] transition-colors"
            >
              Login
            </a>
          } @else {
            <div class="relative">
              <button
                class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F8F8F8] transition-colors"
                (click)="toggleDropdown()"
              >
                <div class="w-8 h-8 bg-[#0C831F] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {{ initials() }}
                </div>
                <span class="text-sm font-medium hidden md:block">{{ authStore.currentUser()?.fullName }}</span>
                <svg class="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </button>

              @if (dropdownOpen()) {
                <div class="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E0E0E0] rounded-xl shadow-lg py-1 z-50">
                  <a routerLink="/orders" class="block px-4 py-2 text-sm hover:bg-[#F8F8F8]" (click)="dropdownOpen.set(false)">My Orders</a>
                  <a routerLink="/account" class="block px-4 py-2 text-sm hover:bg-[#F8F8F8]" (click)="dropdownOpen.set(false)">My Account</a>
                  @if (authStore.currentUser()?.role === 'Admin') {
                    <a routerLink="/admin" class="block px-4 py-2 text-sm hover:bg-[#F8F8F8]" (click)="dropdownOpen.set(false)">Admin Panel</a>
                  }
                  <hr class="border-[#E0E0E0] my-1" />
                  <button class="block w-full text-left px-4 py-2 text-sm text-[#F44336] hover:bg-[#F8F8F8]" (click)="onLogout()">
                    Logout
                  </button>
                </div>
              }
            </div>
          }

          <!-- Cart button -->
          <a
            routerLink="/cart"
            class="flex items-center gap-2 bg-[#0C831F] text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span>My Cart</span>
          </a>
        </div>
      </div>
    </header>
  `,
})
export class NavbarComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);

  readonly dropdownOpen = signal(false);
  readonly locationLabel = signal('Select Location');

  ngOnInit(): void {
    const stored = localStorage.getItem('userLocation');
    if (stored) {
      const loc: UserLocation = JSON.parse(stored);
      this.locationLabel.set(loc.city || 'Select Location');
    }
  }

  initials(): string {
    const name = this.authStore.currentUser()?.fullName ?? '';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  openLocationSelector(): void {
    const ref = this.dialog.open(LocationSelectorComponent, { panelClass: 'rounded-2xl' });
    ref.afterClosed().subscribe((loc: UserLocation | undefined) => {
      if (loc?.city) this.locationLabel.set(loc.city);
    });
  }

  onLogout(): void {
    this.dropdownOpen.set(false);
    this.authService.logout().subscribe();
  }
}
