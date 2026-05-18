import {
  ChangeDetectionStrategy, Component, inject, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword
    ? { passwordsMismatch: true }
    : null;
}

@Component({
  selector: 'app-forgot-password-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule],
  template: `
    <div class="w-full max-w-sm mx-auto p-6">

      <!-- Logo -->
      <div class="flex justify-center mb-5">
        <div class="bg-[#0C831F] px-4 py-2 rounded-xl">
          <span class="text-[#F8C200] italic font-black text-2xl">blinkit</span>
        </div>
      </div>

      <!-- Heading -->
      <h2 class="text-[20px] font-bold text-[#1A1A1A] text-center mb-1">Reset Password</h2>
      <p class="text-[13px] text-[#666666] text-center mb-5">Enter your email and choose a new password</p>

      @if (success()) {
        <!-- Success state -->
        <div class="text-center py-4">
          <div class="text-5xl mb-3">✅</div>
          <p class="text-[16px] font-bold text-[#0C831F]">Password reset!</p>
          <p class="text-[13px] text-[#666666] mt-1">You can now login with your new password.</p>
          <button
            class="mt-5 w-full bg-[#0C831F] text-white rounded-xl py-3 font-semibold text-sm hover:bg-green-700 transition-colors"
            (click)="close()"
          >Back to Login</button>
        </div>
      } @else {
        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="submit()">

          <!-- Email -->
          <div class="mb-4">
            <label class="block text-[13px] font-semibold text-[#1A1A1A] mb-1">Email address</label>
            <input
              type="email"
              formControlName="email"
              placeholder="you@example.com"
              class="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/20 transition-all"
            />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <p class="text-[#F44336] text-xs mt-1">Valid email is required</p>
            }
          </div>

          <!-- New Password -->
          <div class="mb-4">
            <label class="block text-[13px] font-semibold text-[#1A1A1A] mb-1">New Password</label>
            <div class="relative">
              <input
                [type]="showNewPassword() ? 'text' : 'password'"
                formControlName="newPassword"
                placeholder="Min. 8 characters"
                class="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/20 transition-all"
              />
              <button type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#1A1A1A]"
                (click)="toggleNewPassword()">
                @if (showNewPassword()) {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                }
              </button>
            </div>
            @if (form.get('newPassword')?.invalid && form.get('newPassword')?.touched) {
              <p class="text-[#F44336] text-xs mt-1">Password must be at least 8 characters</p>
            }
          </div>

          <!-- Confirm Password -->
          <div class="mb-5">
            <label class="block text-[13px] font-semibold text-[#1A1A1A] mb-1">Confirm Password</label>
            <div class="relative">
              <input
                [type]="showConfirmPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                placeholder="Repeat new password"
                class="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/20 transition-all"
              />
              <button type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#1A1A1A]"
                (click)="toggleConfirmPassword()">
                @if (showConfirmPassword()) {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                }
              </button>
            </div>
            @if (form.hasError('passwordsMismatch') && form.get('confirmPassword')?.touched) {
              <p class="text-[#F44336] text-xs mt-1">Passwords do not match</p>
            }
          </div>

          <!-- Error -->
          @if (errorMessage()) {
            <div class="mb-4 bg-red-50 border border-[#F44336] rounded-xl px-4 py-2">
              <p class="text-[#F44336] text-xs">{{ errorMessage() }}</p>
            </div>
          }

          <!-- Submit -->
          <button
            type="submit"
            [disabled]="submitting()"
            class="w-full bg-[#0C831F] text-white rounded-xl py-3 font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {{ submitting() ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>

        <!-- Cancel -->
        <div class="text-center mt-3">
          <button
            type="button"
            class="text-xs text-[#666666] hover:text-[#1A1A1A] underline"
            (click)="close()"
          >Back to Login</button>
        </div>
      }
    </div>
  `,
})
export class ForgotPasswordDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ForgotPasswordDialogComponent>);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly success = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { email, newPassword, confirmPassword } = this.form.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set('');

    this.authService.resetPassword(email, newPassword, confirmPassword).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
      },
      error: (err: { error?: { message?: string } }) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not reset password. Please try again.');
      },
    });
  }

  toggleNewPassword(): void { this.showNewPassword.update(v => !v); }
  toggleConfirmPassword(): void { this.showConfirmPassword.update(v => !v); }

  close(): void {
    this.dialogRef.close();
  }
}
