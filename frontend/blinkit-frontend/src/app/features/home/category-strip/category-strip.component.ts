import {
  ChangeDetectionStrategy, Component, EventEmitter, inject, OnInit, Output, signal,
} from '@angular/core';
import { ProductService } from '../../../core/services/product.service';
import { ImageService } from '../../../core/services/image.service';
import { ICategory } from '../../../core/models';
import { resolveImageUrl } from '../../../shared/utils';

@Component({
  selector: 'app-category-strip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white border-b border-[#F0F0F0]
                sticky top-[64px] z-40">
      <div class="max-w-[1400px] mx-auto px-4">
        <div class="flex items-center overflow-x-auto
                    scrollbar-hide gap-0 py-1">

          @if (loading()) {
            @for (_ of skeletons; track $index) {
              <div class="flex-shrink-0 flex flex-col items-center gap-1
                          px-4 py-3 min-w-[80px] animate-pulse">
                <div class="w-12 h-12 rounded-full bg-gray-200"></div>
                <div class="h-2.5 w-14 bg-gray-200 rounded mt-1"></div>
              </div>
            }
          } @else {

            <!-- All pill -->
            <button
              [class]="'flex flex-col items-center gap-1 px-4 py-3
                        cursor-pointer transition flex-shrink-0 border-b-2 ' +
                        (selected() === null
                          ? 'border-[#0C831F]'
                          : 'border-transparent hover:bg-[#F8F8F8]')"
              (click)="select(null)">
              <div class="w-12 h-12 rounded-full bg-[#F8F8F8]
                          flex items-center justify-center">
                <span class="material-icons text-[22px] text-[#666]">grid_view</span>
              </div>
              <span [class]="'text-[11px] font-semibold text-center ' +
                             (selected() === null ? 'text-[#0C831F]' : 'text-[#1A1A1A]')">
                All
              </span>
            </button>

            @for (cat of categories(); track cat.id) {
              <button
                [class]="'flex flex-col items-center gap-1 px-3 py-3
                          cursor-pointer transition flex-shrink-0
                          min-w-[72px] border-b-2 ' +
                          (selected() === cat.id
                            ? 'border-[#0C831F]'
                            : 'border-transparent hover:bg-[#F8F8F8]')"
                (click)="select(cat.id)">

                <div class="w-12 h-12 rounded-full overflow-hidden
                            border-2 border-[#F0F0F0] flex-shrink-0 bg-[#F8F8F8]">
                  <img [src]="resolveImageUrl(categoryImages()[cat.id] || cat.iconUrl, cat.name)"
                       [alt]="cat.name"
                       loading="lazy"
                       class="w-full h-full object-cover">
                </div>

                <span [class]="'text-[11px] font-semibold text-center
                                leading-tight max-w-[72px] ' +
                                (selected() === cat.id ? 'text-[#0C831F]' : 'text-[#1A1A1A]')">
                  {{ cat.name }}
                </span>
              </button>
            }

          }
        </div>
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
  protected readonly resolveImageUrl = resolveImageUrl;

  ngOnInit(): void {
    this.productService.getCategories().subscribe({
      next: cats => {
        this.categories.set(cats);
        this.loading.set(false);
        cats.forEach(cat => {
          // Pass existing iconUrl — uploaded images (/uploads/) are returned
          // immediately and never replaced by an Unsplash result.
          this.imageService.getCategoryImage(cat.name, cat.id, cat.iconUrl).subscribe(url => {
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
