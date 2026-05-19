import {
  ChangeDetectionStrategy, Component, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, switchMap } from 'rxjs';
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
          [currentFilters]="currentFilters()"
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
            @else if (currentFilters().categoryId) { {{ activeCategoryName() }} }
            @else { All Products }
          </h1>
          @if (!isLoading() && totalCount() > 0) {
            <p class="text-xs text-[#666666] mt-0.5">
              {{ products().length }} of {{ totalCount() }} products
            </p>
          }
        </div>

        <!-- Product grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          @if (isLoading()) {
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
        @if (!isLoading() && totalPages() > 1) {
          <div class="flex items-center justify-center gap-2 mt-8 pb-8">
            <button
              [disabled]="currentPage() === 1"
              (click)="onPageChange(currentPage() - 1)"
              class="border border-[#E0E0E0] rounded-[8px] px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed bg-white text-[#1A1A1A]">
              Previous
            </button>
            
            @for (page of getPageNumbers(); track page) {
              <button
                class="w-10 h-10 rounded-[8px] flex items-center justify-center border border-[#E0E0E0]"
                [class]="page === currentPage() ? 'bg-[#0C831F] text-white font-bold border-[#0C831F]' : 'bg-white text-[#1A1A1A] hover:border-[#0C831F]'"
                (click)="onPageChange(page)">
                {{ page }}
              </button>
            }
            
            <button
              [disabled]="currentPage() === totalPages()"
              (click)="onPageChange(currentPage() + 1)"
              class="border border-[#E0E0E0] rounded-[8px] px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed bg-white text-[#1A1A1A]">
              Next
            </button>
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
            [currentFilters]="currentFilters()"
            (filtersChanged)="onFiltersChanged($event); mobileFilterOpen.set(false)" />
        </div>
      </div>
    }
  `,
})
export class ProductListComponent {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly products = signal<IProduct[]>([]);
  readonly categories = signal<ICategory[]>([]);
  readonly isLoading = signal(false);
  readonly totalCount = signal(0);
  readonly totalPages = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = 20;

  readonly searchQuery = signal('');
  readonly activeCategoryName = signal('');
  readonly mobileFilterOpen = signal(false);
  readonly skeletons = Array(8);

  readonly currentFilters = signal<FilterState>({
    categoryId: null,
    minPrice: 0,
    maxPrice: 2000,
    sortBy: 'relevance',
  });

  // Subject used to funnel every fetch request through switchMap so that
  // in-flight requests are cancelled when a new one arrives.
  private readonly fetch$ = new Subject<void>();

  constructor() {
    // Load categories once.
    this.productService
      .getCategories()
      .pipe(takeUntilDestroyed())
      .subscribe(cats => this.categories.set(cats));

    // Wire the fetch pipeline: switchMap cancels any in-flight HTTP request
    // whenever a new fetch$ emission arrives.
    this.fetch$
      .pipe(
        switchMap(() => {
          this.isLoading.set(true);
          const filters = this.currentFilters();
          return this.productService.getProducts({
            search: this.searchQuery() || undefined,
            categoryId: filters.categoryId ?? undefined,
            page: this.currentPage(),
            pageSize: this.pageSize,
            sortBy: filters.sortBy,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
          });
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (result) => {
          this.products.set(result.items);
          this.totalCount.set(result.totalCount);
          this.totalPages.set(result.totalPages);

          const cat = this.categories().find(
            c => c.id === this.currentFilters().categoryId,
          );
          this.activeCategoryName.set(cat ? cat.name : '');
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });

    // Read URL params and trigger a fetch whenever the route query-params
    // change (direct link, browser back/forward, search bar navigation, etc.).
    // The previous isNavigating boolean flag is removed: the fetch$ Subject +
    // switchMap already prevents double work by cancelling superseded requests.
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        const q = params.get('q') ?? '';
        const catId = params.get('category') ?? null;
        const validSortValues: FilterState['sortBy'][] = [
          'relevance', 'price_asc', 'price_desc', 'name_asc', 'discount',
        ];
        const rawSort = params.get('sortBy') ?? 'relevance';
        const sortBy: FilterState['sortBy'] = (validSortValues as string[]).includes(rawSort)
          ? (rawSort as FilterState['sortBy'])
          : 'relevance';
        const page = parseInt(params.get('page') ?? '1', 10);
        const minPrice = params.get('minPrice') ? parseInt(params.get('minPrice')!, 10) : 0;
        const maxPrice = params.get('maxPrice') ? parseInt(params.get('maxPrice')!, 10) : 2000;

        this.searchQuery.set(q);
        this.currentPage.set(page);
        this.currentFilters.set({
          categoryId: catId,
          minPrice,
          maxPrice,
          sortBy,
        });

        this.fetch$.next();
      });
  }

  onFiltersChanged(newFilters: FilterState): void {
    this.currentFilters.set(newFilters);
    this.currentPage.set(1);
    // Navigating updates the URL which triggers queryParamMap, which in turn
    // calls fetch$.next(). No separate fetch$.next() call is needed here.
    this.updateUrlParams();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.updateUrlParams();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateUrlParams(): void {
    const filters = this.currentFilters();
    this.router.navigate([], {
      queryParams: {
        q: this.searchQuery() || null,
        category: filters.categoryId,
        sortBy: filters.sortBy !== 'relevance' ? filters.sortBy : null,
        minPrice: filters.minPrice > 0 ? filters.minPrice : null,
        maxPrice: filters.maxPrice < 2000 ? filters.maxPrice : null,
        page: this.currentPage() > 1 ? this.currentPage() : null,
      },
      // No queryParamsHandling: 'merge' — always write the full set of params
      // so stale params from a previous URL state are never preserved.
      replaceUrl: true,
    });
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}
