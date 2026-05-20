import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocationService, UserLocation } from '../../core/services/location.service';

@Component({
  selector: 'app-location-gate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center px-6 py-8 page-enter">

      <!-- Blinkit Logo -->
      <div class="mb-8">
        <div class="bg-[#F8C200] rounded-[14px] px-5 py-2.5 inline-block">
          <span class="text-[#0C831F] font-black italic text-[32px] leading-none">blinkit</span>
        </div>
      </div>

      <!-- Main content card -->
      <div class="bg-white rounded-[24px] w-full max-w-[420px] border border-[#F0F0F0] shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-8">

        @if (step() === 'initial') {
          <div class="text-center">
            <div class="w-20 h-20 bg-[#F0FFF4] rounded-full flex items-center justify-center mx-auto mb-5">
              <span class="material-icons text-[40px] text-[#0C831F]">location_on</span>
            </div>
            <h1 class="text-[24px] font-black text-[#1A1A1A] mb-2 leading-tight">
              Where should we<br>deliver?
            </h1>
            <p class="text-[14px] text-[#666] mb-6 leading-relaxed">
              We'll show you products and offers<br>available at your location
            </p>

            <button
              (click)="onAllowLocation()"
              [disabled]="isDetecting()"
              class="w-full bg-[#0C831F] text-white rounded-[14px] h-[54px] font-bold text-[16px] mb-3 flex items-center justify-center gap-2 hover:bg-[#0a6b19] transition btn-press disabled:opacity-70 disabled:cursor-not-allowed">
              @if (isDetecting()) {
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Detecting location...</span>
              } @else {
                <span class="material-icons text-[20px]">my_location</span>
                <span>Allow location access</span>
              }
            </button>

            <div class="flex items-center gap-3 mb-3">
              <div class="flex-1 h-px bg-[#F0F0F0]"></div>
              <span class="text-[12px] text-[#999] font-medium">OR</span>
              <div class="flex-1 h-px bg-[#F0F0F0]"></div>
            </div>

            <button
              (click)="step.set('pincode')"
              class="w-full border-2 border-[#E0E0E0] rounded-[14px] h-[54px] font-semibold text-[15px] text-[#1A1A1A] hover:border-[#0C831F] hover:text-[#0C831F] transition btn-press">
              Enter pincode manually
            </button>

            @if (gpsDenied()) {
              <div class="mt-4 bg-[#FFF3E0] rounded-[10px] p-3 flex items-start gap-2">
                <span class="material-icons text-[#F57C00] text-[18px] flex-shrink-0">info</span>
                <p class="text-[12px] text-[#E65100] text-left leading-snug">
                  Location access denied. Please enable location in browser settings or enter your pincode below.
                </p>
              </div>
            }
          </div>
        }

        @if (step() === 'pincode') {
          <div>
            <button
              (click)="step.set('initial')"
              class="flex items-center gap-1 text-[#666] text-[13px] mb-5 hover:text-[#1A1A1A] transition cursor-pointer">
              <span class="material-icons text-[18px]">arrow_back</span>
              Back
            </button>

            <h2 class="text-[20px] font-bold text-[#1A1A1A] mb-1">Enter your pincode</h2>
            <p class="text-[13px] text-[#666] mb-5">We'll find stores near you</p>

            <div class="relative mb-3">
              <input
                type="tel"
                inputmode="numeric"
                maxlength="6"
                placeholder="Enter 6-digit pincode"
                [(ngModel)]="pincodeValue"
                (input)="onPincodeInput($event)"
                (keyup.enter)="onPincodeSubmit()"
                class="w-full border-2 rounded-[14px] h-[54px] px-4 text-[16px] font-semibold text-[#1A1A1A] outline-none transition tracking-[4px]"
                [class.border-[#F44336]]="pincodeError()"
                [class.border-[#E0E0E0]]="!pincodeError()"
                [class.focus:border-[#0C831F]]="!pincodeError()" />
              @if (pincodeValue.length > 0) {
                <button
                  (click)="pincodeValue = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#1A1A1A]">
                  <span class="material-icons text-[20px]">close</span>
                </button>
              }
            </div>

            @if (pincodeError()) {
              <p class="text-[12px] text-[#F44336] mb-3 flex items-center gap-1">
                <span class="material-icons text-[14px]">error_outline</span>
                {{ pincodeError() }}
              </p>
            }

            <button
              (click)="onPincodeSubmit()"
              [disabled]="pincodeValue.length !== 6 || isLoading()"
              class="w-full bg-[#0C831F] text-white rounded-[14px] h-[54px] font-bold text-[16px] flex items-center justify-center gap-2 hover:bg-[#0a6b19] transition btn-press disabled:opacity-50 disabled:cursor-not-allowed">
              @if (isLoading()) {
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              } @else {
                Confirm Location
              }
            </button>

            <div class="mt-6">
              <p class="text-[12px] text-[#999] font-semibold uppercase tracking-wide mb-3">Popular cities</p>
              <div class="flex flex-wrap gap-2">
                @for (city of popularCities; track city.name) {
                  <button
                    (click)="onCitySelect(city)"
                    class="border border-[#E0E0E0] rounded-full px-4 py-1.5 text-[13px] font-medium text-[#1A1A1A] hover:border-[#0C831F] hover:text-[#0C831F] hover:bg-[#F0FFF4] transition">
                    {{ city.name }}
                  </button>
                }
              </div>
            </div>
          </div>
        }

        @if (step() === 'success') {
          <div class="text-center">
            <div class="w-20 h-20 bg-[#F0FFF4] rounded-full flex items-center justify-center mx-auto mb-5">
              <span class="material-icons text-[40px] text-[#0C831F]">check_circle</span>
            </div>
            <h2 class="text-[22px] font-bold text-[#1A1A1A] mb-2">Location confirmed!</h2>
            <p class="text-[15px] text-[#0C831F] font-semibold mb-1">{{ detectedLocation()?.fullAddress }}</p>
            <p class="text-[13px] text-[#666] mb-6">Delivery in 8 minutes 🚀</p>

            <button
              (click)="onConfirm()"
              class="w-full bg-[#0C831F] text-white rounded-[14px] h-[54px] font-bold text-[16px] hover:bg-[#0a6b19] transition btn-press">
              Start Shopping →
            </button>

            <button
              (click)="step.set('pincode')"
              class="mt-3 text-[13px] text-[#666] hover:text-[#0C831F] transition block w-full">
              Change location
            </button>
          </div>
        }

      </div>

      <p class="text-[11px] text-[#999] text-center mt-6 max-w-[300px]">
        Your location helps us show products available for delivery in your area
      </p>
    </div>
  `,
})
export class LocationGateComponent {
  readonly locationSelected = output<void>();

  private readonly locationService = inject(LocationService);

  readonly step = signal<'initial' | 'pincode' | 'success'>('initial');
  readonly isDetecting = signal(false);
  readonly isLoading = signal(false);
  readonly gpsDenied = signal(false);
  readonly pincodeError = signal<string | null>(null);
  readonly detectedLocation = signal<UserLocation | null>(null);

  pincodeValue = '';

  readonly popularCities = [
    { name: 'Mumbai',    pincode: '400001' },
    { name: 'Delhi',     pincode: '110001' },
    { name: 'Bangalore', pincode: '560001' },
    { name: 'Ahmedabad', pincode: '380001' },
    { name: 'Hyderabad', pincode: '500001' },
    { name: 'Chennai',   pincode: '600001' },
    { name: 'Pune',      pincode: '411001' },
    { name: 'Kolkata',   pincode: '700001' },
    { name: 'Jaipur',    pincode: '302001' },
    { name: 'Surat',     pincode: '395001' },
  ];

  onAllowLocation(): void {
    this.isDetecting.set(true);
    this.gpsDenied.set(false);
    this.locationService.detectGPSLocation().subscribe({
      next: loc => {
        this.detectedLocation.set(loc);
        this.isDetecting.set(false);
        this.step.set('success');
      },
      error: () => {
        this.isDetecting.set(false);
        this.gpsDenied.set(true);
        setTimeout(() => this.step.set('pincode'), 1500);
      },
    });
  }

  onPincodeInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.pincodeValue = val.replace(/\D/g, '').slice(0, 6);
    this.pincodeError.set(null);
  }

  onPincodeSubmit(): void {
    if (this.pincodeValue.length !== 6) {
      this.pincodeError.set('Please enter a valid 6-digit pincode');
      return;
    }
    this.isLoading.set(true);
    this.locationService.lookupPincode(this.pincodeValue).subscribe({
      next: loc => {
        this.detectedLocation.set(loc);
        this.isLoading.set(false);
        this.step.set('success');
      },
      error: () => {
        this.isLoading.set(false);
        this.pincodeError.set('Pincode not found. Try a nearby pincode.');
      },
    });
  }

  onCitySelect(city: { name: string; pincode: string }): void {
    this.pincodeValue = city.pincode;
    this.onPincodeSubmit();
  }

  onConfirm(): void {
    const loc = this.detectedLocation();
    if (loc) this.locationService.saveLocation(loc);
    this.locationSelected.emit();
  }
}
