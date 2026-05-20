import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';

export interface UserLocation {
  city: string;
  state: string;
  pincode: string;
  area: string;
  fullAddress: string;
  lat?: number;
  lng?: number;
  isServiceable: boolean;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);

  private readonly _location = signal<UserLocation | null>(this.loadFromStorage());
  readonly currentLocation = this._location.asReadonly();

  readonly hasLocation = computed(() => this._location() !== null);

  readonly displayLocation = computed(() => {
    const loc = this._location();
    if (!loc) return 'Select Location';
    return loc.area && loc.area !== 'Select Location'
      ? `${loc.area}, ${loc.city}`
      : loc.city;
  });

  detectGPSLocation(): Observable<UserLocation> {
    return new Observable<{ lat: number; lng: number }>(observer => {
      if (!navigator.geolocation) {
        observer.error('Geolocation not supported');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        position => {
          observer.next({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          observer.complete();
        },
        error => observer.error(error),
        { timeout: 10000, enableHighAccuracy: true },
      );
    }).pipe(
      switchMap(coords => this.reverseGeocode(coords.lat, coords.lng)),
    );
  }

  reverseGeocode(lat: number, lng: number): Observable<UserLocation> {
    return this.http.get<UserLocation>(`/api/location/reverse?lat=${lat}&lng=${lng}`).pipe(
      tap(loc => this.saveLocation({ ...loc, lat, lng })),
      catchError(() => {
        const fallback = this.getDefaultLocation();
        this.saveLocation(fallback);
        return of(fallback);
      }),
    );
  }

  lookupPincode(pincode: string): Observable<UserLocation> {
    return this.http.get<UserLocation>(`/api/location/pincode?code=${pincode}`).pipe(
      tap(loc => this.saveLocation(loc)),
      catchError(err => throwError(() => err)),
    );
  }

  saveLocation(loc: UserLocation): void {
    this._location.set(loc);
    localStorage.setItem('userLocation', JSON.stringify(loc));
  }

  clearLocation(): void {
    this._location.set(null);
    localStorage.removeItem('userLocation');
  }

  private loadFromStorage(): UserLocation | null {
    try {
      const raw = localStorage.getItem('userLocation');
      return raw ? (JSON.parse(raw) as UserLocation) : null;
    } catch {
      return null;
    }
  }

  private getDefaultLocation(): UserLocation {
    return {
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380001',
      area: 'Ahmedabad',
      fullAddress: 'Ahmedabad, Gujarat',
      isServiceable: true,
    };
  }
}
