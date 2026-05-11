import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { pincodeValid } from '../utils';

const CITIES = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Surat', state: 'Gujarat' },
];

@Component({
  selector: 'app-location-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatInputModule, MatFormFieldModule],
  template: `
    <div class="p-6 w-80">
      <h2 class="text-lg font-semibold mb-4">Select Delivery Location</h2>

      <mat-form-field class="w-full mb-4">
        <mat-label>Enter Pincode</mat-label>
        <input matInput [formControl]="pincodeCtrl" placeholder="6-digit pincode" maxlength="6" />
        @if (pincodeCtrl.invalid && pincodeCtrl.touched) {
          <mat-error>Enter a valid 6-digit pincode</mat-error>
        }
      </mat-form-field>

      <p class="text-sm text-[#666666] mb-3">Or select a city</p>
      <div class="grid grid-cols-2 gap-2">
        @for (loc of cities; track loc.city) {
          <button
            class="text-sm border border-[#E0E0E0] rounded-lg px-3 py-2 text-left hover:border-[#0C831F] hover:text-[#0C831F] transition-colors"
            (click)="selectCity(loc)"
          >
            {{ loc.city }}
          </button>
        }
      </div>
    </div>
  `,
})
export class LocationSelectorComponent {
  private readonly dialogRef = inject(MatDialogRef<LocationSelectorComponent>);

  readonly cities = CITIES;
  readonly pincodeCtrl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^\d{6}$/),
  ]);

  selectCity(loc: { city: string; state: string }): void {
    const data = { city: loc.city, state: loc.state, pincode: '' };
    localStorage.setItem('userLocation', JSON.stringify(data));
    this.dialogRef.close(data);
  }
}
