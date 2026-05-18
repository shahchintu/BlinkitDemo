import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ProductService } from '../../core/services/product.service';
import { ICategory, IProduct } from '../../core/models';
import { HeroBannerComponent } from './hero-banner/hero-banner.component';
import { CategoryStripComponent } from './category-strip/category-strip.component';
import { OffersStripComponent } from './offers-strip/offers-strip.component';
import { BrandStoresStripComponent } from './brand-stores-strip/brand-stores-strip.component';
import { ProductCardComponent } from '../products/product-card/product-card.component';

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
    MatIconModule,
    HeroBannerComponent,
    CategoryStripComponent,
    OffersStripComponent,
    BrandStoresStripComponent,
    ProductCardComponent,
  ],
  template: `
    <div class="bg-[#F8F8F8] min-h-screen pb-8">
      <app-category-strip />
      <app-hero-banner />

      <!-- Category-wise product sections -->
      <div class="max-w-[1400px] mx-auto">
        @for (section of categorySections(); track section.category.id) {
          <div class="mb-10">

            <!-- Section header -->
            <div class="flex items-center justify-between px-4 py-3">
              <h2 class="text-[22px] font-bold text-[#1A1A1A]">{{ section.category.name }}</h2>
              <a [routerLink]="['/products']"
                 [queryParams]="{ category: section.category.id }"
                 class="text-[14px] font-semibold text-[#0C831F] hover:underline flex items-center gap-0.5">
                See all
                <mat-icon class="text-[16px] leading-none">chevron_right</mat-icon>
              </a>
            </div>

            <!-- Skeleton loading -->
            @if (section.isLoading) {
              <div class="flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide">
                @for (i of skeletons; track $index) {
                  <div class="w-[175px] h-[280px] flex-shrink-0 bg-[#F2F2F2] rounded-[16px] animate-pulse"></div>
                }
              </div>
            }

            <!-- Products horizontal scroll -->
            @if (!section.isLoading && section.products.length > 0) {
              <div class="flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide">
                @for (product of section.products; track product.id) {
                  <div class="w-[175px] flex-shrink-0">
                    <app-product-card [product]="product" />
                  </div>
                }
              </div>
            }

          </div>
        }
      </div>

      <app-offers-strip />
      <app-brand-stores-strip />
    </div>
  `,
})
export class HomeComponent implements OnInit {
  private readonly productService = inject(ProductService);

  readonly categorySections = signal<CategorySection[]>([]);
  readonly skeletons = Array(5);

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
