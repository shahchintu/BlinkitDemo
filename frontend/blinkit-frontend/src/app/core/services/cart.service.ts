import { effect, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
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
        this.mergeGuestCartAfterLogin().subscribe();
      } else {
        const guestItems = this.readGuestItems();
        this.cartStore.setItems(guestItems);
        this.cartSubject.next(this.guestItemsToCartDto(guestItems));
      }
    });
  }

  openCart(): void { this.sidebarSubject.next(true); }
  closeCart(): void { this.sidebarSubject.next(false); }

  loadCart(): Observable<void> {
    return this.http.get<CartDto>('/api/cart').pipe(
      tap(dto => {
        this.cartSubject.next(dto);
        this.cartStore.setItems(this.buildStoreItemsFromDto(dto));
      }),
      map(() => void 0),
    );
  }

  addItem(product: IProduct, variant: IProductVariant): Observable<void> {
    if (!this.authStore.isAuthenticated()) {
      this.addGuestItem(product, variant);
      return of(void 0);
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
          const serverItem = dto.items.find(i => i.variantId === variant.id);
          if (serverItem) {
            this.cartStore.updateItemId(variant.id, serverItem.id);
          }
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
    if (!this.authStore.isAuthenticated()) {
      const items = this.readGuestItems();
      const updated = qty <= 0
        ? items.filter(i => i.id !== serverItemId)
        : items.map(i => i.id === serverItemId ? { ...i, quantity: qty } : i);
      this.syncGuest(updated);
      return of(void 0);
    }

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
        tap(dto => {
          this.cartSubject.next(dto);
          this.cartStore.setItems(this.buildStoreItemsFromDto(dto));
        }),
        map(() => void 0),
      );
  }

  removeItem(serverItemId: string): Observable<void> {
    if (!this.authStore.isAuthenticated()) {
      const items = this.readGuestItems().filter(i => i.id !== serverItemId);
      this.syncGuest(items);
      return of(void 0);
    }

    const variantId = this.getVariantId(serverItemId);
    if (variantId) {
      const storeItem = this.cartStore.cartItems().find(i => i.variantId === variantId);
      if (storeItem) this.cartStore.removeItem(storeItem.id);
    }

    return this.http.delete<CartDto>(`/api/cart/items/${serverItemId}`).pipe(
      tap(dto => {
        this.cartSubject.next(dto);
        this.cartStore.setItems(this.buildStoreItemsFromDto(dto));
      }),
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

  mergeGuestCartAfterLogin(): Observable<void> {
    let guestItems: ICartItem[];
    try {
      guestItems = JSON.parse(localStorage.getItem('guestCart') ?? '[]');
      localStorage.removeItem('guestCart');
    } catch {
      guestItems = [];
    }

    if (guestItems.length === 0) {
      return this.loadCart();
    }

    const posts = guestItems.map(item =>
      this.http.post<CartDto>('/api/cart/items', {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }).pipe(catchError(() => of(null as CartDto | null)))
    );

    return forkJoin(posts).pipe(
      switchMap(() => this.loadCart()),
      map(() => void 0),
    );
  }

  private addGuestItem(product: IProduct, variant: IProductVariant): void {
    const items = this.readGuestItems();
    const existing = items.find(i => i.variantId === variant.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({
        id: `guest-${variant.id}`,
        productId: product.id,
        product,
        variantId: variant.id,
        variant,
        quantity: 1,
        unitPrice: variant.discountPrice ?? variant.price,
      });
    }
    this.syncGuest(items);
  }

  private readGuestItems(): ICartItem[] {
    try {
      return JSON.parse(localStorage.getItem('guestCart') ?? '[]');
    } catch {
      return [];
    }
  }

  private syncGuest(items: ICartItem[]): void {
    try {
      localStorage.setItem('guestCart', JSON.stringify(items));
    } catch { }
    this.cartStore.setItems(items);
    this.cartSubject.next(this.guestItemsToCartDto(items));
  }

  private guestItemsToCartDto(items: ICartItem[]): CartDto {
    return {
      items: items.map(i => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        variantId: i.variantId,
        variantUnit: i.variant.unit,
        variantImageUrl: i.variant.imageUrl,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      subTotal: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
    };
  }

  private getVariantId(serverItemId: string): string | undefined {
    return this.cartSubject.value.items.find(i => i.id === serverItemId)?.variantId;
  }

  private buildStoreItemsFromDto(dto: CartDto): ICartItem[] {
    return dto.items.map(item => ({
      id: item.id,
      productId: item.productId,
      product: {
        id: item.productId,
        categoryId: '',
        categoryName: '',
        name: item.productName,
        slug: '',
        description: '',
        price: item.unitPrice,
        discountPrice: null,
        stockQty: 1,
        unit: item.variantUnit,
        imageUrl: item.variantImageUrl,
        images: [item.variantImageUrl],
        isActive: true,
        variants: [],
        attributes: [],
        relatedTags: [],
      } as IProduct,
      variantId: item.variantId,
      variant: {
        id: item.variantId,
        productId: item.productId,
        unit: item.variantUnit,
        price: item.unitPrice,
        discountPrice: null,
        stockQty: 1,
        imageUrl: item.variantImageUrl,
        displayOrder: 0,
      } as IProductVariant,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));
  }
}
