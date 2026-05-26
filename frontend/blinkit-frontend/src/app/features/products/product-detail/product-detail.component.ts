import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { ImageService } from '../../../core/services/image.service';
import { CartStore } from '../../../core/stores/cart.store';
import { CartService } from '../../../core/services/cart.service';
import { IProduct, IProductVariant } from '../../../core/models';
import { formatPrice, getCategoryFallback, resolveImageUrl } from '../../../shared/utils';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ScrollableRowComponent } from '../../../shared/components/scrollable-row/scrollable-row.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductCardComponent, ScrollableRowComponent],
  template: `
    <div class="bg-[#F8F8F8] min-h-screen">

      @if (loading()) {
        <!-- Skeleton -->
        <div class="max-w-screen-lg mx-auto px-4 py-6 animate-pulse">
          <div class="lg:grid lg:grid-cols-2 gap-8">
            <div class="h-80 bg-gray-200 rounded-2xl"></div>
            <div class="space-y-4 mt-4 lg:mt-0">
              <div class="h-6 bg-gray-200 rounded w-3/4"></div>
              <div class="h-4 bg-gray-200 rounded w-1/4"></div>
              <div class="h-8 bg-gray-200 rounded w-1/3"></div>
              <div class="h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>

      } @else if (error()) {
        <div class="flex flex-col items-center justify-center py-24 text-[#666666]">
          <div class="text-5xl mb-4">😕</div>
          <div class="font-bold text-lg">Product not found</div>
          <a routerLink="/" class="mt-4 text-[#0C831F] text-sm font-medium">← Back to home</a>
        </div>

      } @else if (product()) {
        <div class="max-w-screen-lg mx-auto px-4 py-4">

          <!-- Breadcrumb -->
          <nav class="flex items-center gap-1 text-xs text-[#666666] mb-4">
            <a routerLink="/" class="hover:text-[#0C831F]">Home</a>
            <span>/</span>
            <a routerLink="/products" class="hover:text-[#0C831F]">{{ product()!.categoryName }}</a>
            <span>/</span>
            <span class="text-gray-800 font-medium line-clamp-1">{{ product()!.name }}</span>
          </nav>

          <!-- Main grid -->
          <div class="lg:grid lg:grid-cols-2 gap-8 bg-white rounded-2xl p-4 md:p-6 shadow-sm">

            <!-- LEFT: Gallery -->
            <div>
              <div class="h-72 md:h-80 rounded-xl border border-[#E0E0E0] bg-gray-50 flex items-center justify-center p-4 overflow-hidden">
                <img
                  [src]="selectedImage()"
                  [alt]="product()!.name"
                  loading="lazy"
                  class="max-h-full max-w-full object-contain"
                  (error)="onImgError($event)"
                />
              </div>

              <!-- Thumbnails -->
              @if (galleryImages().length > 1) {
                <div class="flex items-center gap-2 mt-3">
                  <button
                    class="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-white border border-[#E0E0E0] shadow hover:border-[#0C831F] transition-colors"
                    (click)="scrollThumbs(-1)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <div class="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
                    @for (img of galleryImages(); track $index) {
                      <button
                        class="w-16 h-16 flex-shrink-0 rounded-lg border-2 p-1 bg-gray-50 overflow-hidden transition-colors"
                        [class]="selectedImage() === img ? 'border-[#0C831F]' : 'border-transparent hover:border-[#E0E0E0]'"
                        (click)="selectedImage.set(img)">
                        <img [src]="img" class="w-full h-full object-contain" loading="lazy" (error)="onImgError($event)" />
                      </button>
                    }
                  </div>
                  <button
                    class="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-white border border-[#E0E0E0] shadow hover:border-[#0C831F] transition-colors"
                    (click)="scrollThumbs(1)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              }
            </div>

            <!-- RIGHT: Info -->
            <div class="mt-4 lg:mt-0">
              <h1 class="text-2xl font-bold text-gray-900">{{ product()!.name }}</h1>
              <p class="text-sm text-[#666666] mt-1">{{ selectedVariant()?.unit ?? product()!.unit }}</p>

              <!-- Price -->
              <div class="flex items-baseline gap-3 mt-3">
                @if (selectedVariant()?.discountPrice ?? product()!.discountPrice; as dp) {
                  <span class="text-3xl font-bold text-gray-900">{{ fmt(dp) }}</span>
                  <span class="text-base text-[#666666] line-through">{{ fmt(selectedVariant()?.price ?? product()!.price) }}</span>
                  <span class="text-sm bg-[#F8C200] text-black font-bold px-2 py-0.5 rounded">
                    {{ discount() }}% off
                  </span>
                } @else {
                  <span class="text-3xl font-bold text-gray-900">{{ fmt(selectedVariant()?.price ?? product()!.price) }}</span>
                }
              </div>
              <p class="text-xs text-[#666666] mt-1">(Inclusive of all taxes)</p>

              <!-- ETA -->
              <p class="text-[#0C831F] font-semibold text-sm mt-3 flex items-center gap-1">
                🕐 Delivery in 8 minutes
              </p>

              <!-- Variant pills -->
              @if (product()!.variants.length > 1) {
                <div class="mt-4">
                  <p class="text-sm font-semibold text-gray-700 mb-2">Select Pack Size</p>
                  <div class="flex gap-2 flex-wrap">
                    @for (v of product()!.variants; track v.id) {
                      <button
                        class="border-2 rounded-xl px-3 py-2 text-sm transition-colors"
                        [class]="selectedVariant()?.id === v.id ? 'border-[#0C831F] bg-green-50 text-[#0C831F] font-semibold' : 'border-[#E0E0E0] hover:border-[#0C831F]'"
                        (click)="selectVariant(v)">
                        {{ v.unit }} — {{ fmt(v.discountPrice ?? v.price) }}
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Add to cart -->
              <div class="mt-6">
                @if ((selectedVariant()?.stockQty ?? product()!.stockQty) === 0) {
                  <button disabled class="w-full bg-gray-200 text-gray-500 rounded-xl py-3 font-bold cursor-not-allowed">
                    Out of Stock
                  </button>
                } @else if (cartStore.isVariantInCart(selectedVariant()?.id ?? product()!.variants[0]?.id ?? '')) {
                  <div class="flex items-center border-2 border-[#0C831F] rounded-xl overflow-hidden">
                    <button
                      class="w-14 h-12 flex items-center justify-center text-[#0C831F] hover:bg-green-50 font-bold text-xl"
                      (click)="decrementCart()">−</button>
                    <span class="flex-1 text-center font-bold text-[#0C831F] text-lg">
                      {{ cartStore.getVariantQty(selectedVariant()?.id ?? product()!.variants[0]?.id ?? '') }}
                    </span>
                    <button
                      class="w-14 h-12 flex items-center justify-center text-[#0C831F] hover:bg-green-50 font-bold text-xl"
                      (click)="addToCart()">+</button>
                  </div>
                } @else {
                  <button
                    class="w-full bg-[#0C831F] text-white rounded-xl py-3 font-bold text-base hover:bg-green-700 transition-colors"
                    [class.opacity-75]="addedFlash()"
                    (click)="addToCart()">
                    @if (addedFlash()) { ✓ Added! } @else { Add to Cart }
                  </button>
                }
              </div>

              <!-- Why Blinkit -->
              <div class="mt-6 space-y-3">
                <p class="text-sm font-bold">WHY SHOP FROM BLINKIT?</p>
                @for (item of whyItems; track item.title) {
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-xl flex-shrink-0">
                      {{ item.icon }}
                    </div>
                    <div>
                      <div class="text-sm font-semibold">{{ item.title }}</div>
                      <div class="text-xs text-[#666666]">{{ item.sub }}</div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Product Details -->
          @if (product()!.attributes.length > 0) {
            <div class="bg-white rounded-2xl mt-4 px-4 md:px-6 py-5 shadow-sm">
              <h2 class="font-bold text-base mb-4">Product Details</h2>
              <div class="divide-y divide-[#E0E0E0]">
                @for (attr of visibleAttributes(); track attr.key) {
                  <div class="flex py-2.5 gap-4">
                    <span class="text-sm text-[#666666] w-36 flex-shrink-0">{{ attr.key }}</span>
                    <span class="text-sm font-medium">{{ attr.value }}</span>
                  </div>
                }
              </div>
              @if (product()!.attributes.length > 4) {
                <button
                  class="mt-3 text-sm text-[#0C831F] font-medium"
                  (click)="toggleAttrs()">
                  {{ showAllAttrs() ? '▲ Show less' : '▾ View more details' }}
                </button>
              }
            </div>
          }

          <!-- Related Products -->
          @if (relatedProducts().length > 0) {
            <div class="mt-6 mb-8">
              <div class="flex items-baseline gap-2 mb-3 px-1">
                <h2 class="font-bold text-base">Related Products</h2>
                @if (product()!.relatedTags[0]) {
                  <span class="text-xs text-[#666666]">More in {{ product()!.relatedTags[0] }}</span>
                }
              </div>
              <app-scrollable-row [scrollAmount]="500">
                @for (rp of relatedProducts(); track rp.id) {
                  <div class="w-[160px] flex-shrink-0">
                    <app-product-card [product]="rp" />
                  </div>
                }
              </app-scrollable-row>
            </div>
          }

          <!-- Similar Products -->
          <section class="mt-8 border-t border-[#F5F5F5] pt-6">
            <div class="flex items-center justify-between px-4 mb-4">
              <div>
                <h3 class="text-[18px] font-bold text-[#1A1A1A]">Similar Products</h3>
                <p class="text-[12px] text-[#999] mt-0.5">More like {{ product()?.name }}</p>
              </div>
              <a [routerLink]="['/products']"
                 [queryParams]="{ categoryId: product()?.categoryId }"
                 class="text-[13px] font-semibold text-[#0C831F] hover:underline flex items-center gap-0.5">
                See all
                <span class="material-icons text-[16px]">chevron_right</span>
              </a>
            </div>

            @if (isSimilarLoading()) {
              <app-scrollable-row>
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="w-[160px] flex-shrink-0">
                    <div class="skeleton h-[140px] rounded-[14px] mb-2"></div>
                    <div class="skeleton h-3 w-3/4 mb-1 rounded"></div>
                    <div class="skeleton h-4 w-full mb-2 rounded"></div>
                    <div class="skeleton h-8 w-full rounded-[8px]"></div>
                  </div>
                }
              </app-scrollable-row>
            }

            @if (!isSimilarLoading() && similarProducts().length > 0) {
              <app-scrollable-row [scrollAmount]="500">
                @for (p of similarProducts(); track p.id) {
                  <div class="w-[160px] flex-shrink-0">
                    <app-product-card [product]="p" />
                  </div>
                }
              </app-scrollable-row>
            }
          </section>

          <!-- Top in Category -->
          <section class="mt-6 border-t border-[#F5F5F5] pt-6">
            <div class="flex items-center justify-between px-4 mb-4">
              <div>
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-[20px]">🏆</span>
                  <h3 class="text-[18px] font-bold text-[#1A1A1A]">Top in {{ product()?.categoryName }}</h3>
                </div>
                <p class="text-[12px] text-[#999] ml-7">Best selling in this category</p>
              </div>
              <a [routerLink]="['/products']"
                 [queryParams]="{ categoryId: product()?.categoryId, sortBy: 'discount' }"
                 class="text-[13px] font-semibold text-[#0C831F] hover:underline flex items-center gap-0.5">
                See all
                <span class="material-icons text-[16px]">chevron_right</span>
              </a>
            </div>

            @if (isTopLoading()) {
              <app-scrollable-row>
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="w-[160px] flex-shrink-0">
                    <div class="skeleton h-[140px] rounded-[14px] mb-2"></div>
                    <div class="skeleton h-3 w-3/4 mb-1 rounded"></div>
                    <div class="skeleton h-4 w-full mb-2 rounded"></div>
                    <div class="skeleton h-8 w-full rounded-[8px]"></div>
                  </div>
                }
              </app-scrollable-row>
            }

            @if (!isTopLoading() && topInCategory().length > 0) {
              <app-scrollable-row [scrollAmount]="500">
                @for (p of topInCategory(); track p.id; let idx = $index) {
                  <div class="w-[160px] flex-shrink-0 relative">
                    @if (idx < 3) {
                      <div class="absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black"
                           [class]="idx === 0 ? 'bg-[#F8C200] text-[#1A1A1A]' : idx === 1 ? 'bg-[#C0C0C0] text-white' : 'bg-[#CD7F32] text-white'">
                        {{ idx + 1 }}
                      </div>
                    }
                    <app-product-card [product]="p" />
                  </div>
                }
              </app-scrollable-row>
            }
          </section>

          <!-- People Also Bought -->
          <section class="mt-6 border-t border-[#F5F5F5] pt-6 mb-8">
            <div class="flex items-center justify-between px-4 mb-4">
              <div>
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-[20px]">🛒</span>
                  <h3 class="text-[18px] font-bold text-[#1A1A1A]">People Also Bought</h3>
                </div>
                <p class="text-[12px] text-[#999] ml-7">Customers who bought this also bought</p>
              </div>
              <a routerLink="/products"
                 class="text-[13px] font-semibold text-[#0C831F] hover:underline flex items-center gap-0.5">
                Explore
                <span class="material-icons text-[16px]">chevron_right</span>
              </a>
            </div>

            @if (isAlsoLoading()) {
              <app-scrollable-row>
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="w-[160px] flex-shrink-0">
                    <div class="skeleton h-[140px] rounded-[14px] mb-2"></div>
                    <div class="skeleton h-3 w-3/4 mb-1 rounded"></div>
                    <div class="skeleton h-4 w-full mb-2 rounded"></div>
                    <div class="skeleton h-8 w-full rounded-[8px]"></div>
                  </div>
                }
              </app-scrollable-row>
            }

            @if (!isAlsoLoading() && alsoBought().length > 0) {
              <app-scrollable-row [scrollAmount]="500">
                @for (p of alsoBought(); track p.id) {
                  <div class="w-[160px] flex-shrink-0">
                    <app-product-card [product]="p" />
                  </div>
                }
              </app-scrollable-row>
            }

            @if (!isAlsoLoading() && alsoBought().length === 0 && similarProducts().length > 0) {
              <app-scrollable-row [scrollAmount]="500">
                @for (p of similarProducts().slice(0, 8); track p.id) {
                  <div class="w-[160px] flex-shrink-0">
                    <app-product-card [product]="p" />
                  </div>
                }
              </app-scrollable-row>
            }
          </section>

        </div>
      }
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly imageService = inject(ImageService);
  readonly cartStore = inject(CartStore);
  private readonly cartService = inject(CartService);

  readonly product = signal<IProduct | null>(null);
  readonly selectedVariant = signal<IProductVariant | null>(null);
  readonly selectedImage = signal('');
  readonly galleryImages = signal<string[]>([]);
  readonly relatedProducts = signal<IProduct[]>([]);
  readonly similarProducts = signal<IProduct[]>([]);
  readonly topInCategory = signal<IProduct[]>([]);
  readonly alsoBought = signal<IProduct[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly addedFlash = signal(false);
  readonly showAllAttrs = signal(false);
  readonly isSimilarLoading = signal(true);
  readonly isTopLoading = signal(true);
  readonly isAlsoLoading = signal(true);

  readonly fmt = formatPrice;
  protected readonly resolveImageUrl = resolveImageUrl;

  readonly whyItems = [
    { icon: '🚚', title: 'Round The Clock Delivery', sub: 'Order any time, we deliver 24×7' },
    { icon: '💸', title: 'Best Prices & Offers', sub: 'Savings on every purchase' },
    { icon: '🛍️', title: 'Wide Assortment', sub: '5000+ products across categories' },
  ];

  visibleAttributes() {
    const attrs = this.product()?.attributes ?? [];
    return this.showAllAttrs() ? attrs : attrs.slice(0, 4);
  }

  discount(): number {
    const v = this.selectedVariant();
    const p = this.product();
    if (!p) return 0;
    const price = v?.price ?? p.price;
    const dp = v?.discountPrice ?? p.discountPrice;
    if (!dp) return 0;
    return Math.round(((price - dp) / price) * 100);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) { this.error.set(true); this.loading.set(false); return; }
      this.load(id);
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set(false);
    this.galleryImages.set([]);
    this.productService.getProductById(id).subscribe({
      next: p => {
        this.product.set(p);
        this.selectedVariant.set(p.variants[0] ?? null);
        // Use DB image as initial placeholder; imageService gallery replaces it below
        this.selectedImage.set(p.images[0] ?? p.imageUrl);
        this.loading.set(false);
        this.loadRelated(id);
        // Always fetch working gallery URLs from the backend — CDN URLs
        // (cdn.grofers.com) are CORS-blocked and must be resolved.
        // Passing p.imageUrl lets the service short-circuit for uploaded
        // images (/uploads/…) so they're never overridden by Unsplash URLs.
        this.imageService.getGalleryImages(p.name, p.categoryName, p.id, p.imageUrl).subscribe(urls => {
          if (urls.length > 0) {
            this.galleryImages.set(urls);
            this.selectedImage.set(urls[0]);
          }
        });
      },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  private loadRelated(id: string): void {
    this.productService.getRelatedProducts(id, 12).subscribe({
      next: items => this.relatedProducts.set(items),
      error: () => {},
    });

    forkJoin({
      similar: this.productService.getSimilarProducts(id, 10),
      top: this.productService.getTopInCategory(id, 10),
      also: this.productService.getAlsoBought(id, 10),
    }).subscribe({
      next: ({ similar, top, also }) => {
        this.similarProducts.set(similar);
        this.topInCategory.set(top);
        this.alsoBought.set(also);
        this.isSimilarLoading.set(false);
        this.isTopLoading.set(false);
        this.isAlsoLoading.set(false);
      },
      error: () => {
        this.isSimilarLoading.set(false);
        this.isTopLoading.set(false);
        this.isAlsoLoading.set(false);
      },
    });
  }

  selectVariant(v: IProductVariant): void {
    this.selectedVariant.set(v);
    if (v.imageUrl) this.selectedImage.set(resolveImageUrl(v.imageUrl, this.product()?.categoryName ?? ''));
  }

  addToCart(): void {
    const p = this.product();
    const v = this.selectedVariant() ?? p?.variants[0];
    if (!p || !v) return;
    this.cartService.addItem(p, v).subscribe();
    this.addedFlash.set(true);
    setTimeout(() => this.addedFlash.set(false), 1500);
  }

  decrementCart(): void {
    const variantId = this.selectedVariant()?.id ?? this.product()?.variants[0]?.id;
    if (!variantId) return;
    const item = this.cartStore.cartItems().find(i => i.variantId === variantId);
    if (item) this.cartService.updateQty(item.id, item.quantity - 1).subscribe();
  }

  scrollThumbs(dir: number): void {
    const imgs = this.galleryImages();
    const current = imgs.indexOf(this.selectedImage());
    const next = (current + dir + imgs.length) % imgs.length;
    this.selectedImage.set(imgs[next]);
  }

  toggleAttrs(): void { this.showAllAttrs.update(v => !v); }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = getCategoryFallback(this.product()?.categoryName ?? '');
  }
}
