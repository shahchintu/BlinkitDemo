import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { ImageService } from '../../../core/services/image.service';
import { ICategory, IProduct } from '../../../core/models';
import { formatPrice } from '../../../shared/utils';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatSnackBarModule],
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
              <input formControlName="name" class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]" />
            </div>
            <div>
              <label class="block text-xs font-medium text-[#666666] mb-1">Category *</label>
              <select formControlName="categoryId" class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]">
                <option value="">Select category</option>
                @for (cat of categories(); track cat.id) { <option [value]="cat.id">{{ cat.name }}</option> }
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-[#666666] mb-1">Description *</label>
            <textarea formControlName="description" rows="2"
              class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]"></textarea>
          </div>

          <!-- Variants -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="text-xs font-bold text-[#666666] uppercase tracking-wide">Variants *</label>
              <button type="button" class="text-xs text-[#0C831F] font-medium" (click)="addVariant()">+ Add Variant</button>
            </div>
            @for (vg of variantsArray.controls; track $index; let i = $index) {
              <div [formGroup]="asGroup(vg)" class="grid grid-cols-6 gap-2 mb-2 items-end">
                <div>
                  <label class="block text-[10px] text-[#666666] mb-1">Unit</label>
                  <input formControlName="unit" placeholder="500g" class="w-full border border-[#E0E0E0] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#0C831F]" />
                </div>
                <div>
                  <label class="block text-[10px] text-[#666666] mb-1">Price ₹</label>
                  <input formControlName="price" type="number" class="w-full border border-[#E0E0E0] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#0C831F]" />
                </div>
                <div>
                  <label class="block text-[10px] text-[#666666] mb-1">Discount ₹</label>
                  <input formControlName="discountPrice" type="number" class="w-full border border-[#E0E0E0] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#0C831F]" />
                </div>
                <div>
                  <label class="block text-[10px] text-[#666666] mb-1">Stock</label>
                  <input formControlName="stockQty" type="number" class="w-full border border-[#E0E0E0] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#0C831F]" />
                </div>
                <div class="col-span-1">
                  <label class="block text-[10px] text-[#666666] mb-1">Image URL</label>
                  <input formControlName="imageUrl" class="w-full border border-[#E0E0E0] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#0C831F]" />
                </div>
                <button type="button" class="text-[#F44336] text-lg leading-none hover:opacity-70 mb-0.5"
                  (click)="removeVariant(i)" [disabled]="variantsArray.length <= 1">×</button>
              </div>
            }
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-xs font-medium text-[#666666] mb-1">Tags (comma-separated)</label>
            <input formControlName="tags" placeholder="fresh, organic, dairy"
              class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]" />
          </div>

          <!-- Images -->
          <div>
            <label class="block text-xs font-medium text-[#666666] mb-1">Image URLs (comma-separated)</label>
            <input formControlName="images" placeholder="https://cdn.grofers.com/..."
              class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]" />
          </div>

          @if (previewImageUrl()) {
            <div class="flex flex-col items-center">
              <img [src]="previewImageUrl()" class="w-24 h-24 object-cover rounded-xl border border-[#E0E0E0]" loading="lazy" />
              <span class="text-[12px] text-[#666666] mt-1">Auto-loaded from Unsplash</span>
            </div>
          }

          <div class="flex gap-2 pt-1">
            <button type="submit"
              class="bg-[#0C831F] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              [disabled]="productForm.invalid || saving()">
              {{ saving() ? 'Saving...' : 'Save Product' }}
            </button>
            <button type="button" class="border border-[#E0E0E0] text-sm px-5 py-2 rounded-xl hover:border-[#0C831F] transition-colors"
              (click)="closeForm()">Cancel</button>
          </div>
        </form>
      </div>
    }

    <!-- Table -->
    @if (loading()) {
      <div class="space-y-2">@for (_ of skeletons; track $index) { <div class="h-14 bg-white rounded-xl border border-[#E0E0E0] animate-pulse"></div> }</div>
    } @else {
      <div class="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        <div class="grid grid-cols-[56px_2fr_1.5fr_1fr_1fr_100px] gap-3 px-4 py-3 bg-gray-50 text-xs font-semibold text-[#666666] border-b border-[#E0E0E0]">
          <span>Img</span><span>Name</span><span>Category</span><span>Price</span><span>Stock</span><span>Actions</span>
        </div>
        @for (product of products(); track product.id) {
          <div class="grid grid-cols-[56px_2fr_1.5fr_1fr_1fr_100px] gap-3 px-4 py-3 border-b border-[#F0F0F0] last:border-0 items-center">
            <img [src]="productImages()[product.id] || product.imageUrl" [alt]="product.name" class="w-10 h-10 object-contain rounded-lg bg-gray-50 p-0.5" loading="lazy" />
            <div>
              <p class="text-sm font-medium truncate">{{ product.name }}</p>
              <p class="text-xs text-[#666666]">{{ product.variants.length }} variant(s)</p>
            </div>
            <span class="text-sm text-[#666666]">{{ product.categoryName }}</span>
            <span class="text-sm font-semibold">{{ fmt(product.price) }}</span>
            <div>
              <span class="text-sm">{{ product.stockQty }}</span>
              @if (product.stockQty < 10) {
                <span class="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">Low</span>
              }
            </div>
            <div class="flex gap-2">
              <button class="text-[#0C831F] text-xs hover:underline" (click)="openForm(product)">Edit</button>
              <button class="text-[#F44336] text-xs hover:underline" (click)="deleteProduct(product.id)">Del</button>
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
  private readonly snackBar = inject(MatSnackBar);
  private readonly imageService = inject(ImageService);

  readonly products = signal<IProduct[]>([]);
  readonly categories = signal<ICategory[]>([]);
  readonly productImages = signal<Record<string, string>>({});
  readonly previewImageUrl = signal<string>('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly skeletons = Array(5);

  fmt = formatPrice;

  readonly searchCtrl = new FormControl('');
  readonly categoryCtrl = new FormControl('');

  readonly productForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    categoryId: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required, Validators.minLength(10)]),
    tags: new FormControl(''),
    images: new FormControl(''),
    variants: new FormArray([this.newVariantGroup()]),
  });

  get variantsArray(): FormArray { return this.productForm.get('variants') as FormArray; }

  ngOnInit(): void {
    this.adminService.getCategories().subscribe({ next: cats => this.categories.set(cats) });
    this.load();

    this.searchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.load();
    });
    this.categoryCtrl.valueChanges.subscribe(() => { this.page.set(1); this.load(); });
  }

  load(): void {
    this.loading.set(true);
    const search = this.searchCtrl.value ?? undefined;
    const categoryId = this.categoryCtrl.value ?? undefined;
    this.adminService.getProducts(this.page(), 10, search || undefined, categoryId || undefined).subscribe({
      next: r => {
        this.products.set(r.items);
        this.totalPages.set(r.totalPages);
        this.loading.set(false);
        r.items.forEach(product => {
          this.imageService.getProductImage(product.name, product.categoryName, product.id)
            .subscribe(url => this.productImages.update(imgs => ({ ...imgs, [product.id]: url })));
        });
      },
      error: () => this.loading.set(false),
    });
  }

  changePage(p: number): void { this.page.set(p); this.load(); }

  newVariantGroup(): FormGroup {
    return new FormGroup({
      unit: new FormControl('', Validators.required),
      price: new FormControl(0, [Validators.required, Validators.min(1)]),
      discountPrice: new FormControl<number | null>(null),
      stockQty: new FormControl(0, [Validators.required, Validators.min(0)]),
      imageUrl: new FormControl('', Validators.required),
    });
  }

  asGroup(ctrl: unknown): FormGroup { return ctrl as FormGroup; }

  addVariant(): void { this.variantsArray.push(this.newVariantGroup()); }
  removeVariant(i: number): void { if (this.variantsArray.length > 1) this.variantsArray.removeAt(i); }

  openForm(product: IProduct | null): void {
    this.editingId.set(product?.id ?? null);
    this.previewImageUrl.set('');
    this.productForm.reset();
    while (this.variantsArray.length > 1) this.variantsArray.removeAt(1);

    if (product) {
      this.productForm.patchValue({
        name: product.name,
        categoryId: product.categoryId,
        description: product.description,
        tags: product.relatedTags.join(', '),
        images: product.images.join(', '),
      });
      this.variantsArray.clear();
      product.variants.forEach(v => {
        const g = this.newVariantGroup();
        g.patchValue({ unit: v.unit, price: v.price, discountPrice: v.discountPrice, stockQty: v.stockQty, imageUrl: v.imageUrl });
        this.variantsArray.push(g);
      });
      this.imageService.getProductImage(product.name, product.categoryName, product.id)
        .subscribe(url => this.previewImageUrl.set(url));
    }
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editingId.set(null); this.previewImageUrl.set(''); }

  saveProduct(): void {
    if (this.productForm.invalid) return;
    this.saving.set(true);
    const v = this.productForm.value;
    const req = {
      name: v.name!,
      categoryId: v.categoryId!,
      description: v.description!,
      tags: (v.tags ?? '').split(',').map((t: string) => t.trim()).filter(Boolean),
      images: (v.images ?? '').split(',').map((u: string) => u.trim()).filter(Boolean),
      attributes: [],
      variants: (v.variants as {unit:string;price:number;discountPrice:number|null;stockQty:number;imageUrl:string}[])
        .map((vv, i) => ({ ...vv, displayOrder: i + 1 })),
    };

    const id = this.editingId();
    const done = () => {
      this.saving.set(false);
      this.closeForm();
      this.load();
      this.snackBar.open(id ? '✓ Product updated' : '✓ Product created', '', { duration: 2000 });
    };
    const fail = () => this.saving.set(false);
    if (id) {
      this.adminService.updateProduct(id, req).subscribe({ next: done, error: fail });
    } else {
      this.adminService.createProduct(req).subscribe({ next: done, error: fail });
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
}
