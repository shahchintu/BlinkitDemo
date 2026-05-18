import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

interface Brand { name: string; slug: string; emoji: string; bg: string; }

@Component({
  selector: 'app-brand-stores-strip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 mt-6 mb-4 max-w-[1400px] mx-auto">
      <h2 class="text-[22px] font-bold text-[#1A1A1A] mb-3">Brand Stores</h2>
      <div class="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        @for (brand of brands; track brand.slug) {
          <button
            class="flex-shrink-0 flex flex-col items-center gap-1.5 group"
            (click)="go(brand.slug)"
          >
            <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl border border-[#E0E0E0] bg-white group-hover:border-[#0C831F] transition-colors shadow-sm"
              [style.background]="brand.bg">
              {{ brand.emoji }}
            </div>
            <span class="text-xs font-medium text-gray-700 text-center w-20 leading-tight">{{ brand.name }}</span>
          </button>
        }
      </div>
    </div>
  `,
})
export class BrandStoresStripComponent {
  private readonly router = inject(Router);

  readonly brands: Brand[] = [
    { name: 'Amul',       slug: 'amul',       emoji: '🥛', bg: '#FFF9E6' },
    { name: "Haldiram's", slug: 'haldirams',   emoji: '🍿', bg: '#FFF3E0' },
    { name: 'Nestlé',     slug: 'nestle',      emoji: '🍫', bg: '#E8F5E9' },
    { name: "Lay's",      slug: 'lays',        emoji: '🥔', bg: '#FFFDE7' },
    { name: 'Britannia',  slug: 'britannia',   emoji: '🍞', bg: '#E3F2FD' },
    { name: 'Parle',      slug: 'parle',       emoji: '🍪', bg: '#FCE4EC' },
    { name: 'Himalaya',   slug: 'himalaya',    emoji: '🌿', bg: '#E8F5E9' },
    { name: 'Pedigree',   slug: 'pedigree',    emoji: '🐾', bg: '#FFF3E0' },
    { name: "Johnson's",  slug: 'johnsons',    emoji: '👶', bg: '#E0F7FA' },
    { name: 'Dettol',     slug: 'dettol',      emoji: '🧴', bg: '#E8F5E9' },
    { name: 'Coca-Cola',  slug: 'coca-cola',   emoji: '🥤', bg: '#FFEBEE' },
    { name: 'Maggi',      slug: 'maggi',       emoji: '🍜', bg: '#FFFDE7' },
  ];

  go(slug: string): void { this.router.navigate(['/brand', slug]); }
}
