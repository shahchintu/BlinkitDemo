import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { ForgotPasswordDialogComponent } from '../../../shared/forgot-password-dialog/forgot-password-dialog.component';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#F8F8F8] flex items-center justify-center px-4">
      <div class="bg-white rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-full max-w-[400px] p-8">

        <!-- Logo -->
        <div class="flex justify-center">
          <div class="bg-[#F8C200] px-3 py-1 rounded-lg">
            <span class="text-[#0C831F] italic font-black text-2xl">blinkit</span>
          </div>
        </div>

        <h1 class="text-[22px] font-bold text-[#1A1A1A] mt-6 text-center">India's last minute app</h1>
        <p class="text-[14px] text-[#666666] text-center mt-1">Sign in to continue</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-6 space-y-4">
          <!-- Email -->
          <div>
            <label class="block text-[13px] font-semibold text-[#1A1A1A] mb-1">Email</label>
            <input
              type="email"
              formControlName="email"
              class="w-full border border-[#E0E0E0] rounded-[10px] px-4 h-[48px] text-[14px] outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/20 transition-all"
              placeholder="you@example.com"
            />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <p class="text-[#F44336] text-xs mt-1">Valid email is required</p>
            }
          </div>

          <!-- Password -->
          <div>
            <label class="block text-[13px] font-semibold text-[#1A1A1A] mb-1">Password</label>
            <input
              type="password"
              formControlName="password"
              class="w-full border border-[#E0E0E0] rounded-[10px] px-4 h-[48px] text-[14px] outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/20 transition-all"
              placeholder="••••••••"
            />
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <p class="text-[#F44336] text-xs mt-1">Password is required</p>
            }
          </div>

          <!-- Forgot password -->
          <div class="flex justify-end -mt-2">
            <button
              type="button"
              class="text-[13px] text-[#0C831F] font-semibold hover:underline"
              (click)="openForgotPassword()"
            >Forgot password?</button>
          </div>

          <!-- Error message -->
          @if (errorMessage()) {
            <div class="bg-red-50 border border-[#F44336] rounded-[10px] px-4 py-3">
              <p class="text-[#F44336] text-sm">{{ errorMessage() }}</p>
            </div>
          }

          <!-- Submit -->
          <button
            type="submit"
            [disabled]="authStore.isLoading()"
            class="w-full bg-[#0C831F] text-white h-[52px] rounded-[12px] text-[16px] font-bold hover:bg-[#0a6b19] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            @if (authStore.isLoading()) {
              <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            }
            Login
          </button>
        </form>

        <p class="text-center text-[14px] text-[#666666] mt-4">
          New to Blinkit?
          <a routerLink="/auth/register" class="text-[#0C831F] font-semibold hover:underline ml-1">Create account</a>
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
  private readonly dialog = inject(MatDialog);
  readonly authStore = inject(AuthStore);

  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  openForgotPassword(): void {
    this.dialog.open(ForgotPasswordDialogComponent, {
      panelClass: 'rounded-2xl',
      width: '420px',
      maxWidth: '95vw',
    });
  }

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
