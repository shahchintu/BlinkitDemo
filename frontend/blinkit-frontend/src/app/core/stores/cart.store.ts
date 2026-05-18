import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { ICartItem, IProduct, IProductVariant } from '../models';

interface CartState {
  cartItems: ICartItem[];
  isLoading: boolean;
}

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState<CartState>({
    cartItems: [] as ICartItem[],
    isLoading: false,
  }),
  withComputed((store) => ({
    itemCount: computed(() =>
      store.cartItems().reduce(
        (sum, i) => sum + i.quantity, 0)
    ),
    total: computed(() =>
      store.cartItems().reduce(
        (sum, i) => sum + (i.unitPrice * i.quantity), 0)
    ),
  })),
  withMethods((store) => ({

    isVariantInCart(variantId: string): boolean {
      return store.cartItems().some(i => i.variantId === variantId);
    },

    getVariantQty(variantId: string): number {
      return store.cartItems().find(i => i.variantId === variantId)?.quantity ?? 0;
    },

    setItems(items: ICartItem[]): void {
      patchState(store, { cartItems: [...items] });
    },

    addItem(product: IProduct, variant: IProductVariant): void {
      const current = [...store.cartItems()];
      const idx = current.findIndex(
        i => i.variantId === variant.id
      );
      if (idx >= 0) {
        const updated = current.map((item, i) =>
          i === idx
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        patchState(store, { cartItems: updated });
      } else {
        patchState(store, {
          cartItems: [...current, {
            id: crypto.randomUUID(),
            productId: product.id,
            product,
            variantId: variant.id,
            variant,
            quantity: 1,
            unitPrice: variant.discountPrice ?? variant.price
          }]
        });
      }
    },

    updateQty(cartItemId: string, qty: number): void {
      if (qty <= 0) {
        patchState(store, {
          cartItems: store.cartItems().filter(
            i => i.id !== cartItemId
          )
        });
        return;
      }
      patchState(store, {
        cartItems: store.cartItems().map(i =>
          i.id === cartItemId ? { ...i, quantity: qty } : i
        )
      });
    },

    removeItem(cartItemId: string): void {
      patchState(store, {
        cartItems: store.cartItems().filter(
          i => i.id !== cartItemId
        )
      });
    },

    clearCart(): void {
      patchState(store, { cartItems: [] });
    },

  }))
);
