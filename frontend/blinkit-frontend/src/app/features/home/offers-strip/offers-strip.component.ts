import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface OfferCard { title: string; sub: string; code: string; bg: string; }

@Component({
  selector: 'app-offers-strip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="px-4 mt-6">
      <h2 class="text-lg font-bold mb-3">Top Offers</h2>
      <div class="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        @for (offer of offers; track offer.code) {
          <a
            routerLink="/offers"
            class="flex-shrink-0 w-52 rounded-2xl p-4 text-white hover:opacity-90 transition-opacity cursor-pointer"
            [style.background]="offer.bg"
          >
            <div class="text-base font-bold leading-tight">{{ offer.title }}</div>
            <div class="text-xs text-white/80 mt-1">{{ offer.sub }}</div>
            <div class="mt-2 text-xs font-bold bg-white/20 rounded-lg px-2 py-1 w-fit">
              Use: {{ offer.code }}
            </div>
          </a>
        }
      </div>
    </div>
  `,
})
export class OffersStripComponent {
  readonly offers: OfferCard[] = [
    { title: '50% off your first order', sub: 'New users only · Up to ₹100 off', code: 'WELCOME50', bg: 'linear-gradient(135deg, #E65100, #FF8F00)' },
    { title: '10% off sitewide', sub: 'Min order ₹199 · Up to ₹100 off', code: 'BLINKIT10', bg: 'linear-gradient(135deg, #1565C0, #42A5F5)' },
    { title: '5% extra savings', sub: 'Min order ₹300 · Bank offer', code: 'BANK5',     bg: 'linear-gradient(135deg, #6A1B9A, #AB47BC)' },
    { title: 'Free delivery on us', sub: 'No minimum order value', code: 'FREESHIP',  bg: 'linear-gradient(135deg, #0C831F, #43A047)' },
  ];
}
