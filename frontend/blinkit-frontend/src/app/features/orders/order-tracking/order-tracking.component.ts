import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TrackingData, TrackingService } from '../../../core/services/tracking.service';
import { DeliveryMapComponent } from '../../../shared/components/delivery-map/delivery-map.component';
import { formatPrice } from '../../../shared/utils';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DeliveryMapComponent, RouterLink],
  template: `
    <div class="max-w-[680px] mx-auto px-4 py-6 pb-16">

        <!-- Loading state -->
        @if (isLoading()) {
          <div class="bg-white rounded-[20px] p-6">
            <div class="h-6 w-1/2 rounded bg-gray-100 animate-pulse mb-4"></div>
            <div class="h-[280px] rounded-[16px] bg-gray-100 animate-pulse mb-4"></div>
            <div class="h-20 rounded-[12px] bg-gray-100 animate-pulse"></div>
          </div>
        }

        @if (!isLoading() && trackingData()) {

          <!-- TOP HEADER CARD -->
          <div class="bg-white rounded-[20px] overflow-hidden mb-4 shadow-sm">

            <!-- Green header bar -->
            <div class="bg-[#0C831F] px-5 py-4 flex items-center justify-between">
              <div>
                <p class="text-white/80 text-[12px] font-medium">
                  Order #{{ orderId().slice(-8).toUpperCase() }}
                </p>
                <p class="text-white text-[18px] font-bold mt-0.5">
                  {{ getStatusMessage() }}
                </p>
              </div>

              @if (trackingData()!.estimatedMinutes > 0 && trackingData()!.status !== 'Delivered') {
                <div class="bg-white/20 rounded-full w-16 h-16 flex flex-col items-center justify-center border-2 border-white/40">
                  <span class="text-white text-[20px] font-black leading-none">
                    {{ trackingData()!.estimatedMinutes }}
                  </span>
                  <span class="text-white/80 text-[9px] font-semibold uppercase tracking-wide">mins</span>
                </div>
              }

              @if (trackingData()!.status === 'Delivered') {
                <div class="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center border-2 border-white/40">
                  <span class="text-[32px]">✅</span>
                </div>
              }
            </div>

            <!-- 4-step progress tracker -->
            <div class="px-5 py-4 border-b border-[#F5F5F5]">
              <div class="flex items-center">
                @for (step of trackingSteps; track step.status; let last = $last) {

                  <!-- Step node -->
                  <div class="flex flex-col items-center gap-1">
                    <div [class]="'w-8 h-8 rounded-full flex items-center justify-center ' + getStepClass(step.status)">
                      @if (isStepCompleted(step.status)) {
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      } @else if (isStepActive(step.status)) {
                        <div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      } @else {
                        <div class="w-2 h-2 bg-white/60 rounded-full"></div>
                      }
                    </div>
                    <span [class]="'text-[10px] font-semibold text-center max-w-[56px] leading-tight ' + (isStepActive(step.status) || isStepCompleted(step.status) ? 'text-[#0C831F]' : 'text-[#999]')">
                      {{ step.label }}
                    </span>
                  </div>

                  <!-- Connector line -->
                  @if (!last) {
                    <div [class]="'flex-1 h-[2px] mb-5 mx-1 ' + (isStepCompleted(step.status) ? 'bg-[#0C831F]' : 'bg-[#E0E0E0]')"></div>
                  }
                }
              </div>
            </div>

            <!-- MAP -->
            <div class="p-4">
              <app-delivery-map
                [trackingData]="trackingData()!"
                mapId="order-tracking-map"
              />

              <!-- Map legend -->
              <div class="flex items-center justify-center gap-6 mt-3">
                <div class="flex items-center gap-1.5">
                  <span class="text-[16px]">🏪</span>
                  <span class="text-[11px] text-[#666] font-medium">Store</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-[16px]">🛵</span>
                  <span class="text-[11px] text-[#666] font-medium">Delivery Partner</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-[16px]">📍</span>
                  <span class="text-[11px] text-[#666] font-medium">Your Location</span>
                </div>
              </div>
            </div>

          </div>

          <!-- DELIVERY PARTNER CARD -->
          @if (trackingData()!.deliveryPartner && trackingData()!.status !== 'Placed') {
            <div class="bg-white rounded-[20px] p-5 mb-4 shadow-sm">
              <p class="text-[13px] font-semibold text-[#999] uppercase tracking-wide mb-3">
                Your Delivery Partner
              </p>
              <div class="flex items-center gap-4">

                <!-- Avatar -->
                <div class="w-14 h-14 rounded-full bg-[#0C831F] flex items-center justify-center flex-shrink-0 border-2 border-[#E8F5E9]">
                  <span class="text-white text-[22px] font-black">
                    {{ trackingData()!.deliveryPartner.initialsAvatar }}
                  </span>
                </div>

                <!-- Info -->
                <div class="flex-1">
                  <p class="text-[16px] font-bold text-[#1A1A1A]">
                    {{ trackingData()!.deliveryPartner.name }}
                  </p>
                  <div class="flex items-center gap-1 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-[#F8C200] fill-[#F8C200]" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span class="text-[13px] text-[#666]">4.8 · 1,200+ deliveries</span>
                  </div>
                </div>

                <!-- Call button -->
                <a
                  [href]="'tel:' + trackingData()!.deliveryPartner.phone"
                  class="w-12 h-12 rounded-full bg-[#F0FFF4] border border-[#C8E6C9] flex items-center justify-center hover:bg-[#0C831F] hover:border-[#0C831F] transition group"
                  aria-label="Call delivery partner"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-[#0C831F] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
                  </svg>
                </a>

              </div>
            </div>
          }

          <!-- STORE INFO CARD -->
          <div class="bg-white rounded-[20px] p-5 mb-4 shadow-sm">
            <p class="text-[13px] font-semibold text-[#999] uppercase tracking-wide mb-3">
              Fulfilling From
            </p>
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-full bg-[#F0FFF4] flex items-center justify-center flex-shrink-0">
                <span class="text-[20px]">🏪</span>
              </div>
              <div>
                <p class="text-[15px] font-semibold text-[#1A1A1A]">
                  {{ trackingData()!.darkStore.name }}
                </p>
                <p class="text-[13px] text-[#666] mt-0.5">
                  {{ trackingData()!.darkStore.address }}
                </p>
              </div>
            </div>
          </div>

          <!-- DELIVERY ADDRESS CARD -->
          <div class="bg-white rounded-[20px] p-5 mb-4 shadow-sm">
            <p class="text-[13px] font-semibold text-[#999] uppercase tracking-wide mb-3">
              Delivering To
            </p>
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-full bg-[#FFEBEE] flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-[#F44336]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p class="text-[15px] font-semibold text-[#1A1A1A]">Home</p>
                <p class="text-[13px] text-[#666] mt-0.5">
                  {{ trackingData()!.customerLocation.address }}
                </p>
              </div>
            </div>
          </div>

          <!-- BACK TO ORDERS -->
          <a
            routerLink="/orders"
            class="flex items-center justify-center gap-2 text-[14px] font-semibold text-[#0C831F] py-4 hover:underline transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to My Orders
          </a>

        }

    </div>
  `,
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly trackingService = inject(TrackingService);

  readonly fmt = formatPrice;
  readonly orderId = signal('');
  readonly trackingData = signal<TrackingData | null>(null);
  readonly isLoading = signal(true);

  private subscription?: Subscription;

  readonly trackingSteps = [
    { status: 'Placed',         label: 'Order\nPlaced' },
    { status: 'Packed',         label: 'Being\nPacked' },
    { status: 'OutForDelivery', label: 'On the\nWay' },
    { status: 'Delivered',      label: 'Delivered' },
  ];

  private readonly statusOrder = ['Placed', 'Packed', 'OutForDelivery', 'Delivered'];

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'] as string;
    this.orderId.set(id);
    this.startPolling(id);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private getStatusIndex(status: string): number {
    return this.statusOrder.indexOf(status);
  }

  isStepCompleted(stepStatus: string): boolean {
    const current = this.trackingData()?.status ?? '';
    return this.getStatusIndex(stepStatus) < this.getStatusIndex(current);
  }

  isStepActive(stepStatus: string): boolean {
    return this.trackingData()?.status === stepStatus;
  }

  getStepClass(stepStatus: string): string {
    if (this.isStepCompleted(stepStatus)) return 'bg-[#0C831F]';
    if (this.isStepActive(stepStatus))    return 'bg-[#0C831F] ring-4 ring-[#0C831F]/20';
    return 'bg-[#E0E0E0]';
  }

  getStatusMessage(): string {
    const minutes = this.trackingData()?.estimatedMinutes ?? 8;
    switch (this.trackingData()?.status) {
      case 'Placed':         return 'Order confirmed, preparing your items';
      case 'Packed':         return 'Items packed, assigning delivery partner';
      case 'OutForDelivery': return `Arriving in ~${minutes} minutes`;
      case 'Delivered':      return 'Order delivered! Enjoy your order 🎉';
      default:               return 'Processing your order...';
    }
  }

  private startPolling(orderId: string): void {
    this.subscription = this.trackingService.pollTracking(orderId).subscribe({
      next: (data) => {
        this.trackingData.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}
