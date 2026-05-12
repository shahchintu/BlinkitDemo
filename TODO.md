# TODO.md — Blinkit Clone
Architecture: Parallel feature-by-feature · Real APIs only · SQL Server

## Resume prompt
> Read CLAUDE.md and TODO.md. Find current phase and first incomplete task.
> Build backend first, verify in Scalar, then build Angular UI.
> No of(), no mock data, no delay() anywhere.

## Phase 00a [x]  Phase 00b [ ]  Phase 01 [x]
## Phase 02 [x] — Auth (backend + Angular together)
## Phase 03 [x] — Products (backend + Angular together)
## Phase 04 [x] — Cart (backend + Angular together)
## Phase 05 [ ] — Checkout + Razorpay (backend + Angular together)
## Phase 06 [ ] — Orders + Account (backend + Angular together)
## Phase 07 [ ] — Admin Panel (backend + Angular together)
## Phase 08 [ ] — Polish + Offers + Help + Deploy
## Phase 09 [ ] — Claude AI + Azure (optional)

## Session Log
| Timestamp | Phase | Summary | Developer |
|-----------|-------|---------|-----------|
| 2026-05-11 | 00a | Project docs generated | — |
| 2026-05-11 | 01  | Infrastructure scaffolded — docker-compose, 4-project .NET sln, Angular 19 + all packages, models, routes, utils | — |
| 2026-05-11 | 02  | Auth — .NET: AppUser/enums, BlinkitDbContext, JwtTokenService, AuthController, InitialAuthCreate migration. Angular: AuthStore, AuthService, AuthInterceptor, AuthGuard, AdminGuard, NavbarComponent, LocationSelectorComponent, FooterComponent, LoginComponent, RegisterComponent | — |
| 2026-05-11 | 03  | Products — .NET: Category/Product/Variant/Attribute/Tag/Image/Coupon/DeliverySlot entities, SeedData (150 products × 5 categories), IBlinkitDbContext interface, MediatR query handlers with Redis cache, ProductsController/CategoriesController/DeliveryController, AddProductEntities migration. Angular: CartStore (NgRx signals), ProductService, SearchBarComponent, HeroBannerComponent, CategoryStripComponent, OffersStripComponent, BrandStoresStripComponent, FeaturedProductsComponent, HomeComponent, ProductCardComponent (ETA badge + split ADD/stepper), ProductVariantModalComponent, ProductListComponent (filter sidebar + pagination), ProductDetailComponent (gallery + variant pills + attributes + related), BrandStoreComponent | — |
| 2026-05-12 | 04  | Cart — .NET: Cart/CartItem entities, RedisCartService (Redis 7d TTL + DB fallback), ICouponRepository (WELCOME50/BLINKIT10/BANK5/FREESHIP), MediatR Add/Update/Remove/Clear/Get handlers, CartController [Authorize], CouponsController [AllowAnonymous], AddCartEntities migration. Angular: CartService (BehaviorSubject + effect auth sync), CouponService, CartSidebarComponent (nudge + coupons + also-bought + save-for-later), CartPageComponent (full page + wishlist + sticky price card), ProductCard wired to CartService.addItem, Navbar cart button opens sidebar, AppComponent includes CartSidebar | — |
