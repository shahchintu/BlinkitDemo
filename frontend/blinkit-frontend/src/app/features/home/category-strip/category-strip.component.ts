import {
  ChangeDetectionStrategy, Component, EventEmitter, inject, OnInit, Output, signal,
} from '@angular/core';
import { ProductService } from '../../../core/services/product.service';
import { ImageService } from '../../../core/services/image.service';
import { ICategory } from '../../../core/models';

@Component({
  selector: 'app-category-strip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white border-b border-[#E0E0E0] sticky top-[64px] z-40">
      <div class="flex items-center overflow-x-auto scrollbar-hide max-w-[1200px] mx-auto px-4">

        @if (loading()) {
          @for (_ of skeletons; track $index) {
            <div class="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 min-w-[80px] animate-pulse">
              <div class="w-12 h-12 rounded-full bg-gray-200"></div>
              <div class="h-2.5 w-14 bg-gray-200 rounded"></div>
            </div>
          }
        } @else {
          <!-- All pill -->
          <button
            class="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 cursor-pointer relative min-w-[80px] transition-colors hover:bg-[#F8F8F8]"
            (click)="select(null)"
          >
            <div class="w-12 h-12 rounded-full bg-[#F8F8F8] flex items-center justify-center text-xl">
              🛒
            </div>
            <span class="text-[12px] font-semibold text-center leading-tight max-w-[72px]"
              [class]="selected() === null ? 'text-[#0C831F]' : 'text-[#1A1A1A]'">All</span>
            @if (selected() === null) {
              <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0C831F]"></div>
            }
          </button>

          @for (cat of categories(); track cat.id) {
            <button
              class="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 cursor-pointer relative min-w-[80px] transition-colors hover:bg-[#F8F8F8]"
              (click)="select(cat.id)"
            >
              <div class="w-12 h-12 rounded-full bg-[#F8F8F8] flex items-center justify-center overflow-hidden">
                <img [src]="categoryImages()[cat.id] || cat.iconUrl" [alt]="cat.name"
                  class="w-8 h-8 object-contain" loading="lazy" />
              </div>
              <span class="text-[12px] font-semibold text-center leading-tight max-w-[72px] line-clamp-2"
                [class]="selected() === cat.id ? 'text-[#0C831F]' : 'text-[#1A1A1A]'">{{ cat.name }}</span>
              @if (selected() === cat.id) {
                <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0C831F]"></div>
              }
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
  private readonly imageService = inject(ImageService);

  readonly categories = signal<ICategory[]>([]);
  readonly categoryImages = signal<Record<string, string>>({});
  readonly loading = signal(true);
  readonly selected = signal<string | null>(null);
  readonly skeletons = Array(10);

  ngOnInit(): void {
    this.productService.getCategories().subscribe({
      next: cats => {
        this.categories.set(cats);
        this.loading.set(false);
        cats.forEach(cat => {
          this.imageService.getCategoryImage(cat.name, cat.id).subscribe(url => {
            this.categoryImages.update(imgs => ({ ...imgs, [cat.id]: url }));
          });
        });
      },
      error: () => this.loading.set(false),
    });
  }

  select(id: string | null): void {
    this.selected.set(id);
    this.categorySelected.emit(id);
  }
}
