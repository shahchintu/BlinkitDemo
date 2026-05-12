import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { IAddress } from '../../../core/models';

interface Profile {
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  hasBlinkitPlus: boolean;
}

type Section = 'profile' | 'addresses';

@Component({
  selector: 'app-account',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavbarComponent, FooterComponent, ReactiveFormsModule, RouterLink, MatSnackBarModule],
  template: `
    <app-navbar />
    <main class="min-h-screen bg-[#F8F8F8]">
      <div class="max-w-4xl mx-auto px-4 py-6 grid md:grid-cols-[240px_1fr] gap-6">

        <!-- Sidebar -->
        <aside class="bg-white rounded-xl border border-[#E0E0E0] p-4 self-start">
          <!-- Avatar -->
          <div class="w-14 h-14 rounded-full bg-[#0C831F] text-white flex items-center justify-center text-xl font-black mx-auto">
            {{ initials() }}
          </div>
          <p class="text-center font-semibold text-sm mt-2">{{ profile()?.fullName }}</p>
          <p class="text-center text-xs text-[#666666]">{{ profile()?.email }}</p>

          <!-- Nav links -->
          <nav class="mt-4 space-y-1">
            <button
              class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              [class]="section() === 'profile' ? 'bg-[#0C831F]/10 text-[#0C831F]' : 'text-[#1A1A1A] hover:bg-gray-50'"
              (click)="section.set('profile')">
              👤 Profile
            </button>
            <a routerLink="/orders"
              class="block px-3 py-2 rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors">
              📦 My Orders
            </a>
            <button
              class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              [class]="section() === 'addresses' ? 'bg-[#0C831F]/10 text-[#0C831F]' : 'text-[#1A1A1A] hover:bg-gray-50'"
              (click)="loadAddresses(); section.set('addresses')">
              📍 Addresses
            </button>
            <a routerLink="/account/blinkit-plus"
              class="block px-3 py-2 rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors">
              ⭐ Blinkit Plus
            </a>
          </nav>
        </aside>

        <!-- Right panel -->
        <div class="bg-white rounded-xl border border-[#E0E0E0] p-6">

          <!-- PROFILE section -->
          @if (section() === 'profile') {
            <h2 class="text-lg font-bold mb-4">Profile</h2>

            @if (loadingProfile()) {
              <div class="space-y-3 animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                <div class="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            } @else if (editing()) {
              <!-- Edit form -->
              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-4 max-w-sm">
                <div>
                  <label class="block text-xs font-medium text-[#666666] mb-1">Full Name</label>
                  <input formControlName="fullName" type="text"
                    class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F] transition-colors" />
                  @if (profileForm.get('fullName')?.invalid && profileForm.get('fullName')?.touched) {
                    <p class="text-xs text-[#F44336] mt-1">Min 2 characters required</p>
                  }
                </div>
                <div>
                  <label class="block text-xs font-medium text-[#666666] mb-1">Email (read-only)</label>
                  <input [value]="profile()?.email" type="email" readonly
                    class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm bg-gray-50 text-[#666666]" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-[#666666] mb-1">Phone</label>
                  <input formControlName="phone" type="tel"
                    class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F] transition-colors" />
                  @if (profileForm.get('phone')?.invalid && profileForm.get('phone')?.touched) {
                    <p class="text-xs text-[#F44336] mt-1">Enter a valid 10-digit number</p>
                  }
                </div>
                <div class="flex gap-2 pt-1">
                  <button type="submit"
                    class="bg-[#0C831F] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    [disabled]="profileForm.invalid || saving()">
                    {{ saving() ? 'Saving...' : 'Save' }}
                  </button>
                  <button type="button"
                    class="border border-[#E0E0E0] text-sm px-5 py-2 rounded-xl hover:border-[#0C831F] transition-colors"
                    (click)="editing.set(false)">
                    Cancel
                  </button>
                </div>
              </form>
            } @else {
              <!-- Display mode -->
              <div class="space-y-3 text-sm">
                <div>
                  <p class="text-xs text-[#666666]">Full Name</p>
                  <p class="font-medium">{{ profile()?.fullName }}</p>
                </div>
                <div>
                  <p class="text-xs text-[#666666]">Email</p>
                  <p class="font-medium">{{ profile()?.email }}</p>
                </div>
                <div>
                  <p class="text-xs text-[#666666]">Phone</p>
                  <p class="font-medium">{{ profile()?.phone || '—' }}</p>
                </div>
              </div>
              <button
                class="mt-4 border border-[#0C831F] text-[#0C831F] px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#0C831F] hover:text-white transition-colors"
                (click)="startEdit()">
                Edit Profile
              </button>
            }
          }

          <!-- ADDRESSES section -->
          @if (section() === 'addresses') {
            <h2 class="text-lg font-bold mb-4">Addresses</h2>

            @if (loadingAddresses()) {
              <div class="space-y-2 animate-pulse">
                <div class="h-16 bg-gray-200 rounded-xl"></div>
                <div class="h-16 bg-gray-200 rounded-xl"></div>
              </div>
            } @else {
              @for (addr of addresses(); track addr.id) {
                <div class="border border-[#E0E0E0] rounded-xl p-3 mb-3">
                  <div class="flex justify-between items-start">
                    <div>
                      <span class="inline-block text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded-full mb-1">
                        {{ addr.label }}
                      </span>
                      @if (addr.isDefault) {
                        <span class="ml-1 inline-block text-xs font-semibold bg-[#0C831F]/10 text-[#0C831F] px-2 py-0.5 rounded-full">Default</span>
                      }
                      <p class="text-sm text-[#1A1A1A]">{{ addr.street }}, {{ addr.city }} - {{ addr.pincode }}</p>
                    </div>
                    <div class="flex gap-2 flex-shrink-0 ml-2">
                      @if (!addr.isDefault) {
                        <button class="text-xs text-[#0C831F] hover:underline" (click)="setDefault(addr.id)">Set Default</button>
                      }
                      <button class="text-xs text-[#F44336] hover:underline" (click)="deleteAddress(addr.id)">Delete</button>
                    </div>
                  </div>
                </div>
              }
              @if (addresses().length === 0) {
                <p class="text-sm text-[#666666] mb-4">No addresses saved yet.</p>
              }

              <!-- Add new address -->
              @if (!showAddForm()) {
                <button
                  class="border border-dashed border-[#0C831F] text-[#0C831F] w-full py-3 rounded-xl text-sm font-medium hover:bg-[#0C831F]/5 transition-colors"
                  (click)="showAddForm.set(true)">
                  + Add New Address
                </button>
              } @else {
                <form [formGroup]="addressForm" (ngSubmit)="addAddress()" class="space-y-3 mt-4 border-t border-[#E0E0E0] pt-4">
                  <h3 class="font-semibold text-sm">New Address</h3>
                  @for (field of addressFields; track field.ctrl) {
                    <div>
                      <label class="block text-xs font-medium text-[#666666] mb-1">{{ field.label }}</label>
                      <input [formControlName]="field.ctrl" [placeholder]="field.placeholder"
                        class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F] transition-colors" />
                    </div>
                  }
                  <div class="flex gap-2">
                    <button type="submit"
                      class="bg-[#0C831F] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                      [disabled]="addressForm.invalid || savingAddress()">
                      {{ savingAddress() ? 'Saving...' : 'Save Address' }}
                    </button>
                    <button type="button"
                      class="border border-[#E0E0E0] text-sm px-5 py-2 rounded-xl hover:border-[#0C831F] transition-colors"
                      (click)="showAddForm.set(false)">
                      Cancel
                    </button>
                  </div>
                </form>
              }
            }
          }
        </div>
      </div>
    </main>
    <app-footer />
  `,
})
export class AccountComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);

  readonly section = signal<Section>('profile');
  readonly profile = signal<Profile | null>(null);
  readonly addresses = signal<IAddress[]>([]);
  readonly loadingProfile = signal(true);
  readonly loadingAddresses = signal(false);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly showAddForm = signal(false);
  readonly savingAddress = signal(false);

  readonly profileForm = new FormGroup({
    fullName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    phone: new FormControl('', [Validators.pattern(/^\d{10}$/)]),
  });

  readonly addressForm = new FormGroup({
    label: new FormControl('', [Validators.required]),
    street: new FormControl('', [Validators.required]),
    city: new FormControl('', [Validators.required]),
    pincode: new FormControl('', [Validators.required, Validators.pattern(/^\d{6}$/)]),
  });

  readonly addressFields = [
    { ctrl: 'label', label: 'Label', placeholder: 'Home / Work / Other' },
    { ctrl: 'street', label: 'Street', placeholder: '123 MG Road' },
    { ctrl: 'city', label: 'City', placeholder: 'Mumbai' },
    { ctrl: 'pincode', label: 'Pincode', placeholder: '400001' },
  ];

  ngOnInit(): void {
    this.http.get<Profile>('/api/account/profile').subscribe({
      next: p => { this.profile.set(p); this.loadingProfile.set(false); },
      error: () => this.loadingProfile.set(false),
    });
  }

  initials(): string {
    const name = this.profile()?.fullName ?? '';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  startEdit(): void {
    const p = this.profile();
    if (p) {
      this.profileForm.setValue({ fullName: p.fullName, phone: p.phone ?? '' });
    }
    this.editing.set(true);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.saving.set(true);
    const { fullName, phone } = this.profileForm.value;
    this.http.patch('/api/account/profile', { fullName, phone }).subscribe({
      next: () => {
        this.profile.update(p => p ? { ...p, fullName: fullName!, phone: phone ?? null } : p);
        this.editing.set(false);
        this.saving.set(false);
        this.snackBar.open('✓ Profile updated', '', { duration: 2000 });
      },
      error: () => this.saving.set(false),
    });
  }

  loadAddresses(): void {
    if (this.addresses().length > 0) return;
    this.loadingAddresses.set(true);
    this.http.get<IAddress[]>('/api/addresses').subscribe({
      next: list => { this.addresses.set(list); this.loadingAddresses.set(false); },
      error: () => this.loadingAddresses.set(false),
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
