import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IOrder } from '../models';

export interface AddItemsRequest {
  items: { productId: string; variantId: string; qty: number }[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  getOrders(): Observable<IOrder[]> {
    return this.http.get<IOrder[]>('/api/orders');
  }

  getOrderById(id: string): Observable<IOrder> {
    return this.http.get<IOrder>(`/api/orders/${id}`);
  }

  addItemsToOrder(id: string, items: AddItemsRequest['items']): Observable<void> {
    return this.http.post<void>(`/api/orders/${id}/add-items`, { items });
  }
}
