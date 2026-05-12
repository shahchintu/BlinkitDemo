import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { CartSidebarComponent } from './features/cart/cart-sidebar/cart-sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CartSidebarComponent],
  template: `
    <app-navbar />
    <main class="min-h-screen bg-[#F8F8F8]">
      <router-outlet />
    </main>
    <app-footer />
    <app-cart-sidebar />
  `,
})
export class AppComponent implements OnInit {
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.refresh().subscribe({ error: () => {} });
  }
}
