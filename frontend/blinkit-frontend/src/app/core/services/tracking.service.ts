import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, filter, interval, Observable, of, startWith, switchMap, throwError } from 'rxjs';

export interface TrackingDarkStore {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface TrackingDeliveryPartner {
  name: string;
  phone: string;
  lat: number;
  lng: number;
  initialsAvatar: string;
}

export interface TrackingCustomerLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface TrackingData {
  orderId: string;
  status: string;
  estimatedMinutes: number;
  elapsedSeconds: number;
  darkStore: TrackingDarkStore;
  deliveryPartner: TrackingDeliveryPartner;
  customerLocation: TrackingCustomerLocation;
  placedAt: string;
}

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private readonly http = inject(HttpClient);

  getTracking(orderId: string): Observable<TrackingData> {
    return this.http
      .get<TrackingData>(`/api/tracking/${orderId}`)
      .pipe(catchError(() => throwError(() => new Error('Tracking unavailable'))));
  }

  pollTracking(orderId: string): Observable<TrackingData> {
    return interval(10000).pipe(
      startWith(0),
      switchMap(() => this.getTracking(orderId).pipe(catchError(() => of(null)))),
      filter((data): data is TrackingData => data !== null),
    );
  }
}
