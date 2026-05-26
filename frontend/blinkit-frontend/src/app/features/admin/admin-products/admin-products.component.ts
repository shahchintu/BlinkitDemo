import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal, ViewChild,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService, ProductRequest } from '../../../core/services/admin.service';
import { ImageService } from '../../../core/services/image.service';
import { ICategory, IProduct } from '../../../core/models';
import { formatPrice, getCategoryFallback, resolveImageUrl } from '../../../shared/utils';
import { ImagePickerComponent } from '../../../shared/components/image-picker/image-picker.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatSnackBarModule, ImagePickerComponent],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-[#1A1A1A]">Products</h1>
      <button class="bg-[#0C831F] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
        (click)="openForm(null)">+ Add Product</button>
    </div>

    <!-- Filter bar -->
    <div class="flex gap-3 mb-4 flex-wrap">
      <input [formControl]="searchCtrl" placeholder="Search products..."
        class="border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F] flex-1 min-w-[180px]" />
      <select [formControl]="categoryCtrl"
        class="border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]">
        <option value="">All Categories</option>
        @for (cat of categories(); track cat.id) {
          <option [value]="cat.id">{{ cat.name }}</option>
        }
      </select>
    </div>

    <!-- Product form -->
    @if (showForm()) {
      <div class="bg-white rounded-xl border border-[#E0E0E0] p-5 mb-6">
        <h2 class="font-bold text-[#1A1A1A] mb-4">{{ editingId() ? 'Edit Product' : 'Add Product' }}</h2>
        <form [formGroup]="productForm" (ngSubmit)="saveProduct()" class="space-y-4">

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-[#666666] mb-1">Product Name *</label>
              <input formControlName="name"
                class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]" />
            </div>
            <div>
              <label class="block text-xs font-medium text-[#666666] mb-1">Category *</label>
              <select formControlName="categoryId"
                class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]">
                <option value="">Select category</option>
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-[#666666] mb-1">Description *</label>
            <textarea formControlName="description" rows="2"
              class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]"></textarea>
          </div>

          <!-- Main product image -->
          <div class="bg-gray-50 rounded-xl p-4 border border-[#E0E0E0]">
            <app-image-picker
              #mainImgPicker
              [entityId]="editingId() || ''"
              entityType="product"
              [currentImageUrl]="mainImageUrl()"
              label="Main Product Image"
              (imageUrlChange)="onMainImageChange($event)">
            </app-image-picker>
          </div>

          <!-- Gallery images (additional URLs) -->
          <div>
            <label class="block text-xs font-medium text-[#666666] mb-1">
              Additional Gallery URLs (comma-separated)
            </label>
            <input formControlName="images"
              placeholder="https://cdn.grofers.com/..."
              class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]" />
          </div>

          <!-- Variants -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="text-xs font-bold text-[#666666] uppercase tracking-wide">Variants *</label>
              <button type="button" class="text-xs text-[#0C831F] font-medium" (click)="addVariant()">
                + Add Variant
              </button>
            </div>

            @for (vg of variantsArray.controls; track $index; let i = $index) {
              <div [formGroup]="asGroup(vg)"
                class="border border-[#E0E0E0] rounded-xl p-3 mb-3 bg-gray-50">

                <!-- Variant fields row -->
                <div class="grid grid-cols-[1fr_1fr_1fr_1fr_32px] gap-2 mb-3 items-end">
                  <div>
                    <label class="block text-[10px] text-[#666666] mb-1">Unit</label>
                    <input formControlName="unit" placeholder="500g"
                      class="w-full border border-[#E0E0E0] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#0C831F]" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-[#666666] mb-1">Price ₹</label>
                    <input formControlName="price" type="number"
                      class="w-full border border-[#E0E0E0] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#0C831F]" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-[#666666] mb-1">Discount ₹</label>
                    <input formControlName="discountPrice" type="number"
                      class="w-full border border-[#E0E0E0] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#0C831F]" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-[#666666] mb-1">Stock</label>
                    <input formControlName="stockQty" type="number"
                      class="w-full border border-[#E0E0E0] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#0C831F]" />
                  </div>
                  <button type="button"
                    class="text-[#F44336] text-lg leading-none hover:opacity-70 mb-0.5 disabled:opacity-30"
                    (click)="removeVariant(i)"
                    [disabled]="variantsArray.length <= 1">×</button>
                </div>

                <!-- Variant image picker -->
                <app-image-picker
                  [entityId]="asGroup(vg).get('id')?.value || ''"
                  entityType="variant"
                  [currentImageUrl]="asGroup(vg).get('imageUrl')?.value || ''"
                  label="Variant Image"
                  (imageUrlChange)="onVariantImageChange(i, $event)">
                </app-image-picker>
              </div>
            }
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-xs font-medium text-[#666666] mb-1">Tags (comma-separated)</label>
            <input formControlName="tags" placeholder="fresh, organic, dairy"
              class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]" />
          </div>

          <div class="flex gap-2 pt-1">
            <button type="submit"
              class="bg-[#0C831F] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              [disabled]="productForm.invalid || saving()">
              {{ saving() ? 'Saving…' : 'Save Product' }}
            </button>
            <button type="button"
              class="border border-[#E0E0E0] text-sm px-5 py-2 rounded-xl hover:border-[#0C831F] transition-colors"
              (click)="closeForm()">Cancel</button>
          </div>
        </form>
      </div>
    }

    <!-- Table -->
    @if (loading()) {
      <div class="space-y-2">
        @for (_ of skeletons; track $index) {
          <div class="h-14 bg-white rounded-xl border border-[#E0E0E0] animate-pulse"></div>
        }
      </div>
    } @else {
      <div class="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        <div class="grid grid-cols-[56px_2fr_1.5fr_1fr_1fr_100px] gap-3 px-4 py-3 bg-gray-50
                    text-xs font-semibold text-[#666666] border-b border-[#E0E0E0]">
          <span>Img</span><span>Name</span><span>Category</span>
          <span>Price</span><span>Stock</span><span>Actions</span>
        </div>
        @for (product of products(); track product.id) {
          <div class="grid grid-cols-[56px_2fr_1.5fr_1fr_1fr_100px] gap-3 px-4 py-3
                      border-b border-[#F0F0F0] last:border-0 items-center">
            <img [src]="resolveImageUrl(productImages()[product.id] || product.imageUrl, product.categoryName)"
              [alt]="product.name"
              class="w-10 h-10 object-contain rounded-lg bg-gray-50 p-0.5"
              loading="lazy"
              (error)="onImgError($event, product.categoryName)" />
            <div>
              <p class="text-sm font-medium truncate">{{ product.name }}</p>
              <p class="text-xs text-[#666666]">{{ product.variants.length }} variant(s)</p>
            </div>
            <span class="text-sm text-[#666666]">{{ product.categoryName }}</span>
            <span class="text-sm font-semibold">{{ fmt(product.price) }}</span>
            <div>
              <span class="text-sm">{{ product.stockQty }}</span>
              @if (product.stockQty < 10) {
                <span class="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">
                  Low
                </span>
              }
            </div>
            <div class="flex gap-2">
              <button class="text-[#0C831F] text-xs hover:underline"
                (click)="openForm(product)">Edit</button>
              <button class="text-[#F44336] text-xs hover:underline"
                (click)="deleteProduct(product.id)">Del</button>
            </div>
          </div>
        }
      </div>

      <div class="flex justify-between items-center mt-4 text-sm text-[#666666]">
        <span>Page {{ page() }} of {{ totalPages() }}</span>
        <div class="flex gap-2">
          <button class="px-3 py-1.5 border border-[#E0E0E0] rounded-lg disabled:opacity-40 hover:border-[#0C831F] transition-colors"
            [disabled]="page() <= 1" (click)="changePage(page() - 1)">← Prev</button>
          <button class="px-3 py-1.5 border border-[#E0E0E0] rounded-lg disabled:opacity-40 hover:border-[#0C831F] transition-colors"
            [disabled]="page() >= totalPages()" (click)="changePage(page() + 1)">Next →</button>
        </div>
      </div>
    }
  `,
})
export class AdminProductsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly snackBar     = inject(MatSnackBar);
  private readonly imageService = inject(ImageService);

  /** Reference to the main image picker (inside @if, so static: false) */
  @ViewChild('mainImgPicker') mainImgPicker?: ImagePickerComponent;

  readonly products      = signal<IProduct[]>([]);
  readonly categories    = signal<ICategory[]>([]);
  readonly productImages = signal<Record<string, string>>({});
  readonly mainImageUrl  = signal('');
  readonly loading       = signal(true);
  readonly saving        = signal(false);
  readonly showForm      = signal(false);
  readonly editingId     = signal<string | null>(null);
  readonly page          = signal(1);
  readonly totalPages    = signal(1);
  readonly skeletons     = Array(5);

  fmt = formatPrice;
  protected readonly resolveImageUrl = resolveImageUrl;

  readonly searchCtrl   = new FormControl('');
  readonly categoryCtrl = new FormControl('');

  readonly productForm = new FormGroup({
    name:        new FormControl('', [Validators.required, Validators.minLength(2)]),
    categoryId:  new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required, Validators.minLength(10)]),
    tags:        new FormControl(''),
    images:      new FormControl(''),
    variants:    new FormArray([this.newVariantGroup()]),
  });

  get variantsArray(): FormArray { return this.productForm.get('variants') as FormArray; }

  ngOnInit(): void {
    this.adminService.getCategories().subscribe({ next: cats => this.categories.set(cats) });
    this.load();

    this.searchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => { this.page.set(1); this.load(); });
    this.categoryCtrl.valueChanges
      .subscribe(() => { this.page.set(1); this.load(); });
  }

  load(): void {
    this.loading.set(true);
    const search     = this.searchCtrl.value ?? undefined;
    const categoryId = this.categoryCtrl.value ?? undefined;
    this.adminService.getProducts(this.page(), 10, search || undefined, categoryId || undefined).subscribe({
      next: r => {
        this.products.set(r.items);
        this.totalPages.set(r.totalPages);
        this.loading.set(false);
        r.items.forEach(product => {
          // Pass existing imageUrl — uploaded images (/uploads/) are returned
          // immediately; CDN/fallback images still resolve via Unsplash.
          this.imageService.getProductImage(
            product.name, product.categoryName, product.id, product.imageUrl,
          ).subscribe(url => this.productImages.update(imgs => ({ ...imgs, [product.id]: url })));
        });
      },
      error: () => this.loading.set(false),
    });
  }

  changePage(p: number): void { this.page.set(p); this.load(); }

  newVariantGroup(): FormGroup {
    return new FormGroup({
      id:            new FormControl<string | null>(null),
      unit:          new FormControl('', Validators.required),
      price:         new FormControl(0, [Validators.required, Validators.min(1)]),
      discountPrice: new FormControl<number | null>(null),
      stockQty:      new FormControl(0, [Validators.required, Validators.min(0)]),
      imageUrl:      new FormControl(''),
    });
  }

  asGroup(ctrl: unknown): FormGroup { return ctrl as FormGroup; }

  addVariant(): void { this.variantsArray.push(this.newVariantGroup()); }
  removeVariant(i: number): void {
    if (this.variantsArray.length > 1) this.variantsArray.removeAt(i);
  }

  onMainImageChange(url: string): void {
    this.mainImageUrl.set(url);
  }

  onVariantImageChange(index: number, url: string): void {
    const ctrl = this.variantsArray.at(index)?.get('imageUrl');
    if (ctrl) ctrl.setValue(url);
  }

  openForm(product: IProduct | null): void {
    this.editingId.set(product?.id ?? null);
    this.mainImageUrl.set('');
    this.productForm.reset();
    while (this.variantsArray.length > 1) this.variantsArray.removeAt(1);

    if (product) {
      this.productForm.patchValue({
        name:        product.name,
        categoryId:  product.categoryId,
        description: product.description,
        tags:        product.relatedTags.join(', '),
        // Additional gallery images (skip index 0 — shown in the picker)
        images: product.images.slice(1).join(', '),
      });
      this.mainImageUrl.set(product.images[0] ?? product.imageUrl ?? '');

      this.variantsArray.clear();
      product.variants.forEach(v => {
        const g = this.newVariantGroup();
        g.patchValue({
          id: v.id, unit: v.unit, price: v.price,
          discountPrice: v.discountPrice, stockQty: v.stockQty, imageUrl: v.imageUrl,
        });
        this.variantsArray.push(g);
      });
    }
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.mainImageUrl.set('');
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.snackBar.open('× Please fill all required fields correctly', '', { duration: 3000 });
      return;
    }
    this.saving.set(true);

    const v = this.productForm.value;

    // Blob URLs (pending upload, no entityId yet) must not reach the backend
    const isBlob = (url: string | null | undefined) => (url ?? '').startsWith('blob:');

    const mainImg         = this.mainImageUrl();
    const additionalImgs  = (v.images ?? '').split(',').map((u: string) => u.trim()).filter(Boolean);
    const mainImgForReq   = isBlob(mainImg) ? '' : mainImg;
    const images          = mainImgForReq
      ? [mainImgForReq, ...additionalImgs]
      : additionalImgs;

    type RawVariant = {
      id: string | null;
      unit: string;
      price: number;
      discountPrice: number | null;
      stockQty: number;
      imageUrl: string;
    };

    const req: ProductRequest = {
      name:        v.name!,
      categoryId:  v.categoryId!,
      description: v.description!,
      tags:        (v.tags ?? '').split(',').map((t: string) => t.trim()).filter(Boolean),
      images,
      attributes:  [],
      variants:    (v.variants as RawVariant[]).map((vv, i) => ({
        id:           vv.id || undefined,
        unit:         vv.unit,
        price:        vv.price,
        discountPrice: vv.discountPrice,
        stockQty:     vv.stockQty,
        // Variant blob URLs are dropped — user uploads after saving
        imageUrl:     isBlob(vv.imageUrl) ? '' : (vv.imageUrl || mainImgForReq),
        displayOrder: i + 1,
      })),
    };

    const id = this.editingId();

    const done = () => {
      this.saving.set(false);
      this.closeForm();
      this.load();
      this.snackBar.open(id ? '✓ Product updated' : '✓ Product created', '', { duration: 2000 });
    };
    const fail = (err: unknown) => {
      this.saving.set(false);
      this.snackBar.open('× Failed to save product. Please try again.', '', { duration: 3000 });
      if (err) { /* suppress — snackBar already shown */ }
    };

    if (id) {
      this.adminService.updateProduct(id, req).subscribe({ next: done, error: fail });
    } else {
      // ADD mode: create first, then upload pending main image if any
      this.adminService.createProduct(req).subscribe({
        next: (created) => {
          const picker = this.mainImgPicker;
          if (picker?.pendingFile()) {
            // Upload the pending file using the real product ID
            picker.uploadPendingFile(created.id).subscribe({
              next: (imageUrl) => {
                // Update product images with the now-uploaded URL
                const updatedReq: ProductRequest = {
                  ...req,
                  images: [imageUrl, ...additionalImgs],
                };
                this.adminService.updateProduct(created.id, updatedReq).subscribe();
                done();
              },
              error: () => done(), // upload failed — product saved without image
            });
          } else {
            done();
          }
        },
        error: fail,
      });
    }
  }

  deleteProduct(id: string): void {
    if (!confirm('Delete this product?')) return;
    this.adminService.deleteProduct(id).subscribe({
      next: () => {
        this.products.update(list => list.filter(p => p.id !== id));
        this.snackBar.open('✓ Product deleted', '', { duration: 2000 });
      },
    });
  }

  onImgError(event: Event, category: string): void {
    (event.target as HTMLImageElement).src = getCategoryFallback(category);
  }
}
