import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../core/stores/auth.store';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  return parent.get('password')?.value === control.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#F8F8F8] flex items-center justify-center px-4 py-8">
      <div class="bg-white rounded-2xl shadow-sm border border-[#E0E0E0] p-8 w-full max-w-md">

        <!-- Logo -->
        <div class="flex justify-center mb-6">
          <div class="bg-[#0C831F] px-4 py-2 rounded-xl">
            <span class="text-[#F8C200] italic font-black text-2xl">blinkit</span>
          </div>
        </div>

        <h1 class="text-2xl font-bold text-gray-900 mb-1 text-center">Create account</h1>
        <p class="text-[#666666] text-sm text-center mb-6">Join blinkit today</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Full Name -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              formControlName="fullName"
              class="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0C831F] transition-colors"
              placeholder="John Doe"
            />
            @if (form.get('fullName')?.invalid && form.get('fullName')?.touched) {
              <p class="text-[#F44336] text-xs mt-1">Name must be at least 2 characters</p>
            }
          </div>

          <!-- Email -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              formControlName="email"
              class="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0C831F] transition-colors"
              placeholder="you@example.com"
            />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <p class="text-[#F44336] text-xs mt-1">Valid email is required</p>
            }
          </div>

          <!-- Phone -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              formControlName="phone"
              class="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0C831F] transition-colors"
              placeholder="10-digit mobile number"
              maxlength="10"
            />
            @if (form.get('phone')?.invalid && form.get('phone')?.touched) {
              <p class="text-[#F44336] text-xs mt-1">Enter a valid 10-digit phone number</p>
            }
          </div>

          <!-- Password -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              formControlName="password"
              class="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0C831F] transition-colors"
              placeholder="Min. 8 characters"
            />
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <p class="text-[#F44336] text-xs mt-1">Password must be at least 8 characters</p>
            }
          </div>

          <!-- Confirm Password -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              formControlName="confirmPassword"
              class="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0C831F] transition-colors"
              placeholder="Repeat password"
            />
            @if (form.get('confirmPassword')?.errors?.['mismatch'] && form.get('confirmPassword')?.touched) {
              <p class="text-[#F44336] text-xs mt-1">Passwords do not match</p>
            }
          </div>

          <!-- Error message -->
          @if (errorMessage()) {
            <div class="mb-4 bg-red-50 border border-[#F44336] rounded-xl px-4 py-3">
              <p class="text-[#F44336] text-sm">{{ errorMessage() }}</p>
            </div>
          }

          <!-- Submit -->
          <button
            type="submit"
            [disabled]="authStore.isLoading()"
            class="w-full bg-[#0C831F] text-white rounded-xl py-3 font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            @if (authStore.isLoading()) {
              <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            }
            Create Account
          </button>
        </form>

        <p class="text-center text-sm text-[#666666] mt-4">
          Already have an account?
          <a routerLink="/auth/login" class="text-[#0C831F] font-medium hover:underline">Login</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStore);

  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, passwordMatchValidator]],
  });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.errorMessage.set('');
    this.authStore.setLoading(true);

    const { fullName, email, phone, password } = this.form.getRawValue();
    this.authService.register({ fullName, email, phone, password }).subscribe({
      next: () => {
        this.authStore.setLoading(false);
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.authStore.setLoading(false);
        const status = err?.status;
        if (status === 409) {
          this.errorMessage.set('Email already in use');
        } else {
          this.errorMessage.set(err?.error?.message ?? 'Registration failed. Please try again.');
        }
      },
    });
  }
}
