import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { ICategory, IProduct } from '../../../core/models';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCardComponent],
  template: `
    <div class="flex min-h-screen bg-[#F8F8F8]">

      <!-- Filter Sidebar -->
      <aside class="hidden md:block w-56 flex-shrink-0 bg-white border-r border-[#E0E0E0] p-4 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-sm">Filters</h3>
          @if (activeCategoryId() || activeSort() !== 'relevance') {
            <button class="text-xs text-[#0C831F] font-medium" (click)="clearFilters()">Clear All</button>
          }
        </div>

        <!-- Categories -->
        <div class="mb-5">
          <h4 class="text-xs font-bold text-[#666666] uppercase tracking-wide mb-2">Category</h4>
          <div class="space-y-1">
            <button
              class="w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors"
              [class]="!activeCategoryId() ? 'bg-green-50 text-[#0C831F] font-medium' : 'hover:bg-gray-50'"
              (click)="setCategory(null)">All</button>
            @for (cat of categories(); track cat.id) {
              <button
                class="w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors"
                [class]="activeCategoryId() === cat.id ? 'bg-green-50 text-[#0C831F] font-medium' : 'hover:bg-gray-50'"
                (click)="setCategory(cat.id)">{{ cat.name }}</button>
            }
          </div>
        </div>

        <!-- Sort -->
        <div>
          <h4 class="text-xs font-bold text-[#666666] uppercase tracking-wide mb-2">Sort By</h4>
          <div class="space-y-1">
            @for (opt of sortOptions; track opt.value) {
              <button
                class="w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors"
                [class]="activeSort() === opt.value ? 'bg-green-50 text-[#0C831F] font-medium' : 'hover:bg-gray-50'"
                (click)="activeSort.set(opt.value); load()">{{ opt.label }}</button>
            }
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <div class="flex-1 p-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-lg font-bold">
              @if (searchQuery()) { Results for "{{ searchQuery() }}" }
              @else if (activeCategoryId()) { {{ activeCategoryName() }} }
              @else { All Products }
            </h1>
            @if (!loading() && totalCount() > 0) {
              <p class="text-xs text-[#666666]">{{ totalCount() }} products</p>
            }
          </div>
        </div>

        <!-- Product grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          @if (loading()) {
            @for (_ of skeletons; track $index) {
              <div class="rounded-2xl border border-[#E0E0E0] overflow-hidden animate-pulse">
                <div class="h-40 bg-gray-200"></div>
                <div class="p-3 space-y-2">
                  <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div class="h-8 bg-gray-200 rounded-xl mt-3"></div>
                </div>
              </div>
            }
          } @else if (products().length === 0) {
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-[#666666]">
              <div class="text-4xl mb-3">🔍</div>
              <div class="font-medium">No products found</div>
              @if (searchQuery()) {
                <div class="text-sm mt-1">Try a different search term</div>
              }
            </div>
          } @else {
            @for (product of products(); track product.id) {
              <app-product-card [product]="product" />
            }
          }
        </div>

        <!-- Pagination -->
        @if (!loading() && totalPages() > 1) {
          <div class="flex justify-center gap-2 mt-8">
            <button
              class="px-4 py-2 rounded-xl border border-[#E0E0E0] text-sm hover:border-[#0C831F] disabled:opacity-40"
              [disabled]="currentPage() === 1"
              (click)="goPage(currentPage() - 1)">← Prev</button>
            <span class="px-4 py-2 text-sm text-[#666666]">{{ currentPage() }} / {{ totalPages() }}</span>
            <button
              class="px-4 py-2 rounded-xl border border-[#E0E0E0] text-sm hover:border-[#0C831F] disabled:opacity-40"
              [disabled]="currentPage() === totalPages()"
              (click)="goPage(currentPage() + 1)">Next →</button>
          </div>
        }
      </div>
    </div>
  `,
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);

  readonly products = signal<IProduct[]>([]);
  readonly categories = signal<ICategory[]>([]);
  readonly loading = signal(true);
  readonly totalCount = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);
  readonly searchQuery = signal('');
  readonly activeCategoryId = signal<string | null>(null);
  readonly activeCategoryName = signal('');
  readonly activeSort = signal('relevance');
  readonly skeletons = Array(8);

  readonly sortOptions = [
    { label: 'Relevance',         value: 'relevance' },
    { label: 'Price: Low → High', value: 'price_asc' },
    { label: 'Price: High → Low', value: 'price_desc' },
    { label: 'Discount %',        value: 'discount' },
  ];

  ngOnInit(): void {
    this.productService.getCategories().subscribe(cats => this.categories.set(cats));

    this.route.queryParamMap.subscribe(params => {
      this.searchQuery.set(params.get('q') ?? '');
      const catId = params.get('category');
      this.activeCategoryId.set(catId);
      this.currentPage.set(1);
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.productService.getProducts({
      search: this.searchQuery() || undefined,
      categoryId: this.activeCategoryId() ?? undefined,
      page: this.currentPage(),
      pageSize: 20,
    }).subscribe({
      next: res => {
        this.products.set(res.items);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        const cat = this.categories().find(c => c.id === this.activeCategoryId());
        if (cat) this.activeCategoryName.set(cat.name);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setCategory(id: string | null): void {
    this.activeCategoryId.set(id);
    this.currentPage.set(1);
    this.load();
  }

  clearFilters(): void {
    this.activeCategoryId.set(null);
    this.activeSort.set('relevance');
    this.currentPage.set(1);
    this.load();
  }

  goPage(page: number): void {
    this.currentPage.set(page);
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
