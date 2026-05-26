import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private readonly http = inject(HttpClient);

  uploadProductImage(
    productId: string,
    file: File,
  ): Observable<{ url: string; relativePath: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ url: string; relativePath: string }>(
        `/api/upload/product/${productId}`,
        formData,
      )
      .pipe(catchError(err => throwError(() => err)));
  }

  uploadCategoryImage(
    categoryId: string,
    file: File,
  ): Observable<{ url: string; relativePath: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ url: string; relativePath: string }>(
        `/api/upload/category/${categoryId}`,
        formData,
      )
      .pipe(catchError(err => throwError(() => err)));
  }

  uploadVariantImage(
    variantId: string,
    file: File,
  ): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ url: string }>(
        `/api/upload/product/variant/${variantId}`,
        formData,
      )
      .pipe(catchError(err => throwError(() => err)));
  }

  deleteImage(imageUrl: string): Observable<null> {
    return this.http
      .delete<null>(`/api/upload/image?imageUrl=${encodeURIComponent(imageUrl)}`)
      .pipe(catchError(() => of(null)));
  }

  /** Returns true when the URL points to a locally-uploaded file. */
  isUploadedImage(url: string): boolean {
    return url?.includes('/uploads/') ?? false;
  }

  /**
   * Validates a file before upload.
   * Returns an error message string, or null when the file is valid.
   */
  validateFile(file: File): string | null {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) return 'Only JPG, PNG, WebP allowed';
    if (file.size > 5 * 1024 * 1024) return 'File must be under 5 MB';
    return null;
  }
}
