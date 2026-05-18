import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, timeout, catchError, of } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
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

    @if (!locationSelected()) {
      <app-location-gate (locationSelected)="locationSelected.set(true)" />
    }
  `,
})
export class AppComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly locationSelected = signal(!!localStorage.getItem('userLocation'));
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
    this.authService.refresh().pipe(
      timeout(5000),
      catchError(() => of(null))
    ).subscribe(result => {
      if (result) {
        // Session restored → load cart from server
        this.cartService.loadCart().subscribe();
      } else {
        // Guest → load from localStorage
        this.cartService.loadGuestCart();
      }
    });
  }
}

