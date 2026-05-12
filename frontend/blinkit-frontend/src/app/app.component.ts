import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
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
      <app-location-gate (locationSelected)="showLocationGate.set(false)" />
    } @else {
      <app-navbar />
      <main class="min-h-screen bg-[#F8F8F8]">
        <router-outlet />
      </main>
      <app-footer />
      <app-cart-sidebar />
    }
  `,
})
export class AppComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly showLocationGate = signal(!localStorage.getItem('userLocation'));

  ngOnInit(): void {
    this.authService.refresh().subscribe({ error: () => {} });
  }
}
