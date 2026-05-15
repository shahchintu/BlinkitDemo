import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface Profile {
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  hasBlinkitPlus: boolean;
}

@Component({
  selector: 'app-account-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatSnackBarModule],
  template: `
    <div class="bg-white rounded-[16px] border border-[#E0E0E0] p-6">
      <h2 class="text-[20px] font-bold text-[#1A1A1A] mb-6">Personal Information</h2>

      @if (loading()) {
        <div class="space-y-3 animate-pulse">
          @for (_ of [1,2,3]; track $index) {
            <div class="bg-[#F8F8F8] rounded-[12px] h-[72px]"></div>
          }
        </div>
      } @else {

        <!-- Full Name -->
        <div class="bg-[#F8F8F8] rounded-[12px] px-4 py-3 flex items-center justify-between mb-3">
          @if (editingField() === 'fullName') {
            <div class="flex-1 mr-4">
              <p class="text-[12px] text-[#666666] mb-1">Full Name</p>
              <input [formControl]="nameCtrl" type="text"
                class="w-full bg-white border border-[#E0E0E0] rounded-[8px] px-3 py-2 text-[14px] outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/10 transition-colors" />
              @if (nameCtrl.invalid && nameCtrl.touched) {
                <p class="text-[12px] text-[#F44336] mt-1">Min 2 characters required</p>
              }
              <div class="flex gap-2 mt-2">
                <button
                  class="bg-[#0C831F] text-white rounded-[8px] px-4 py-1.5 text-[13px] font-semibold hover:bg-[#0a6b19] transition-colors disabled:opacity-50"
                  [disabled]="nameCtrl.invalid || saving()" (click)="saveField('fullName')">
                  {{ saving() ? 'Saving...' : 'Save' }}
                </button>
                <button
                  class="border border-[#E0E0E0] rounded-[8px] px-4 py-1.5 text-[13px] hover:border-[#0C831F] transition-colors"
                  (click)="editingField.set(null)">Cancel</button>
              </div>
            </div>
          } @else {
            <div>
              <p class="text-[12px] text-[#666666]">Full Name</p>
              <p class="text-[15px] font-semibold text-[#1A1A1A] mt-0.5">{{ profile()?.fullName || '—' }}</p>
            </div>
            <button class="text-[13px] text-[#0C831F] font-semibold hover:opacity-70 transition-opacity"
              (click)="startEdit('fullName')">Edit</button>
          }
        </div>

        <!-- Email (read-only) -->
        <div class="bg-[#F8F8F8] rounded-[12px] px-4 py-3 mb-3">
          <p class="text-[12px] text-[#666666]">Email</p>
          <p class="text-[15px] font-semibold text-[#1A1A1A] mt-0.5">{{ profile()?.email }}</p>
        </div>

        <!-- Phone Number -->
        <div class="bg-[#F8F8F8] rounded-[12px] px-4 py-3 flex items-center justify-between mb-3">
          @if (editingField() === 'phone') {
            <div class="flex-1 mr-4">
              <p class="text-[12px] text-[#666666] mb-1">Phone Number</p>
              <input [formControl]="phoneCtrl" type="tel" placeholder="10-digit mobile number"
                class="w-full bg-white border border-[#E0E0E0] rounded-[8px] px-3 py-2 text-[14px] outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/10 transition-colors" />
              @if (phoneCtrl.invalid && phoneCtrl.touched) {
                <p class="text-[12px] text-[#F44336] mt-1">Enter a valid 10-digit number</p>
              }
              <div class="flex gap-2 mt-2">
                <button
                  class="bg-[#0C831F] text-white rounded-[8px] px-4 py-1.5 text-[13px] font-semibold hover:bg-[#0a6b19] transition-colors disabled:opacity-50"
                  [disabled]="phoneCtrl.invalid || saving()" (click)="saveField('phone')">
                  {{ saving() ? 'Saving...' : 'Save' }}
                </button>
                <button
                  class="border border-[#E0E0E0] rounded-[8px] px-4 py-1.5 text-[13px] hover:border-[#0C831F] transition-colors"
                  (click)="editingField.set(null)">Cancel</button>
              </div>
            </div>
          } @else {
            <div>
              <p class="text-[12px] text-[#666666]">Phone Number</p>
              <p class="text-[15px] font-semibold text-[#1A1A1A] mt-0.5">{{ profile()?.phone || '—' }}</p>
            </div>
            <button class="text-[13px] text-[#0C831F] font-semibold hover:opacity-70 transition-opacity"
              (click)="startEdit('phone')">Edit</button>
          }
        </div>

      }
    </div>
  `,
})
export class AccountProfileComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);

  readonly profile = signal<Profile | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editingField = signal<'fullName' | 'phone' | null>(null);

  readonly nameCtrl = new FormControl('', [Validators.required, Validators.minLength(2)]);
  readonly phoneCtrl = new FormControl('', [Validators.pattern(/^\d{10}$/)]);

  ngOnInit(): void {
    this.http.get<Profile>('/api/account/profile').subscribe({
      next: p => { this.profile.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  startEdit(field: 'fullName' | 'phone'): void {
    if (field === 'fullName') {
      this.nameCtrl.setValue(this.profile()?.fullName ?? '');
    } else {
      this.phoneCtrl.setValue(this.profile()?.phone ?? '');
    }
    this.editingField.set(field);
  }

  saveField(field: 'fullName' | 'phone'): void {
    const ctrl = field === 'fullName' ? this.nameCtrl : this.phoneCtrl;
    ctrl.markAsTouched();
    if (ctrl.invalid) return;
    this.saving.set(true);
    const value = ctrl.value ?? '';
    this.http.patch('/api/account/profile', { [field]: value }).subscribe({
      next: () => {
        this.profile.update(p => p ? { ...p, [field]: value } : p);
        this.editingField.set(null);
        this.saving.set(false);
        this.snackBar.open('✓ Saved', '', { duration: 2000 });
      },
      error: () => this.saving.set(false),
    });
  }
}
