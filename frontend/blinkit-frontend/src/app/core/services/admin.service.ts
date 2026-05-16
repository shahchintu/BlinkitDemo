import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ICategory, ICoupon, IOrder, IProduct, IUser, IPaginatedResult, IProductVariant } from '../models';

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  topProducts: { productId: string; name: string; imageUrl: string; soldCount: number }[];
}

export interface AdminUserDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  orderCount: number;
  createdAt: string;
}

export interface VariantInput {
  id?: string;
  unit: string;
  price: number;
  discountPrice: number | null;
  stockQty: number;
  imageUrl: string;
  displayOrder: number;
}

export interface ProductRequest {
  name: string;
  categoryId: string;
  description: string;
  variants: VariantInput[];
  attributes: { key: string; value: string }[];
  tags: string[];
  images: string[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  // Dashboard
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>('/api/admin/dashboard/stats');
  }

  // Products
  getProducts(page = 1, pageSize = 10, search?: string, categoryId?: string, activeOnly = false): Observable<IPaginatedResult<IProduct>> {
    let params = new HttpParams()
      .set('page', page).set('pageSize', pageSize).set('activeOnly', activeOnly);
    if (search) params = params.set('search', search);
    if (categoryId) params = params.set('categoryId', categoryId);
    
    return this.http.get<any>('/api/admin/products', { params }).pipe(
      map(res => {
        const items = res.items || res.Items || [];
        return {
          items: items.map((p: any) => this.mapProduct(p)),
          totalCount: res.totalCount || res.TotalCount || 0,
          page: res.page || res.Page || page,
          pageSize: res.pageSize || res.PageSize || pageSize,
          totalPages: res.totalPages || res.TotalPages || 1
        };
      })
    );
  }

  private mapProduct(p: any): IProduct {
    if (!p) return {} as IProduct;
    const variants = p.variants || p.Variants || [];
    const defaultVariant = p.defaultVariant || p.DefaultVariant || variants[0] || {};
    const id = p.id || p.Id || '';

    const mapVariant = (v: any, pid: string): IProductVariant => ({
      id: v.id || v.Id,
      productId: pid,
      unit: v.unit || v.Unit || '',
      price: v.price || v.Price || 0,
      discountPrice: v.discountPrice !== undefined ? v.discountPrice : v.DiscountPrice,
      stockQty: v.stockQty !== undefined ? v.stockQty : (v.StockQty || 0),
      imageUrl: v.imageUrl || v.ImageUrl || '',
      displayOrder: v.displayOrder || v.DisplayOrder || 0,
    });

    return {
      id,
      categoryId: p.categoryId || p.CategoryId || '',
      categoryName: p.categoryName || p.CategoryName || '',
      name: p.name || p.Name || '',
      slug: p.slug || p.Slug || '',
      description: p.description || p.Description || '',
      isActive: p.isActive !== undefined ? p.isActive : (p.IsActive !== undefined ? p.IsActive : true),
      price: (defaultVariant.price !== undefined ? defaultVariant.price : defaultVariant.Price) ?? 0,
      discountPrice: (defaultVariant.discountPrice !== undefined ? defaultVariant.discountPrice : defaultVariant.DiscountPrice) ?? null,
      stockQty: (defaultVariant.stockQty !== undefined ? defaultVariant.stockQty : defaultVariant.StockQty) ?? 0,
      unit: defaultVariant.unit || defaultVariant.Unit || '',
      imageUrl: defaultVariant.imageUrl || defaultVariant.ImageUrl || '',
      images: (p.images || p.Images || []).length > 0 ? (p.images || p.Images) : [defaultVariant.imageUrl || defaultVariant.ImageUrl].filter(Boolean),
      variants: variants.map((v: any) => mapVariant(v, id)),
      attributes: p.attributes || p.Attributes || [],
      relatedTags: p.relatedTags || p.RelatedTags || [],
    };
  }

  createProduct(req: ProductRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>('/api/admin/products', req);
  }

  updateProduct(id: string, req: ProductRequest): Observable<void> {
    return this.http.put<void>(`/api/admin/products/${id}`, req);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/products/${id}`);
  }

  toggleProductActive(id: string): Observable<void> {
    return this.http.patch<void>(`/api/admin/products/${id}/toggle-active`, {});
  }

  // Categories
  getCategories(): Observable<ICategory[]> {
    return this.http.get<ICategory[]>('/api/admin/categories');
  }

  createCategory(req: { name: string; slug: string; iconUrl: string; displayOrder: number }): Observable<{ id: string }> {
    return this.http.post<{ id: string }>('/api/admin/categories', req);
  }

  updateCategory(id: string, req: { name: string; slug: string; iconUrl: string; displayOrder: number }): Observable<void> {
    return this.http.put<void>(`/api/admin/categories/${id}`, req);
  }

  reorderCategories(items: { categoryId: string; displayOrder: number }[]): Observable<void> {
    return this.http.patch<void>('/api/admin/categories/reorder', items);
  }

  toggleCategoryActive(id: string): Observable<void> {
    return this.http.patch<void>(`/api/admin/categories/${id}/toggle-active`, {});
  }

  // Coupons
  getCoupons(): Observable<ICoupon[]> {
    return this.http.get<ICoupon[]>('/api/admin/coupons');
  }

  createCoupon(req: object): Observable<{ id: string }> {
    return this.http.post<{ id: string }>('/api/admin/coupons', req);
  }

  updateCoupon(id: string, req: object): Observable<void> {
    return this.http.put<void>(`/api/admin/coupons/${id}`, req);
  }

  toggleCouponActive(id: string): Observable<void> {
    return this.http.patch<void>(`/api/admin/coupons/${id}/toggle-active`, {});
  }

  // Orders
  getOrders(page = 1, pageSize = 10, status?: string): Observable<IPaginatedResult<IOrder>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    return this.http.get<IPaginatedResult<IOrder>>('/api/admin/orders', { params });
  }

  getOrderById(id: string): Observable<IOrder> {
    return this.http.get<IOrder>(`/api/admin/orders/${id}`);
  }

  updateOrderStatus(id: string, status: string): Observable<void> {
    return this.http.patch<void>(`/api/admin/orders/${id}/status`, { status });
  }

  // Users
  getUsers(page = 1, pageSize = 20, search?: string): Observable<IPaginatedResult<AdminUserDto>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    return this.http.get<IPaginatedResult<AdminUserDto>>('/api/admin/users', { params });
  }

  getUserOrders(userId: string): Observable<IOrder[]> {
    return this.http.get<IOrder[]>(`/api/admin/users/${userId}/orders`);
  }
}
