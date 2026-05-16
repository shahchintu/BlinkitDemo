import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ProductService } from '../../../core/services/product.service';
import { ICategory, IProduct } from '../../../core/models';
import { ProductCardComponent } from '../product-card/product-card.component';
import { FilterSidebarComponent, FilterState } from './filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCardComponent, FilterSidebarComponent, MatIconModule],
  template: `
    <div class="flex min-h-screen bg-[#F8F8F8]">

      <!-- Desktop sidebar -->
      <aside class="hidden md:block w-56 flex-shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <app-filter-sidebar
          [categories]="categories()"
          [selectedCategoryId]="filterState().categoryId"
          [maxPrice]="filterState().maxPrice"
          [sortBy]="filterState().sortBy"
          (filtersChanged)="onFiltersChanged($event)" />
      </aside>

      <!-- Main content -->
      <div class="flex-1 p-4">

        <!-- Mobile filter button -->
        <div class="md:hidden mb-4">
          <button
            class="border border-[#E0E0E0] rounded-[8px] px-4 py-2 flex items-center gap-2 text-[14px] text-[#1A1A1A] bg-white hover:border-[#0C831F] transition-colors"
            (click)="mobileFilterOpen.set(true)">
            <mat-icon class="text-[18px] leading-none">tune</mat-icon>
            Filter & Sort
          </button>
        </div>

        <!-- Header -->
        <div class="mb-4">
          <h1 class="text-lg font-bold text-[#1A1A1A]">
            @if (searchQuery()) { Results for "{{ searchQuery() }}" }
            @else if (filterState().categoryId) { {{ activeCategoryName() }} }
            @else { All Products }
          </h1>
          @if (!loading() && totalCount() > 0) {
            <p class="text-xs text-[#666666] mt-0.5">
              {{ displayProducts().length }} of {{ totalCount() }} products
            </p>
          }
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
          } @else if (displayProducts().length === 0) {
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-[#666666]">
              <div class="text-4xl mb-3">🔍</div>
              <div class="font-medium">No products found</div>
              @if (searchQuery()) {
                <div class="text-sm mt-1">Try a different search term</div>
              }
            </div>
          } @else {
            @for (product of displayProducts(); track product.id) {
              <app-product-card [product]="product" />
            }
          }
        </div>

        <!-- Pagination -->
        @if (!loading() && totalPages() > 1) {
          <div class="flex justify-center gap-2 mt-8">
            <button
              class="px-4 py-2 rounded-xl border border-[#E0E0E0] text-sm hover:border-[#0C831F] disabled:opacity-40 bg-white"
              [disabled]="currentPage() === 1"
              (click)="goPage(currentPage() - 1)">← Prev</button>
            <span class="px-4 py-2 text-sm text-[#666666]">{{ currentPage() }} / {{ totalPages() }}</span>
            <button
              class="px-4 py-2 rounded-xl border border-[#E0E0E0] text-sm hover:border-[#0C831F] disabled:opacity-40 bg-white"
              [disabled]="currentPage() === totalPages()"
              (click)="goPage(currentPage() + 1)">Next →</button>
          </div>
        }
      </div>
    </div>

    <!-- Mobile filter drawer + backdrop -->
    @if (mobileFilterOpen()) {
      <div
        class="fixed inset-0 bg-black/40 z-40 md:hidden"
        (click)="mobileFilterOpen.set(false)">
      </div>
      <div class="fixed top-0 left-0 h-full w-72 bg-[#F8F8F8] z-50 md:hidden overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between px-4 py-4 bg-white border-b border-[#E0E0E0]">
          <span class="text-[16px] font-bold text-[#1A1A1A]">Filter & Sort</span>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F8F8F8]"
            (click)="mobileFilterOpen.set(false)">
            <mat-icon class="text-[#666666] text-[20px]">close</mat-icon>
          </button>
        </div>
        <div class="p-4">
          <app-filter-sidebar
            [categories]="categories()"
            [selectedCategoryId]="filterState().categoryId"
            [maxPrice]="filterState().maxPrice"
            [sortBy]="filterState().sortBy"
            (filtersChanged)="onFiltersChanged($event); mobileFilterOpen.set(false)" />
        </div>
      </div>
    }
  `,
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly rawProducts = signal<IProduct[]>([]);
  readonly displayProducts = signal<IProduct[]>([]);
  readonly categories = signal<ICategory[]>([]);
  readonly loading = signal(true);
  readonly totalCount = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);
  readonly searchQuery = signal('');
  readonly activeCategoryName = signal('');
  readonly mobileFilterOpen = signal(false);
  readonly skeletons = Array(8);

  readonly filterState = signal<FilterState>({
    categoryId: null,
    minPrice: 0,
    maxPrice: 2000,
    sortBy: 'relevance',
  });

  ngOnInit(): void {
    this.productService.getCategories().subscribe(cats => this.categories.set(cats));

    this.route.queryParamMap.subscribe(params => {
      const q = params.get('q') ?? '';
      const catId = params.get('category') ?? null;
      this.searchQuery.set(q);
      this.filterState.update(s => ({ ...s, categoryId: catId }));
      this.currentPage.set(1);
      this.load();
    });
  }

  onFiltersChanged(state: FilterState): void {
    const prev = this.filterState();
    this.filterState.set(state);

    if (state.categoryId !== prev.categoryId) {
      // Category changed → update URL (triggers queryParamMap → load())
      this.currentPage.set(1);
      this.router.navigate([], {
        queryParams: {
          category: state.categoryId ?? null,
          q: this.searchQuery() || null,
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    } else {
      // Price or sort changed → apply client-side only
      this.applyClientFilters();
    }

    if (state.categoryId) {
      const cat = this.categories().find(c => c.id === state.categoryId);
      if (cat) this.activeCategoryName.set(cat.name);
    } else {
      this.activeCategoryName.set('');
    }
  }

  private load(): void {
    this.loading.set(true);
    this.productService.getProducts({
      search: this.searchQuery() || undefined,
      categoryId: this.filterState().categoryId ?? undefined,
      page: this.currentPage(),
      pageSize: 20,
    }).subscribe({
      next: res => {
        this.rawProducts.set(res.items);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        const cat = this.categories().find(c => c.id === this.filterState().categoryId);
        if (cat) this.activeCategoryName.set(cat.name);
        this.loading.set(false);
        this.applyClientFilters();
      },
      error: () => this.loading.set(false),
    });
  }

  private applyClientFilters(): void {
    const { maxPrice, sortBy } = this.filterState();
    let items = [...this.rawProducts()];

    if (maxPrice < 2000) {
      items = items.filter(p => (p.discountPrice ?? p.price) <= maxPrice);
    }

    switch (sortBy) {
      case 'price_asc':
        items.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
        break;
      case 'price_desc':
        items.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
        break;
      case 'discount':
        items.sort((a, b) => {
          const da = a.discountPrice ? (a.price - a.discountPrice) / a.price : 0;
          const db = b.discountPrice ? (b.price - b.discountPrice) / b.price : 0;
          return db - da;
        });
        break;
    }

    this.displayProducts.set(items);
  }

  goPage(page: number): void {
    this.currentPage.set(page);
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
