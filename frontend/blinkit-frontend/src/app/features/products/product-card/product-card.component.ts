import { ChangeDetectionStrategy, Component, inject, Input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CartStore } from '../../../core/stores/cart.store';
import { CartService } from '../../../core/services/cart.service';
import { ImageService } from '../../../core/services/image.service';
import { IProduct } from '../../../core/models';
import { formatPrice, onImgError, resolveImageUrl } from '../../../shared/utils';
import { ProductVariantModalComponent } from '../product-variant-modal/product-variant-modal.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  styles: [':host { display: block; height: 100%; }'],
  template: `
    <div class="bg-white rounded-[16px]
                border border-[#F0F0F0]
                card-hover cursor-pointer
                overflow-hidden group
                flex flex-col h-full"
         (click)="navigateToProduct()">

      <!-- Image section -->
      <div class="relative bg-[#F8F8F8] rounded-t-[16px] overflow-hidden"
           style="height:160px">

        <img [src]="getImageUrl()"
             [alt]="product.name"
             loading="lazy"
             (error)="onImgError($event, product.categoryName)"
             class="w-full h-full object-cover
                    transition-transform duration-300
                    group-hover:scale-105">

        <!-- Discount badge -->
        @if (discount() > 0) {
          <div class="absolute top-2 left-2 z-10
                      bg-[#3D6BE8] text-white
                      text-[10px] font-black px-1.5 py-0.5
                      rounded-[6px] leading-tight">
            {{ discount() }}% OFF
          </div>
        }

        <!-- Out of stock overlay -->
        @if (isOutOfStock()) {
          <div class="absolute inset-0 bg-white/80
                      flex items-center justify-center
                      rounded-t-[16px]">
            <span class="text-[12px] font-semibold text-[#666]
                         bg-white px-3 py-1 rounded-full
                         border border-[#E0E0E0]">
              Out of Stock
            </span>
          </div>
        }
      </div>

      <!-- Content -->
      <div class="p-3 flex-1 flex flex-col justify-between">
        <div>
          <!-- Unit -->
          <p class="text-[11px] text-[#666] font-medium mb-0.5">
            {{ product.variants[0]?.unit ?? product.unit }}
          </p>

          <!-- Name -->
          <p class="text-[13px] font-semibold text-[#1A1A1A] leading-snug mb-2 h-[36px] min-h-[36px]"
             style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
            {{ product.name }}
          </p>
        </div>

        <!-- Price row + ADD button -->
        <div class="flex items-center justify-between gap-2 mt-auto">

          <!-- Price -->
          <div class="flex flex-col justify-center">
            <span class="text-[15px] font-bold text-[#1A1A1A] leading-tight">
              {{ fmt(product.variants[0]?.discountPrice ?? product.variants[0]?.price ?? product.discountPrice ?? product.price) }}
            </span>
            @if (product.variants[0]?.discountPrice ?? product.discountPrice) {
              <span class="text-[11px] text-[#999] line-through leading-tight">
                {{ fmt(product.variants[0]?.price ?? product.price) }}
              </span>
            } @else {
              <span class="text-[11px] leading-tight invisible">&nbsp;</span>
            }
          </div>

          <!-- Buttons -->
          @if (isOutOfStock()) {
            <button disabled
              class="border-2 border-[#E0E0E0] text-[#999]
                     rounded-[8px] px-3 h-[34px] text-[13px]
                     font-bold cursor-not-allowed flex-shrink-0">
              Out of Stock
            </button>
          } @else if (product.variants.length > 1 && !anyVariantInCart()) {
            <!-- Multi-variant: single button, vertical ADD + options -->
            <button
              class="border-2 border-[#0C831F] rounded-[8px]
                     flex-shrink-0 flex flex-col items-center
                     justify-center px-4 py-1 min-w-[64px]
                     hover:bg-[#F0FFF4] transition btn-press"
              (click)="$event.stopPropagation(); openVariantModal()">
              <span class="text-[#0C831F] text-[14px] font-bold leading-tight">ADD</span>
              <span class="text-[#0C831F] text-[9px] font-semibold leading-tight">
                {{ product.variants.length }} options
              </span>
            </button>
          } @else if (product.variants.length > 1 && anyVariantInCart()) {
            <!-- Multi-variant stepper -->
            <div class="flex items-center bg-[#0C831F]
                        rounded-[8px] overflow-hidden flex-shrink-0">
              <button
                class="w-8 h-[34px] text-white text-[18px] font-light
                       hover:bg-[#0a6b19] transition flex items-center justify-center"
                (click)="$event.stopPropagation(); openVariantModal()">
                −
              </button>
              <span class="text-white text-[13px] font-bold min-w-[24px] text-center">
                {{ totalVariantQty() }}
              </span>
              <button
                class="w-8 h-[34px] text-white text-[18px] font-light
                       hover:bg-[#0a6b19] transition flex items-center justify-center"
                (click)="$event.stopPropagation(); openVariantModal()">
                +
              </button>
            </div>
          } @else if (product.variants.length > 0 && !cartStore.isVariantInCart(product.variants[0].id)) {
            <!-- Single ADD -->
            <button
              class="border-2 border-[#0C831F] rounded-[8px]
                     px-4 h-[34px] text-[#0C831F] text-[13px]
                     font-bold hover:bg-[#0C831F] hover:text-white
                     transition btn-press flex-shrink-0"
              (click)="$event.stopPropagation(); addSingle()">
              ADD
            </button>
          } @else if (product.variants.length === 0) {
            <button disabled
              class="border-2 border-[#E0E0E0] text-[#999]
                     rounded-[8px] px-3 h-[34px] text-[13px]
                     font-bold cursor-not-allowed flex-shrink-0">
              Unavailable
            </button>
          } @else {
            <!-- Single variant stepper -->
            <div class="flex items-center bg-[#0C831F]
                        rounded-[8px] overflow-hidden flex-shrink-0">
              <button
                class="w-8 h-[34px] text-white text-[18px] font-light
                       hover:bg-[#0a6b19] transition flex items-center justify-center"
                (click)="$event.stopPropagation(); decrement()">
                −
              </button>
              <span class="text-white text-[13px] font-bold min-w-[24px] text-center">
                {{ cartStore.getVariantQty(product.variants[0]?.id ?? '') }}
              </span>
              <button
                class="w-8 h-[34px] text-white text-[18px] font-light
                       hover:bg-[#0a6b19] transition flex items-center justify-center"
                (click)="$event.stopPropagation(); increment()">
                +
              </button>
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
  private readonly router = inject(Router);

  readonly fmt = formatPrice;
  readonly onImgError = onImgError;
  readonly realImageUrl = signal<string>('');

  ngOnInit(): void {
    this.realImageUrl.set(this.product.imageUrl);
    // Always call imageService — CDN URLs (cdn.grofers.com) are CORS-blocked
    // and must be resolved via the backend.
    // Passing product.imageUrl lets the service short-circuit and return it
    // directly when it's an uploaded file (/uploads/…), preventing an Unsplash
    // URL from overriding the admin-uploaded image.
    this.imageService.getProductImage(
      this.product.name,
      this.product.categoryName,
      this.product.id,
      this.product.imageUrl,
    ).subscribe(url => { if (url) this.realImageUrl.set(url); });
  }

  getImageUrl(): string {
    return resolveImageUrl(
      this.realImageUrl() || this.product.imageUrl,
      this.product.categoryName,
    );
  }

  navigateToProduct(): void {
    this.router.navigate(['/product', this.product.id]);
  }

  discount(): number {
    const price = this.product.variants[0]?.price ?? this.product.price;
    const discountPrice = this.product.variants[0]?.discountPrice ?? this.product.discountPrice;
    if (!discountPrice || discountPrice >= price) return 0;
    return Math.round(((price - discountPrice) / price) * 100);
  }

  isOutOfStock(): boolean {
    if (this.product.variants.length > 0) {
      return this.product.variants[0]?.stockQty === 0;
    }
    return this.product.stockQty === 0;
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
      panelClass: 'rounded-2xl',
      width: '400px',
      maxWidth: '95vw',
    });
  }

  addSingle(): void {
    const variant = this.product.variants[0];
    if (!variant) return;
    this.cartService.addItem(this.product, variant).subscribe();
  }

  increment(): void {
    const variant = this.product.variants[0];
    if (!variant) return;
    const storeItem = this.cartStore.cartItems().find(i => i.variantId === variant.id);
    if (storeItem) this.cartService.updateQty(storeItem.id, storeItem.quantity + 1).subscribe();
  }

  decrement(): void {
    const variant = this.product.variants[0];
    if (!variant) return;
    const storeItem = this.cartStore.cartItems().find(i => i.variantId === variant.id);
    if (storeItem) this.cartService.updateQty(storeItem.id, storeItem.quantity - 1).subscribe();
  }
}
