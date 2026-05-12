import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  signal,
} from '@angular/core';
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

      <!-- Logo -->
      <div class="flex items-center gap-2 mb-8">
        <div class="w-10 h-10 bg-[#0C831F] rounded-xl flex items-center justify-center">
          <span class="text-white font-black text-xl">B</span>
        </div>
        <span class="text-2xl font-black text-[#0C831F]">blinkit</span>
      </div>

      <!-- Heading -->
      <h1 class="text-2xl font-bold text-[#1A1A1A] text-center">Delivery in 10 minutes</h1>
      <p class="text-[#666666] text-center mt-2 mb-8 text-sm">
        Select your delivery location to see products near you
      </p>

      <!-- Detect location -->
      <button
        class="w-full max-w-sm bg-[#0C831F] text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-60 mb-4"
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
        <p class="text-[#F44336] text-xs mb-4 text-center max-w-sm">{{ geoError() }}</p>
      }

      <!-- Divider -->
      <div class="flex items-center gap-3 w-full max-w-sm mb-4">
        <div class="flex-1 h-px bg-[#E0E0E0]"></div>
        <span class="text-[#666666] text-xs">or</span>
        <div class="flex-1 h-px bg-[#E0E0E0]"></div>
      </div>

      <!-- Pincode input -->
      <div class="flex gap-2 w-full max-w-sm mb-6">
        <input
          type="text"
          placeholder="Enter 6-digit pincode"
          maxlength="6"
          inputmode="numeric"
          [formControl]="pincodeCtrl"
          class="flex-1 border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0C831F] transition-colors"
        />
        <button
          class="bg-[#0C831F] text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
          [disabled]="pincodeCtrl.invalid"
          (click)="submitPincode()"
        >Go</button>
      </div>

      <!-- City list -->
      <p class="text-xs text-[#666666] mb-3 self-start w-full max-w-sm font-medium">Popular cities</p>
      <div class="grid grid-cols-2 gap-2 w-full max-w-sm">
        @for (city of cities; track city) {
          <button
            class="text-sm border border-[#E0E0E0] rounded-xl px-3 py-2.5 text-left hover:border-[#0C831F] hover:text-[#0C831F] transition-colors font-medium"
            (click)="selectCity(city)"
          >{{ city }}</button>
        }
      </div>
    </div>
  `,
})
export class LocationGateComponent {
  @Output() readonly locationSelected = new EventEmitter<void>();

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
    localStorage.setItem('userLocation', JSON.stringify(location));
    this.locationSelected.emit();
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
