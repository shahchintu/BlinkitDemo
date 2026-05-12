import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { ProductCardComponent } from '../../products/product-card/product-card.component';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { IProduct } from '../../../core/models';

@Component({
  selector: 'app-post-checkout-add',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavbarComponent, ProductCardComponent],
  template: `
    <app-navbar />
    <main class="min-h-screen bg-[#F8F8F8] pb-24">
      <div class="max-w-5xl mx-auto px-4 py-4">

        <!-- Banner -->
        <div class="bg-[#F8C200]/20 border border-[#F8C200] rounded-xl p-4 mb-5">
          <p class="font-semibold text-sm text-[#1A1A1A]">
            📦 Adding to Order #{{ shortId() }}
          </p>
          <p class="text-xs text-[#666666] mt-1">
            ⏱️ Order finalises once packed — add items now.
          </p>
        </div>

        <!-- Products -->
        @if (loading()) {
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            @for (_ of skeletons; track $index) {
              <div class="bg-white rounded-2xl h-64 animate-pulse border border-[#E0E0E0]"></div>
            }
          </div>
        } @else {
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            @for (product of products(); track product.id) {
              <app-product-card [product]="product" />
            }
          </div>
        }
      </div>

      <!-- Sticky Done button -->
      <div class="fixed bottom-4 left-0 right-0 flex justify-center px-4 z-30">
        <button
          class="w-full max-w-xs bg-[#0C831F] text-white rounded-xl py-4 font-semibold text-base shadow-lg hover:bg-green-700 transition-colors"
          (click)="done()">
          Done — View Orders
        </button>
      </div>
    </main>
  `,
})
export class PostCheckoutAddComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly productService = inject(ProductService);

  readonly products = signal<IProduct[]>([]);
  readonly loading = signal(true);
  readonly shortId = signal('');
  readonly skeletons = Array(10);

  private orderId = '';

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') ?? '';
    this.shortId.set(this.orderId.slice(-8).toUpperCase());

    this.orderService.getOrderById(this.orderId).subscribe({
      next: order => {
        if (order.status !== 'Placed') {
          this.router.navigate(['/orders']);
        }
      },
      error: () => this.router.navigate(['/orders']),
    });

    this.productService.getProducts({ page: 1, pageSize: 40 }).subscribe({
      next: result => { this.products.set(result.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  done(): void {
    this.router.navigate(['/orders']);
  }
}
