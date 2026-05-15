# Architecture — Blinkit Clone

## Clean Architecture

The backend follows Clean Architecture with strict unidirectional dependency flow:

```
┌─────────────────────────────────────────────────────────┐
│  Blinkit.API          (outermost — presentation)        │
│  Controllers · Middleware · Program.cs                  │
│                   depends on ↓                          │
├─────────────────────────────────────────────────────────┤
│  Blinkit.Application  (use-case layer)                  │
│  MediatR Handlers · DTOs · Interfaces · FluentValidation│
│                   depends on ↓                          │
├─────────────────────────────────────────────────────────┤
│  Blinkit.Domain       (innermost — no dependencies)     │
│  Entities · Enums · Domain logic                        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Blinkit.Infrastructure (implements Application ifaces) │
│  EF Core · Redis · Razorpay · Resend                    │
└─────────────────────────────────────────────────────────┘
```

**Key rule**: Domain and Application layers have zero dependencies on Infrastructure. They depend only on abstractions (interfaces defined in Application). Infrastructure is registered via DI in Program.cs.

---

## Folder Structure

### Backend

```
backend/BlinkitAPI/src/
│
├── Blinkit.API/
│   ├── Controllers/
│   │   ├── AuthController.cs           POST /api/auth/*
│   │   ├── ProductsController.cs       GET  /api/products/*
│   │   ├── CategoriesController.cs     GET  /api/categories
│   │   ├── CartController.cs           [Authorize] CRUD /api/cart
│   │   ├── AddressesController.cs      [Authorize] CRUD /api/addresses
│   │   ├── DeliveryController.cs       GET  /api/delivery/slots
│   │   ├── PaymentsController.cs       [Authorize] POST /api/payments/*
│   │   ├── OrdersController.cs         [Authorize] /api/orders/*
│   │   ├── CouponsController.cs        [AllowAnonymous] GET /api/coupons
│   │   ├── AccountController.cs        [Authorize] /api/account
│   │   ├── BlinkitPlusController.cs    [Authorize] /api/blinkitplus
│   │   └── Admin*/                     [AdminOnly]  /api/admin/*
│   ├── Middleware/
│   │   └── GlobalExceptionMiddleware.cs
│   └── Program.cs
│
├── Blinkit.Application/
│   ├── Auth/
│   │   ├── Commands/                   Register · Login · Refresh · Logout
│   │   └── DTOs/                       AuthResponse · LoginRequest
│   ├── Products/Queries/               GetProducts · GetProductById · GetRelated
│   ├── Cart/
│   │   ├── Commands/                   AddItem · UpdateQty · RemoveItem · Clear
│   │   └── Queries/                    GetCart
│   ├── Orders/
│   │   ├── Commands/                   CreateOrder · VerifyPayment · AddItems · UpdateStatus
│   │   ├── Queries/                    GetOrders · GetOrderById
│   │   └── DTOs/                       OrderDto · AddressDto
│   ├── Coupons/                        ValidateCoupon logic
│   ├── Interfaces/                     IBlinkitDbContext · IJwtTokenService · IRedisCartService
│   │                                   IRazorpayService · IEmailService · ICouponRepository
│   └── Common/                         Shared command/query base types
│
├── Blinkit.Domain/
│   ├── Entities/
│   │   ├── AppUser.cs                  Extends IdentityUser
│   │   ├── Product.cs                  + ProductVariant · ProductImage · ProductAttribute · ProductTag
│   │   ├── Category.cs
│   │   ├── Cart.cs + CartItem.cs
│   │   ├── Order.cs + OrderItem.cs
│   │   ├── Address.cs
│   │   ├── Coupon.cs
│   │   ├── DeliverySlot.cs
│   │   └── BlinkitPlusSubscription.cs
│   └── Enums/
│       ├── OrderStatus.cs              Placed · Packed · OutForDelivery · Delivered · Cancelled
│       └── PaymentStatus.cs            Pending · Paid · Failed · Refunded
│
└── Blinkit.Infrastructure/
    ├── Data/
    │   ├── BlinkitDbContext.cs          EF Core context implementing IBlinkitDbContext
    │   ├── Configurations/             Fluent API entity configurations
    │   ├── Migrations/                 EF Core migrations
    │   └── SeedData.cs                 500+ products · 15 categories · admin user · coupons
    ├── Services/
    │   ├── JwtTokenService.cs          Access + refresh token generation/validation
    │   └── RedisCartService.cs         Cart read/write with Redis TTL + SQL Server fallback
    ├── Repositories/
    │   └── CouponRepository.cs         WELCOME50 · BLINKIT10 · BANK5 · FREESHIP logic
    ├── Payment/
    │   └── RazorpayService.cs          CreateOrder + HMAC-SHA256 signature verification
    └── Email/
        └── ResendEmailService.cs       Order confirmation + status update emails
```

