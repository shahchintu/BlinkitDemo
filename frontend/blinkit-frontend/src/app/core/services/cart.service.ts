import { effect, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  forkJoin,
  map,
  Observable,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { AuthStore } from '../stores/auth.store';
import { CartStore } from '../stores/cart.store';
import { IProduct, IProductVariant } from '../models';

export interface CartItemDto {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantUnit: string;
  variantImageUrl: string;
  quantity: number;
  unitPrice: number;
}

export interface CartDto {
  items: CartItemDto[];
  subTotal: number;
  itemCount: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);

  private readonly sidebarSubject = new BehaviorSubject<boolean>(false);
  readonly isSidebarOpen$ = this.sidebarSubject.asObservable();

  private readonly cartSubject = new BehaviorSubject<CartDto>({ items: [], subTotal: 0, itemCount: 0 });
  readonly cart$ = this.cartSubject.asObservable();

  constructor() {
    effect(() => {
      if (this.authStore.isAuthenticated()) {
        this.loadCart().subscribe();
      } else {
        this.cartSubject.next({ items: [], subTotal: 0, itemCount: 0 });
        this.cartStore.clearCart();
      }
    });
  }

  openCart(): void { this.sidebarSubject.next(true); }
  closeCart(): void { this.sidebarSubject.next(false); }

  loadCart(): Observable<void> {
    return this.http.get<CartDto>('/api/cart').pipe(
      tap(dto => {
        this.cartSubject.next(dto);
        this.syncStoreFromDto(dto);
      }),
      map(() => void 0),
    );
  }

  addItem(product: IProduct, variant: IProductVariant): Observable<void> {
    if (!this.authStore.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return EMPTY;
    }
    this.cartStore.addItem(product, variant);

    return this.http
      .post<CartDto>('/api/cart/items', {
        productId: product.id,
        variantId: variant.id,
        quantity: 1,
      })
      .pipe(
        tap(dto => {
          this.cartSubject.next(dto);
          this.syncQtyFromDto(dto, variant.id);
        }),
        map(() => void 0),
        catchError(err => {
          const item = this.cartStore.cartItems().find(i => i.variantId === variant.id);
          if (item) this.cartStore.updateQty(item.id, item.quantity - 1);
          return throwError(() => err);
        }),
      );
  }

  updateQty(serverItemId: string, qty: number): Observable<void> {
    const variantId = this.getVariantId(serverItemId);
    if (variantId) {
      const storeItem = this.cartStore.cartItems().find(i => i.variantId === variantId);
      if (storeItem) this.cartStore.updateQty(storeItem.id, qty);
    }

    if (qty <= 0) {
      return this.removeItem(serverItemId);
    }

    return this.http
      .put<CartDto>(`/api/cart/items/${serverItemId}`, { quantity: qty })
      .pipe(
        tap(dto => this.cartSubject.next(dto)),
        map(() => void 0),
      );
  }

  removeItem(serverItemId: string): Observable<void> {
    const variantId = this.getVariantId(serverItemId);
    if (variantId) {
      const storeItem = this.cartStore.cartItems().find(i => i.variantId === variantId);
      if (storeItem) this.cartStore.removeItem(storeItem.id);
    }

    return this.http.delete<CartDto>(`/api/cart/items/${serverItemId}`).pipe(
      tap(dto => this.cartSubject.next(dto)),
      map(() => void 0),
    );
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>('/api/cart').pipe(
      tap(() => {
        this.cartSubject.next({ items: [], subTotal: 0, itemCount: 0 });
        this.cartStore.clearCart();
      }),
      map(() => void 0),
    );
  }

  reorderItems(items: { productId: string; variantId: string; quantity: number }[]): Observable<void> {
    const posts = items.map(i =>
      this.http.post<CartDto>('/api/cart/items', {
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })
    );
    return forkJoin(posts).pipe(
      switchMap(() => this.loadCart()),
    );
  }

  deliveryFee(subtotal: number): number {
    return subtotal >= 199 ? 0 : 29;
  }

  private getVariantId(serverItemId: string): string | undefined {
    return this.cartSubject.value.items.find(i => i.id === serverItemId)?.variantId;
  }

  private syncStoreFromDto(dto: CartDto): void {
    dto.items.forEach(apiItem => {
      const storeItem = this.cartStore.cartItems().find(i => i.variantId === apiItem.variantId);
      if (storeItem) {
        this.cartStore.updateQty(storeItem.id, apiItem.quantity);
      }
    });
  }

  private syncQtyFromDto(dto: CartDto, variantId: string): void {
    const apiItem = dto.items.find(i => i.variantId === variantId);
    if (apiItem) {
      const storeItem = this.cartStore.cartItems().find(i => i.variantId === variantId);
      if (storeItem) this.cartStore.updateQty(storeItem.id, apiItem.quantity);
    }
  }
}
