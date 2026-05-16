import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { ImageService } from '../../../core/services/image.service';
import { ICategory } from '../../../core/models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatSnackBarModule],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-[#1A1A1A]">Categories</h1>
      <button class="bg-[#0C831F] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
        (click)="showAddForm.set(!showAddForm())">
        {{ showAddForm() ? 'Cancel' : '+ Add Category' }}
      </button>
    </div>

    @if (showAddForm()) {
      <form [formGroup]="addForm" (ngSubmit)="addCategory()" class="bg-white rounded-xl border border-[#E0E0E0] p-4 mb-6 grid grid-cols-4 gap-3 items-end">
        <div>
          <label class="block text-xs font-medium text-[#666666] mb-1">Name *</label>
          <input formControlName="name" class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]" />
        </div>
        <div>
          <label class="block text-xs font-medium text-[#666666] mb-1">Slug *</label>
          <input formControlName="slug" class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]" />
        </div>
        <div>
          <label class="block text-xs font-medium text-[#666666] mb-1">Icon URL *</label>
          <input formControlName="iconUrl" class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]" />
        </div>
        <button type="submit" class="bg-[#0C831F] text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
          [disabled]="addForm.invalid || savingCat()">
          {{ savingCat() ? 'Saving...' : 'Save' }}
        </button>
      </form>
    }

    @if (loading()) {
      <div class="space-y-2">@for (_ of skeletons; track $index) { <div class="h-14 bg-white rounded-xl border border-[#E0E0E0] animate-pulse"></div> }</div>
    } @else {
      <div class="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        <div class="grid grid-cols-[56px_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 bg-gray-50 text-xs font-semibold text-[#666666] border-b border-[#E0E0E0]">
          <span>Icon</span><span>Name</span><span>Slug</span><span>Order</span><span>Active</span><span>Actions</span>
        </div>
        @for (cat of categories(); track cat.id; let i = $index) {
          <div class="grid grid-cols-[56px_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-[#F0F0F0] last:border-0 items-center">
            <img [src]="categoryImages()[cat.id] || cat.iconUrl" [alt]="cat.name" class="w-10 h-10 object-contain rounded-lg bg-gray-50 p-1" loading="lazy" />
            <span class="text-sm font-medium">{{ cat.name }}</span>
            <span class="text-xs text-[#666666] font-mono">{{ cat.slug }}</span>
            <div class="flex gap-1">
              <button class="text-[#666666] text-lg hover:text-[#0C831F] disabled:opacity-30" [disabled]="i === 0"
                (click)="moveUp(i)">↑</button>
              <button class="text-[#666666] text-lg hover:text-[#0C831F] disabled:opacity-30" [disabled]="i === categories().length - 1"
                (click)="moveDown(i)">↓</button>
            </div>
            <div>
              <button class="relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                [class]="cat.isActive ? 'bg-[#0C831F]' : 'bg-gray-300'"
                (click)="toggleActive(cat.id)">
                <span class="inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5"
                  [class]="cat.isActive ? 'translate-x-5' : 'translate-x-0.5'"></span>
              </button>
            </div>
            <span class="text-xs text-[#666666]">{{ cat.productCount }} products</span>
          </div>
        }
      </div>
    }
  `,
})
export class AdminCategoriesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly imageService = inject(ImageService);

  readonly categories = signal<ICategory[]>([]);
  readonly categoryImages = signal<Record<string, string>>({});
  readonly loading = signal(true);
  readonly showAddForm = signal(false);
  readonly savingCat = signal(false);
  readonly skeletons = Array(8);

  readonly addForm = new FormGroup({
    name: new FormControl('', Validators.required),
    slug: new FormControl('', Validators.required),
    iconUrl: new FormControl('', Validators.required),
  });

  ngOnInit(): void {
    this.adminService.getCategories().subscribe({
      next: cats => {
        this.categories.set(cats);
        this.loading.set(false);
        cats.forEach(cat => {
          this.imageService.getCategoryImage(cat.name, cat.id)
            .subscribe(url => this.categoryImages.update(imgs => ({ ...imgs, [cat.id]: url })));
        });
      },
      error: () => this.loading.set(false),
    });

    this.addForm.get('name')?.valueChanges.subscribe(name => {
      if (name) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        this.addForm.get('slug')?.setValue(slug, { emitEvent: false });
      }
    });
  }

  addCategory(): void {
    if (this.addForm.invalid) return;
    this.savingCat.set(true);
    const { name, slug, iconUrl } = this.addForm.value;
    const nextOrder = this.categories().length + 1;
    this.adminService.createCategory({ name: name!, slug: slug!, iconUrl: iconUrl!, displayOrder: nextOrder }).subscribe({
      next: () => {
        this.savingCat.set(false);
        this.addForm.reset();
        this.showAddForm.set(false);
        this.adminService.getCategories().subscribe({ next: cats => this.categories.set(cats) });
        this.snackBar.open('✓ Category added', '', { duration: 2000 });
      },
      error: () => this.savingCat.set(false),
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
    this.adminService.reorderCategories(updated.map(c => ({ categoryId: c.id, displayOrder: c.displayOrder }))).subscribe({
      next: () => this.snackBar.open('✓ Order saved', '', { duration: 1500 }),
    });
  }

  toggleActive(id: string): void {
    this.adminService.toggleCategoryActive(id).subscribe({
      next: () => this.categories.update(list => list.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c)),
    });
  }
}
