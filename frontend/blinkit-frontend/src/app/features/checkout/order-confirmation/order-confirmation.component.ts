import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { formatPrice } from '../../../shared/utils';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styles: [`
    @keyframes stroke-dash {
      to { stroke-dashoffset: 0; }
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
        <p class="text-[#666666]">Redirecting...</p>
      } @else {

        <!-- Animated checkmark — 80px -->
        <div class="w-20 h-20">
          <svg viewBox="0 0 100 100" class="w-full h-full">
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="#0C831F"
              stroke-width="4"
              stroke-linecap="round"
              class="circle-anim"
            />
            <path
              d="M30 50 L44 64 L70 38"
              fill="none"
              stroke="#0C831F"
              stroke-width="5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="check-anim"
            />
          </svg>
        </div>

        <!-- Heading -->
        <h1 class="text-[28px] font-bold text-[#1A1A1A] mt-6 text-center">🎉 Order Placed!</h1>
        <p class="text-[#666666] text-sm mt-1 text-center">Your order is confirmed and being prepared.</p>

        <!-- Order details card -->
        <div class="bg-[#F8F8F8] rounded-[16px] p-5 mt-6 w-full max-w-sm space-y-3">
          <div class="flex justify-between items-center text-sm">
            <span class="text-[#666666]">Order ID</span>
            <span class="font-semibold text-[#1A1A1A] font-mono">#{{ orderId() }}</span>
          </div>
          @if (paymentId()) {
            <div class="flex justify-between items-center text-sm">
              <span class="text-[#666666]">Payment ID</span>
              <span class="font-semibold text-[#1A1A1A] font-mono text-xs">{{ paymentId() }}</span>
            </div>
          }
          <div class="flex justify-between items-center text-sm">
            <span class="text-[#666666]">Order Total</span>
            <span class="font-bold text-[#0C831F] font-mono">{{ fmt(orderTotal()) }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-[#666666]">Status</span>
            <span class="font-semibold text-[#0C831F] text-xs">📧 Confirmation email sent</span>
          </div>

          <!-- ETA block -->
          <div class="bg-[#E8F5E9] rounded-[12px] p-4 text-center mt-2">
            <p class="text-[#0C831F] font-semibold text-[15px]">🕐 Arriving in ~10 minutes</p>
            <p class="text-[#0C831F] text-xs mt-1 opacity-80">From your nearest dark store</p>
          </div>
        </div>

        <!-- Post-checkout add items -->
        <div class="mt-5 bg-yellow-50 border border-[#F8C200] rounded-[16px] p-4 w-full max-w-sm text-center">
          <p class="text-sm text-[#1A1A1A]">Forgot something? You can still add items before your order is packed.</p>
          <button
            class="mt-3 border border-[#0C831F] text-[#0C831F] rounded-[8px] px-4 py-2 text-[13px] font-semibold hover:bg-[#0C831F] hover:text-white transition-colors"
            (click)="goAddItems()"
          >Add Items</button>
        </div>

        <!-- Action buttons -->
        <div class="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <!-- Track Order — primary CTA -->
          <a [routerLink]="['/orders', orderId(), 'track']"
            class="flex-1 h-[52px] bg-[#0C831F] text-white rounded-[14px] font-bold
                   flex items-center justify-center gap-2
                   hover:bg-[#0a6b19] active:scale-[0.98]
                   transition-all shadow-[0_4px_14px_rgba(12,131,31,0.35)]">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2.5.5M13 16l1.5.5m0 0l1.5-5H17l2 5-1.5-.5M2 12h11"/>
            </svg>
            <span class="text-[15px]">Track Order</span>
          </a>

          <!-- Continue Shopping — secondary CTA -->
          <a routerLink="/"
            class="flex-1 h-[52px] border-2 border-[#0C831F] text-[#0C831F] rounded-[14px] font-bold
                   flex items-center justify-center gap-2
                   hover:bg-[#F0FFF4] active:scale-[0.98]
                   transition-all">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span class="text-[15px]">Continue Shopping</span>
          </a>
        </div>

      }
    </div>
  `,
})
export class OrderConfirmationComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);

  readonly fmt = formatPrice;

  readonly hasState = signal(false);
  readonly orderId = signal('');
  readonly paymentId = signal('');
  readonly orderTotal = signal<number>(0);

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state ?? history.state;

    if (state?.orderId) {
      this.orderId.set(state.orderId);
      this.paymentId.set(state.paymentId ?? '');
      this.orderTotal.set(state.orderTotal ?? 0);
      this.hasState.set(true);

      // Clear cart ONLY HERE — after confirmation page loads
      // Small delay so cart badge doesn't flicker
      setTimeout(() => {
        this.cartService.clearCart().subscribe();
      }, 500);
    } else {
      this.router.navigate(['/']);
    }
  }

  goAddItems(): void {
    this.router.navigate(['/orders', this.orderId(), 'add']);
  }
}
