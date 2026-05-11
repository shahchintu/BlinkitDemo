# TASK-TRACKER.md  [~] starting · [x] done

## Phase 01 — Infrastructure
| Backend | [ ] docker-compose.yml · [ ] .NET sln (4 projects) · [ ] Program.cs skeleton · [ ] GET /api/health |
| Angular | [ ] ng new · [ ] Tailwind+Material+NgRx · [ ] core/models/index.ts · [ ] app.routes.ts · [ ] utils.ts |

## Phase 02 — Auth
| Backend | [ ] AppUser entity · [ ] BlinkitDbContext · [ ] JwtTokenService · [ ] AuthController (register/login/refresh/logout) |
| Angular | [ ] AuthStore · [ ] AuthService · [ ] AuthInterceptor · [ ] AuthGuard · [ ] NavbarComponent · [ ] LoginComponent · [ ] RegisterComponent |

## Phase 03 — Products
| Backend | [ ] All entities · [ ] SeedData (500+ products) · [ ] ProductsController · [ ] CategoriesController · [ ] Migration applied |
| Angular | [ ] ProductService · [ ] CartStore · [ ] SearchBar · [ ] Home (Hero+CategoryStrip+Featured+Offers+BrandStrip) · [ ] ProductCard (ETA badge · variants) · [ ] ProductVariantModal · [ ] ProductList+FilterSidebar · [ ] ProductDetail (gallery+attributes+related) · [ ] BrandStore |

## Phase 04 — Cart
| Backend | [ ] RedisCartService · [ ] CartController · [ ] CouponsController |
| Angular | [ ] CartService · [ ] CouponService · [ ] CartSidebar (nudge+coupons+customers-also-bought) · [ ] CartPage (save-for-later) |

## Phase 05 — Checkout + Razorpay
| Backend | [ ] RazorpayService · [ ] PaymentsController · [ ] CreateOrderCommand · [ ] VerifyPaymentCommand · [ ] ResendEmailService · [ ] AddressesController · [ ] DeliveryController |
| Angular | [ ] PaymentService · [ ] CheckoutComponent (3-step) · [ ] RazorpayPaymentComponent · [ ] OrderConfirmationComponent |

## Phase 06 — Orders + Account
| Backend | [ ] OrdersController · [ ] AddItemsToOrderCommand · [ ] BlinkitPlusController · [ ] AccountController |
| Angular | [ ] OrderService · [ ] OrderHistory (reorder) · [ ] OrderDetail · [ ] OrderStatusTracker (4-step) · [ ] PostCheckoutAdd · [ ] AccountComponent · [ ] BlinkitPlusComponent |

## Phase 07 — Admin Panel
| Backend | [ ] AdminProductsController+Variants · [ ] AdminCategoriesController · [ ] AdminOrdersController · [ ] AdminUsersController · [ ] AdminCouponsController · [ ] AdminDashboardController |
| Angular | [ ] AdminService · [ ] AdminShell · [ ] AdminDashboard · [ ] AdminOrders · [ ] AdminProducts+ProductForm · [ ] AdminCategories · [ ] AdminUsers · [ ] AdminCoupons |

## Phase 08 — Polish + Deploy
| Angular | [ ] OffersComponent · [ ] HelpComponent · [ ] Mobile responsive (375px) · [ ] OnPush audit · [ ] Vercel deploy |
