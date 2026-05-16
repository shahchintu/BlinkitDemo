import { ChangeDetectionStrategy, Component, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CartStore } from '../../../core/stores/cart.store';
import { CartService } from '../../../core/services/cart.service';
import { ImageService } from '../../../core/services/image.service';
import { IProduct } from '../../../core/models';
import { formatPrice, onImgError } from '../../../shared/utils';
import { ProductVariantModalComponent } from '../product-variant-modal/product-variant-modal.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="bg-white rounded-[16px] border border-[#E0E0E0] overflow-hidden flex flex-col h-full hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow duration-200 cursor-pointer">

      <!-- Image area -->
      <a [routerLink]="['/product', product.id]" class="relative block h-40 bg-[#F8F8F8] rounded-t-[16px]">
        <!-- ETA badge -->
        <div class="absolute top-2 left-2 z-10 flex items-center gap-0.5 bg-[#0C831F] text-white text-[10px] font-bold px-2 py-1 rounded-[6px]">
          🕐 8 MINS
        </div>

        <!-- Discount badge -->
        @if (product.discountPrice) {
          <div class="absolute top-2 right-2 z-10 bg-[#F8C200] text-[#1A1A1A] text-[10px] font-bold px-2 py-1 rounded-[6px]">
            {{ discount() }}% off
          </div>
        }

        <img
          [src]="realImageUrl()"
          [alt]="product.name"
          loading="lazy"
          class="w-full h-full object-contain p-3"
          (error)="onImgError($event, product.categoryName)"
        />

        @if (product.stockQty === 0) {
          <div class="absolute inset-0 bg-white/70 flex items-center justify-center rounded-t-[16px]">
            <span class="text-xs font-bold text-[#666666] bg-white px-2 py-1 rounded-lg border">Out of Stock</span>
          </div>
        }
      </a>

      <!-- Body -->
      <div class="p-3 flex flex-col flex-1">
        <div class="text-[12px] text-[#666666] font-medium mb-1">{{ product.unit }}</div>
        <a [routerLink]="['/product', product.id]"
          class="text-[14px] font-semibold text-[#1A1A1A] line-clamp-2 leading-[1.3] mb-2 flex-1 hover:text-[#0C831F] transition-colors">
          {{ product.name }}
        </a>

        <!-- Price row -->
        <div class="flex items-center gap-2 mb-3">
          @if (product.discountPrice) {
            <span class="text-[16px] font-bold text-[#1A1A1A]">{{ fmt(product.discountPrice) }}</span>
            <span class="text-[13px] text-[#999999] line-through">{{ fmt(product.price) }}</span>
          } @else {
            <span class="text-[16px] font-bold text-[#1A1A1A]">{{ fmt(product.price) }}</span>
          }
        </div>

        <!-- ADD button / Stepper -->
        <div class="mt-auto">
          @if (product.stockQty === 0) {
            <button disabled
              class="w-full border-2 border-[#E0E0E0] text-[#999999] rounded-[8px] h-[36px] text-[14px] font-bold cursor-not-allowed">
              Out of Stock
            </button>
          } @else if (product.variants.length > 1 && !anyVariantInCart()) {
            <!-- Multi-variant not in cart: split button -->
            <div class="flex border-2 border-[#0C831F] rounded-[8px] h-[36px] overflow-hidden">
              <button
                class="flex-1 text-center text-[#0C831F] font-bold text-[14px] hover:bg-[#0C831F] hover:text-white transition-colors"
                (click)="openVariantModal()"
              >ADD</button>
              <div class="w-px bg-[#0C831F]"></div>
              <button
                class="bg-[#0C831F] text-white text-[11px] font-bold px-2 flex items-center hover:bg-[#0a6b19] transition-colors"
                (click)="openVariantModal()"
              >{{ product.variants.length }} options</button>
            </div>
          } @else if (product.variants.length > 1 && anyVariantInCart()) {
            <!-- Multi-variant in cart: solid green stepper -->
            <div class="flex items-center bg-[#0C831F] rounded-[8px] h-[36px]">
              <button
                class="w-9 h-[36px] flex items-center justify-center text-white text-[18px] font-light hover:bg-[#0a6b19] transition-colors rounded-l-[8px]"
                (click)="openVariantModal()"
              >−</button>
              <span class="flex-1 text-center text-white text-[14px] font-bold">
                {{ totalVariantQty() }}
              </span>
              <button
                class="w-9 h-[36px] flex items-center justify-center text-white text-[18px] font-light hover:bg-[#0a6b19] transition-colors rounded-r-[8px]"
                (click)="openVariantModal()"
              >+</button>
            </div>
          } @else if (!cartStore.isVariantInCart(product.variants[0]?.id ?? '')) {
            <!-- Single variant not in cart: outlined green -->
            <button
              class="w-full border-2 border-[#0C831F] rounded-[8px] h-[36px] text-[#0C831F] text-[14px] font-bold hover:bg-[#0C831F] hover:text-white transition-colors"
              (click)="addSingle()"
            >ADD</button>
          } @else {
            <!-- Single variant in cart: solid green stepper -->
            <div class="flex items-center bg-[#0C831F] rounded-[8px] h-[36px]">
              <button
                class="w-9 h-[36px] flex items-center justify-center text-white text-[18px] font-light hover:bg-[#0a6b19] transition-colors rounded-l-[8px]"
                (click)="decrement()"
              >−</button>
              <span class="flex-1 text-center text-white text-[14px] font-bold">
                {{ cartStore.getVariantQty(product.variants[0]?.id ?? '') }}
              </span>
              <button
                class="w-9 h-[36px] flex items-center justify-center text-white text-[18px] font-light hover:bg-[#0a6b19] transition-colors rounded-r-[8px]"
                (click)="addSingle()"
              >+</button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProductCardComponent implements OnInit {
  @Input({ required: true }) product!: IProduct;

  readonly cartStore = inject(CartStore);
  private readonly cartService = inject(CartService);
  private readonly imageService = inject(ImageService);
  private readonly dialog = inject(MatDialog);

  readonly fmt = formatPrice;
  readonly onImgError = onImgError;
  readonly realImageUrl = signal<string>('');

  ngOnInit(): void {
    this.realImageUrl.set(this.product.imageUrl);
    this.imageService.getProductImage(
      this.product.name,
      this.product.categoryName,
      this.product.id,
    ).subscribe(url => { if (url) this.realImageUrl.set(url); });
  }

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

}
