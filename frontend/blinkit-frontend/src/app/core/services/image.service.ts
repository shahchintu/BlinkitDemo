import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private readonly http = inject(HttpClient);

  getProductImage(name: string, category: string, productId: string): Observable<string> {
    return this.http
      .get<{ url: string }>(
        `/api/images/product?name=${encodeURIComponent(name)}&category=${encodeURIComponent(category)}&seed=${productId}`,
      )
      .pipe(
        map(r => r.url),
        catchError(() => of(this.getFallbackImage(category))),
      );
  }

  getGalleryImages(name: string, category: string, productId: string): Observable<string[]> {
    return this.http
      .get<{ urls: string[] }>(
        `/api/images/gallery?name=${encodeURIComponent(name)}&category=${encodeURIComponent(category)}&seed=${productId}&count=4`,
      )
      .pipe(
        map(r => r.urls),
        catchError(() => of([this.getFallbackImage(category)])),
      );
  }

  getCategoryImage(categoryName: string, categoryId: string): Observable<string> {
    return this.http
      .get<{ url: string }>(
        `/api/images/category?name=${encodeURIComponent(categoryName)}&seed=${categoryId}`,
      )
      .pipe(
        map(r => r.url),
        catchError(() => of(this.getFallbackImage(categoryName))),
      );
  }

  private getFallbackImage(category: string): string {
    const colors: Record<string, string> = {
      'Fruits & Vegetables': '4CAF50',
      'Dairy & Eggs':        'FFC107',
      'Snacks':              'FF9800',
      'Beverages':           '2196F3',
      'Bakery':              '795548',
      'Meat & Fish':         'F44336',
      'Personal Care':       'E91E63',
      'Household':           '607D8B',
      'Baby Care':           'F8BBD9',
      'Pet Care':            '8D6E63',
      'Pharma & Wellness':   '00BCD4',
      'Beauty & Skin':       '9C27B0',
      'Frozen Foods':        '90CAF9',
      'Breakfast & Cereals': 'FF8F00',
      'Electronics':         '37474F',
    };
    const color = colors[category] ?? '0C831F';
    return `https://dummyjson.com/image/200x200/${color}/ffffff?text=${encodeURIComponent(category.substring(0, 8))}`;
  }
}
