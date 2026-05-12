import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICouponValidation } from '../models';

@Injectable({ providedIn: 'root' })
export class CouponService {
  private readonly http = inject(HttpClient);

  validateCoupon(code: string, subtotal: number): Observable<ICouponValidation> {
    const params = new HttpParams().set('code', code).set('subtotal', subtotal.toString());
    return this.http.get<ICouponValidation>('/api/coupons/validate', { params });
  }
}
