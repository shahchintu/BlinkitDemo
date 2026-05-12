import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CartStore } from '../../../core/stores/cart.store';
import { CartService } from '../../../core/services/cart.service';
import { IProduct } from '../../../core/models';
import { formatPrice, getCategoryFallback } from '../../../shared/utils';
import { ProductVariantModalComponent } from '../product-variant-modal/product-variant-modal.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">

      <!-- Image area -->
      <a [routerLink]="['/product', product.id]" class="relative block h-40 bg-gray-50 p-2">
        <!-- ETA badge -->
        <div class="absolute top-2 left-2 z-10 flex items-center gap-0.5 bg-[#0C831F] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
          🕐 8 MINS
        </div>

        <img
          [src]="product.imageUrl"
          [alt]="product.name"
          loading="lazy"
          class="w-full h-full object-contain"
          (error)="onImgError($event)"
        />

        @if (product.stockQty === 0) {
          <div class="absolute inset-0 bg-white/70 flex items-center justify-center rounded-t-2xl">
            <span class="text-xs font-bold text-[#666666] bg-white px-2 py-1 rounded-lg border">Out of Stock</span>
          </div>
        }
      </a>

      <!-- Body -->
      <div class="p-3 flex flex-col flex-1">
        <div class="text-xs text-[#666666] mb-0.5">{{ product.unit }}</div>
        <a [routerLink]="['/product', product.id]"
          class="text-sm font-medium text-gray-800 line-clamp-2 mb-2 flex-1 hover:text-[#0C831F] transition-colors">
          {{ product.name }}
        </a>

        <!-- Price row -->
        <div class="flex items-center gap-1.5 mb-2 flex-wrap">
          @if (product.discountPrice) {
            <span class="text-sm font-bold text-[#0C831F]">{{ fmt(product.discountPrice) }}</span>
            <span class="text-xs text-[#666666] line-through">{{ fmt(product.price) }}</span>
            <span class="text-[9px] bg-[#F8C200] text-black font-bold px-1 py-0.5 rounded">
              {{ discount() }}% off
            </span>
          } @else {
            <span class="text-sm font-bold">{{ fmt(product.price) }}</span>
          }
        </div>

        <!-- ADD button -->
        <div class="mt-auto">
          @if (product.stockQty === 0) {
            <button disabled
              class="w-full border-2 border-gray-200 text-gray-400 rounded-xl py-2 text-sm font-bold cursor-not-allowed">
              Out of Stock
            </button>
          } @else if (product.variants.length > 1 && !anyVariantInCart()) {
            <!-- Multi-variant not in cart: split button -->
            <div class="flex border-2 border-[#0C831F] rounded-xl overflow-hidden">
              <button
                class="flex-1 py-2 text-sm font-bold text-[#0C831F] hover:bg-green-50 transition-colors"
                (click)="openVariantModal()"
              >ADD</button>
              <div class="w-px bg-[#0C831F]"></div>
              <button
                class="px-2 py-2 text-[11px] font-bold text-white bg-[#0C831F] hover:bg-green-700 transition-colors"
                (click)="openVariantModal()"
              >{{ product.variants.length }} options</button>
            </div>
          } @else if (product.variants.length > 1 && anyVariantInCart()) {
            <!-- Multi-variant in cart: stepper + re-open modal -->
            <div class="flex items-center border-2 border-[#0C831F] rounded-xl overflow-hidden">
              <button
                class="w-11 h-9 flex items-center justify-center text-[#0C831F] hover:bg-green-50 font-bold"
                (click)="openVariantModal()"
              >−</button>
              <span class="flex-1 text-center text-sm font-bold text-[#0C831F]">
                {{ totalVariantQty() }}
              </span>
              <button
                class="w-11 h-9 flex items-center justify-center text-[#0C831F] hover:bg-green-50 font-bold"
                (click)="openVariantModal()"
              >+</button>
            </div>
          } @else if (!cartStore.isVariantInCart(product.variants[0]?.id ?? '')) {
            <!-- Single variant not in cart -->
            <button
              class="w-full bg-[#0C831F] text-white rounded-xl py-2 text-sm font-bold hover:bg-green-700 transition-colors"
              (click)="addSingle()"
            >ADD</button>
          } @else {
            <!-- Single variant stepper -->
            <div class="flex items-center border-2 border-[#0C831F] rounded-xl overflow-hidden">
              <button
                class="w-11 h-9 flex items-center justify-center text-[#0C831F] hover:bg-green-50 font-bold"
                (click)="decrement()"
              >−</button>
              <span class="flex-1 text-center text-sm font-bold text-[#0C831F]">
                {{ cartStore.getVariantQty(product.variants[0]?.id ?? '') }}
              </span>
              <button
                class="w-11 h-9 flex items-center justify-center text-[#0C831F] hover:bg-green-50 font-bold"
                (click)="addSingle()"
              >+</button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: IProduct;

  readonly cartStore = inject(CartStore);
  private readonly cartService = inject(CartService);
  private readonly dialog = inject(MatDialog);

  readonly fmt = formatPrice;

  discount(): number {
    if (!this.product.discountPrice) return 0;
    return Math.round(((this.product.price - this.product.discountPrice) / this.product.price) * 100);
  }

  anyVariantInCart(): boolean {
    return this.product.variants.some(v => this.cartStore.isVariantInCart(v.id));
  }

  totalVariantQty(): number {
    return this.product.variants.reduce((sum, v) => sum + this.cartStore.getVariantQty(v.id), 0);
  }

  openVariantModal(): void {
    this.dialog.open(ProductVariantModalComponent, {
      data: this.product,
      panelClass: ['rounded-t-2xl', 'w-full', 'max-w-sm'],
      position: { bottom: '0' },
    });
  }

  addSingle(): void {
    if (this.product.variants[0]) {
      this.cartService.addItem(this.product, this.product.variants[0]).subscribe();
    }
  }

  decrement(): void {
    const variant = this.product.variants[0];
    if (!variant) return;
    const storeItem = this.cartStore.cartItems().find(i => i.variantId === variant.id);
    if (storeItem) this.cartService.updateQty(storeItem.id, storeItem.quantity - 1).subscribe();
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = getCategoryFallback(this.product.categoryName);
  }
}
