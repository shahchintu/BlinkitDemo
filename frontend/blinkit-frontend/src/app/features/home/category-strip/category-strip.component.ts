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
    <div class="px-4 mt-4">
      <div class="flex gap-3 overflow-x-auto scrollbar-hide pb-2">

        @if (loading()) {
          @for (_ of skeletons; track $index) {
            <div class="flex-shrink-0 flex flex-col items-center gap-1 animate-pulse">
              <div class="w-16 h-16 rounded-2xl bg-gray-200"></div>
              <div class="h-2.5 w-14 bg-gray-200 rounded"></div>
            </div>
          }
        } @else {
          <!-- All pill -->
          <button
            class="flex-shrink-0 flex flex-col items-center gap-1 group"
            (click)="select(null)"
          >
            <div class="w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl transition-colors"
              [class]="selected() === null ? 'border-[#0C831F] bg-green-50' : 'border-[#E0E0E0] bg-[#F8F8F8] group-hover:border-[#0C831F]'">
              🛒
            </div>
            <span class="text-[10px] font-medium text-center w-16 leading-tight"
              [class]="selected() === null ? 'text-[#0C831F]' : 'text-gray-600'">All</span>
          </button>

          @for (cat of categories(); track cat.id) {
            <button
              class="flex-shrink-0 flex flex-col items-center gap-1 group"
              (click)="select(cat.id)"
            >
              <div class="w-16 h-16 rounded-2xl border-2 overflow-hidden transition-colors"
                [class]="selected() === cat.id ? 'border-[#0C831F] bg-green-50' : 'border-[#E0E0E0] bg-[#F8F8F8] group-hover:border-[#0C831F]'">
                <img [src]="cat.iconUrl" [alt]="cat.name"
                  class="w-full h-full object-contain p-1" loading="lazy" />
              </div>
              <span class="text-[10px] font-medium text-center w-16 leading-tight line-clamp-2"
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
