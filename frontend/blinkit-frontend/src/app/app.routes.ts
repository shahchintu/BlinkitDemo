import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent),
  },
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./features/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
  },
  {
    path: 'brand/:slug',
    loadComponent: () =>
      import('./features/products/brand-store/brand-store.component').then(m => m.BrandStoreComponent),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/cart-page/cart-page.component').then(m => m.CartPageComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/checkout/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'checkout/confirmation',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/checkout/order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/order-history/order-history.component').then(m => m.OrderHistoryComponent),
  },
  {
    path: 'orders/:id/track',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/order-tracking/order-tracking.component').then(m => m.OrderTrackingComponent),
  },
  {
    path: 'orders/:id/add',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/post-checkout-add/post-checkout-add.component').then(m => m.PostCheckoutAddComponent),
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/account/account/account.component').then(m => m.AccountComponent),
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/account/account-profile/account-profile.component').then(m => m.AccountProfileComponent),
      },
      {
        path: 'addresses',
        loadComponent: () =>
          import('./features/account/account-addresses/account-addresses.component').then(m => m.AccountAddressesComponent),
      },
      {
        path: 'blinkit-plus',
        loadComponent: () =>
          import('./features/account/blinkit-plus/blinkit-plus.component').then(m => m.BlinkitPlusComponent),
      },
    ],
  },
  {
    path: 'offers',
    loadComponent: () =>
      import('./features/offers/offers/offers.component').then(m => m.OffersComponent),
  },
  {
    path: 'help',
    loadComponent: () =>
      import('./features/help/help/help.component').then(m => m.HelpComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: 'pages/:slug',
    loadComponent: () => import(
      './features/pages/dynamic-page/dynamic-page.component'
    ).then(m => m.DynamicPageComponent)
  },
  {
    path: '**',
    redirectTo: '',
  },
];

