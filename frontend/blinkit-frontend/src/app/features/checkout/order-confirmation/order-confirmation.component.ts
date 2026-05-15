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
          @if (userEmail()) {
            <div class="flex justify-between items-center text-sm">
              <span class="text-[#666666]">Confirmation sent to</span>
              <span class="font-semibold text-[#0C831F] text-xs">{{ userEmail() }}</span>
            </div>
          }

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
        <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center w-full max-w-sm">
          <a
            routerLink="/orders"
            class="flex-1 bg-[#0C831F] text-white px-8 py-3 rounded-[12px] font-bold hover:bg-[#0a6b19] transition-colors text-center"
          >Track Order</a>
          <a
            routerLink="/"
            class="flex-1 border-2 border-[#0C831F] text-[#0C831F] px-8 py-3 rounded-[12px] font-bold hover:bg-[#0C831F]/5 transition-colors text-center"
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
