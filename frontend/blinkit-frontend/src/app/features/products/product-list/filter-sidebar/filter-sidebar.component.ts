import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, OnChanges, SimpleChanges
} from '@angular/core';
import { ICategory } from '../../../../core/models';

export interface FilterState {
  categoryId: string | null;
  minPrice: number;
  maxPrice: number;
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'name_asc' | 'discount';
}

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-[16px] border border-[#E0E0E0] p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-[16px] font-bold text-[#1A1A1A]">Filter</h3>
        @if (hasActiveFilters()) {
          <button class="text-[13px] text-[#0C831F] cursor-pointer hover:underline" (click)="clearAll()">
            Clear All
          </button>
        }
      </div>

      <!-- Categories -->
      <div class="mb-4">
        <p class="text-[13px] font-semibold text-[#666666] uppercase tracking-wide mb-2">Categories</p>
        <div class="space-y-0.5">

          <!-- All -->
          <div class="flex items-center gap-2 py-2 cursor-pointer" (click)="selectCategory(null)">
            <div class="w-4 h-4 border-2 rounded-full flex items-center justify-center flex-shrink-0"
              [class]="selectedCategoryId() === null ? 'border-[#0C831F]' : 'border-[#CCCCCC]'">
              @if (selectedCategoryId() === null) {
                <div class="w-2 h-2 rounded-full bg-[#0C831F]"></div>
              }
            </div>
            <span class="text-[14px] text-[#1A1A1A]">All</span>
          </div>

          @for (cat of categories; track cat.id) {
            <div class="flex items-center gap-2 py-2 cursor-pointer" (click)="selectCategory(cat.id)">
              <div class="w-4 h-4 border-2 rounded-full flex items-center justify-center flex-shrink-0"
                [class]="selectedCategoryId() === cat.id ? 'border-[#0C831F]' : 'border-[#CCCCCC]'">
                @if (selectedCategoryId() === cat.id) {
                  <div class="w-2 h-2 rounded-full bg-[#0C831F]"></div>
                }
              </div>
              <span class="text-[14px] text-[#1A1A1A] leading-tight">{{ cat.name }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Price Range -->
      <div class="mt-4 border-t border-[#F2F2F2] pt-4">
        <p class="text-[13px] font-semibold text-[#666666] uppercase tracking-wide mb-2">Price Range</p>
        <p class="text-[13px] text-[#1A1A1A] mb-3">₹{{ minPrice() }} — ₹{{ maxPrice() }}</p>
        <input
          type="range"
          min="0"
          max="2000"
          step="10"
          [value]="maxPrice()"
          (input)="onPriceInput($event)"
          class="w-full accent-[#0C831F] cursor-pointer"
        />
        <div class="flex justify-between text-[11px] text-[#999999] mt-1">
          <span>₹0</span>
          <span>₹2000</span>
        </div>
      </div>

      <!-- Sort By -->
      <div class="mt-4 border-t border-[#F2F2F2] pt-4">
        <p class="text-[13px] font-semibold text-[#666666] uppercase tracking-wide mb-2">Sort By</p>
        <div class="space-y-0.5">
          @for (opt of sortOptions; track opt.value) {
            <div class="flex items-center gap-2 py-2 cursor-pointer" (click)="selectSort(opt.value)">
              <div class="w-4 h-4 border-2 rounded-full flex items-center justify-center flex-shrink-0"
                [class]="selectedSort() === opt.value ? 'border-[#0C831F]' : 'border-[#CCCCCC]'">
                @if (selectedSort() === opt.value) {
                  <div class="w-2 h-2 rounded-full bg-[#0C831F]"></div>
                }
              </div>
              <span class="text-[14px] text-[#1A1A1A]">{{ opt.label }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class FilterSidebarComponent implements OnChanges {
  @Input() categories: ICategory[] = [];
  @Input() currentFilters!: FilterState;
  @Output() filtersChanged = new EventEmitter<FilterState>();

  selectedCategoryId = signal<string | null>(null);
  selectedSort = signal<FilterState['sortBy']>('relevance');
  minPrice = signal<number>(0);
  maxPrice = signal<number>(2000);

  readonly sortOptions: { label: string; value: FilterState['sortBy'] }[] = [
    { label: 'Relevance',          value: 'relevance' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Name: A to Z',       value: 'name_asc' },
    { label: 'Discount',           value: 'discount' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentFilters'] && this.currentFilters) {
      this.selectedCategoryId.set(this.currentFilters.categoryId);
      this.selectedSort.set(this.currentFilters.sortBy);
      this.minPrice.set(this.currentFilters.minPrice);
      this.maxPrice.set(this.currentFilters.maxPrice);
    }
  }

  hasActiveFilters(): boolean {
    return this.selectedCategoryId() !== null
      || this.minPrice() > 0
      || this.maxPrice() < 2000
      || this.selectedSort() !== 'relevance';
  }

  selectCategory(id: string | null): void {
    this.selectedCategoryId.set(id);
    this.emitFilters();
  }

  onPriceInput(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.onPriceChange(0, val);
  }

  onPriceChange(min: number, max: number): void {
    this.minPrice.set(min);
    this.maxPrice.set(max);
    this.emitFilters();
  }

  selectSort(sort: FilterState['sortBy']): void {
    this.selectedSort.set(sort);
    this.emitFilters();
  }

  clearAll(): void {
    this.selectedCategoryId.set(null);
    this.selectedSort.set('relevance');
    this.minPrice.set(0);
    this.maxPrice.set(2000);
    this.emitFilters();
  }

  emitFilters(): void {
    this.filtersChanged.emit({
      categoryId: this.selectedCategoryId(),
      minPrice: this.minPrice(),
      maxPrice: this.maxPrice(),
      sortBy: this.selectedSort(),
    });
  }
}
