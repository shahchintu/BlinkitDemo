import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '../../../core/services/cart.service';
import { CartStore } from '../../../core/stores/cart.store';
import { AuthStore } from '../../../core/stores/auth.store';
import { PaymentService } from '../../../core/services/payment.service';
import { IAddress, IDeliverySlot } from '../../../core/models';
import { formatPrice } from '../../../shared/utils';
import { environment } from '../../../../environments/environment';

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod' | 'paylater';

@Component({
  selector: 'app-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-blinkit-bg py-6 px-4">
      <div class="max-w-2xl mx-auto">

        <!-- Step indicator -->
        <div class="flex items-center justify-center gap-0 mb-8">
          @for (step of [1, 2, 3]; track step; let i = $index) {
            <div class="flex items-center">
              <div class="flex flex-col items-center">
                <div
                  class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                  [class]="currentStep() >= step
                    ? 'bg-blinkit-green text-white'
                    : 'bg-white border-2 border-blinkit-border text-blinkit-muted'"
                >{{ step }}</div>
                <span class="text-[10px] mt-1 font-medium"
                  [class]="currentStep() >= step ? 'text-blinkit-green' : 'text-blinkit-muted'"
                >{{ stepLabel(step) }}</span>
              </div>
              @if (step < 3) {
                <div class="w-16 h-0.5 mb-4 mx-1"
                  [class]="currentStep() > step ? 'bg-blinkit-green' : 'bg-blinkit-border'">
                </div>
              }
            </div>
          }
        </div>

        <!-- ─── STEP 1: Address ─── -->
        @if (currentStep() === 1) {
          <div class="bg-white rounded-2xl border border-blinkit-border p-5 space-y-4">
            <h2 class="text-base font-bold text-gray-800">Select Delivery Address</h2>

            @if (addressLoading()) {
              <div class="space-y-3">
                @for (s of [1, 2]; track s) {
                  <div class="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
                }
              </div>
            } @else {
              @for (addr of addresses(); track addr.id) {
                <label
                  class="flex items-start gap-3 border-2 rounded-xl p-3 cursor-pointer transition-colors"
                  [class]="selectedAddressId() === addr.id
                    ? 'border-blinkit-green bg-green-50'
                    : 'border-blinkit-border'"
                >
                  <input
                    type="radio"
                    name="address"
                    class="mt-1 accent-blinkit-green"
                    [value]="addr.id"
                    [checked]="selectedAddressId() === addr.id"
                    (change)="selectedAddressId.set(addr.id)"
                  />
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">{{ addr.label }}</span>
                      @if (addr.isDefault) {
                        <span class="text-[10px] text-blinkit-green font-semibold">Default</span>
                      }
                    </div>
                    <p class="text-sm text-gray-700 mt-0.5">{{ addr.street }}, {{ addr.city }} — {{ addr.pincode }}</p>
                  </div>
                </label>
              }
            }

            <!-- Add new address -->
            @if (!showAddressForm()) {
              <button
                class="w-full border-2 border-dashed border-blinkit-border rounded-xl p-3 text-sm text-blinkit-green font-semibold hover:border-blinkit-green hover:bg-green-50 transition-colors"
                (click)="showAddressForm.set(true)"
              >+ Add New Address</button>
            } @else {
              <form [formGroup]="addressForm" (ngSubmit)="submitAddress()" class="space-y-3 border border-blinkit-border rounded-xl p-4">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-xs font-medium text-gray-600">Label</label>
                    <input formControlName="label" placeholder="Home / Work"
                      class="w-full mt-1 border border-blinkit-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blinkit-green" />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-gray-600">Pincode</label>
                    <input formControlName="pincode" placeholder="560001"
                      class="w-full mt-1 border border-blinkit-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blinkit-green"
                      (blur)="checkPincode()" />
                  </div>
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-600">Street / Area</label>
                  <input formControlName="street" placeholder="123 MG Road"
                    class="w-full mt-1 border border-blinkit-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blinkit-green" />
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-600">City</label>
                  <input formControlName="city" placeholder="Bangalore"
                    class="w-full mt-1 border border-blinkit-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blinkit-green" />
                </div>
                @if (pincodeChecked()) {
                  <p class="text-xs text-blinkit-success font-medium">✓ Delivery available in this area</p>
                }
                <div class="flex gap-2">
                  <button type="submit"
                    [disabled]="addressForm.invalid || addressSaving()"
                    class="flex-1 bg-blinkit-green text-white py-2 rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors">
                    {{ addressSaving() ? 'Saving...' : 'Save Address' }}
                  </button>
                  <button type="button"
                    class="px-4 py-2 border border-blinkit-border rounded-xl text-sm hover:bg-gray-50 transition-colors"
                    (click)="showAddressForm.set(false)">Cancel</button>
                </div>
              </form>
            }

            <button
              class="w-full bg-blinkit-green text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 transition-colors mt-2"
              [disabled]="!selectedAddressId()"
              (click)="currentStep.set(2)"
            >Continue →</button>
          </div>
        }

        <!-- ─── STEP 2: Delivery Slot ─── -->
        @if (currentStep() === 2) {
          <div class="bg-white rounded-2xl border border-blinkit-border p-5 space-y-4">
            <h2 class="text-base font-bold text-gray-800">Choose Delivery Slot</h2>

            @if (slotLoading()) {
              <div class="space-y-3">
                <div class="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
                <div class="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
              </div>
            } @else {
              <div class="grid sm:grid-cols-2 gap-3">
                @for (slot of slots(); track slot.id) {
                  <label
                    class="relative border-2 rounded-xl p-4 cursor-pointer transition-colors"
                    [class]="selectedSlotId() === slot.id
                      ? 'border-blinkit-green bg-green-50'
                      : 'border-blinkit-border'"
                  >
                    <input type="radio" name="slot" class="sr-only"
                      [value]="slot.id"
                      [checked]="selectedSlotId() === slot.id"
                      (change)="selectedSlotId.set(slot.id)" />
                    @if (selectedSlotId() === slot.id) {
                      <div class="absolute top-2 right-2 w-5 h-5 bg-blinkit-green rounded-full flex items-center justify-center">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    }
                    <p class="font-bold text-gray-800 text-sm">{{ slot.label }}</p>
                    <p class="text-xs text-blinkit-muted mt-0.5">{{ slot.startTime }} – {{ slot.endTime }}</p>
                  </label>
                }
              </div>
            }

            <div class="flex gap-3 mt-2">
              <button
                class="flex-1 border-2 border-blinkit-border text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                (click)="currentStep.set(1)"
              >← Back</button>
              <button
                class="flex-1 bg-blinkit-green text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
                [disabled]="!selectedSlotId()"
                (click)="currentStep.set(3)"
              >Continue →</button>
            </div>
          </div>
        }

        <!-- ─── STEP 3: Summary + Payment ─── -->
        @if (currentStep() === 3) {
          <div class="space-y-4">

            <!-- Order summary -->
            <div class="bg-white rounded-2xl border border-blinkit-border p-5">
              <h2 class="text-base font-bold text-gray-800 mb-3">Order Summary</h2>
              <div class="divide-y divide-blinkit-border">
                @for (item of cartStore.cartItems(); track item.id) {
                  <div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-800">{{ item.product.name }}</p>
                      <p class="text-xs text-blinkit-muted">{{ item.variant.unit }} × {{ item.quantity }}</p>
                    </div>
                    <p class="text-sm font-bold text-blinkit-green">{{ fmt(item.unitPrice * item.quantity) }}</p>
                  </div>
                }
              </div>

              <!-- Price breakdown -->
              <div class="mt-3 pt-3 border-t border-blinkit-border space-y-1.5 text-sm">
                <div class="flex justify-between text-gray-600">
                  <span>Subtotal ({{ cartStore.itemCount() }} items)</span>
                  <span>{{ fmt(cartStore.total()) }}</span>
                </div>
                <div class="flex justify-between text-gray-600">
                  <span>Delivery fee</span>
                  @if (cartStore.total() >= 199) {
                    <span class="text-blinkit-success font-semibold">FREE</span>
                  } @else {
                    <span>{{ fmt(29) }}</span>
                  }
                </div>
                <div class="flex justify-between font-bold text-gray-800 pt-2 border-t border-blinkit-border">
                  <span>Total</span>
                  <span>{{ fmt(orderTotal(cartStore.total())) }}</span>
                </div>
                <p class="text-[10px] text-blinkit-muted">(Inclusive of all taxes)</p>
              </div>
            </div>

            <!-- Selected address + slot recap -->
            <div class="bg-white rounded-2xl border border-blinkit-border p-4 text-sm space-y-1.5">
              @if (selectedAddress(); as addr) {
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-blinkit-green flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span class="text-gray-700">{{ addr.street }}, {{ addr.city }} — {{ addr.pincode }}</span>
                </div>
              }
              @if (selectedSlot(); as slot) {
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-blinkit-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-gray-700">{{ slot.label }} ({{ slot.startTime }}–{{ slot.endTime }})</span>
                </div>
              }
            </div>

            <!-- Payment method -->
            <div class="bg-white rounded-2xl border border-blinkit-border p-5">
              <h2 class="text-base font-bold text-gray-800 mb-3">Payment Method</h2>
              <div class="space-y-2">
                @for (method of paymentMethods; track method.id) {
                  <label
                    class="flex items-center gap-3 border-2 rounded-xl p-3 cursor-pointer transition-colors"
                    [class]="selectedPayment() === method.id
                      ? 'border-blinkit-green bg-green-50'
                      : 'border-blinkit-border'"
                  >
                    <input type="radio" name="payment"
                      class="accent-blinkit-green"
                      [value]="method.id"
                      [checked]="selectedPayment() === method.id"
                      (change)="selectedPayment.set(method.id)" />
                    <div class="flex items-center gap-2 flex-1">
                      <span class="text-lg">{{ method.icon }}</span>
                      <div>
                        <p class="text-sm font-semibold text-gray-800">{{ method.label }}</p>
                        <p class="text-xs text-blinkit-muted">{{ method.subtitle }}</p>
                      </div>
                    </div>
                  </label>
                }
              </div>
            </div>

            <!-- Pay button -->
            <div class="space-y-2">
              <button
                class="w-full bg-blinkit-green text-white py-4 rounded-xl text-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                [disabled]="paying()"
                (click)="pay()"
              >
                {{ paying() ? 'Processing...' : 'Pay ' + fmt(orderTotal(cartStore.total())) }}
              </button>
              <div class="text-center space-y-0.5">
                <p class="text-xs text-blinkit-muted">💳 Test card: 4111 1111 1111 1111 · Any future expiry · CVV: any 3 digits</p>
                <p class="text-xs text-blinkit-muted">📱 Test UPI: success&#64;razorpay</p>
              </div>
            </div>

            <button
              class="w-full border-2 border-blinkit-border text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              (click)="currentStep.set(2)"
            >← Back</button>
          </div>
        }

      </div>
    </div>
  `,
})
export class CheckoutComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly cartService = inject(CartService);
  readonly cartStore = inject(CartStore);
  private readonly authStore = inject(AuthStore);
  private readonly paymentService = inject(PaymentService);

  readonly fmt = formatPrice;

  readonly currentStep = signal<number>(1);
  readonly addresses = signal<IAddress[]>([]);
  readonly slots = signal<IDeliverySlot[]>([]);
  readonly selectedAddressId = signal<string>('');
  readonly selectedSlotId = signal<string>('');
  readonly selectedPayment = signal<PaymentMethod>('upi');

  readonly addressLoading = signal(false);
  readonly slotLoading = signal(false);
  readonly showAddressForm = signal(false);
  readonly addressSaving = signal(false);
  readonly pincodeChecked = signal(false);
  readonly paying = signal(false);

  readonly selectedAddress = computed(() =>
    this.addresses().find(a => a.id === this.selectedAddressId()));

  readonly selectedSlot = computed(() =>
    this.slots().find(s => s.id === this.selectedSlotId()));

  readonly paymentMethods: { id: PaymentMethod; icon: string; label: string; subtitle: string }[] = [
    { id: 'upi', icon: '📱', label: 'UPI', subtitle: 'Google Pay / PhonePe / Paytm' },
    { id: 'card', icon: '💳', label: 'Credit / Debit Card', subtitle: 'Visa · Mastercard · RuPay' },
    { id: 'netbanking', icon: '🏦', label: 'Net Banking', subtitle: 'All major banks supported' },
    { id: 'cod', icon: '💵', label: 'Cash on Delivery', subtitle: 'Pay when delivered' },
    { id: 'paylater', icon: '⏳', label: 'Pay Later / BNPL', subtitle: 'Simpl · LazyPay · ZestMoney' },
  ];

  readonly addressForm = this.fb.nonNullable.group({
    label: ['Home', Validators.required],
    street: ['', Validators.required],
    city: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    if (this.cartStore.itemCount() === 0) {
      this.router.navigate(['/']);
      return;
    }
    this.loadAddresses();
    this.loadSlots();
  }

  stepLabel(step: number): string {
    return ['Address', 'Delivery', 'Payment'][step - 1];
  }

  orderTotal(subTotal: number): number {
    return subTotal >= 199 ? subTotal : subTotal + 29;
  }

  private loadAddresses(): void {
    this.addressLoading.set(true);
    this.http.get<IAddress[]>('/api/addresses').subscribe({
      next: list => {
        this.addresses.set(list);
        const def = list.find(a => a.isDefault);
        if (def) this.selectedAddressId.set(def.id);
        this.addressLoading.set(false);
      },
      error: () => this.addressLoading.set(false),
    });
  }

  private loadSlots(): void {
    this.slotLoading.set(true);
    this.http.get<IDeliverySlot[]>('/api/delivery/slots').subscribe({
      next: list => {
        this.slots.set(list);
        if (list.length > 0) this.selectedSlotId.set(list[0].id);
        this.slotLoading.set(false);
      },
      error: () => this.slotLoading.set(false),
    });
  }

  checkPincode(): void {
    const pincode = this.addressForm.controls.pincode.value;
    if (pincode.length >= 6) {
      this.http.get<{ available: boolean }>(`/api/delivery/check?pincode=${pincode}`).subscribe({
        next: () => this.pincodeChecked.set(true),
        error: () => this.pincodeChecked.set(true),
      });
    }
  }

  submitAddress(): void {
    if (this.addressForm.invalid) return;
    this.addressSaving.set(true);
    const val = this.addressForm.getRawValue();
    this.http.post<IAddress>('/api/addresses', val).subscribe({
      next: addr => {
        this.addresses.update(list => [...list, addr]);
        this.selectedAddressId.set(addr.id);
        this.showAddressForm.set(false);
        this.addressForm.reset({ label: 'Home' });
        this.addressSaving.set(false);
        this.pincodeChecked.set(false);
      },
      error: () => this.addressSaving.set(false),
    });
  }

  pay(): void {
    const subTotal = this.cartStore.total();
    const addressId = this.selectedAddressId();
    const slotId = this.selectedSlotId();
    if (!addressId) return;

    this.paying.set(true);

    this.paymentService.createOrder(addressId, slotId || null).subscribe({
      next: result => {
        const user = this.authStore.currentUser();
        this.paymentService.openRazorpay({
          key: environment.razorpayKeyId,
          amount: result.amount * 100,
          currency: result.currency,
          name: 'Blinkit Clone',
          description: 'Grocery Order',
          order_id: result.razorpayOrderId,
          prefill: {
            name: user?.fullName ?? '',
            email: user?.email ?? '',
            contact: user?.phone ?? '',
          },
          theme: { color: '#0C831F' },
        }).subscribe({
          next: rzpResponse => {
            this.paymentService.verifyPayment(
              result.orderId,
              result.razorpayOrderId,
              rzpResponse.razorpay_payment_id,
              rzpResponse.razorpay_signature,
            ).subscribe({
              next: () => {
                this.cartService.clearCart().subscribe();
                this.router.navigate(['/checkout/confirmation'], {
                  state: { orderId: result.orderId, paymentId: rzpResponse.razorpay_payment_id },
                });
              },
              error: (err: unknown) => {
                this.paying.set(false);
                const msg = err instanceof HttpErrorResponse
                  ? (err.error?.message ?? 'Payment verification failed. Please contact support.')
                  : 'Payment verification failed. Please contact support.';
                this.snackBar.open(msg, 'OK', { duration: 5000 });
              },
            });
          },
          error: (err: unknown) => {
            this.paying.set(false);
            if (err === 'cancelled') {
              this.snackBar.open('Payment cancelled. Please try again.', 'OK', { duration: 3000 });
            } else {
              const reason = this.razorpayErrorMessage(err);
              this.snackBar.open(`Payment failed: ${reason}`, 'OK', { duration: 5000 });
            }
          },
        });
      },
      error: (err: unknown) => {
        this.paying.set(false);
        const msg = err instanceof HttpErrorResponse
          ? (err.status === 0
              ? 'Connection error. Please check the API is running.'
              : (err.error?.message ?? 'Could not create order. Please try again.'))
          : 'Could not create order. Please try again.';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      },
    });
  }

  private razorpayErrorMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const e = (err as { error?: { description?: string } }).error;
      if (e?.description) return e.description;
    }
    return 'Please try again.';
  }
}
