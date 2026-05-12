import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { ICoupon } from '../../../core/models';
import { formatPrice } from '../../../shared/utils';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatSnackBarModule],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-[#1A1A1A]">Coupons</h1>
      <button class="bg-[#0C831F] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
        (click)="openForm(null)">+ Add Coupon</button>
    </div>

    @if (showForm()) {
      <div class="bg-white rounded-xl border border-[#E0E0E0] p-5 mb-6">
        <h2 class="font-bold text-[#1A1A1A] mb-4">{{ editingId() ? 'Edit Coupon' : 'Add Coupon' }}</h2>
        <form [formGroup]="couponForm" (ngSubmit)="saveCoupon()" class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-medium text-[#666666] mb-1">Code *</label>
            <input formControlName="code" placeholder="SAVE20"
              class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm uppercase font-mono focus:outline-none focus:border-[#0C831F]" />
          </div>
          <div>
            <label class="block text-xs font-medium text-[#666666] mb-1">Type *</label>
            <select formControlName="discountType"
              class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]">
              <option value="Percent">Percent (%)</option>
              <option value="Flat">Flat (₹)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-[#666666] mb-1">Value *</label>
            <input formControlName="discountValue" type="number"
              class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]" />
          </div>
          <div>
            <label class="block text-xs font-medium text-[#666666] mb-1">Min Order ₹ *</label>
            <input formControlName="minOrderAmount" type="number"
              class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]" />
          </div>
          <div>
            <label class="block text-xs font-medium text-[#666666] mb-1">Max Discount ₹</label>
            <input formControlName="maxDiscountAmount" type="number"
              class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]" />
          </div>
          <div>
            <label class="block text-xs font-medium text-[#666666] mb-1">Valid For</label>
            <select formControlName="validFor"
              class="w-full border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F]">
              <option value="All">All Users</option>
              <option value="NewUsers">New Users</option>
            </select>
          </div>
          <div class="col-span-3 flex gap-2 pt-1">
            <button type="submit"
              class="bg-[#0C831F] text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              [disabled]="couponForm.invalid || saving()">
              {{ saving() ? 'Saving...' : 'Save Coupon' }}
            </button>
            <button type="button" class="border border-[#E0E0E0] text-sm px-5 py-2 rounded-xl hover:border-[#0C831F] transition-colors"
              (click)="closeForm()">Cancel</button>
          </div>
        </form>
      </div>
    }

    @if (loading()) {
      <div class="space-y-2">@for (_ of skeletons; track $index) { <div class="h-14 bg-white rounded-xl border border-[#E0E0E0] animate-pulse"></div> }</div>
    } @else {
      <div class="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        <div class="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_80px] gap-3 px-4 py-3 bg-gray-50 text-xs font-semibold text-[#666666] border-b border-[#E0E0E0]">
          <span>Code</span><span>Discount</span><span>Min Order</span><span>Valid For</span><span>Usage</span><span>Active</span><span>Edit</span>
        </div>
        @for (coupon of coupons(); track coupon.id) {
          <div class="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_80px] gap-3 px-4 py-3.5 border-b border-[#F0F0F0] last:border-0 items-center">
            <span class="font-mono font-bold text-sm">{{ coupon.code }}</span>
            <span class="text-sm">
              {{ coupon.discountType === 'Percent' ? coupon.discountValue + '%' : '₹' + coupon.discountValue }} off
            </span>
            <span class="text-sm">{{ fmt(coupon.minOrderAmount) }}</span>
            <span class="text-xs text-[#666666]">{{ coupon.validFor }}</span>
            <span class="text-sm">{{ coupon.usageCount }}{{ coupon.maxUsage ? '/' + coupon.maxUsage : '' }}</span>
            <button class="relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
              [class]="coupon.isActive ? 'bg-[#0C831F]' : 'bg-gray-300'"
              (click)="toggleActive(coupon.id)">
              <span class="inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5"
                [class]="coupon.isActive ? 'translate-x-5' : 'translate-x-0.5'"></span>
            </button>
            <button class="text-[#0C831F] text-xs hover:underline" (click)="openForm(coupon)">Edit</button>
          </div>
        }
      </div>
    }
  `,
})
export class AdminCouponsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);

  readonly coupons = signal<ICoupon[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly skeletons = Array(5);

  fmt = formatPrice;

  readonly couponForm = new FormGroup({
    code: new FormControl('', Validators.required),
    discountType: new FormControl('Percent', Validators.required),
    discountValue: new FormControl(10, [Validators.required, Validators.min(1)]),
    minOrderAmount: new FormControl(0, [Validators.required, Validators.min(0)]),
    maxDiscountAmount: new FormControl<number | null>(null),
    validFor: new FormControl('All', Validators.required),
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.adminService.getCoupons().subscribe({
      next: c => { this.coupons.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(coupon: ICoupon | null): void {
    this.editingId.set(coupon?.id ?? null);
    if (coupon) {
      this.couponForm.setValue({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        validFor: coupon.validFor,
      });
    } else {
      this.couponForm.reset({ discountType: 'Percent', discountValue: 10, minOrderAmount: 0, validFor: 'All' });
    }
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editingId.set(null); }

  saveCoupon(): void {
    if (this.couponForm.invalid) return;
    this.saving.set(true);
    const v = this.couponForm.value;
    const req = {
      code: v.code!,
      discountType: v.discountType!,
      discountValue: v.discountValue!,
      minOrderAmount: v.minOrderAmount!,
      maxDiscountAmount: v.maxDiscountAmount ?? null,
      validFor: v.validFor!,
      maxUsage: null,
    };

    const id = this.editingId();
    const done = () => {
      this.saving.set(false);
      this.closeForm();
      this.load();
      this.snackBar.open(id ? '✓ Coupon updated' : '✓ Coupon created', '', { duration: 2000 });
    };
    const fail = () => this.saving.set(false);
    if (id) {
      this.adminService.updateCoupon(id, req).subscribe({ next: done, error: fail });
    } else {
      this.adminService.createCoupon(req).subscribe({ next: done, error: fail });
    }
  }

  toggleActive(id: string): void {
    this.adminService.toggleCouponActive(id).subscribe({
      next: () => this.coupons.update(list => list.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c)),
    });
  }
}
