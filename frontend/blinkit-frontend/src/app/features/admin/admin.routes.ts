import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./admin-products/admin-products.component').then(m => m.AdminProductsComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./admin-categories/admin-categories.component').then(m => m.AdminCategoriesComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./admin-users/admin-users.component').then(m => m.AdminUsersComponent),
      },
      {
        path: 'coupons',
        loadComponent: () =>
          import('./admin-coupons/admin-coupons.component').then(m => m.AdminCouponsComponent),
      },
    ],
  },
];
