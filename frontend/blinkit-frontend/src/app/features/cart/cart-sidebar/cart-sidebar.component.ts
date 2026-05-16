import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { tap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CartService } from '../../../core/services/cart.service';
import { CartStore } from '../../../core/stores/cart.store';
import { AuthStore } from '../../../core/stores/auth.store';
import { CouponService } from '../../../core/services/coupon.service';
import { ImageService } from '../../../core/services/image.service';
import { ProductService } from '../../../core/services/product.service';
import { LoginPromptDialogComponent } from '../../../shared/login-prompt-dialog/login-prompt-dialog.component';
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
      <div class="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.12)] z-50 flex flex-col">

        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-4 border-b border-[#E0E0E0]">
          <div class="flex items-center gap-2">
            <h2 class="text-[18px] font-bold text-[#1A1A1A]">My Cart</h2>
            @if (cartStore.itemCount() > 0) {
              <span class="bg-[#0C831F] text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
                {{ cartStore.itemCount() }}
              </span>
            }
          </div>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F8F8F8] transition-colors"
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
              <svg class="w-16 h-16 text-[#E0E0E0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <div class="text-center">
                <p class="text-[18px] font-bold text-[#1A1A1A]">Your cart is empty</p>
                <p class="text-[14px] text-[#666666] mt-1">Add items to get started</p>
              </div>
              <button
                class="bg-[#0C831F] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#0a6b19] transition-colors"
                (click)="cartService.closeCart(); router.navigate(['/'])"
              >Start Shopping</button>
            </div>
          } @else {
            <!-- Free delivery progress -->
            <div class="mx-4 my-3 bg-[#F0FFF4] rounded-[12px] p-3">
              @if (cartStore.total() < 199) {
                <p class="text-[13px] font-semibold text-[#0C831F] mb-2">
                  Add <span class="font-bold">{{ fmt(199 - cartStore.total()) }}</span> more for FREE delivery!
                </p>
                <div class="bg-[#E8F5E9] rounded-full h-[4px]">
                  <div
                    class="bg-[#0C831F] h-[4px] rounded-full transition-all duration-500"
                    [style.width.%]="(cartStore.total() / 199) * 100"
                  ></div>
                </div>
              } @else {
                <p class="text-[13px] font-semibold text-[#0C831F]">✓ You've unlocked free delivery!</p>
              }
            </div>

            <!-- Cart items -->
            <div class="divide-y divide-[#F2F2F2]">
              @for (item of cartStore.cartItems(); track item.id) {
                <div class="flex items-start gap-3 px-4 py-3">
                  <img
                    [src]="productImages()[item.productId] || item.variant.imageUrl"
                    [alt]="item.product.name"
                    loading="lazy"
                    class="w-16 h-16 object-contain flex-shrink-0 rounded-[8px] bg-[#F8F8F8] p-1"
                    (error)="onImgError($event, item.product.categoryName)"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-[14px] font-semibold text-[#1A1A1A] line-clamp-1">{{ item.product.name }}</p>
                    <p class="text-[12px] text-[#666666] mt-0.5">{{ item.variant.unit }}</p>
                    <p class="text-[14px] font-bold text-[#1A1A1A] mt-1">{{ fmt(item.unitPrice * item.quantity) }}</p>
                  </div>
                  <!-- Stepper -->
                  <div class="flex items-center bg-[#0C831F] rounded-[8px] h-[28px] flex-shrink-0">
                    <button
                      class="w-8 h-[28px] flex items-center justify-center text-white font-bold text-base hover:bg-[#0a6b19] transition-colors rounded-l-[8px]"
                      (click)="decrement(item)"
                    >−</button>
                    <span class="w-6 text-center text-[13px] font-bold text-white">{{ item.quantity }}</span>
                    <button
                      class="w-8 h-[28px] flex items-center justify-center text-white font-bold text-base hover:bg-[#0a6b19] transition-colors rounded-r-[8px]"
                      (click)="increment(item)"
                    >+</button>
                  </div>
                </div>
                <div class="px-4 pb-2">
                  <button
                    class="text-xs text-[#666666] hover:text-[#F44336] transition-colors"
                    (click)="saveForLater(item)"
                  >Save for later</button>
                </div>
              }
            </div>

            <!-- Coupon -->
            <div class="px-4 py-3 border-t border-[#E0E0E0]">
              @if (appliedCoupon()) {
                <div class="flex items-center justify-between bg-green-50 border border-[#4CAF50] rounded-xl px-3 py-2">
                  <div>
                    <span class="text-xs font-bold text-[#4CAF50]">{{ appliedCoupon()!.message }}</span>
                    <p class="text-[10px] text-gray-500">{{ couponCode().toUpperCase() }} applied</p>
                  </div>
                  <button
                    class="text-[#666666] hover:text-[#F44336] ml-2"
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
                    class="flex-1 border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F] uppercase"
                  />
                  <button
                    class="bg-[#0C831F] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#0a6b19] transition-colors disabled:opacity-50"
                    [disabled]="!couponCode()"
                    (click)="applyCoupon(cartStore.total())"
                  >Apply</button>
                </div>
                @if (couponError()) {
                  <p class="text-xs text-[#F44336] mt-1">{{ couponError() }}</p>
                }
              }
            </div>

            <!-- Customers also bought -->
            @if (relatedProducts().length > 0) {
              <div class="px-4 py-3 border-t border-[#E0E0E0]">
                <h3 class="text-sm font-bold text-[#1A1A1A] mb-3">You might also like</h3>
                <div class="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  @for (rp of relatedProducts(); track rp.id) {
                    <a
                      [routerLink]="['/product', rp.id]"
                      (click)="cartService.closeCart()"
                      class="flex-shrink-0 w-28 bg-[#F8F8F8] rounded-xl p-2 hover:shadow-md transition-shadow"
                    >
                      <img
                        [src]="productImages()[rp.id] || rp.imageUrl"
                        [alt]="rp.name"
                        loading="lazy"
                        class="w-full h-16 object-contain mb-1"
                        (error)="onImgError($event, rp.categoryName)"
                      />
                      <p class="text-[10px] text-gray-700 line-clamp-2 leading-tight">{{ rp.name }}</p>
                      <p class="text-xs font-bold text-[#0C831F] mt-0.5">
                        {{ fmt(rp.discountPrice ?? rp.price) }}
                      </p>
                    </a>
                  }
                </div>
              </div>
            }

            <!-- Price summary -->
            <div class="px-4 py-3 border-t border-[#E0E0E0]">
              <div class="space-y-1">
                <div class="flex justify-between text-[14px] py-1 text-[#666666]">
                  <span>MRP</span>
                  <span>{{ fmt(cartStore.total()) }}</span>
                </div>
                @if (appliedCoupon()) {
                  <div class="flex justify-between text-[14px] py-1 text-[#0C831F]">
                    <span>Coupon discount</span>
                    <span>− {{ fmt(appliedCoupon()!.discountAmount) }}</span>
                  </div>
                }
                <div class="flex justify-between text-[14px] py-1 text-[#666666]">
                  <span>Delivery fee</span>
                  @if (deliveryFee(cartStore.total()) === 0) {
                    <span class="text-[#0C831F] font-semibold">FREE</span>
                  } @else {
                    <span>{{ fmt(deliveryFee(cartStore.total())) }}</span>
                  }
                </div>
                <div class="border-t border-dashed border-[#E0E0E0] my-2"></div>
                <div class="flex justify-between font-bold text-[16px] py-1">
                  <span>To Pay</span>
                  <span>{{ fmt(totalToPay(cartStore.total())) }}</span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Footer CTA -->
        @if (cartStore.cartItems().length > 0) {
          <div class="m-4">
            <button
              class="w-full bg-[#0C831F] text-white rounded-[12px] py-4 font-bold hover:bg-[#0a6b19] transition-colors flex items-center justify-between px-4 text-[16px]"
              (click)="proceedToCheckout()"
            >
              <span>Proceed to Checkout</span>
              <span>{{ fmt(totalToPay(cartStore.total())) }} →</span>
            </button>
          </div>
        }
      </div>
    }
  `,
})
export class CartSidebarComponent implements OnInit {
  readonly cartService = inject(CartService);
  readonly cartStore = inject(CartStore);
  private readonly authStore = inject(AuthStore);
  readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly couponService = inject(CouponService);
  private readonly imageService = inject(ImageService);
  private readonly productService = inject(ProductService);

  readonly fmt = formatPrice;

  readonly couponCode = signal('');
  readonly appliedCoupon = signal<ICouponValidation | null>(null);
  readonly couponError = signal('');
  readonly relatedProducts = signal<IProduct[]>([]);
  readonly productImages = signal<Record<string, string>>({});

  constructor() {
    effect(() => {
      // Cart items
      this.cartStore.cartItems().forEach(item => {
        this.fetchImageIfNeeded(item.product.name, item.product.categoryName, item.productId);
      });
      // Related products
      this.relatedProducts().forEach(rp => {
        this.fetchImageIfNeeded(rp.name, rp.categoryName, rp.id);
      });
    });
  }

  private fetchImageIfNeeded(name: string, category: string, id: string) {
    if (!this.productImages()[id]) {
      this.imageService.getProductImage(name, category, id).subscribe(url => {
        if (url) {
          this.productImages.update(imgs => ({ ...imgs, [id]: url }));
        }
      });
    }
  }

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
    if (!this.authStore.isAuthenticated()) {
      this.dialog.open(LoginPromptDialogComponent, { panelClass: 'rounded-2xl', width: '380px' });
      return;
    }
    this.router.navigate(['/checkout']);
  }

  onImgError(event: Event, category: string): void {
    (event.target as HTMLImageElement).src = getCategoryFallback(category);
  }
}
