import { ChangeDetectionStrategy, Component, inject, OnInit, signal, HostListener, ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
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
  imports: [RouterLink, SearchBarComponent],
  template: `
    <nav class="sticky top-0 z-50 bg-white
                border-b border-[#F0F0F0]
                shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div class="max-w-[1400px] mx-auto px-4
                  h-[64px] flex items-center gap-4">

        <!-- Logo -->
        <a routerLink="/" class="flex-shrink-0">
          <div class="bg-[#F8C200] rounded-[10px]
                      px-3 py-1.5 cursor-pointer
                      hover:opacity-90 transition">
            <span class="text-[#0C831F] font-black
                         italic text-[22px] leading-none">
              blinkit
            </span>
          </div>
        </a>

        <!-- Location -->
        <div class="flex-shrink-0 cursor-pointer
                    hover:opacity-80 transition"
             (click)="openLocationSelector()">
          <p class="text-[11px] font-bold text-[#1A1A1A] leading-tight">
            Delivery in 8 minutes
          </p>
          <div class="flex items-center gap-0.5 mt-0.5">
            <span class="text-[13px] font-semibold text-[#1A1A1A]
                         max-w-[140px] truncate">
              {{ locationLabel() }}
            </span>
            <span class="material-icons text-[16px] text-[#666]">expand_more</span>
          </div>
        </div>

        <!-- Search bar -->
        <div class="flex-1 max-w-[640px] mx-2 hidden md:block">
          <app-search-bar />
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-2 flex-shrink-0 ml-auto">

          @if (!authStore.isAuthenticated()) {
            <button
              class="border-2 border-[#1A1A1A] rounded-[10px]
                     px-5 h-[40px] text-[14px] font-semibold
                     text-[#1A1A1A] hover:bg-[#F8F8F8]
                     transition btn-press"
              (click)="onLogin()">
              Login
            </button>
          } @else {
            <!-- Account dropdown -->
            <div class="relative">
              <button
                class="flex items-center gap-1.5 px-3 h-[40px]
                       rounded-[10px] hover:bg-[#F8F8F8]
                       transition cursor-pointer"
                (click)="toggleDropdown()">
                <div class="w-8 h-8 rounded-full bg-[#0C831F]
                            flex items-center justify-center flex-shrink-0">
                  <span class="text-white text-[13px] font-bold">
                    {{ getInitials() }}
                  </span>
                </div>
                <span class="text-[14px] font-semibold text-[#1A1A1A]
                             max-w-[80px] truncate hidden md:block">
                  {{ authStore.currentUser()?.fullName?.split(' ')?.[0] }}
                </span>
                <span class="material-icons text-[18px] text-[#666]">expand_more</span>
              </button>

              @if (isDropdownOpen()) {
                <div class="absolute right-0 top-[calc(100%+8px)] bg-white
                            rounded-[16px] shadow-dropdown
                            border border-[#F0F0F0] min-w-[280px]
                            z-[100] overflow-hidden">

                  <!-- User info -->
                  <div class="px-5 py-4 border-b border-[#F5F5F5]">
                    <p class="text-[16px] font-bold text-[#1A1A1A] truncate">
                      {{ currentUser()?.fullName }}
                    </p>
                    <p class="text-[13px] text-[#666666] truncate mt-0.5">
                      {{ currentUser()?.email }}
                    </p>
                  </div>

                  <!-- Menu items -->
                  <div class="py-1">
                    <div (click)="navigate('/orders')"
                      class="flex items-center gap-3 px-5 py-3
                             hover:bg-[#F8F8F8] cursor-pointer transition">
                      <span class="material-icons text-[20px] text-[#666666]">shopping_bag</span>
                      <span class="text-[14px] text-[#1A1A1A] font-medium">My Orders</span>
                    </div>

                    <div (click)="navigate('/account/addresses')"
                      class="flex items-center gap-3 px-5 py-3
                             hover:bg-[#F8F8F8] cursor-pointer transition">
                      <span class="material-icons text-[20px] text-[#666666]">location_on</span>
                      <span class="text-[14px] text-[#1A1A1A] font-medium">Saved Addresses</span>
                    </div>

                    <div (click)="navigate('/account/blinkit-plus')"
                      class="flex items-center gap-3 px-5 py-3
                             hover:bg-[#F8F8F8] cursor-pointer transition">
                      <span class="material-icons text-[20px] text-[#F8C200]">star</span>
                      <span class="text-[14px] text-[#1A1A1A] font-medium">Blinkit Plus</span>
                    </div>

                    <div (click)="navigate('/help')"
                      class="flex items-center gap-3 px-5 py-3
                             hover:bg-[#F8F8F8] cursor-pointer transition">
                      <span class="material-icons text-[20px] text-[#666666]">help_outline</span>
                      <span class="text-[14px] text-[#1A1A1A] font-medium">FAQ's</span>
                    </div>

                    <div (click)="navigate('/account')"
                      class="flex items-center gap-3 px-5 py-3
                             hover:bg-[#F8F8F8] cursor-pointer transition">
                      <span class="material-icons text-[20px] text-[#666666]">lock_outline</span>
                      <span class="text-[14px] text-[#1A1A1A] font-medium">Account Privacy</span>
                    </div>

                    @if (currentUser()?.role === 'Admin') {
                      <div class="border-t border-[#F5F5F5]">
                        <div (click)="navigate('/admin')"
                          class="flex items-center gap-3 px-5 py-3
                                 hover:bg-[#FFF8E1] cursor-pointer transition">
                          <span class="material-icons text-[20px] text-[#F57C00]">admin_panel_settings</span>
                          <span class="text-[14px] font-semibold text-[#F57C00]">Admin Panel</span>
                        </div>
                      </div>
                    }

                    <div class="border-t border-[#F5F5F5]">
                      <div (click)="onLogout()"
                        class="flex items-center gap-3 px-5 py-3
                               hover:bg-[#FFEBEE] cursor-pointer transition">
                        <span class="material-icons text-[20px] text-[#F44336]">logout</span>
                        <span class="text-[14px] font-semibold text-[#F44336]">Log Out</span>
                      </div>
                    </div>
                  </div>

                  <!-- App QR section -->
                  <div class="border-t border-[#F5F5F5] bg-[#FAFAFA] px-5 py-4
                              flex items-center gap-3">
                    <div class="w-[52px] h-[52px] bg-[#1A1A1A] rounded-[8px]
                                flex-shrink-0 flex items-center justify-center">
                      <span class="material-icons text-white text-[28px]">qr_code</span>
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
            class="relative flex items-center gap-2
                   bg-[#0C831F] text-white rounded-[10px]
                   h-[44px] px-4 hover:bg-[#0a6b19]
                   transition btn-press"
            (click)="cartService.openCart()">
            <span class="material-icons text-[20px]">shopping_cart</span>
            <span class="text-[14px] font-semibold hidden sm:block">My Cart</span>
            @if (cartStore.itemCount() > 0) {
              <span class="absolute -top-1.5 -right-1.5
                           bg-[#F8C200] text-[#1A1A1A]
                           text-[11px] font-black
                           w-5 h-5 rounded-full
                           flex items-center justify-center">
                {{ cartStore.itemCount() }}
              </span>
            }
          </button>

        </div>
      </div>
    </nav>
  `,
})
export class NavbarComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly cartStore = inject(CartStore);
  readonly cartService = inject(CartService);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.isDropdownOpen.set(false);
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

  getInitials(): string {
    const name = this.authStore.currentUser()?.fullName ?? '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
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
