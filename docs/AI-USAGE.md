# AI Usage — How Claude Code Built This Project

This project was built end-to-end using [Claude Code](https://claude.ai/code) (Anthropic's AI-powered CLI) as the primary development tool. A human developer provided the architecture direction, reviewed all output, and made product decisions. Claude Code generated, debugged, and refactored the code.

---

## How Claude Code Was Used

### Phase-by-phase development
Each phase was a single focused session. The developer opened Claude Code, ran `/compact` when context grew large, and drove the session with structured prompts. Claude Code:
- Read `CLAUDE.md` (project rules) and `TODO.md` (phase state) at the start of every session
- Built the backend first, then verified it in Scalar, then built the Angular UI
- Ran `npx tsc --noEmit` after every change to confirm zero TypeScript errors
- Committed with conventional commit messages at phase boundaries

### Parallel feature development
The `CLAUDE.md` instruction "each phase = one complete feature: .NET endpoint + Angular UI together" forced Claude Code to think vertically (full stack per feature) rather than horizontally (all backend then all frontend). This meant working code was always deliverable at the end of each session.

### Bug fixing sessions
Several dedicated bug-fix sessions used a structured "Read CLAUDE.md first. Bug: … Fix: …" prompt format. Claude Code read the relevant files, diagnosed the root cause, applied targeted edits, and confirmed with `tsc --noEmit`.

---

## Example Prompts Used

### Infrastructure setup
```
Read CLAUDE.md first. Implement Phase 01:
- docker-compose.yml with SQL Server 2022 + Redis 7-alpine
- 4-project Clean Architecture .NET solution
- Angular 18 skeleton with all packages
- Proxy config: /api/* → https://localhost:7001
```

### Auth implementation
```
Read CLAUDE.md and TODO.md first. Implement Phase 02 — Auth:
Backend: AppUser entity, BlinkitDbContext, JwtTokenService (15m access / 7d refresh cookie),
AuthController (register/login/refresh/logout/me), EF Core migration.
Angular: AuthStore (NgRx signals), AuthService, JWT interceptor, auth/admin guards,
login and register pages.
No mocks, real API only. Run backend first, verify in Scalar, then build Angular.
```

### Guest cart flow
```
Read CLAUDE.md and TODO.md first.
Implement the EXACT real Blinkit guest-to-login flow:
CORRECT FLOW: Location → Home → Browse freely → Add to cart freely
→ Click "Proceed to Checkout" → Login prompt appears
→ After login → cart preserved → checkout continues
[full spec followed]
```

### Targeted bug fix
```
Read CLAUDE.md first.
Bug: Checkout page shows wrong total amount.
Cart has 3 items worth ₹292 but checkout shows:
  Subtotal: ₹0 / Delivery: ₹29 / Total: ₹29
Root cause: CheckoutComponent Step 3 calculates subtotal from wrong source.
Fix: Subtotal must come from CartStore.total() signal NOT from cart$ | async.
Run npx tsc --noEmit — zero errors required.
```

### Logout hang fix
```
Read CLAUDE.md first.
Bug: Clicking logout hangs the entire app — page becomes unresponsive.
Fix AuthService.logout():
  - timeout(3000) — max 3 seconds
  - catchError(() => of(null)) — ignore any error
  - finalize() — clearAuth() + navigate ALWAYS runs
Also fix app.component.ts refresh() — add timeout there too.
```

---

## Problems Solved With AI

### Blank white page on first load
The root shell `AppComponent` used `@if (showLocationGate()) { gate } @else { main app }`. This structure prevented the entire app tree (navbar, router-outlet) from mounting while the gate was showing. Claude Code diagnosed this by running `ng build` (confirmed zero compile errors), then identified that the `@if/@else` structure was the culprit and restructured it to an overlay pattern: main content always renders, gate floats on top with `fixed inset-0 z-[9999]`.

### Checkout subtotal showing ₹0
`CheckoutComponent` Step 3 was reading `cart$ | async` — a `BehaviorSubject<CartDto>` that initialises to `{ subTotal: 0 }`. `CartStore.total()` was always correct (it's a computed signal over the already-loaded store items). Claude Code replaced the `cart$ | async` binding throughout Step 3 with direct `cartStore.total()` and `cartStore.cartItems()` signal reads, also removing the now-unused `AsyncPipe` import.

### Logout hanging
`logout()` had `finalize()` but no `catchError()` or `timeout()`. If the `POST /api/auth/logout` request never resolved, `finalize()` would never fire. Claude Code added `timeout(3000)` and `catchError(() => of(void 0))` before `finalize()`, guaranteeing `clearAuth()` and navigation always run.

### Duplicate navbar across all pages
Six feature components (`order-history`, `post-checkout-add`, `account`, `blinkit-plus`, `help`, `offers`) each contained their own `<app-navbar />` and `<app-footer />`, causing doubled navigation on every page. Claude Code identified the pattern with a grep across the features directory, then systematically removed the shell elements from each component and replaced the `<main>` wrapper with a plain `<div>`.

### Guest cart architecture
Designing the guest→login cart merge required coordinating three concerns: localStorage persistence, NgRx Signals store, and the `cart$` BehaviorSubject used by existing components. Claude Code designed an idempotent `mergeGuestCartAfterLogin()` that clears localStorage at the start (preventing double-merge), a `syncGuest()` helper that keeps all three sources in sync, and a `guestItemsToCartDto()` mapper so existing components (CartPage, CartSidebar) that read from `cart$` continue to work unmodified.

### TypeScript strict mode compliance
Every edit was immediately validated with `npx tsc --noEmit`. Claude Code fixed issues like: missing `inject` in import blocks, unused `AsyncPipe` after template refactor, `throwError` left in imports after removal from the code body, and strict null-check violations in error handlers.

---

## Human Decisions Made

The developer (not Claude Code) made all product and architecture decisions:

- **Project scope**: which Blinkit features to clone and in what order
- **Technology choices**: ASP.NET Core + Angular (not Node.js/React) — enforced via `CLAUDE.md`
- **`CLAUDE.md` rules**: all "NEVER use X", "always use Y" constraints were written by the developer before Phase 01
- **Phase sequencing**: Infrastructure → Auth → Products → Cart → Checkout — not AI-driven
- **Guest cart requirement**: the decision to allow browsing and adding to cart without login
- **Razorpay + Resend**: specific third-party choices (free tiers, test mode)
- **Code review**: every generated file was reviewed before committing; several were rejected and re-prompted
- **Bug reports**: all bugs were identified by manual testing, not automated tests
- **Commit messages and git history**: written and controlled by the developer

---

## Observations on AI-Assisted Development

### What worked well
- **Boilerplate elimination**: EF Core entity configurations, MediatR handler scaffolding, Angular component templates — all generated quickly and correctly
- **Cross-layer consistency**: Claude Code kept Angular interfaces in sync with C# DTOs naturally, since it read both sides before writing either
- **Structured prompts**: the "Read CLAUDE.md first" + "Run tsc --noEmit" pattern produced consistently correct output
- **Bug diagnosis**: giving Claude Code the symptom + a hypothesis ("root cause: …") plus the actual fix ("Fix: …") led to targeted, minimal changes

### What required human oversight
- **Architecture decisions** cannot be delegated — the developer had to define Clean Architecture boundaries upfront in `CLAUDE.md`
- **Feature scope creep**: Claude Code sometimes added more than asked (extra error handling, extra UI polish) — review was needed to keep changes minimal
- **Test coverage**: AI-generated code is not automatically tested; no test suite exists yet
- **Secrets management**: `.env` handling and `appsettings.Development.json` gitignore required manual setup
