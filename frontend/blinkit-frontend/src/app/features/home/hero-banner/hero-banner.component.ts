import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';

interface Slide { bg: string; headline: string; sub: string; cta: string; ctaLink: string; }

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden rounded-2xl mx-4 mt-4 h-40 md:h-52 lg:h-64">
      @for (slide of slides; track $index) {
        <div
          class="absolute inset-0 flex flex-col justify-center px-8 transition-opacity duration-700"
          [class.opacity-100]="activeIndex() === $index"
          [class.opacity-0]="activeIndex() !== $index"
          [style.background]="slide.bg"
        >
          <h2 class="text-white font-black text-2xl md:text-3xl lg:text-4xl drop-shadow">{{ slide.headline }}</h2>
          <p class="text-white/90 text-sm md:text-base mt-1 drop-shadow">{{ slide.sub }}</p>
          <a
            [href]="slide.ctaLink"
            class="mt-3 inline-flex items-center gap-1 bg-white text-[#0C831F] font-bold text-sm px-4 py-2 rounded-xl w-fit hover:bg-green-50 transition-colors shadow"
          >
            {{ slide.cta }} →
          </a>
        </div>
      }

      <!-- Dot indicators -->
      <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        @for (slide of slides; track $index) {
          <button
            class="rounded-full transition-all duration-300"
            [class]="activeIndex() === $index ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50'"
            (click)="goTo($index)"
          ></button>
        }
      </div>
    </div>
  `,
})
export class HeroBannerComponent implements OnInit, OnDestroy {
  readonly activeIndex = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  readonly slides: Slide[] = [
    {
      bg: 'linear-gradient(135deg, #F8C200 0%, #0C831F 100%)',
      headline: '10-minute delivery',
      sub: 'Groceries, fresh produce & more — at your door in minutes.',
      cta: 'Order Now',
      ctaLink: '/products',
    },
    {
      bg: 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)',
      headline: '10% off with HDFC Cards',
      sub: 'Use code HDFCBLINKIT on your next order. Min order ₹299.',
      cta: 'Shop Now',
      ctaLink: '/products',
    },
    {
      bg: 'linear-gradient(135deg, #E65100 0%, #FF8F00 100%)',
      headline: '50% off your first order',
      sub: 'New to Blinkit? Use code WELCOME50 and save up to ₹100.',
      cta: 'Get Offer',
      ctaLink: '/auth/register',
    },
  ];

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.activeIndex.update(i => (i + 1) % this.slides.length);
    }, 4000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  goTo(index: number): void {
    this.activeIndex.set(index);
  }
}
