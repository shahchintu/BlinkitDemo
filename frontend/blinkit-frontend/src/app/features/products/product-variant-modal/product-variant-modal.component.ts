import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CartStore } from '../../../core/stores/cart.store';
import { CartService } from '../../../core/services/cart.service';
import { ImageService } from '../../../core/services/image.service';
import { IProduct, IProductVariant } from '../../../core/models';
import { formatPrice, getCategoryFallback } from '../../../shared/utils';

@Component({
  selector: 'app-product-variant-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#E0E0E0]">
        <h3 class="font-bold text-base line-clamp-1">{{ product.name }}</h3>
        <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100" (click)="close()">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <!-- Variants list -->
      <div class="divide-y divide-[#E0E0E0] max-h-96 overflow-y-auto">
        @for (variant of product.variants; track variant.id) {
          <div class="flex items-center gap-3 px-4 py-3"
            [class.opacity-50]="variant.stockQty === 0">
            <!-- Image -->
            <div class="w-16 h-16 rounded-xl bg-gray-50 border border-[#E0E0E0] flex-shrink-0 overflow-hidden">
              <img
                [src]="variantImages()[variant.id] || variant.imageUrl || product.imageUrl"
                [alt]="variant.unit"
                class="w-full h-full object-contain p-1"
                loading="lazy"
                (error)="onImgError($event)"
              />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium">{{ variant.unit }}</div>
              <div class="flex items-center gap-2 mt-0.5">
                @if (variant.discountPrice) {
                  <span class="text-sm font-bold text-[#0C831F]">{{ fmt(variant.discountPrice) }}</span>
                  <span class="text-xs text-[#666666] line-through">{{ fmt(variant.price) }}</span>
                  <span class="text-[10px] bg-[#F8C200] text-black font-bold px-1 rounded">
                    {{ discount(variant.price, variant.discountPrice) }}% off
                  </span>
                } @else {
                  <span class="text-sm font-bold">{{ fmt(variant.price) }}</span>
                }
              </div>
              @if (variant.stockQty === 0) {
                <span class="text-xs text-[#F44336] font-medium">Out of Stock</span>
              }
            </div>

            <!-- ADD / Stepper -->
            <div class="flex-shrink-0">
              @if (variant.stockQty === 0) {
                <button class="border-2 border-gray-200 text-gray-400 rounded-xl px-4 py-2 text-sm font-bold cursor-not-allowed" disabled>
                  ADD
                </button>
              } @else if (cartStore.isVariantInCart(variant.id)) {
                <div class="flex items-center border-2 border-[#0C831F] rounded-xl overflow-hidden">
                  <button
                    class="w-9 h-9 flex items-center justify-center text-[#0C831F] hover:bg-green-50 font-bold"
                    (click)="decrement(variant)"
                  >−</button>
                  <span class="w-8 text-center text-sm font-bold text-[#0C831F]">
                    {{ cartStore.getVariantQty(variant.id) }}
                  </span>
                  <button
                    class="w-9 h-9 flex items-center justify-center text-[#0C831F] hover:bg-green-50 font-bold"
                    (click)="addItem(variant)"
                  >+</button>
                </div>
              } @else {
                <button
                  class="border-2 border-[#0C831F] text-[#0C831F] rounded-xl px-4 py-2 text-sm font-bold hover:bg-green-50 transition-colors"
                  (click)="addItem(variant)"
                >
                  ADD
                </button>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ProductVariantModalComponent implements OnInit {
  readonly product = inject<IProduct>(MAT_DIALOG_DATA);
  readonly cartStore = inject(CartStore);
  private readonly cartService = inject(CartService);
  private readonly dialogRef = inject(MatDialogRef<ProductVariantModalComponent>);
  private readonly imageService = inject(ImageService);

  readonly fmt = formatPrice;
  readonly variantImages = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.product.variants.forEach(variant => {
      this.imageService.getProductImage(
        this.product.name,
        this.product.categoryName,
        variant.id,
      ).subscribe(url => {
        if (url) this.variantImages.update(prev => ({ ...prev, [variant.id]: url }));
      });
    });
  }

  discount(price: number, discountPrice: number): number {
    return Math.round(((price - discountPrice) / price) * 100);
  }

  addItem(variant: IProductVariant): void {
    this.cartService.addItem(this.product, variant).subscribe();
  }

  decrement(variant: IProductVariant): void {
    const item = this.cartStore.cartItems().find(i => i.variantId === variant.id);
    if (item) {
      this.cartService.updateQty(item.id, item.quantity - 1).subscribe();
    }
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = getCategoryFallback('snacks');
  }

  close(): void {
    this.dialogRef.close();
  }
}
