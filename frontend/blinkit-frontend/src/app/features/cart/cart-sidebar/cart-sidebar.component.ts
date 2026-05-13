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
import { tap } from 'rxjs';
import { CartService } from '../../../core/services/cart.service';
import { CartStore } from '../../../core/stores/cart.store';
import { CouponService } from '../../../core/services/coupon.service';
import { ProductService } from '../../../core/services/product.service';
import { ICartItem, ICouponValidation, IProduct } from '../../../core/models';
import { formatPrice, getCategoryFallback } from '../../../shared/utils';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, RouterLink, FormsModule],
  template: `
    @if (cartService.isSidebarOpen$ | async) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/40 z-40"
        (click)="cartService.closeCart()"
      ></div>

      <!-- Panel -->
      <div class="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col">

        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-blinkit-border">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-blinkit-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <h2 class="font-bold text-gray-800">My Cart</h2>
            @if (cartStore.itemCount() > 0) {
              <span class="text-xs bg-blinkit-green text-white px-2 py-0.5 rounded-full font-bold">
                {{ cartStore.itemCount() }}
              </span>
            }
          </div>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            (click)="cartService.closeCart()"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Scrollable body -->
        <div class="flex-1 overflow-y-auto">

          @if (cartStore.cartItems().length === 0) {
            <!-- Empty state -->
            <div class="flex flex-col items-center justify-center h-64 gap-4 px-6">
              <svg class="w-16 h-16 text-blinkit-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <p class="text-blinkit-muted text-center">Your cart is empty</p>
              <button
                class="bg-blinkit-green text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
                (click)="cartService.closeCart(); router.navigate(['/'])"
              >Start Shopping</button>
            </div>
          } @else {
            <!-- Delivery nudge -->
            @if (cartStore.total() < 199 && cartStore.total() > 0) {
              <div class="px-4 py-3 bg-green-50 border-b border-blinkit-border">
                <p class="text-xs text-gray-700 mb-1.5">
                  Add <span class="font-bold text-blinkit-green">{{ fmt(199 - cartStore.total()) }}</span> more for FREE delivery!
                </p>
                <div class="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    class="bg-blinkit-success h-1.5 rounded-full transition-all"
                    [style.width.%]="(cartStore.total() / 199) * 100"
                  ></div>
                </div>
              </div>
            } @else if (cartStore.total() >= 199) {
              <div class="px-4 py-2 bg-green-50 border-b border-blinkit-border">
                <p class="text-xs text-blinkit-success font-semibold">✓ You've unlocked free delivery!</p>
              </div>
            }

            <!-- Cart items -->
            <div class="divide-y divide-blinkit-border">
              @for (item of cartStore.cartItems(); track item.id) {
                <div class="flex items-start gap-3 px-4 py-3">
                  <img
                    [src]="item.variant.imageUrl"
                    [alt]="item.product.name"
                    loading="lazy"
                    class="w-14 h-14 object-contain flex-shrink-0 rounded-lg bg-gray-50"
                    (error)="onImgError($event)"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 line-clamp-1">{{ item.product.name }}</p>
                    <p class="text-xs text-blinkit-muted mt-0.5">{{ item.variant.unit }}</p>
                    <p class="text-sm font-bold text-blinkit-green mt-1">{{ fmt(item.unitPrice) }}</p>
                  </div>
                  <div class="flex items-center gap-0.5 border-2 border-blinkit-green rounded-xl overflow-hidden flex-shrink-0">
                    <button
                      class="w-8 h-8 flex items-center justify-center text-blinkit-green hover:bg-green-50 font-bold text-lg"
                      (click)="decrement(item)"
                    >−</button>
                    <span class="w-6 text-center text-sm font-bold text-blinkit-green">{{ item.quantity }}</span>
                    <button
                      class="w-8 h-8 flex items-center justify-center text-blinkit-green hover:bg-green-50 font-bold text-lg"
                      (click)="increment(item)"
                    >+</button>
                  </div>
                </div>
                <div class="px-4 pb-2">
                  <button
                    class="text-xs text-blinkit-muted hover:text-blinkit-error transition-colors"
                    (click)="saveForLater(item)"
                  >Save for later</button>
                </div>
              }
            </div>

            <!-- Coupon -->
            <div class="px-4 py-3 border-t border-blinkit-border">
              @if (appliedCoupon()) {
                <div class="flex items-center justify-between bg-green-50 border border-blinkit-success rounded-xl px-3 py-2">
                  <div>
                    <span class="text-xs font-bold text-blinkit-success">{{ appliedCoupon()!.message }}</span>
                    <p class="text-[10px] text-gray-500">{{ couponCode().toUpperCase() }} applied</p>
                  </div>
                  <button
                    class="text-blinkit-muted hover:text-blinkit-error ml-2"
                    (click)="removeCoupon()"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              } @else {
                <div class="flex gap-2">
                  <input
                    type="text"
                    [(ngModel)]="couponCode"
                    placeholder="Coupon code"
                    class="flex-1 border border-blinkit-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blinkit-green uppercase"
                  />
                  <button
                    class="bg-blinkit-green text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
                    [disabled]="!couponCode()"
                    (click)="applyCoupon(cartStore.total())"
                  >Apply</button>
                </div>
                @if (couponError()) {
                  <p class="text-xs text-blinkit-error mt-1">{{ couponError() }}</p>
                }
              }
            </div>

            <!-- Customers also bought -->
            @if (relatedProducts().length > 0) {
              <div class="px-4 py-3 border-t border-blinkit-border">
                <h3 class="text-sm font-bold text-gray-800 mb-3">You might also like</h3>
                <div class="flex gap-3 overflow-x-auto pb-2">
                  @for (rp of relatedProducts(); track rp.id) {
                    <a
                      [routerLink]="['/product', rp.id]"
                      (click)="cartService.closeCart()"
                      class="flex-shrink-0 w-28 bg-gray-50 rounded-xl p-2 hover:shadow-md transition-shadow"
                    >
                      <img
                        [src]="rp.imageUrl"
                        [alt]="rp.name"
                        loading="lazy"
                        class="w-full h-16 object-contain mb-1"
                        (error)="onImgError($event)"
                      />
                      <p class="text-[10px] text-gray-700 line-clamp-2 leading-tight">{{ rp.name }}</p>
                      <p class="text-xs font-bold text-blinkit-green mt-0.5">
                        {{ fmt(rp.discountPrice ?? rp.price) }}
                      </p>
                    </a>
                  }
                </div>
              </div>
            }

            <!-- Price summary -->
            <div class="px-4 py-3 border-t border-blinkit-border bg-gray-50">
              <h3 class="text-sm font-bold text-gray-800 mb-2">Price Details</h3>
              <div class="space-y-1.5 text-sm">
                <div class="flex justify-between text-gray-600">
                  <span>MRP</span>
                  <span>{{ fmt(cartStore.total()) }}</span>
                </div>
                @if (appliedCoupon()) {
                  <div class="flex justify-between text-blinkit-success">
                    <span>Coupon discount</span>
                    <span>− {{ fmt(appliedCoupon()!.discountAmount) }}</span>
                  </div>
                }
                <div class="flex justify-between text-gray-600">
                  <span>Delivery fee</span>
                  @if (deliveryFee(cartStore.total()) === 0) {
                    <span class="text-blinkit-success font-semibold">FREE</span>
                  } @else {
                    <span>{{ fmt(deliveryFee(cartStore.total())) }}</span>
                  }
                </div>
                <div class="flex justify-between font-bold text-gray-800 pt-1.5 border-t border-blinkit-border">
                  <span>To Pay</span>
                  <span>{{ fmt(totalToPay(cartStore.total())) }}</span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Footer CTA -->
        @if (cartStore.cartItems().length > 0) {
          <div class="p-4 border-t border-blinkit-border bg-white">
            <button
              class="w-full bg-blinkit-green text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
              (click)="proceedToCheckout()"
            >Proceed to Checkout →</button>
          </div>
        }
      </div>
    }
  `,
})
export class CartSidebarComponent implements OnInit {
  readonly cartService = inject(CartService);
  readonly cartStore = inject(CartStore);
  readonly router = inject(Router);
  private readonly couponService = inject(CouponService);
  private readonly productService = inject(ProductService);

