import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal, ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { ImageService } from '../../../core/services/image.service';
import { ICategory } from '../../../core/models';
import { resolveImageUrl } from '../../../shared/utils';
import { ImagePickerComponent } from '../../../shared/components/image-picker/image-picker.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatSnackBarModule, ImagePickerComponent],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-[#1A1A1A]">Categories</h1>
      <button class="bg-[#0C831F] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
        (click)="toggleAddForm()">
        {{ showForm() ? 'Cancel' : '+ Add Category' }}
      </button>
    </div>

    @if (showForm()) {
      <form [formGroup]="catForm" (ngSubmit)="saveCategory()"
        class="bg-white rounded-xl border border-[#E0E0E0] p-4 mb-6 shadow-sm space-y-4">

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[#666666] mb-1 uppercase tracking-wider">
              Name *
            </label>
            <input formControlName="name" placeholder="e.g. Beverages"
              class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]" />
          </div>
          <div>
            <label class="block text-xs font-medium text-[#666666] mb-1 uppercase tracking-wider">
              Slug *
            </label>
            <input formControlName="slug" placeholder="beverages"
              class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]" />
          </div>
        </div>

        <!-- Category icon picker -->
        <div class="bg-gray-50 rounded-xl p-4 border border-[#E0E0E0]">
          <app-image-picker
            #catImgPicker
            [entityId]="editingCat()?.id || ''"
            entityType="category"
            [currentImageUrl]="catIconUrl()"
            label="Category Icon *"
            (imageUrlChange)="onCatIconChange($event)">
          </app-image-picker>
        </div>

        <div class="flex gap-2">
          <button type="submit"
            class="bg-[#0C831F] text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-green-700"
            [disabled]="catForm.invalid || savingCat()">
            {{ savingCat() ? 'Saving…' : (editingCat() ? 'Update' : 'Save') }}
          </button>
          <button type="button"
            class="border border-[#E0E0E0] text-sm px-4 py-2 rounded-xl hover:border-[#0C831F] transition-colors"
            (click)="toggleAddForm()">Cancel</button>
        </div>
      </form>
    }

    @if (loading()) {
      <div class="space-y-2">
        @for (_ of skeletons; track $index) {
          <div class="h-14 bg-white rounded-xl border border-[#E0E0E0] animate-pulse"></div>
        }
      </div>
    } @else {
      <div class="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden shadow-sm">
        <div class="grid grid-cols-[56px_2fr_1fr_100px_100px_120px] gap-3 px-4 py-3 bg-gray-50
                    text-[10px] font-bold text-[#666666] border-b border-[#E0E0E0] uppercase tracking-wider">
          <span>Icon</span><span>Name</span><span>Slug</span>
          <span class="text-center">Order</span><span class="text-center">Active</span>
          <span class="text-right">Actions</span>
        </div>
        @for (cat of categories(); track cat.id; let i = $index) {
          <div class="grid grid-cols-[56px_2fr_1fr_100px_100px_120px] gap-3 px-4 py-3
                      border-b border-[#F0F0F0] last:border-0 items-center hover:bg-[#F9F9F9] transition-colors">
            <div class="w-10 h-10 rounded-lg bg-gray-50 p-1 border border-[#F0F0F0] overflow-hidden">
              <img [src]="resolveImageUrl(categoryImages()[cat.id] || cat.iconUrl, cat.name)"
                [alt]="cat.name"
                class="w-full h-full object-contain"
                loading="lazy"
                (error)="onImgError($event, cat.name)" />
            </div>
            <div>
              <span class="text-sm font-medium text-gray-900">{{ cat.name }}</span>
              <p class="text-[10px] text-[#666666]">{{ cat.productCount }} products</p>
            </div>
            <span class="text-xs text-[#666666] font-mono">{{ cat.slug }}</span>
            <div class="flex justify-center gap-1">
              <button class="text-[#666666] text-lg hover:text-[#0C831F] disabled:opacity-20 p-1"
                [disabled]="i === 0" (click)="moveUp(i)">↑</button>
              <button class="text-[#666666] text-lg hover:text-[#0C831F] disabled:opacity-20 p-1"
                [disabled]="i === categories().length - 1" (click)="moveDown(i)">↓</button>
            </div>
            <div class="flex justify-center">
              <button class="relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none"
                [class]="cat.isActive ? 'bg-[#0C831F]' : 'bg-gray-300'"
                (click)="toggleActive(cat.id)">
                <span class="inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5"
                  [class]="cat.isActive ? 'translate-x-5' : 'translate-x-0.5'"></span>
              </button>
            </div>
            <div class="flex justify-end gap-3 text-xs">
              <button class="text-[#0C831F] font-semibold hover:underline" (click)="editCategory(cat)">
                Edit
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class AdminCategoriesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly snackBar     = inject(MatSnackBar);
  private readonly imageService = inject(ImageService);

  /** Reference to the category icon picker (inside @if, static: false) */
  @ViewChild('catImgPicker') catImgPicker?: ImagePickerComponent;

  readonly categories    = signal<ICategory[]>([]);
  readonly categoryImages = signal<Record<string, string>>({});
  readonly catIconUrl    = signal('');   // tracks the URL shown in the picker
  readonly loading       = signal(true);
  readonly showForm      = signal(false);
  readonly editingCat    = signal<ICategory | null>(null);
  readonly savingCat     = signal(false);
  readonly skeletons     = Array(8);
  protected readonly resolveImageUrl = resolveImageUrl;

  readonly catForm = new FormGroup({
    name:    new FormControl('', Validators.required),
    slug:    new FormControl('', Validators.required),
    iconUrl: new FormControl('', Validators.required),
  });

  ngOnInit(): void {
    this.loadCategories();

    this.catForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.editingCat()) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        this.catForm.get('slug')?.setValue(slug, { emitEvent: false });
      }
    });
  }

  loadCategories(): void {
    this.loading.set(true);
    this.adminService.getCategories().subscribe({
      next: cats => {
        this.categories.set(cats);
        this.loading.set(false);
        cats.forEach(cat => this.fetchCatImage(cat));
      },
      error: () => this.loading.set(false),
    });
  }

  private fetchCatImage(cat: ICategory): void {
    // Pass existing iconUrl — uploaded images (/uploads/) are returned
    // immediately and never replaced by an Unsplash result.
    this.imageService.getCategoryImage(cat.name, cat.id, cat.iconUrl)
      .subscribe(url => {
        if (url) this.categoryImages.update(imgs => ({ ...imgs, [cat.id]: url }));
      });
  }

  onCatIconChange(url: string): void {
    this.catIconUrl.set(url);
    // Keep the reactive form in sync so Validators.required works
    this.catForm.get('iconUrl')?.setValue(url);
  }

  toggleAddForm(): void {
    if (this.showForm() && this.editingCat()) {
      this.editingCat.set(null);
      this.catForm.reset();
      this.catIconUrl.set('');
    } else {
      this.showForm.set(!this.showForm());
      this.editingCat.set(null);
      this.catForm.reset();
      this.catIconUrl.set('');
    }
  }

  editCategory(cat: ICategory): void {
    this.editingCat.set(cat);
    this.showForm.set(true);
    this.catIconUrl.set(cat.iconUrl);
    this.catForm.patchValue({ name: cat.name, slug: cat.slug, iconUrl: cat.iconUrl });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveCategory(): void {
    if (this.catForm.invalid) return;
    this.savingCat.set(true);

    const { name, slug } = this.catForm.value;
    // Use catIconUrl signal (most up-to-date value from picker)
    const iconUrl  = this.catIconUrl();
    const isBlob   = iconUrl.startsWith('blob:');
    const editing  = this.editingCat();

    if (editing) {
      // EDIT mode — picker uploads immediately (entityId is set), URL is always real
      this.adminService.updateCategory(editing.id, {
        name: name!, slug: slug!, iconUrl, displayOrder: editing.displayOrder,
      }).subscribe({
        next: () => {
          this.savingCat.set(false);
          this.snackBar.open('✓ Category updated', '', { duration: 2000 });
          this.finishSave();
        },
        error: () => this.savingCat.set(false),
      });
    } else {
      // ADD mode — create first, then upload pending file if any
      const nextOrder   = this.categories().length + 1;
      const iconForReq  = isBlob ? '' : iconUrl; // don't store blob URL in DB

      this.adminService.createCategory({
        name: name!, slug: slug!, iconUrl: iconForReq, displayOrder: nextOrder,
      }).subscribe({
        next: (created) => {
          const picker = this.catImgPicker;
          if (picker?.pendingFile()) {
            // Upload pending image with the real category ID
            picker.uploadPendingFile(created.id).subscribe({
              next: (realUrl) => {
                // Update category with the uploaded icon URL
                this.adminService.updateCategory(created.id, {
                  name: name!, slug: slug!, iconUrl: realUrl, displayOrder: nextOrder,
                }).subscribe();
                this.savingCat.set(false);
                this.snackBar.open('✓ Category added', '', { duration: 2000 });
                this.finishSave();
              },
              error: () => {
                // Upload failed — category saved without icon
                this.savingCat.set(false);
                this.snackBar.open('✓ Category added (icon upload failed)', '', { duration: 3000 });
                this.finishSave();
              },
            });
          } else {
            this.savingCat.set(false);
            this.snackBar.open('✓ Category added', '', { duration: 2000 });
            this.finishSave();
          }
        },
        error: () => this.savingCat.set(false),
      });
    }
  }

  private finishSave(): void {
    this.catForm.reset();
    this.catIconUrl.set('');
    this.showForm.set(false);
    this.editingCat.set(null);
    this.adminService.getCategories().subscribe({
      next: cats => {
        this.categories.set(cats);
        cats.forEach(cat => this.fetchCatImage(cat));
      },
    });
  }

  moveUp(i: number): void {
    if (i === 0) return;
    const cats = [...this.categories()];
    [cats[i - 1], cats[i]] = [cats[i], cats[i - 1]];
    this.reorder(cats);
  }

  moveDown(i: number): void {
    const cats = [...this.categories()];
    if (i >= cats.length - 1) return;
    [cats[i], cats[i + 1]] = [cats[i + 1], cats[i]];
    this.reorder(cats);
  }

  reorder(cats: ICategory[]): void {
    const updated = cats.map((c, idx) => ({ ...c, displayOrder: idx + 1 }));
    this.categories.set(updated);
    this.adminService.reorderCategories(
      updated.map(c => ({ categoryId: c.id, displayOrder: c.displayOrder })),
    ).subscribe({
      next: () => this.snackBar.open('✓ Order saved', '', { duration: 1500 }),
    });
  }

  toggleActive(id: string): void {
    this.adminService.toggleCategoryActive(id).subscribe({
      next: () =>
        this.categories.update(list =>
          list.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c),
        ),
    });
  }

  onImgError(event: Event, categoryName: string): void {
    const colors: Record<string, string> = {
      'Fruits & Vegetables': '4CAF50',
      'Dairy & Eggs':        'FFC107',
      'Snacks':              'FF9800',
      'Beverages':           '2196F3',
      'Bakery':              '795548',
      'Meat & Fish':         'F44336',
      'Personal Care':       'E91E63',
      'Household':           '607D8B',
      'Baby Care':           'F8BBD9',
      'Pet Care':            '8D6E63',
      'Pharma & Wellness':   '00BCD4',
      'Beauty & Skin':       '9C27B0',
      'Frozen Foods':        '90CAF9',
      'Breakfast & Cereals': 'FF8F00',
      'Electronics':         '37474F',
    };
    const color = colors[categoryName] ?? '0C831F';
    (event.target as HTMLImageElement).src =
      `https://dummyjson.com/image/200x200/${color}/ffffff?text=${encodeURIComponent(categoryName.substring(0, 8))}`;
  }
}
