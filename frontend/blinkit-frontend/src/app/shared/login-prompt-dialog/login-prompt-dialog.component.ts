import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { CartStore } from '../../core/stores/cart.store';
import { formatPrice } from '../utils';

@Component({
  selector: 'app-login-prompt-dialog',
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
      <h2 class="text-xl font-bold text-gray-900 text-center mb-1">Login to continue</h2>
      <p class="text-[#666666] text-sm text-center mb-4">You're one step away from placing your order!</p>

      <!-- Cart summary -->
      @if (cartStore.itemCount() > 0) {
        <div class="bg-[#0C831F]/10 rounded-xl p-3 text-center mb-5">
          <span class="text-[#0C831F] font-semibold text-sm">
            {{ cartStore.itemCount() }} {{ cartStore.itemCount() === 1 ? 'item' : 'items' }} · {{ fmt(cartStore.total()) }}
          </span>
        </div>
      }

      <!-- Login form -->
      <form [formGroup]="form" (ngSubmit)="login()">
        <div class="mb-3">
          <input
            type="email"
            formControlName="email"
            placeholder="Email address"
            class="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0C831F] transition-colors"
          />
        </div>
        <div class="mb-4">
          <input
            type="password"
            formControlName="password"
            placeholder="Password"
            class="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0C831F] transition-colors"
          />
        </div>

        @if (error()) {
          <div class="mb-3 bg-red-50 border border-[#F44336] rounded-xl px-4 py-2">
            <p class="text-[#F44336] text-xs">{{ error() }}</p>
          </div>
        }

        <button
          type="submit"
          [disabled]="submitting()"
          class="w-full bg-[#0C831F] text-white rounded-xl py-3 font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          {{ submitting() ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <!-- Register link -->
      <p class="text-center text-sm text-[#666666] mt-4">
        Don't have an account?
        <button
          type="button"
          class="text-[#0C831F] font-medium hover:underline"
          (click)="goToRegister()"
        >Register</button>
      </p>

      <!-- Dismiss -->
      <div class="text-center mt-3">
        <button
          type="button"
          class="text-xs text-[#666666] hover:text-gray-800 underline"
          (click)="dismiss()"
        >Continue browsing</button>
      </div>
    </div>
  `,
})
export class LoginPromptDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<LoginPromptDialogComponent>);
  private readonly authService = inject(AuthService);
  readonly cartService = inject(CartService);
  readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly submitting = signal(false);
  readonly error = signal('');

  readonly fmt = formatPrice;

  login(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.error.set('');

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.dialogRef.close('loggedIn');
        this.router.navigate(['/checkout']);
        this.snackBar.open('✓ Logged in! Your cart is ready.', '', { duration: 3000 });
      },
      error: (err: { error?: { message?: string } }) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message ?? 'Invalid email or password');
      },
    });
  }

  goToRegister(): void {
    this.dialogRef.close();
    this.router.navigate(['/auth/register']);
  }

  dismiss(): void {
    this.dialogRef.close();
  }
}
