import {
  ChangeDetectionStrategy, Component, EventEmitter, inject, OnInit, Output, signal,
} from '@angular/core';
import { ProductService } from '../../../core/services/product.service';
import { ICategory } from '../../../core/models';

@Component({
  selector: 'app-category-strip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 mt-6">
      <h2 class="text-base font-bold text-[#1A1A1A] mb-3">Shop by Category</h2>
      <div class="flex gap-3 overflow-x-auto scrollbar-hide pb-2">

        @if (loading()) {
          @for (_ of skeletons; track $index) {
            <div class="flex-shrink-0 w-20 flex flex-col items-center gap-2 animate-pulse">
              <div class="w-20 h-20 rounded-xl bg-gray-200"></div>
              <div class="h-2.5 w-14 bg-gray-200 rounded"></div>
            </div>
          }
        } @else {
          <!-- All card -->
          <button
            class="flex-shrink-0 w-20 flex flex-col items-center gap-1.5 group"
            (click)="select(null)"
          >
            <div class="w-20 h-20 rounded-xl shadow-sm border-2 flex flex-col items-center justify-center transition-colors relative"
              [class]="selected() === null ? 'border-[#0C831F] bg-green-50' : 'border-transparent bg-white group-hover:border-[#0C831F]'">
              <span class="text-2xl">🛒</span>
            </div>
            <span class="text-[10px] font-semibold text-center w-20 leading-tight"
              [class]="selected() === null ? 'text-[#0C831F]' : 'text-gray-600'">All</span>
          </button>

          @for (cat of categories(); track cat.id) {
            <button
              class="flex-shrink-0 w-20 flex flex-col items-center gap-1.5 group"
              (click)="select(cat.id)"
            >
              <div class="w-20 h-20 rounded-xl shadow-sm border-2 overflow-hidden flex items-center justify-center transition-colors relative"
                [class]="selected() === cat.id ? 'border-[#0C831F] bg-green-50' : 'border-transparent bg-white group-hover:border-[#0C831F]'">
                <img [src]="cat.iconUrl" [alt]="cat.name"
                  class="w-12 h-12 object-contain" loading="lazy" />
                @if (cat.productCount > 0) {
                  <span class="absolute top-1 right-1 bg-[#0C831F] text-white text-[8px] font-bold rounded-full px-1 py-0.5 leading-none">
                    {{ cat.productCount }}
                  </span>
                }
              </div>
              <span class="text-[10px] font-semibold text-center w-20 leading-tight line-clamp-2"
                [class]="selected() === cat.id ? 'text-[#0C831F]' : 'text-gray-600'">{{ cat.name }}</span>
            </button>
          }
        }
      </div>
    </div>
  `,
})
export class CategoryStripComponent implements OnInit {
  @Output() categorySelected = new EventEmitter<string | null>();

  private readonly productService = inject(ProductService);

  readonly categories = signal<ICategory[]>([]);
  readonly loading = signal(true);
  readonly selected = signal<string | null>(null);
  readonly skeletons = Array(10);

  ngOnInit(): void {
    this.productService.getCategories().subscribe({
      next: cats => { this.categories.set(cats); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  select(id: string | null): void {
    this.selected.set(id);
    this.categorySelected.emit(id);
  }
}
