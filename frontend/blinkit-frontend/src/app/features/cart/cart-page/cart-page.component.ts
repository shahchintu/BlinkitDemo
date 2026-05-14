import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { CartService, CartItemDto } from '../../../core/services/cart.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { CouponService } from '../../../core/services/coupon.service';
import { LoginPromptDialogComponent } from '../../../shared/login-prompt-dialog/login-prompt-dialog.component';
import { ICouponValidation } from '../../../core/models';
import { formatPrice, getCategoryFallback } from '../../../shared/utils';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-blinkit-bg py-6 px-4">
      <div class="max-w-screen-lg mx-auto">

        @if (cart$ | async; as cart) {
          @if (cart.items.length === 0 && wishlist().length === 0) {
            <!-- Empty state -->
            <div class="flex flex-col items-center justify-center py-24 gap-4">
              <svg class="w-20 h-20 text-blinkit-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <h2 class="text-xl font-bold text-gray-800">Your cart is empty</h2>
              <p class="text-blinkit-muted text-sm">Add items to get started</p>
              <a
                routerLink="/"
                class="bg-blinkit-green text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
              >Start Shopping</a>
            </div>
          } @else {
            <div class="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6">

              <!-- Left column -->
              <div class="space-y-4">
                <h1 class="text-xl font-bold text-gray-800">My Cart
                  @if (cart.itemCount > 0) {
                    <span class="ml-2 text-sm font-normal text-blinkit-muted">({{ cart.itemCount }} items)</span>
                  }
                </h1>

                @if (cart.items.length > 0) {
                  <!-- Delivery nudge -->
                  @if (cart.subTotal < 199) {
                    <div class="bg-green-50 border border-blinkit-border rounded-2xl px-4 py-3">
                      <p class="text-sm text-gray-700 mb-2">
                        Add <span class="font-bold text-blinkit-green">{{ fmt(199 - cart.subTotal) }}</span> more for FREE delivery!
                      </p>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div
                          class="bg-blinkit-success h-2 rounded-full transition-all"
                          [style.width.%]="(cart.subTotal / 199) * 100"
                        ></div>
                      </div>
                    </div>
                  } @else {
                    <div class="bg-green-50 border border-blinkit-success rounded-2xl px-4 py-3">
                      <p class="text-sm text-blinkit-success font-semibold">✓ You've unlocked free delivery!</p>
                    </div>
                  }

                  <!-- Cart items -->
                  <div class="bg-white rounded-2xl border border-blinkit-border divide-y divide-blinkit-border">
                    @for (item of cart.items; track item.id) {
                      <div class="flex items-start gap-4 p-4">
                        <img
                          [src]="item.variantImageUrl"
                          [alt]="item.productName"
                          loading="lazy"
                          class="w-16 h-16 object-contain flex-shrink-0 rounded-xl bg-gray-50"
                          (error)="onImgError($event)"
                        />
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-800">{{ item.productName }}</p>
                          <p class="text-xs text-blinkit-muted mt-0.5">{{ item.variantUnit }}</p>
                          <p class="text-sm font-bold text-blinkit-green mt-1">{{ fmt(item.unitPrice) }}</p>
                          <button
                            class="text-xs text-blinkit-muted hover:text-blinkit-error transition-colors mt-1"
                            (click)="saveForLater(item)"
                          >Save for later</button>
                        </div>
                        <div class="flex items-center gap-0.5 border-2 border-blinkit-green rounded-xl overflow-hidden flex-shrink-0">
                          <button
                            class="w-9 h-9 flex items-center justify-center text-blinkit-green hover:bg-green-50 font-bold text-lg"
                            (click)="decrement(item)"
                          >−</button>
                          <span class="w-7 text-center text-sm font-bold text-blinkit-green">{{ item.quantity }}</span>
                          <button
                            class="w-9 h-9 flex items-center justify-center text-blinkit-green hover:bg-green-50 font-bold text-lg"
                            (click)="increment(item)"
                          >+</button>
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- Coupon -->
                <div class="bg-white rounded-2xl border border-blinkit-border p-4">
                  <h3 class="text-sm font-bold text-gray-800 mb-3">Coupon Code</h3>
                  @if (appliedCoupon()) {
                    <div class="flex items-center justify-between bg-green-50 border border-blinkit-success rounded-xl px-4 py-3">
                      <div>
                        <span class="text-sm font-bold text-blinkit-success">{{ appliedCoupon()!.message }}</span>
                        <p class="text-xs text-gray-500 mt-0.5">{{ couponCode().toUpperCase() }} applied</p>
                      </div>
                      <button class="text-blinkit-muted hover:text-blinkit-error ml-4" (click)="removeCoupon()">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  } @else {
                    <div class="flex gap-2">
                      <input
                        type="text"
                        [(ngModel)]="couponCode"
                        placeholder="Enter coupon code"
                        class="flex-1 border border-blinkit-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blinkit-green uppercase"
                      />
                      <button
                        class="bg-blinkit-green text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                        [disabled]="!couponCode()"
                        (click)="applyCoupon(cart.subTotal)"
                      >Apply</button>
                    </div>
                    @if (couponError()) {
                      <p class="text-xs text-blinkit-error mt-2">{{ couponError() }}</p>
                    }
                    <div class="flex flex-wrap gap-2 mt-3">
                      @for (code of availableCoupons; track code) {
                        <button
                          class="text-xs border border-blinkit-green text-blinkit-green px-2.5 py-1 rounded-lg hover:bg-green-50 transition-colors font-medium"
                          (click)="couponCode.set(code)"
                        >{{ code }}</button>
                      }
                    </div>
                  }
                </div>

                <!-- Saved for later / Wishlist -->
                @if (wishlist().length > 0) {
                  <div class="bg-white rounded-2xl border border-blinkit-border p-4">
                    <h3 class="text-sm font-bold text-gray-800 mb-3">Saved for Later ({{ wishlist().length }})</h3>
                    <div class="divide-y divide-blinkit-border">
                      @for (item of wishlist(); track item.variantId) {
                        <div class="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                          <img
                            [src]="item.variantImageUrl"
                            [alt]="item.productName"
                            loading="lazy"
                            class="w-14 h-14 object-contain flex-shrink-0 rounded-xl bg-gray-50"
                            (error)="onImgError($event)"
                          />
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-800">{{ item.productName }}</p>
                            <p class="text-xs text-blinkit-muted mt-0.5">{{ item.variantUnit }}</p>
                            <p class="text-sm font-bold text-blinkit-green mt-1">{{ fmt(item.unitPrice) }}</p>
                          </div>
                          <div class="flex flex-col gap-1.5 flex-shrink-0">
                            <button
                              class="text-xs bg-blinkit-green text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-700 transition-colors"
                              (click)="moveToCart(item)"
                            >Move to cart</button>
                            <button
                              class="text-xs text-blinkit-muted hover:text-blinkit-error transition-colors text-center"
                              (click)="removeFromWishlist(item)"
                            >Remove</button>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Right column: price summary -->
              @if (cart.items.length > 0) {
                <div class="mt-6 lg:mt-0">
                  <div class="bg-white rounded-2xl border border-blinkit-border p-4 lg:sticky lg:top-20">
                    <h3 class="text-sm font-bold text-gray-800 mb-3">Price Details</h3>
                    <div class="space-y-2 text-sm">
                      <div class="flex justify-between text-gray-600">
                        <span>MRP ({{ cart.itemCount }} items)</span>
                        <span>{{ fmt(cart.subTotal) }}</span>
                      </div>
                      @if (appliedCoupon()) {
                        <div class="flex justify-between text-blinkit-success">
                          <span>Coupon discount</span>
                          <span>− {{ fmt(appliedCoupon()!.discountAmount) }}</span>
                        </div>
                      }
                      <div class="flex justify-between text-gray-600">
                        <span>Delivery fee</span>
                        @if (deliveryFee(cart.subTotal) === 0) {
                          <span class="text-blinkit-success font-semibold">FREE</span>
                        } @else {
                          <span>{{ fmt(deliveryFee(cart.subTotal)) }}</span>
                        }
                      </div>
                      <div class="flex justify-between font-bold text-gray-800 pt-2 border-t border-blinkit-border text-base">
                        <span>To Pay</span>
                        <span>{{ fmt(totalToPay(cart.subTotal)) }}</span>
                      </div>
                    </div>

                    <button
                      class="w-full bg-blinkit-green text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors mt-4"
                      (click)="proceedToCheckout()"
                    >Proceed to Checkout →</button>

                    <p class="text-[10px] text-blinkit-muted text-center mt-2">Safe and Secure Payments. 100% Authentic Products.</p>
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class CartPageComponent implements OnInit {
  readonly cartService = inject(CartService);
  private readonly authStore = inject(AuthStore);
  private readonly couponService = inject(CouponService);
  private readonly dialog = inject(MatDialog);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly cart$ = this.cartService.cart$;
  readonly fmt = formatPrice;

  readonly couponCode = signal('');
  readonly appliedCoupon = signal<ICouponValidation | null>(null);
  readonly couponError = signal('');
  readonly wishlist = signal<CartItemDto[]>([]);

  readonly availableCoupons = ['WELCOME50', 'BLINKIT10', 'BANK5', 'FREESHIP'];

  ngOnInit(): void {
    this.loadWishlist();
  }

  private loadWishlist(): void {
    const stored = localStorage.getItem('wishlist');
    this.wishlist.set(stored ? JSON.parse(stored) : []);
  }

  increment(item: CartItemDto): void {
    this.cartService.updateQty(item.id, item.quantity + 1).subscribe();
  }

  decrement(item: CartItemDto): void {
    this.cartService.updateQty(item.id, item.quantity - 1).subscribe();
  }

  saveForLater(item: CartItemDto): void {
    const list: CartItemDto[] = JSON.parse(localStorage.getItem('wishlist') ?? '[]');
    if (!list.some(w => w.variantId === item.variantId)) {
      list.push(item);
      localStorage.setItem('wishlist', JSON.stringify(list));
    }
    this.cartService.removeItem(item.id).subscribe(() => this.loadWishlist());
  }

  moveToCart(item: CartItemDto): void {
    this.http.post<unknown>('/api/cart/items', {
      productId: item.productId,
      variantId: item.variantId,
      quantity: 1,
    }).subscribe(() => {
      this.cartService.loadCart().subscribe();
      this.removeFromWishlist(item);
    });
  }

  removeFromWishlist(item: CartItemDto): void {
    const list: CartItemDto[] = JSON.parse(localStorage.getItem('wishlist') ?? '[]');
    const updated = list.filter(w => w.variantId !== item.variantId);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    this.wishlist.set(updated);
  }

  applyCoupon(subtotal: number): void {
    this.couponError.set('');
    this.couponService.validateCoupon(this.couponCode(), subtotal).subscribe(result => {
      if (result.isValid) {
        this.appliedCoupon.set(result);
        this.couponError.set('');
      } else {
        this.couponError.set(result.message);
      }
    });
  }

  removeCoupon(): void {
    this.appliedCoupon.set(null);
    this.couponCode.set('');
  }

  deliveryFee(subtotal: number): number {
    return this.cartService.deliveryFee(subtotal);
  }

  totalToPay(subtotal: number): number {
    const couponDiscount = this.appliedCoupon()?.discountAmount ?? 0;
    const delivery = this.deliveryFee(subtotal);
    return Math.max(0, subtotal - couponDiscount + delivery);
  }

  proceedToCheckout(): void {
    if (!this.authStore.isAuthenticated()) {
      this.dialog.open(LoginPromptDialogComponent, { panelClass: 'rounded-2xl', width: '380px' });
      return;
    }
    this.router.navigate(['/checkout']);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = getCategoryFallback('snacks');
  }
}
