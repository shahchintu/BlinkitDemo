import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { ICartItem, IProduct, IProductVariant } from '../models';
import { generateId } from '../../shared/utils';

interface CartState {
  cartItems: ICartItem[];
}

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState<CartState>({ cartItems: [] }),
  withComputed(store => ({
    itemCount: computed(() => store.cartItems().reduce((sum, item) => sum + item.quantity, 0)),
    total: computed(() =>
      store.cartItems().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    ),
  })),
  withMethods(store => ({
    isVariantInCart(variantId: string): boolean {
      return store.cartItems().some(i => i.variantId === variantId);
    },
    getVariantQty(variantId: string): number {
      return store.cartItems().find(i => i.variantId === variantId)?.quantity ?? 0;
    },
    addItem(product: IProduct, variant: IProductVariant): void {
      const existing = store.cartItems().find(i => i.variantId === variant.id);
      if (existing) {
        patchState(store, {
          cartItems: store.cartItems().map(i =>
            i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        });
      } else {
        const newItem: ICartItem = {
          id: generateId(),
          productId: product.id,
          product,
          variantId: variant.id,
          variant,
          quantity: 1,
          unitPrice: variant.discountPrice ?? variant.price,
        };
        patchState(store, { cartItems: [...store.cartItems(), newItem] });
      }
    },
    updateQty(cartItemId: string, qty: number): void {
      if (qty <= 0) {
        patchState(store, { cartItems: store.cartItems().filter(i => i.id !== cartItemId) });
      } else {
        patchState(store, {
          cartItems: store.cartItems().map(i => i.id === cartItemId ? { ...i, quantity: qty } : i),
        });
      }
    },
    removeItem(cartItemId: string): void {
      patchState(store, { cartItems: store.cartItems().filter(i => i.id !== cartItemId) });
    },
    clearCart(): void {
      patchState(store, { cartItems: [] });
    },
    setItems(items: ICartItem[]): void {
      patchState(store, { cartItems: items });
    },
    updateItemId(variantId: string, newId: string): void {
      patchState(store, {
        cartItems: store.cartItems().map(i => i.variantId === variantId ? { ...i, id: newId } : i),
      });
    },
  }))
);
