import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { IAddress } from '../../../core/models';

@Component({
  selector: 'app-account-addresses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatSnackBarModule, MatIconModule],
  template: `
    <div class="bg-white rounded-[16px] border border-[#E0E0E0] p-6">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-[20px] font-bold text-[#1A1A1A]">Saved Addresses</h2>
        @if (!showAddForm()) {
          <button
            class="border border-[#0C831F] text-[#0C831F] rounded-[8px] px-4 py-2 text-[13px] font-semibold hover:bg-[#F0FFF4] transition-colors"
            (click)="showAddForm.set(true)">Add New +</button>
        }
      </div>

      @if (loading()) {
        <div class="space-y-3 animate-pulse">
          @for (_ of [1,2]; track $index) {
            <div class="h-20 bg-gray-100 rounded-[12px]"></div>
          }
        </div>
      } @else {

        <!-- Address cards -->
        @for (addr of addresses(); track addr.id) {
          <div class="bg-white border border-[#E0E0E0] rounded-[12px] p-4 mb-3 flex items-start gap-3">
            <mat-icon class="text-[#0C831F] flex-shrink-0 mt-0.5">location_on</mat-icon>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="bg-[#F0FFF4] text-[#0C831F] text-[11px] font-bold px-2 py-0.5 rounded-[4px]">
                  {{ addr.label }}
                </span>
                @if (addr.isDefault) {
                  <span class="text-[11px] text-[#0C831F] font-semibold">Default</span>
                }
              </div>
              <p class="text-[14px] text-[#1A1A1A] mt-1">
                {{ addr.street }}, {{ addr.city }} - {{ addr.pincode }}
              </p>
            </div>
            <div class="ml-auto flex gap-3 flex-shrink-0 items-center">
              @if (!addr.isDefault) {
                <button class="text-[13px] text-[#0C831F] cursor-pointer hover:underline"
                  (click)="setDefault(addr.id)">Default</button>
              }
              <button class="text-[13px] text-[#F44336] cursor-pointer hover:underline"
                (click)="deleteAddress(addr.id)">Delete</button>
            </div>
          </div>
        }

        @if (addresses().length === 0 && !showAddForm()) {
          <div class="text-center py-12">
            <p class="text-[48px]">📍</p>
            <p class="text-[16px] font-semibold text-[#1A1A1A] mt-3">No addresses saved</p>
            <p class="text-[13px] text-[#666666] mt-1">Add a delivery address to get started</p>
          </div>
        }

        <!-- Add address form -->
        @if (showAddForm()) {
          <div class="border border-[#E0E0E0] rounded-[12px] p-5 mt-2">
            <p class="font-bold text-[15px] text-[#1A1A1A] mb-4">New Address</p>
            <form [formGroup]="addressForm" (ngSubmit)="addAddress()" class="space-y-3">
              @for (field of addressFields; track field.ctrl) {
                <div>
                  <label class="block text-[12px] font-medium text-[#666666] mb-1">{{ field.label }}</label>
                  <input [formControlName]="field.ctrl" [placeholder]="field.placeholder"
                    class="w-full border border-[#E0E0E0] rounded-[10px] px-4 h-[44px] text-[14px] outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/10 transition-colors" />
                </div>
              }
              <div class="flex gap-2 pt-1">
                <button type="submit"
                  class="bg-[#0C831F] text-white rounded-[10px] px-5 h-[40px] text-[14px] font-semibold hover:bg-[#0a6b19] transition-colors disabled:opacity-50"
                  [disabled]="addressForm.invalid || savingAddress()">
                  {{ savingAddress() ? 'Saving...' : 'Save Address' }}
                </button>
                <button type="button"
                  class="border border-[#E0E0E0] rounded-[10px] px-5 h-[40px] text-[14px] hover:border-[#0C831F] transition-colors"
                  (click)="showAddForm.set(false)">Cancel</button>
              </div>
            </form>
          </div>
        }
      }
    </div>
  `,
})
export class AccountAddressesComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);

  readonly addresses = signal<IAddress[]>([]);
  readonly loading = signal(true);
  readonly showAddForm = signal(false);
  readonly savingAddress = signal(false);

  readonly addressForm = new FormGroup({
    label:   new FormControl('', [Validators.required]),
    street:  new FormControl('', [Validators.required]),
    city:    new FormControl('', [Validators.required]),
    pincode: new FormControl('', [Validators.required, Validators.pattern(/^\d{6}$/)]),
  });

  readonly addressFields = [
    { ctrl: 'label',   label: 'Label',   placeholder: 'Home / Work / Other' },
    { ctrl: 'street',  label: 'Street',  placeholder: '123 MG Road' },
    { ctrl: 'city',    label: 'City',    placeholder: 'Mumbai' },
    { ctrl: 'pincode', label: 'Pincode', placeholder: '400001' },
  ];

  ngOnInit(): void {
    this.http.get<IAddress[]>('/api/addresses').subscribe({
      next: list => { this.addresses.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  addAddress(): void {
    if (this.addressForm.invalid) return;
    this.savingAddress.set(true);
    const { label, street, city, pincode } = this.addressForm.value;
    this.http.post<IAddress>('/api/addresses', { label, street, city, pincode }).subscribe({
      next: addr => {
        this.addresses.update(list => [...list, addr]);
        this.addressForm.reset();
        this.showAddForm.set(false);
        this.savingAddress.set(false);
        this.snackBar.open('✓ Address added', '', { duration: 2000 });
      },
      error: () => this.savingAddress.set(false),
    });
  }

  deleteAddress(id: string): void {
    this.http.delete(`/api/addresses/${id}`).subscribe({
      next: () => this.addresses.update(list => list.filter(a => a.id !== id)),
    });
  }

  setDefault(id: string): void {
    this.http.patch(`/api/addresses/${id}/set-default`, {}).subscribe({
      next: () => this.addresses.update(list =>
        list.map(a => ({ ...a, isDefault: a.id === id }))
      ),
    });
  }
}
