# TASK-TRACKER.md  [~] starting · [x] done

## Phase 01 — Infrastructure ✓ COMPLETE
| Backend | [x] docker-compose.yml · [x] .NET sln (4 projects) · [x] Program.cs skeleton · [x] GET /api/health |
| Angular | [x] ng new · [x] Tailwind+Material+NgRx · [x] core/models/index.ts · [x] app.routes.ts · [x] utils.ts |

## Phase 02 — Auth ✓ COMPLETE
| Backend | [x] AppUser entity · [x] BlinkitDbContext · [x] JwtTokenService · [x] AuthController (register/login/refresh/logout/me) · [x] InitialAuthCreate migration |
| Angular | [x] AuthStore · [x] AuthService · [x] AuthInterceptor · [x] AuthGuard · [x] AdminGuard · [x] NavbarComponent · [x] LocationSelectorComponent · [x] FooterComponent · [x] LoginComponent · [x] RegisterComponent |

## Phase 03 — Products ✓ COMPLETE
| Backend | [x] All entities · [x] SeedData (150 products × 5 categories) · [x] IBlinkitDbContext + MediatR handlers · [x] ProductsController · [x] CategoriesController · [x] DeliveryController · [x] Redis cache (categories) · [x] AddProductEntities migration |
| Angular | [x] ProductService · [x] CartStore · [x] SearchBar (debounced + dropdown) · [x] Home (Hero+CategoryStrip+Featured+Offers+BrandStrip) · [x] ProductCard (ETA badge · split ADD/stepper) · [x] ProductVariantModal · [x] ProductList+FilterSidebar+Pagination · [x] ProductDetail (gallery+thumbnails+variant pills+attributes+related) · [x] BrandStore |

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
