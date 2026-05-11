# TODO.md — Blinkit Clone
Architecture: Parallel feature-by-feature · Real APIs only · SQL Server

## Resume prompt
> Read CLAUDE.md and TODO.md. Find current phase and first incomplete task.
> Build backend first, verify in Scalar, then build Angular UI.
> No of(), no mock data, no delay() anywhere.

## Phase 00a [x]  Phase 00b [ ]  Phase 01 [x]
## Phase 02 [x] — Auth (backend + Angular together)
## Phase 03 [ ] — Products (backend + Angular together)
## Phase 04 [ ] — Cart (backend + Angular together)
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
