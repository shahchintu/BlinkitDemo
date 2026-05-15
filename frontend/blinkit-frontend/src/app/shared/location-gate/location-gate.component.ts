import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad',
  'Chennai', 'Pune', 'Kolkata', 'Jaipur', 'Surat',
];

@Component({
  selector: 'app-location-gate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center px-6 overflow-y-auto py-8">

      <!-- Yellow pill logo -->
      <div class="mb-8">
        <div class="bg-[#F8C200] px-4 py-1.5 rounded-lg">
          <span class="text-[#0C831F] italic font-black text-3xl tracking-tight">blinkit</span>
        </div>
      </div>

      <!-- Heading -->
      <h1 class="text-[28px] font-bold text-[#1A1A1A] text-center">Where should we deliver?</h1>
      <p class="text-[#666666] text-center mt-2 mb-8 text-sm max-w-[360px]">
        Select your location to see products available in your area
      </p>

      <!-- Detect location -->
      <button
        class="w-full max-w-[400px] bg-[#0C831F] text-white rounded-[12px] h-[52px] font-semibold flex items-center justify-center gap-2 hover:bg-[#0a6b19] transition-colors disabled:opacity-60 mb-4"
        (click)="detectLocation()"
        [disabled]="detecting()"
      >
        @if (detecting()) {
          <span>Detecting location...</span>
        } @else {
          <span>📍 Use my current location</span>
        }
      </button>

      @if (geoError()) {
        <p class="text-[#F44336] text-xs mb-4 text-center max-w-[400px]">{{ geoError() }}</p>
      }

      <!-- Divider -->
      <div class="flex items-center gap-3 w-full max-w-[400px] mb-4">
        <div class="flex-1 h-px bg-[#E0E0E0]"></div>
        <span class="text-[#666666] text-xs">or search your area</span>
        <div class="flex-1 h-px bg-[#E0E0E0]"></div>
      </div>

      <!-- Pincode / search input -->
      <div class="flex gap-2 w-full max-w-[400px] mb-6">
        <input
          type="text"
          placeholder="Enter 6-digit pincode"
          maxlength="6"
          inputmode="numeric"
          [formControl]="pincodeCtrl"
          class="flex-1 border-2 border-[#E0E0E0] rounded-[12px] px-4 h-[52px] text-[16px] outline-none focus:border-[#0C831F] transition-colors"
        />
        <button
          class="bg-[#0C831F] text-white rounded-[12px] px-5 h-[52px] text-sm font-semibold hover:bg-[#0a6b19] transition-colors disabled:opacity-50"
          [disabled]="pincodeCtrl.invalid"
          (click)="submitPincode()"
        >Go</button>
      </div>

      <!-- City pills -->
      <p class="text-xs text-[#666666] mb-3 font-medium text-center">Popular cities</p>
      <div class="flex flex-wrap gap-2 justify-center max-w-[500px]">
        @for (city of cities; track city) {
          <button
            class="border border-[#E0E0E0] rounded-full px-4 py-2 text-[14px] cursor-pointer hover:border-[#0C831F] hover:text-[#0C831F] transition-colors font-medium"
            (click)="selectCity(city)"
          >{{ city }}</button>
        }
      </div>
    </div>
  `,
})
export class LocationGateComponent {
  readonly locationSelected = output<void>();

  private readonly router = inject(Router);

  readonly detecting = signal(false);
  readonly geoError = signal('');

  readonly pincodeCtrl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^\d{6}$/),
  ]);

  readonly cities = CITIES;

  detectLocation(): void {
    if (!navigator.geolocation) {
      this.geoError.set('Geolocation is not supported by your browser.');
      return;
    }
    this.detecting.set(true);
    this.geoError.set('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.detecting.set(false);
        const city = this.cityFromCoords(pos.coords.latitude, pos.coords.longitude);
        this.save({ city, pincode: '' });
      },
      () => {
        this.detecting.set(false);
        this.geoError.set('Location access denied. Please select a city below.');
      },
    );
  }

  selectCity(city: string): void {
    this.save({ city, pincode: '' });
  }

  submitPincode(): void {
    if (this.pincodeCtrl.valid) {
      this.save({ city: '', pincode: this.pincodeCtrl.value ?? '' });
    }
  }

  private save(location: { city: string; pincode: string }): void {
    try {
      localStorage.setItem('userLocation', JSON.stringify(location));
    } catch {
      // storage unavailable (private browsing quota, etc.) — proceed anyway
    }
    this.locationSelected.emit();
    this.router.navigate(['/']);
  }

  private cityFromCoords(lat: number, lng: number): string {
    if (lat > 28.0 && lat < 29.5 && lng > 76.5 && lng < 77.8) return 'Delhi';
    if (lat > 18.8 && lat < 19.5 && lng > 72.7 && lng < 73.2) return 'Mumbai';
    if (lat > 12.8 && lat < 13.2 && lng > 77.4 && lng < 77.8) return 'Bangalore';
    if (lat > 17.2 && lat < 17.6 && lng > 78.3 && lng < 78.7) return 'Hyderabad';
    if (lat > 22.8 && lat < 23.2 && lng > 72.4 && lng < 72.8) return 'Ahmedabad';
    if (lat > 12.9 && lat < 13.2 && lng > 80.1 && lng < 80.4) return 'Chennai';
    if (lat > 18.4 && lat < 18.7 && lng > 73.7 && lng < 74.0) return 'Pune';
    if (lat > 22.4 && lat < 22.7 && lng > 88.2 && lng < 88.6) return 'Kolkata';
    if (lat > 26.8 && lat < 27.0 && lng > 75.7 && lng < 75.9) return 'Jaipur';
    if (lat > 21.1 && lat < 21.3 && lng > 72.8 && lng < 73.0) return 'Surat';
    return 'Mumbai';
  }
}
