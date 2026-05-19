import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { ICategory, IProduct } from '../../core/models';
import { HeroBannerComponent } from './hero-banner/hero-banner.component';
import { CategoryStripComponent } from './category-strip/category-strip.component';
import { OffersStripComponent } from './offers-strip/offers-strip.component';
import { BrandStoresStripComponent } from './brand-stores-strip/brand-stores-strip.component';
import { ProductCardComponent } from '../products/product-card/product-card.component';
import { ScrollableRowComponent } from '../../shared/components/scrollable-row/scrollable-row.component';

interface CategorySection {
  category: ICategory;
  products: IProduct[];
  isLoading: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    HeroBannerComponent,
    CategoryStripComponent,
    OffersStripComponent,
    BrandStoresStripComponent,
    ProductCardComponent,
    ScrollableRowComponent,
  ],
  template: `
    <div class="bg-[#F8F8F8] min-h-screen pb-8">
      <app-category-strip (categorySelected)="onCategorySelected($event)" />
      <app-hero-banner />

      <!-- Category-wise product sections -->
      <div class="max-w-[1400px] mx-auto">
        @for (section of categorySections(); track section.category.id) {
          <section class="mb-8">

            <!-- Section header -->
            <div class="flex items-center justify-between px-4 mb-3">
              <div class="flex items-center gap-2">
                <h2 class="text-[20px] font-bold text-[#1A1A1A]">
                  {{ section.category.name }}
                </h2>
                @if (!section.isLoading && section.products.length > 0) {
                  <span class="text-[13px] text-[#999] font-medium">
                    {{ section.products.length }} items
                  </span>
                }
              </div>
              <a [routerLink]="['/products']"
                 [queryParams]="{ category: section.category.id }"
                 class="flex items-center gap-0.5 text-[14px]
                        font-semibold text-[#0C831F] hover:underline
                        transition cursor-pointer">
                See all
                <span class="material-icons text-[18px]">chevron_right</span>
              </a>
            </div>

            <!-- Skeleton loading -->
            @if (section.isLoading) {
              <app-scrollable-row>
                @for (i of skeletons; track $index) {
                  <div class="w-[175px] flex-shrink-0">
                    <div class="skeleton h-[160px] rounded-[16px] mb-2"></div>
                    <div class="skeleton h-3 w-3/4 mb-1 rounded"></div>
                    <div class="skeleton h-4 w-full mb-2 rounded"></div>
                    <div class="skeleton h-8 w-full rounded-[8px]"></div>
                  </div>
                }
              </app-scrollable-row>
            }

            <!-- Products horizontal scroll -->
            @if (!section.isLoading && section.products.length > 0) {
              <app-scrollable-row [scrollAmount]="600">
                @for (product of section.products; track product.id) {
                  <div class="w-[175px] flex-shrink-0">
                    <app-product-card [product]="product" />
                  </div>
                }
              </app-scrollable-row>
            }

          </section>
        }
      </div>

      <app-offers-strip />
      <app-brand-stores-strip />
    </div>
  `,
})
export class HomeComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);

  readonly categorySections = signal<CategorySection[]>([]);
  readonly skeletons = Array(6);

  onCategorySelected(categoryId: string | null): void {
    if (categoryId) {
      this.router.navigate(['/products'], { queryParams: { category: categoryId } });
    } else {
      this.router.navigate(['/products']);
    }
  }

  ngOnInit(): void {
    this.productService.getCategories().subscribe(categories => {
      const topCategories = categories.slice(0, 6);

      topCategories.forEach(cat => {
        this.categorySections.update(sections => [
          ...sections,
          { category: cat, products: [], isLoading: true },
        ]);

        this.productService.getProducts({ categoryId: cat.id, pageSize: 10, page: 1 })
          .subscribe(result => {
            this.categorySections.update(sections =>
              sections.map(s =>
                s.category.id === cat.id
                  ? { ...s, products: result.items, isLoading: false }
                  : s
              )
            );
          });
      });
    });
  }
}
