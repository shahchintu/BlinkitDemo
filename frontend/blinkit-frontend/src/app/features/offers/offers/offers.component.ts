import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface CouponDto {
  code: string;
  discountType: 'Percent' | 'Flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  validFor: 'All' | 'NewUsers';
}

interface BankOffer {
  emoji: string;
  bank: string;
  offer: string;
  code: string | null;
}

const BANK_OFFERS: BankOffer[] = [
  { emoji: '🏦', bank: 'HDFC Bank', offer: '10% off with HDFC Credit Cards · Max ₹150', code: 'HDFC10' },
  { emoji: '🔷', bank: 'Axis Bank', offer: '10% off with Axis Neo Card · Max ₹100', code: 'AXIS10' },
  { emoji: '📱', bank: 'Paytm UPI', offer: '₹50 cashback on Paytm UPI · Min ₹299', code: null },
  { emoji: '🛒', bank: 'Amazon Pay', offer: '₹75 Amazon Pay cashback · Min ₹499', code: null },
];

@Component({
  selector: 'app-offers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="min-h-screen bg-[#F8F8F8]">
      <div class="max-w-6xl mx-auto px-4 py-8">
        <h1 class="text-2xl font-bold text-[#1A1A1A] mb-6">Offers & Coupons</h1>

        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            @for (_ of skeletons; track $index) {
              <div class="h-44 bg-white rounded-xl border border-[#E0E0E0] animate-pulse"></div>
            }
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            @for (coupon of coupons(); track coupon.code) {
              <div class="bg-white rounded-xl border-2 border-dashed border-[#0C831F] p-5">
                <div class="flex items-center justify-between mb-3">
                  <span class="bg-[#0C831F]/10 text-[#0C831F] font-mono font-bold text-sm px-3 py-1.5 rounded-lg">
                    {{ coupon.code }}
                  </span>
                  <button
                    class="border border-[#0C831F] text-[#0C831F] text-xs px-3 py-1.5 rounded-lg hover:bg-[#0C831F]/5 transition-colors min-w-[90px] text-center"
                    (click)="copyCode(coupon.code)">
                    {{ copiedCode() === coupon.code ? '✓ Copied!' : 'Copy Code' }}
                  </button>
                </div>

                <p class="text-lg font-bold text-[#1A1A1A] mb-1">
                  @if (coupon.code === 'FREESHIP') {
                    Free Delivery on all orders
                  } @else if (coupon.discountType === 'Percent') {
                    {{ coupon.discountValue }}% off
                    @if (coupon.maxDiscountAmount) { up to ₹{{ coupon.maxDiscountAmount }} }
                  } @else {
                    ₹{{ coupon.discountValue }} off instantly
                  }
                </p>

                <p class="text-sm text-[#666666] mb-1">
                  Min. order ₹{{ coupon.minOrderAmount }}
                  @if (coupon.validFor === 'NewUsers') { · New users only }
                </p>

                <p class="text-sm text-[#4CAF50] font-medium mb-2">
                  Save up to ₹{{ coupon.maxDiscountAmount ?? coupon.discountValue }}
                </p>

                <button class="text-xs text-[#666666] underline cursor-pointer hover:text-[#0C831F] transition-colors"
                  (click)="toggleTerms(coupon.code)">
                  Terms & Conditions
                </button>
                @if (expandedTerms() === coupon.code) {
                  <p class="text-xs text-[#666666] mt-1 leading-relaxed">
                    Offer valid on minimum purchase. Cannot be combined with other offers.
                  </p>
                }
              </div>
            }
          </div>
        }

        <!-- Bank Offers -->
        <div class="mt-4">
          <h2 class="text-xl font-bold text-[#1A1A1A] mb-4">Bank & Payment Offers</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (offer of bankOffers; track offer.bank) {
              <div class="bg-white rounded-xl border border-[#E0E0E0] p-4 flex items-start gap-3">
                <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  {{ offer.emoji }}
                </div>
                <div>
                  <p class="font-semibold text-sm text-[#1A1A1A]">{{ offer.bank }}</p>
                  <p class="text-sm text-[#666666] mb-1">{{ offer.offer }}</p>
                  @if (offer.code) {
                    <span class="bg-[#0C831F]/10 text-[#0C831F] font-mono text-xs px-2 py-0.5 rounded">{{ offer.code }}</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OffersComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly coupons = signal<CouponDto[]>([]);
  readonly loading = signal(true);
  readonly copiedCode = signal<string | null>(null);
  readonly expandedTerms = signal<string | null>(null);
  readonly skeletons = Array(6);

  readonly bankOffers = BANK_OFFERS;

  ngOnInit(): void {
    this.http.get<CouponDto[]>('/api/coupons').subscribe({
      next: c => { this.coupons.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.copiedCode.set(code);
      setTimeout(() => this.copiedCode.set(null), 2000);
    });
  }

  toggleTerms(code: string): void {
    this.expandedTerms.set(this.expandedTerms() === code ? null : code);
  }
}
