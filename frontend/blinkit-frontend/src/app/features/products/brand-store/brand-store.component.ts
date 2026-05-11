import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { IProduct } from '../../../core/models';
import { ProductCardComponent } from '../product-card/product-card.component';

const BRAND_MAP: Record<string, string> = {
  'amul':      'Amul',
  'haldirams': "Haldiram's",
  'nestle':    'Nestlé',
  'lays':      "Lay's",
  'britannia': 'Britannia',
  'parle':     'Parle',
  'himalaya':  'Himalaya',
  'pedigree':  'Pedigree',
  'johnsons':  "Johnson's",
  'dettol':    'Dettol',
  'coca-cola': 'Coca-Cola',
  'maggi':     'Maggi',
};

@Component({
  selector: 'app-brand-store',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCardComponent],
  template: `
    <div class="bg-[#F8F8F8] min-h-screen">
      <!-- Brand header -->
      <div class="bg-[#0C831F] text-white px-4 py-8 text-center">
        <h1 class="text-3xl font-black">{{ brandName() }}</h1>
        <p class="text-white/80 text-sm mt-1">Official Brand Store on Blinkit</p>
      </div>

      <div class="max-w-screen-lg mx-auto px-4 py-6">
        @if (!loading() && products().length > 0) {
          <p class="text-sm text-[#666666] mb-4">{{ products().length }} products</p>
        }

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          @if (loading()) {
            @for (_ of skeletons; track $index) {
              <div class="rounded-2xl border border-[#E0E0E0] overflow-hidden animate-pulse">
                <div class="h-40 bg-gray-200"></div>
                <div class="p-3 space-y-2">
                  <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div class="h-8 bg-gray-200 rounded-xl mt-3"></div>
                </div>
              </div>
            }
          } @else if (products().length === 0) {
            <div class="col-span-full text-center py-16 text-[#666666]">
              <div class="text-4xl mb-3">🏪</div>
              <div class="font-medium">No products found for {{ brandName() }}</div>
            </div>
          } @else {
            @for (product of products(); track product.id) {
              <app-product-card [product]="product" />
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class BrandStoreComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  readonly products = signal<IProduct[]>([]);
  readonly loading = signal(true);
  readonly brandName = signal('');
  readonly skeletons = Array(8);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') ?? '';
      const name = BRAND_MAP[slug] ?? slug;
      this.brandName.set(name);
      this.loading.set(true);
      this.productService.getProducts({ search: name, pageSize: 40 }).subscribe({
        next: res => { this.products.set(res.items); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    });
  }
}
