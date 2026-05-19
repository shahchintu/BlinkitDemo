import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';

interface Slide {
  id: number;
  tag: string;
  headline: string;
  cta: string;
  gradient: string;
  shapeColor: string;
}

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden rounded-[20px] mx-4 mt-4 mb-2"
         style="height:200px">

      <!-- Slides -->
      @for (slide of slides; track slide.id; let i = $index) {
        <div [class]="'absolute inset-0 transition-opacity duration-500 ' +
                      (currentSlide() === i ? 'opacity-100' : 'opacity-0')"
             [style.background]="slide.gradient">

          <div class="flex items-center h-full px-10 gap-8">
            <!-- Text content -->
            <div class="flex-1">
              <p class="text-[#F8C200] text-[13px] font-bold
                        uppercase tracking-wide mb-2">
                {{ slide.tag }}
              </p>
              <h2 class="text-white text-[28px] font-black
                         leading-tight mb-3 max-w-[280px]"
                  style="white-space:pre-line">
                {{ slide.headline }}
              </h2>
              <button class="bg-white text-[#1A1A1A] rounded-[10px]
                             px-6 py-2.5 text-[14px] font-bold
                             hover:bg-[#F8F8F8] transition btn-press">
                {{ slide.cta }}
              </button>
            </div>

            <!-- Decorative shape -->
            <div class="flex-shrink-0 w-[160px] h-[160px]
                        opacity-20 rounded-full"
                 [style.background]="slide.shapeColor">
            </div>
          </div>
        </div>
      }

      <!-- Dot indicators -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        @for (slide of slides; track slide.id; let i = $index) {
          <button (click)="goToSlide(i)"
            [class]="'transition-all duration-300 rounded-full ' +
                      (currentSlide() === i
                        ? 'w-6 h-2 bg-white'
                        : 'w-2 h-2 bg-white/50')">
          </button>
        }
      </div>
    </div>
  `,
})
export class HeroBannerComponent implements OnInit, OnDestroy {
  readonly currentSlide = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  readonly slides: Slide[] = [
    {
      id: 1,
      tag: '⚡ Quick Commerce',
      headline: '10-minute\ndelivery',
      cta: 'Order Now →',
      gradient: 'linear-gradient(135deg, #0C831F 0%, #1DB954 100%)',
      shapeColor: '#ffffff',
    },
    {
      id: 2,
      tag: '🏦 Bank Offers',
      headline: '10% off with\nHDFC Cards',
      cta: 'Use Code: HDFC10',
      gradient: 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)',
      shapeColor: '#ffffff',
    },
    {
      id: 3,
      tag: '🎉 New User',
      headline: '50% off on\nfirst order',
      cta: 'Use Code: WELCOME50',
      gradient: 'linear-gradient(135deg, #E65100 0%, #FF9800 100%)',
      shapeColor: '#ffffff',
    },
  ];

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.currentSlide.update(i => (i + 1) % this.slides.length);
    }, 4000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
  }
}