### Frontend

```
frontend/blinkit-frontend/src/app/
│
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts               Redirects to /auth/login if not authenticated
│   │   └── admin.guard.ts              Redirects to / if not Admin role
│   ├── interceptors/
│   │   └── auth.interceptor.ts         Attaches Bearer token from AuthStore to requests
│   ├── models/
│   │   └── index.ts                    All TypeScript interfaces (IProduct · ICart · IOrder · …)
│   ├── services/
│   │   ├── auth.service.ts             Login · logout · refresh · getMe (with timeouts)
│   │   ├── cart.service.ts             Guest + authenticated cart · mergeGuestCartAfterLogin
│   │   ├── product.service.ts          Products API calls + search
│   │   ├── coupon.service.ts           Validate coupon
│   │   └── payment.service.ts          Razorpay integration + openRazorpay Subject
│   ├── stores/
│   │   ├── auth.store.ts               NgRx Signal store — currentUser · accessToken · isLoading
│   │   └── cart.store.ts               NgRx Signal store — cartItems · total · itemCount
│   └── types/
│       └── razorpay.d.ts               Window.Razorpay type declarations
│
├── features/
│   ├── home/                           Hero banner · category strip · featured products
│   ├── products/
│   │   ├── product-list/               Filterable paginated grid
│   │   ├── product-detail/             Gallery · variants · attributes · related
│   │   └── brand-store/                Brand-filtered product page
│   ├── cart/
│   │   ├── cart-sidebar/               Slide-in panel (app-wide overlay)
│   │   └── cart-page/                  Full /cart route with wishlist
│   ├── checkout/
│   │   ├── checkout/                   3-step: address → slot → payment
│   │   └── order-confirmation/         Animated confirmation + post-checkout add
│   ├── auth/
│   │   ├── login/                      Standard login page
│   │   └── register/                   Registration page
│   ├── orders/
│   │   ├── order-history/              Order list with status
│   │   └── post-checkout-add/          Add items to recent order
│   ├── account/
│   │   ├── account/                    Profile management
│   │   └── blinkit-plus/               Subscription page
│   ├── admin/                          Full admin CRUD panel (lazy-loaded)
│   ├── offers/                         Coupon + bank offers display
│   └── help/                           FAQ with Material expansion panels
│
└── shared/
    ├── navbar/                         Sticky header with auth-aware Login/user menu
    ├── footer/                         Links footer
    ├── location-gate/                  Full-screen location selector (first visit)
    ├── location-selector/              Dialog to change city
    ├── search-bar/                     Debounced product search
    ├── login-prompt-dialog/            Inline login dialog with guest-cart context
    └── utils.ts                        formatPrice · getCategoryFallback · generateId
```

---

## Data Flow

### Request lifecycle (authenticated API call)

