import {
  ChangeDetectionStrategy, Component, inject, Input, OnChanges, OnInit, signal, SimpleChanges,
} from '@angular/core';
import { ProductService } from '../../../core/services/product.service';
import { IProduct } from '../../../core/models';
import { ProductCardComponent } from '../../products/product-card/product-card.component';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCardComponent],
  template: `
    <div class="px-4 mt-6">
      <h2 class="text-lg font-bold mb-3">
        @if (selectedCategoryId) { Products in Category } @else { Featured Products }
      </h2>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        @if (loading()) {
          @for (_ of skeletons; track $index) {
            <div class="rounded-2xl border border-[#E0E0E0] overflow-hidden animate-pulse">
              <div class="h-40 bg-gray-200"></div>
              <div class="p-3 space-y-2">
                <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                <div class="h-3 bg-gray-200 rounded w-1/3"></div>
                <div class="h-8 bg-gray-200 rounded-xl mt-3"></div>
              </div>
            </div>
          }
        } @else if (products().length === 0) {
          <div class="col-span-full text-center py-12 text-[#666666]">
            No products found.
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
  readonly skeletons = Array(8);

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
      pageSize: 12,
    }).subscribe({
      next: res => { this.products.set(res.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
