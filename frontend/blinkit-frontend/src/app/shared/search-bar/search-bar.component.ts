import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener,
  inject, OnDestroy, OnInit, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { IProduct } from '../../core/models';
import { formatPrice, getCategoryFallback } from '../utils';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="relative w-full" (keydown.escape)="close()">
      <div class="flex items-center bg-gray-100 rounded-xl px-4 py-2.5 gap-2 border border-transparent focus-within:border-[#0C831F] transition-colors">
        <svg class="w-4 h-4 text-[#666666] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          class="bg-transparent flex-1 text-sm outline-none placeholder:text-[#666666]"
          placeholder='Search "egg"'
          [(ngModel)]="query"
          (input)="onInput()"
          (keydown.enter)="onEnter()"
          (focus)="onFocus()"
        />
        @if (query) {
          <button class="text-gray-400 hover:text-gray-600" (click)="clear()">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        }
      </div>

      @if (open() && query.trim().length >= 2) {
        <div class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-[#E0E0E0] z-50 overflow-hidden">
          @if (loading()) {
            <div class="px-4 py-3 space-y-2">
              @for (_ of skeletons; track $index) {
                <div class="flex gap-3 items-center animate-pulse">
                  <div class="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0"></div>
                  <div class="flex-1 space-y-1.5">
                    <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div class="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (results().length === 0) {
            <div class="px-4 py-6 text-center text-sm text-[#666666]">
              No results for "{{ query }}"
            </div>
          } @else {
            <div class="py-2">
              <div class="px-4 py-1 text-xs font-semibold text-[#666666] uppercase tracking-wide">Products</div>
              @for (product of results(); track product.id) {
                <button
                  class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F8F8] text-left transition-colors"
                  (click)="goToProduct(product.id)"
                >
                  <div class="w-10 h-10 rounded-lg bg-gray-50 border border-[#E0E0E0] flex-shrink-0 overflow-hidden">
                    <img
                      [src]="product.imageUrl"
                      [alt]="product.name"
                      class="w-full h-full object-contain p-0.5"
                      loading="lazy"
                      (error)="onImgError($event, product.categoryName)"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-800 truncate">{{ product.name }}</div>
                    <div class="text-xs text-[#666666] flex items-center gap-2">
                      <span>{{ product.categoryName }}</span>
                      <span class="bg-[#0C831F] text-white text-[9px] font-bold px-1 py-0.5 rounded">🕐 8 MINS</span>
                    </div>
                  </div>
                  <div class="text-sm font-semibold text-gray-800 flex-shrink-0">{{ formatPrice(product.price) }}</div>
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SearchBarComponent implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly elRef = inject(ElementRef);
  private readonly search$ = new Subject<string>();

  query = '';
  readonly results = signal<IProduct[]>([]);
  readonly loading = signal(false);
  readonly open = signal(false);
  readonly skeletons = Array(4);
  readonly formatPrice = formatPrice;

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.trim().length < 2) { this.results.set([]); this.loading.set(false); return of(null); }
        this.loading.set(true);
        return this.productService.getProducts({ search: q, pageSize: 8 }).pipe(
          catchError(() => of(null))
        );
      })
    ).subscribe(res => {
      this.loading.set(false);
      this.results.set(res?.items ?? []);
    });
  }

  ngOnDestroy(): void {
    this.search$.complete();
  }

  onInput(): void {
    this.open.set(true);
    this.search$.next(this.query);
  }

  onFocus(): void {
    if (this.query.trim().length >= 2) this.open.set(true);
  }

  onEnter(): void {
    if (this.query.trim()) {
      this.close();
      this.router.navigate(['/products'], { queryParams: { q: this.query.trim() } });
    }
  }

  goToProduct(id: string): void {
    this.close();
    this.router.navigate(['/product', id]);
  }

  clear(): void {
    this.query = '';
    this.results.set([]);
    this.open.set(false);
  }

  close(): void {
    this.open.set(false);
  }

  onImgError(event: Event, category: string): void {
    (event.target as HTMLImageElement).src = getCategoryFallback(category);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(e.target)) this.close();
  }
}
