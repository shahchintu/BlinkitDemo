import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthStore } from '../stores/auth.store';
import { RazorpayOptions, RazorpaySuccessResponse } from '../models';

export interface CreateOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  createOrder(addressId: string, deliverySlotId: string | null, couponCode?: string): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>('/api/payments/create-order', {
      addressId,
      deliverySlotId,
      couponCode: couponCode ?? null,
    });
  }

  verifyPayment(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): Observable<VerifyPaymentResponse> {
    return this.http.post<VerifyPaymentResponse>('/api/payments/verify', {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
  }

  openRazorpay(options: RazorpayOptions): Observable<RazorpaySuccessResponse> {
    const subject = new Subject<RazorpaySuccessResponse>();
    const rzp = new window.Razorpay({
      ...options,
      handler: (response: RazorpaySuccessResponse) => {
        subject.next(response);
        subject.complete();
      },
    });
    rzp.on('payment.failed', (err: unknown) => subject.error(err));
    rzp.open();
    return subject.asObservable().pipe(take(1));
  }
}
