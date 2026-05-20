import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { CartService } from './core/services/cart.service';
import { AuthStore } from './core/stores/auth.store';
import { LocationService } from './core/services/location.service';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { CartSidebarComponent } from './features/cart/cart-sidebar/cart-sidebar.component';
import { LocationGateComponent } from './shared/location-gate/location-gate.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CartSidebarComponent, LocationGateComponent],
  template: `
    @if (showLocationGate()) {
      <app-location-gate (locationSelected)="onLocationConfirmed()" />
    } @else {
      @if (!isAuthRoute()) {
        <app-navbar />
      }
      <main class="min-h-screen bg-[#F8F8F8]">
        <router-outlet />
      </main>
      @if (!isAuthRoute()) {
        <app-footer />
      }
      <app-cart-sidebar />
    }
  `,
})
export class AppComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly locationService = inject(LocationService);

  readonly showLocationGate = computed(() => !this.locationService.hasLocation());
  readonly isAuthRoute = signal(false);

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const url = event.urlAfterRedirects || event.url;
      this.isAuthRoute.set(url.includes('/auth/'));
    });
  }

  ngOnInit(): void {
    // APP_INITIALIZER already ran refresh(); auth state is resolved before this runs.
    if (this.authStore.isAuthenticated()) {
      this.cartService.loadCart().subscribe();
    } else {
      this.cartService.loadGuestCart();
    }
  }

  onLocationConfirmed(): void {
    // Gate hides automatically via LocationService.hasLocation() signal
  }
}

