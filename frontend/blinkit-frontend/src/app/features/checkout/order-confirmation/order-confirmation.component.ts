import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styles: [`
    @keyframes stroke-dash {
      to { stroke-dashoffset: 0; }
    }
    @keyframes fill-circle {
      to { fill: #4CAF50; }
    }
    .circle-anim {
      stroke-dasharray: 251;
      stroke-dashoffset: 251;
      animation: stroke-dash 0.6s ease forwards;
    }
    .check-anim {
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: stroke-dash 0.4s ease 0.5s forwards;
    }
  `],
  template: `
    <div class="min-h-screen bg-white flex flex-col items-center justify-center p-8">

      @if (!hasState()) {
        <p class="text-blinkit-muted">Redirecting...</p>
      } @else {

        <!-- Animated checkmark -->
        <svg class="w-28 h-28" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="#4CAF50"
            stroke-width="4"
            stroke-linecap="round"
            class="circle-anim"
          />
          <path
            d="M30 50 L44 64 L70 38"
            fill="none"
            stroke="#4CAF50"
            stroke-width="5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="check-anim"
          />
        </svg>

        <!-- Content -->
        <div class="text-center mt-6 max-w-sm">
          <h1 class="text-2xl font-bold text-[#1A1A1A]">Order Placed Successfully!</h1>
          <p class="text-blinkit-muted text-sm mt-1">Order #{{ orderId() }}</p>
          <p class="text-blinkit-muted text-xs mt-0.5">Payment ID: {{ paymentId() }}</p>
          <p class="text-blinkit-green text-sm font-medium mt-3">
            📧 Confirmation email sent to {{ userEmail() }}
          </p>
          <p class="text-blinkit-green font-semibold mt-1">🕐 Arriving in ~10 minutes</p>
        </div>

        <!-- Post-checkout add items -->
        <div class="mt-6 bg-yellow-50 border border-blinkit-yellow rounded-xl p-4 max-w-sm w-full text-center">
          <p class="text-sm text-gray-700">Forgot something? You can still add items before your order is packed.</p>
          <button
            class="mt-3 border border-blinkit-green text-blinkit-green rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-50 transition-colors"
            (click)="goAddItems()"
          >Add Items</button>
        </div>

        <!-- Action buttons -->
        <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center w-full max-w-sm">
          <a
            routerLink="/orders"
            class="flex-1 bg-blinkit-green text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors text-center"
          >Track Order</a>
          <a
            routerLink="/"
            class="flex-1 border-2 border-blinkit-green text-blinkit-green px-8 py-3 rounded-xl font-bold hover:bg-green-50 transition-colors text-center"
          >Continue Shopping</a>
        </div>

      }
    </div>
  `,
})
export class OrderConfirmationComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);

  readonly hasState = signal(false);
  readonly orderId = signal('');
  readonly paymentId = signal('');
  readonly userEmail = signal('');

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { orderId?: string; paymentId?: string } | undefined;

    if (state?.orderId) {
      this.orderId.set(state.orderId);
      this.paymentId.set(state.paymentId ?? '');
      this.userEmail.set(this.authStore.currentUser()?.email ?? '');
      this.hasState.set(true);
    } else {
      this.router.navigate(['/']);
    }
  }

  goAddItems(): void {
    this.router.navigate(['/orders', this.orderId(), 'add']);
  }
}
