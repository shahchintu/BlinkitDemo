import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HeroBannerComponent } from './hero-banner/hero-banner.component';
import { CategoryStripComponent } from './category-strip/category-strip.component';
import { FeaturedProductsComponent } from './featured-products/featured-products.component';
import { OffersStripComponent } from './offers-strip/offers-strip.component';
import { BrandStoresStripComponent } from './brand-stores-strip/brand-stores-strip.component';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeroBannerComponent,
    CategoryStripComponent,
    FeaturedProductsComponent,
    OffersStripComponent,
    BrandStoresStripComponent,
  ],
  template: `
    <div class="bg-[#F8F8F8] min-h-screen pb-8">
      <app-hero-banner />
      <app-category-strip (categorySelected)="onCategorySelected($event)" />
      <app-featured-products [selectedCategoryId]="selectedCategory()" />
      <app-offers-strip />
      <app-brand-stores-strip />
    </div>
  `,
})
export class HomeComponent {
  readonly selectedCategory = signal<string | null>(null);

  onCategorySelected(id: string | null): void {
    this.selectedCategory.set(id);
  }
}
