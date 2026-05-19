import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
import { ScrollableRowComponent } from '../../../shared/components/scrollable-row/scrollable-row.component';
import { ProductCardComponent } from '../../products/product-card/product-card.component';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, FormsModule, ScrollableRowComponent, ProductCardComponent],
  template: `
    @if (cartService.isSidebarOpen$ | async) {
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/40 z-40 transition-opacity"
           (click)="cartService.closeCart()">
      </div>

      <!-- Sidebar panel -->
      <div class="fixed top-0 right-0 h-full bg-white z-50 flex flex-col
                  shadow-sidebar w-full sm:w-[400px]">

        <!-- Header -->
        <div class="flex items-center justify-between
                    px-5 py-4 border-b border-[#F5F5F5]">
          <div class="flex items-center gap-2">
            <span class="text-[18px] font-bold text-[#1A1A1A]">My Cart</span>
            @if (cartStore.itemCount() > 0) {
              <span class="bg-[#0C831F] text-white text-[12px]
                           font-bold px-2 py-0.5 rounded-full">
                {{ cartStore.itemCount() }}
              </span>
            }
          </div>
          <button (click)="cartService.closeCart()"
            class="w-8 h-8 rounded-full hover:bg-[#F8F8F8]
                   flex items-center justify-center transition">
            <span class="material-icons text-[20px] text-[#666]">close</span>
          </button>
        </div>

        <!-- Scrollable body -->
        <div class="flex-1 overflow-y-auto">

          @if (cartStore.cartItems().length === 0) {
            <!-- Empty state -->
            <div class="flex flex-col items-center justify-center
                        h-full gap-4 px-8">
              <span class="material-icons text-[64px] text-[#E0E0E0]">
                shopping_cart
              </span>
              <p class="text-[16px] font-bold text-[#1A1A1A]">Your cart is empty</p>
              <p class="text-[13px] text-[#666] text-center">Add items to get started</p>
              <button (click)="cartService.closeCart(); router.navigate(['/'])"
                class="bg-[#0C831F] text-white rounded-[10px]
                       px-6 py-2.5 text-[14px] font-semibold
                       hover:bg-[#0a6b19] transition btn-press">
                Start Shopping
              </button>
            </div>
          } @else {

            <!-- Free delivery progress -->
            @if (cartStore.total() < 199) {
              <div class="mx-4 my-3 bg-[#F0FFF4] rounded-[12px] p-3">
                <div class="bg-[#C8E6C9] rounded-full h-[4px] mb-2">
                  <div class="bg-[#0C831F] h-full rounded-full transition-all duration-500"
                       [style.width.%]="(cartStore.total() / 199) * 100">
                  </div>
                </div>
                <p class="text-[13px] font-semibold text-[#0C831F]">
                  Add <span class="font-bold">₹{{ (199 - cartStore.total()).toFixed(0) }}</span>
                  more for FREE delivery!
                </p>
              </div>
            } @else {
              <div class="mx-4 my-3 bg-[#F0FFF4] rounded-[12px]
                          p-3 flex items-center gap-2">
                <span class="material-icons text-[#0C831F] text-[20px]">check_circle</span>
                <p class="text-[13px] font-semibold text-[#0C831F]">
                  🎉 You've unlocked FREE delivery!
                </p>
              </div>
            }

            <!-- Cart items -->
            <div class="divide-y divide-[#F8F8F8]">
              @for (item of cartStore.cartItems(); track item.id) {
                <div class="flex items-start gap-3 px-4 py-3">

                  <!-- Product image -->
                  <div class="w-[64px] h-[64px] flex-shrink-0
                              bg-[#F8F8F8] rounded-[10px]
                              flex items-center justify-center overflow-hidden">
                    <img [src]="productImages()[item.productId] || item.variant.imageUrl"
                         [alt]="item.product.name"
                         loading="lazy"
                         class="w-full h-full object-contain p-1"
                         (error)="onImgError($event, item.product.categoryName)">
                  </div>

                  <!-- Product info -->
                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-semibold text-[#1A1A1A]
                              leading-snug line-clamp-2">
                      {{ item.product.name }}
                    </p>
                    <p class="text-[11px] text-[#666] mt-0.5">{{ item.variant.unit }}</p>
                    <p class="text-[13px] font-bold text-[#1A1A1A] mt-1">
                      ₹{{ (item.unitPrice * item.quantity).toFixed(0) }}
                    </p>
                    <button (click)="saveForLater(item)"
                      class="text-[11px] text-[#666] hover:text-[#F44336] transition mt-1">
                      Save for later
                    </button>
                  </div>

                  <!-- Stepper -->
                  <div class="flex items-center bg-[#0C831F]
                              rounded-[8px] overflow-hidden flex-shrink-0">
                    <button (click)="decrement(item)"
                      class="w-8 h-[32px] text-white text-[18px] font-light
                             hover:bg-[#0a6b19] transition
                             flex items-center justify-center">
                      −
                    </button>
                    <span class="text-white text-[13px] font-bold
                                 min-w-[24px] text-center">
                      {{ item.quantity }}
                    </span>
                    <button (click)="increment(item)"
                      class="w-8 h-[32px] text-white text-[18px] font-light
                             hover:bg-[#0a6b19] transition
                             flex items-center justify-center">
                      +
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Coupon -->
            <div class="px-4 py-3 border-t border-[#F0F0F0]">
              @if (appliedCoupon()) {
                <div class="flex items-center justify-between
                            bg-green-50 border border-[#4CAF50]
                            rounded-[12px] px-3 py-2">
                  <div>
                    <span class="text-[12px] font-bold text-[#4CAF50]">
                      {{ appliedCoupon()!.message }}
                    </span>
                    <p class="text-[10px] text-[#666]">
                      {{ couponCode().toUpperCase() }} applied
                    </p>
                  </div>
                  <button (click)="removeCoupon()"
                    class="text-[#666] hover:text-[#F44336] ml-2">
                    <span class="material-icons text-[18px]">close</span>
                  </button>
                </div>
              } @else {
                <div class="flex gap-2">
                  <input type="text"
                    [(ngModel)]="couponCode"
                    placeholder="Coupon code"
                    class="flex-1 border border-[#E0E0E0] rounded-[10px]
                           px-3 py-2 text-[13px] uppercase
                           focus:outline-none focus:border-[#0C831F]">
                  <button (click)="applyCoupon(cartStore.total())"
                    [disabled]="!couponCode()"
                    class="bg-[#0C831F] text-white px-4 py-2
                           rounded-[10px] text-[13px] font-bold
                           hover:bg-[#0a6b19] transition disabled:opacity-50">
                    Apply
                  </button>
                </div>
                @if (couponError()) {
                  <p class="text-[11px] text-[#F44336] mt-1">{{ couponError() }}</p>
                }
              }
            </div>

            <!-- Customers also bought -->
            @if (relatedProducts().length > 0) {
              <div class="py-3 border-t border-[#F0F0F0]">
                <h3 class="text-[13px] font-bold text-[#1A1A1A] mb-3 px-4">
                  You might also like
                </h3>
                <app-scrollable-row [scrollAmount]="300">
                  @for (rp of relatedProducts(); track rp.id) {
                    <div class="w-[140px] flex-shrink-0"
                         (click)="cartService.closeCart()">
                      <app-product-card [product]="rp" />
                    </div>
                  }
                </app-scrollable-row>
              </div>
            }

            <!-- Price summary -->
            <div class="px-4 py-3 border-t border-[#F0F0F0]">
              <div class="space-y-2">
                <div class="flex justify-between text-[13px]">
                  <span class="text-[#666]">
                    MRP ({{ cartStore.itemCount() }} items)
                  </span>
                  <span class="text-[#1A1A1A] font-medium">
                    {{ fmt(cartStore.total()) }}
                  </span>
                </div>
                @if (appliedCoupon()) {
                  <div class="flex justify-between text-[13px] text-[#0C831F]">
                    <span>Coupon discount</span>
                    <span>− {{ fmt(appliedCoupon()!.discountAmount) }}</span>
                  </div>
                }
                <div class="flex justify-between text-[13px]">
                  <span class="text-[#666]">Delivery fee</span>
                  @if (deliveryFee(cartStore.total()) === 0) {
                    <span class="text-[#0C831F] font-semibold">FREE</span>
                  } @else {
                    <span class="text-[#1A1A1A]">
                      {{ fmt(deliveryFee(cartStore.total())) }}
                    </span>
                  }
                </div>
                <div class="border-t border-dashed border-[#E0E0E0] pt-2
                            flex justify-between">
                  <span class="text-[15px] font-bold text-[#1A1A1A]">To Pay</span>
                  <span class="text-[15px] font-bold text-[#1A1A1A]">
                    {{ fmt(totalToPay(cartStore.total())) }}
                  </span>
                </div>
              </div>
            </div>

          }
        </div>

        <!-- Checkout CTA -->
        @if (cartStore.cartItems().length > 0) {
          <div class="border-t border-[#F5F5F5] p-4">
            <button (click)="proceedToCheckout()"
              class="w-full bg-[#0C831F] text-white rounded-[12px]
                     h-[52px] flex items-center justify-between px-5
                     hover:bg-[#0a6b19] transition btn-press">
              <span class="text-[15px] font-bold">Proceed to Checkout</span>
              <span class="text-[15px] font-bold">
                {{ fmt(totalToPay(cartStore.total())) }} →
              </span>
            </button>
          </div>
        }

      </div>
    }
  `,
})
export class CartSidebarComponent {
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
      this.cartStore.cartItems().forEach(item => {
        this.fetchImageIfNeeded(item.product.name, item.product.categoryName, item.productId);
      });
      this.relatedProducts().forEach(rp => {
        this.fetchImageIfNeeded(rp.name, rp.categoryName, rp.id);
      });
    });

    effect((onCleanup) => {
      const items = this.cartStore.cartItems();
      if (items.length > 0) {
        const sub = this.productService
          .getRelatedProducts(items[0].productId, 4)
          .subscribe(products => this.relatedProducts.set(products));
        onCleanup(() => sub.unsubscribe());
      } else {
        this.relatedProducts.set([]);
      }
    });
  }

  private fetchImageIfNeeded(name: string, category: string, id: string): void {
    if (!this.productImages()[id]) {
      this.imageService.getProductImage(name, category, id).subscribe(url => {
        if (url) this.productImages.update(imgs => ({ ...imgs, [id]: url }));
      });
    }
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