  readonly fmt = formatPrice;

  readonly couponCode = signal('');
  readonly appliedCoupon = signal<ICouponValidation | null>(null);
  readonly couponError = signal('');
  readonly relatedProducts = signal<IProduct[]>([]);

  ngOnInit(): void {
    this.cartService.cart$.pipe(
      tap(() => {
        const items = this.cartStore.cartItems();
        if (items.length > 0) {
          this.productService
            .getRelatedProducts(items[0].productId, 4)
            .subscribe(products => this.relatedProducts.set(products));
        } else {
          this.relatedProducts.set([]);
        }
      }),
    ).subscribe();
  }

  increment(item: ICartItem): void {
    this.cartService.updateQty(item.id, item.quantity + 1).subscribe();
  }

  decrement(item: ICartItem): void {
    this.cartService.updateQty(item.id, item.quantity - 1).subscribe();
  }

  saveForLater(item: ICartItem): void {
    const wishlist: object[] = JSON.parse(localStorage.getItem('wishlist') ?? '[]');
    if (!wishlist.some((w: { variantId?: string }) => w.variantId === item.variantId)) {
      wishlist.push({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        variantId: item.variantId,
        variantUnit: item.variant.unit,
        variantImageUrl: item.variant.imageUrl,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
    this.cartService.removeItem(item.id).subscribe();
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
    this.cartService.closeCart();
    this.router.navigate(['/checkout']);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = getCategoryFallback('snacks');
  }
}