```
Angular Component
    │  calls service method (Observable<T>)
    ▼
Angular HttpClient
    │  AUTH INTERCEPTOR attaches Authorization: Bearer <token from AuthStore>
    ▼
ASP.NET Core Pipeline
    │  GlobalExceptionMiddleware (catches + formats errors)
    │  UseAuthentication — validates JWT, populates ClaimsPrincipal
    │  UseAuthorization — [Authorize] / [AdminOnly] gates
    ▼
Controller
    │  extracts UserId from ClaimsPrincipal
    │  sends MediatR IRequest<TResponse>
    ▼
MediatR Handler (Application layer)
    │  FluentValidation pipeline behaviour runs first
    │  calls IBlinkitDbContext (EF Core) or IRedisCartService
    ▼
Infrastructure (EF Core → SQL Server / RedisCartService → Redis)
    │  returns result
    ▼
Controller → HTTP 200 JSON response
    ▼
Angular service → updates NgRx Signal store → Component re-renders (OnPush)
```

### Guest cart flow

```
Guest user adds product
    │
    ▼
CartService.addItem()
    │  authStore.isAuthenticated() === false
    ▼
localStorage.guestCart updated  +  CartStore.setItems()  +  cartSubject.next()
    │
    ▼
User clicks "Proceed to Checkout"
    │
    ▼
LoginPromptDialogComponent opens
    │  shows cart summary: "N items · ₹XXX"
    ▼
User submits credentials
    │
    ▼
AuthService.login() → authStore.setAuth() → isAuthenticated() = true
    │
    ▼
CartService.mergeGuestCartAfterLogin()
    │  reads guestCart from localStorage
    │  clears localStorage immediately (idempotent)
    │  POSTs each item to POST /api/cart/items
    │  calls loadCart() → cartSubject + CartStore updated
    ▼
Dialog closes → Router.navigate(['/checkout'])
```

### Payment flow

```
User clicks "Pay ₹XXX"
    │
    ▼
POST /api/payments/create-order
    │  validates stock, applies coupon, calculates total
    │  calls Razorpay API → creates Razorpay order
    │  saves Order entity (status: Placed, PaymentStatus: Pending)
    │  returns { razorpayOrderId, amount, orderId }
    ▼
PaymentService.openRazorpay() → opens Razorpay SDK modal
    │
    ▼ (user completes payment)
    │
POST /api/payments/verify
    │  verifies HMAC-SHA256 signature
    │  marks PaymentStatus: Paid
    │  decrements stock quantities
    │  marks coupon usage
    │  clears cart
    │  sends confirmation email (fire-and-forget)
    ▼
Angular navigates to /checkout/confirmation
```

---

## Key Design Decisions

### Why Clean Architecture?
Enforces separation of concerns so infrastructure details (which DB, which payment gateway) can be swapped without touching business logic. All domain and application layers are independently unit-testable.

### Why MediatR?
Decouples controllers from business logic. Each use case is a self-contained handler class. Adding FluentValidation as a pipeline behavior automatically validates every command before the handler runs.

### Why Redis for cart?
Cart reads happen on every page load and every product card render. Redis keeps cart retrieval at ~1 ms versus ~10–50 ms for SQL. A 7-day TTL matches the refresh token lifetime. SQL Server is the fallback if Redis is unavailable.

### Why NgRx Signals instead of RxJS BehaviorSubject for state?
Angular Signals (and NgRx Signals on top) integrate natively with Angular's change detection. `ChangeDetectionStrategy.OnPush` + signals means components re-render only when their specific signals change, giving near-zero unnecessary renders.

### Why guest cart in localStorage?
Real Blinkit allows cart actions before login. Storing guest items in `localStorage.guestCart` (as full `ICartItem` objects) means zero server round-trips for guests, instant UI feedback, and a clean merge path when they authenticate.

### Why access token in memory only?
Storing JWT in `localStorage` or a cookie accessible to JavaScript exposes it to XSS. Keeping it only in the NgRx Signals AuthStore (in-memory) means it is lost on page reload — which is intentional. The `refresh()` call in `AppComponent.ngOnInit()` silently rehydrates the session from the httpOnly refresh cookie, which is invisible to JavaScript and CSRF-protected via `SameSite: Strict`.

### Why Fluent API only for EF Core?
Data annotations pollute domain entities with infrastructure concerns. Fluent API keeps entity classes pure and configurations are co-located in `Infrastructure/Data/Configurations/`.
