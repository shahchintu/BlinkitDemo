import {
  ChangeDetectionStrategy, Component, inject, Input, OnChanges, OnInit, signal, SimpleChanges,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { IProduct } from '../../../core/models';
import { ProductCardComponent } from '../../products/product-card/product-card.component';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCardComponent, RouterLink],
  template: `
    <div class="max-w-[1200px] mx-auto px-4 mt-6">
      <!-- Section heading -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-[20px] font-bold text-[#1A1A1A]">
          @if (selectedCategoryId) { Products in Category } @else { Featured Products }
        </h2>
        <a routerLink="/products" class="text-[14px] font-semibold text-[#0C831F] hover:underline">See all →</a>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        @if (loading()) {
          @for (_ of skeletons; track $index) {
            <div class="rounded-[16px] border border-[#E0E0E0] overflow-hidden animate-pulse bg-white">
              <div class="h-40 bg-gray-200"></div>
              <div class="p-3 space-y-2">
                <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                <div class="h-3 bg-gray-200 rounded w-1/3"></div>
                <div class="h-9 bg-gray-200 rounded-[8px] mt-3"></div>
              </div>
            </div>
          }
        } @else if (products().length === 0) {
          <div class="col-span-full text-center py-16">
            <div class="text-[64px] mb-4">🔍</div>
            <p class="text-[18px] font-bold text-[#1A1A1A]">No products found</p>
            <p class="text-[14px] text-[#666666] mt-1">Try a different category</p>
          </div>
        } @else {
          @for (product of products(); track product.id) {
            <app-product-card [product]="product" />
          }
        }
      </div>
    </div>
  `,
})
export class FeaturedProductsComponent implements OnInit, OnChanges {
  @Input() selectedCategoryId: string | null = null;

  private readonly productService = inject(ProductService);

  readonly products = signal<IProduct[]>([]);
  readonly loading = signal(true);
  readonly skeletons = Array(10);

  ngOnInit(): void { this.load(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedCategoryId'] && !changes['selectedCategoryId'].firstChange) {
      this.load();
    }
  }

  private load(): void {
    this.loading.set(true);
    this.productService.getProducts({
      categoryId: this.selectedCategoryId ?? undefined,
      pageSize: 15,
    }).subscribe({
      next: res => { this.products.set(res.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
