import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#F8F8F8] flex items-center justify-center px-4">
      <div class="bg-white rounded-2xl shadow-sm border border-[#E0E0E0] p-8 w-full max-w-md">

        <!-- Logo -->
        <div class="flex justify-center mb-6">
          <div class="bg-[#0C831F] px-4 py-2 rounded-xl">
            <span class="text-[#F8C200] italic font-black text-2xl">blinkit</span>
          </div>
        </div>

        <h1 class="text-2xl font-bold text-gray-900 mb-1 text-center">Welcome back</h1>
        <p class="text-[#666666] text-sm text-center mb-6">Sign in to continue</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
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

          <!-- Password -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              formControlName="password"
              class="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0C831F] transition-colors"
              placeholder="••••••••"
            />
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <p class="text-[#F44336] text-xs mt-1">Password is required</p>
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
            Login
          </button>
        </form>

        <p class="text-center text-sm text-[#666666] mt-4">
          Don't have an account?
          <a routerLink="/auth/register" class="text-[#0C831F] font-medium hover:underline">Register</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly authStore = inject(AuthStore);

  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.errorMessage.set('');
    this.authStore.setLoading(true);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.authStore.setLoading(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.authStore.setLoading(false);
        this.errorMessage.set(err?.error?.message ?? 'Invalid email or password');
      },
    });
  }
}
