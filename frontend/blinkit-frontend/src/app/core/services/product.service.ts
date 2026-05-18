import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ICategory, IProduct, IProductVariant, IPaginatedResult } from '../models';

interface ProductVariantDto {
  id: string;
  unit: string;
  price: number;
  discountPrice: number | null;
  stockQty: number;
  imageUrl: string;
  displayOrder: number;
}

interface ProductDto {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  defaultVariant: ProductVariantDto;
  variants: ProductVariantDto[];
  attributes: { key: string; value: string }[];
  relatedTags: string[];
  images: string[];
  hasVariants: boolean;
}

interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name_asc' | 'discount';
  minPrice?: number;
  maxPrice?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  getProducts(filters?: ProductFilters): Observable<IPaginatedResult<IProduct>> {
    let params = new HttpParams();
    if (filters?.search)     params = params.set('search', filters.search);
    if (filters?.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters?.page)       params = params.set('page', filters.page.toString());
    if (filters?.pageSize)   params = params.set('pageSize', filters.pageSize.toString());
    if (filters?.sortBy && filters.sortBy !== 'relevance')
      params = params.set('sortBy', filters.sortBy);
    if (filters?.minPrice)   params = params.set('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice && filters.maxPrice < 2000) 
      params = params.set('maxPrice', filters.maxPrice.toString());

    return this.http
      .get<PagedResultDto<ProductDto>>('/api/products', { params })
      .pipe(map(res => ({
        items: res.items.map(this.mapProduct),
        totalCount: res.totalCount,
        page: res.page,
        pageSize: res.pageSize,
        totalPages: res.totalPages,
      })));
  }

  getProductById(id: string): Observable<IProduct> {
    return this.http
      .get<ProductDto>(`/api/products/${id}`)
      .pipe(map(this.mapProduct));
  }

  getCategories(): Observable<ICategory[]> {
    return this.http.get<ICategory[]>('/api/categories');
  }

  getRelatedProducts(productId: string, limit = 12): Observable<IProduct[]> {
    return this.http
      .get<ProductDto[]>(`/api/products/${productId}/related`, { params: { limit } })
      .pipe(map(items => items.map(this.mapProduct)));
  }

  private mapProduct(p: ProductDto): IProduct {
    const mapVariant = (v: ProductVariantDto, pid: string): IProductVariant => ({
      id: v.id,
      productId: pid,
      unit: v.unit,
      price: v.price,
      discountPrice: v.discountPrice,
      stockQty: v.stockQty,
      imageUrl: v.imageUrl,
      displayOrder: v.displayOrder,
    });

    return {
      id: p.id,
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      name: p.name,
      slug: p.slug,
      description: p.description,
      isActive: p.isActive,
      price: p.defaultVariant.price,
      discountPrice: p.defaultVariant.discountPrice,
      stockQty: p.defaultVariant.stockQty,
      unit: p.defaultVariant.unit,
      imageUrl: p.defaultVariant.imageUrl,
      images: p.images.length > 0 ? p.images : [p.defaultVariant.imageUrl],
      variants: p.variants.map(v => mapVariant(v, p.id)),
      attributes: p.attributes,
      relatedTags: p.relatedTags,
    };
  }
}
