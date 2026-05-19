import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-scrollable-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">

      <!-- LEFT ARROW — hidden on mobile, visible on md+ -->
      <button
        (click)="scrollLeft()"
        [class]="'hidden md:flex absolute left-0 top-1/2 -translate-y-1/2
                  -translate-x-1/2 z-10
                  w-9 h-9 bg-white rounded-full
                  border border-[#E0E0E0]
                  items-center justify-center
                  cursor-pointer
                  hover:border-[#CCC]
                  hover:shadow-[0_4px_16px_rgba(0,0,0,0.18)]
                  hover:scale-[1.08]
                  active:scale-[0.95]
                  transition-all duration-150 ' +
                  (showLeft()
                    ? 'opacity-100 scale-100 pointer-events-auto shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
                    : 'opacity-0 scale-[0.8] pointer-events-none shadow-none')">
        <span class="material-icons text-[20px] font-bold text-[#1A1A1A]">
          chevron_left
        </span>
      </button>

      <!-- SCROLLABLE CONTAINER -->
      <div
        #scrollContainer
        (scroll)="onScroll()"
        class="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 scroll-smooth">
        <ng-content></ng-content>
      </div>

      <!-- RIGHT ARROW — hidden on mobile, visible on md+ -->
      <button
        (click)="scrollRight()"
        [class]="'hidden md:flex absolute right-0 top-1/2 -translate-y-1/2
                  translate-x-1/2 z-10
                  w-9 h-9 bg-white rounded-full
                  border border-[#E0E0E0]
                  items-center justify-center
                  cursor-pointer
                  hover:border-[#CCC]
                  hover:shadow-[0_4px_16px_rgba(0,0,0,0.18)]
                  hover:scale-[1.08]
                  active:scale-[0.95]
                  transition-all duration-150 ' +
                  (showRight()
                    ? 'opacity-100 scale-100 pointer-events-auto shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
                    : 'opacity-0 scale-[0.8] pointer-events-none shadow-none')">
        <span class="material-icons text-[20px] font-bold text-[#1A1A1A]">
          chevron_right
        </span>
      </button>

    </div>
  `,
})
export class ScrollableRowComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') containerRef!: ElementRef<HTMLDivElement>;

  @Input() scrollAmount = 600;

  readonly showLeft = signal(false);
  readonly showRight = signal(true);

  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.checkArrows();
    this.resizeObserver = new ResizeObserver(() => this.checkArrows());
    this.resizeObserver.observe(this.containerRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  onScroll(): void {
    this.checkArrows();
  }

  scrollLeft(): void {
    this.containerRef.nativeElement.scrollBy({ left: -this.scrollAmount, behavior: 'smooth' });
  }

  scrollRight(): void {
    this.containerRef.nativeElement.scrollBy({ left: this.scrollAmount, behavior: 'smooth' });
  }

  private checkArrows(): void {
    const el = this.containerRef?.nativeElement;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    this.showLeft.set(scrollLeft > 10);
    this.showRight.set(scrollLeft + clientWidth < scrollWidth - 10);
  }
}
