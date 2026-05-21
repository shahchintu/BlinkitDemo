import { inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthStore } from '../stores/auth.store';
import { CartStore } from '../stores/cart.store';
import { ICartItem, IProduct, IProductVariant } from '../models';

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
  private readonly cartStore = inject(CartStore);
  private readonly authStore = inject(AuthStore);
  
  private sidebarOpen = signal<boolean>(false);
  isSidebarOpen = this.sidebarOpen.asReadonly();
  
  openSidebar(): void { 
    this.sidebarOpen.set(true); 
    this.sidebarSubject.next(true);
  }
  closeSidebar(): void { 
    this.sidebarOpen.set(false); 
    this.sidebarSubject.next(false);
  }

  // Compatibility observables and methods
  private readonly sidebarSubject = new BehaviorSubject<boolean>(false);
  readonly isSidebarOpen$ = this.sidebarSubject.asObservable();
  openCart(): void { this.openSidebar(); }
  closeCart(): void { this.closeSidebar(); }

  // Reactive compatibility observable for components that require cart$
  readonly cart$: Observable<CartDto> = toObservable(this.cartStore.cartItems).pipe(
    map(items => ({
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name ?? '',
        variantId: item.variantId,
        variantUnit: item.variant?.unit ?? '',
        variantImageUrl: item.variant?.imageUrl ?? '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      subTotal: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
    }))
  );

  // ── LOAD CART FROM SERVER ──────────────────────────
  loadCart(): Observable<void> {
    if (!this.authStore.isAuthenticated()) {
      this.loadGuestCart();
      return of(void 0);
    }
    return this.http.get<any>('/api/cart').pipe(
      tap(data => {
        if (!data?.items) return;
        const items: ICartItem[] = (data.items || []).map(
          (i: any) => ({
            id: i.id,
            productId: i.productId,
            product: i.product,
            variantId: i.variantId,
            variant: i.variant,
            quantity: i.quantity,
            unitPrice: i.unitPrice
          })
        );
        this.cartStore.setItems(items);
      }),
      map(() => void 0),
      catchError(() => of(void 0))
    );
  }

  // ── ADD ITEM ──────────────────────────────────────
  addItem(product: IProduct, variant: IProductVariant): Observable<void> {
    // 1. Update UI immediately
    this.cartStore.addItem(product, variant);

    // 2. Sync to server silently
    if (this.authStore.isAuthenticated()) {
      return this.http.post('/api/cart/items', {
        productId: product.id,
        variantId: variant.id,
        quantity: 1
      }).pipe(
        map(() => void 0),
        catchError(() => {
          // On error only: reload from server
          this.loadCart().subscribe();
          return of(void 0);
        })
      );
      // NEVER call loadCart() on success
    } else {
      this.saveGuestCart();
      return of(void 0);
    }
  }

  // ── UPDATE QTY ────────────────────────────────────
  updateQty(cartItemId: string, qty: number): Observable<void> {
    this.cartStore.updateQty(cartItemId, qty);
    if (this.authStore.isAuthenticated()) {
      const req = qty <= 0
        ? this.http.delete(`/api/cart/items/${cartItemId}`)
        : this.http.put(`/api/cart/items/${cartItemId}`, { quantity: qty });
      return req.pipe(
        map(() => void 0),
        catchError(() => of(void 0))
      );
    } else {
      this.saveGuestCart();
      return of(void 0);
    }
  }

  // ── REMOVE ITEM ───────────────────────────────────
  removeItem(cartItemId: string): Observable<void> {
    this.cartStore.removeItem(cartItemId);
    if (this.authStore.isAuthenticated()) {
      return this.http.delete(`/api/cart/items/${cartItemId}`).pipe(
        map(() => void 0),
        catchError(() => of(void 0))
      );
    } else {
      this.saveGuestCart();
      return of(void 0);
    }
  }

  // ── CLEAR CART ────────────────────────────────────
  clearCart(): Observable<void> {
    this.cartStore.clearCart();
    localStorage.removeItem('guestCart');
    if (this.authStore.isAuthenticated()) {
      return this.http.delete('/api/cart').pipe(
        map(() => void 0),
        catchError(() => of(void 0))
      );
    }
    return of(void 0);
  }

  // ── GUEST CART ────────────────────────────────────
  saveGuestCart(): void {
    try {
      localStorage.setItem(
        'guestCart',
        JSON.stringify(this.cartStore.cartItems())
      );
    } catch { /* ignore */ }
  }

  loadGuestCart(): void {
    try {
      const raw = localStorage.getItem('guestCart');
      if (!raw) return;
      const items: ICartItem[] = JSON.parse(raw);
      if (items?.length) this.cartStore.setItems(items);
    } catch {
      localStorage.removeItem('guestCart');
    }
  }

  mergeGuestCartAfterLogin(): Observable<void> {
    const raw = localStorage.getItem('guestCart');
    if (!raw) return this.loadCart();

    let guestItems: ICartItem[] = [];
    try { guestItems = JSON.parse(raw); } catch { }
    if (!guestItems.length) return this.loadCart();

    const requests = guestItems.map(item =>
      this.http.post('/api/cart/items', {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      }).pipe(catchError(() => of(null)))
    );

    return forkJoin(requests).pipe(
      tap(() => localStorage.removeItem('guestCart')),
      switchMap(() => this.loadCart())
    );
  }

  // Compatibility reorderItems method
  reorderItems(items: { productId: string; variantId: string; quantity: number }[]): Observable<void> {
    const posts = items.map(i =>
      this.http.post('/api/cart/items', {
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      }).pipe(catchError(() => of(null)))
    );
    return forkJoin(posts).pipe(
      switchMap(() => this.loadCart())
    );
  }

  // Compatibility deliveryFee supporting optional subtotal parameter
  deliveryFee(subtotal?: number): number {
    const amount = subtotal !== undefined ? subtotal : this.cartStore.total();
    return amount >= 199 ? 0 : 29;
  }

  shareCart(items: ICartItem[]): Observable<{ shareUrl: string; token: string }> {
    const body = items.map(i => ({
      productId: i.productId,
      productName: i.product.name,
      variantId: i.variantId,
      variantUnit: i.variant.unit,
      imageUrl: i.variant.imageUrl,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));
    return this.http.post<{ shareUrl: string; token: string }>('/api/cart/share', body);
  }
}
