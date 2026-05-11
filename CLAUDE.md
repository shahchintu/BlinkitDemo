# CLAUDE.md — Blinkit Clone
_Read this at the start of every Claude Code session._

## Repository
https://github.com/shahchintu/BlinkitDemo
Backend:  backend/BlinkitAPI/
Frontend: frontend/blinkit-frontend/

## Architecture — PARALLEL FEATURE-BY-FEATURE · REAL APIs ONLY
Each phase = one complete feature: .NET endpoint + Angular UI together.
⚠️  NO mock data · NO of() · NO delay() · NO picsum for product images
Angular calls REAL ASP.NET Core endpoints for EVERYTHING.
Backend must be running on port 7001 before any Angular work.

## Developer Profile
Full-stack .NET developer.
NEVER use: React, Vue, NestJS, Express, Prisma, TypeORM, MongoDB,
NgModules, constructor-based Angular DI, *ngIf/*ngFor, Promises in
Angular services, localStorage for tokens, of() mock data.

## Stack
### Backend (build first in each phase)
  ASP.NET Core 8 Web API · backend/BlinkitAPI/
  C# 12 · nullable reference types on · no #nullable disable
  Clean Architecture: API → Application → Domain → Infrastructure
  EF Core 8 · Fluent API only · no data annotations · SQL Server 2022 (Docker)
  Redis 7 (Docker) · MediatR 12 · FluentValidation · AutoMapper
  ASP.NET Core Identity + JWT
    Access token: 15m · response body only
    Refresh token: 7d · httpOnly cookie only
  Razorpay .NET SDK (test mode · free)
  Resend.Net NuGet (free · 3000 emails/month)
  Scalar at /scalar

### Frontend (build after backend endpoint is verified)
  Angular 18+ standalone components · TypeScript 5 strict (zero any)
  Tailwind CSS + Angular Material 18 · NgRx Signals (@ngrx/signals)
  Reactive Forms only · inject() DI only · @if/@for/@switch
  Observable<T> — never Promise · lazy-loaded routing
  Access token: NgRx Signals memory ONLY — never localStorage
  Refresh token: httpOnly cookie (backend sets it, Angular ignores it)

### Infrastructure
  SQL Server 2022 · Docker · port 1433 · SA_PASSWORD: BlinkitDev@123
  Redis 7-alpine · Docker · port 6379
  docker-compose.yml at repo root
  Angular proxy: /api/* → https://localhost:7001

## Code Rules
- TypeScript strict: zero any · zero @ts-ignore
- Standalone Angular only — no NgModules
- OnPush on every component
- Observable<T> everywhere — never Promise
- Tailwind only — no inline styles
- inject() only — never constructor DI
- @if/@for — never *ngIf/*ngFor
- No console.log · no Console.WriteLine in committed code
- Fluent API only for EF Core
- PasswordHash: [JsonIgnore] always · never in any DTO

## Product Images — Real Blinkit CDN
Base: https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/images/products/full_img/
All product.imageUrl and variant.imageUrl = CDN base + numericId.jpg
product.images[] = 2–6 CDN gallery URLs (images[0] === imageUrl)
All <img>: loading="lazy" · object-contain · (error) → getCategoryFallback()
getCategoryFallback(): fallback CDN URL per category

## Product Features
- 500+ products · 15 categories · 30–40 per category
- Variants: every product has variants[] · multi-variant → "ADD · X options" split button
- ETA badge "8 MINS" on every product card (top-left overlay)
- Product detail: gallery thumbnails + prev/next · variant pills · attributes · related

## Cart Features
- Variant-aware cart (ICartItem has variantId + variant)
- Free delivery nudge: "Add ₹X more for free delivery" progress bar (threshold ₹199)
- "Customers also bought" in cart sidebar
- Coupon codes: WELCOME50 · BLINKIT10 · BANK5 · FREESHIP
- Save for later / wishlist

## Razorpay (Phase 05)
Test mode · free · https://dashboard.razorpay.com
Payment methods: UPI · Card · Net Banking · COD · Pay Later (BNPL)
Test card: 4111 1111 1111 1111 · Test UPI: success@razorpay

## Resend Email (Phase 05)
Free tier · 3000/month · https://resend.com
Triggers: order confirmation + status updates (Packed, OutForDelivery, Delivered)
Fire-and-forget — email failure never blocks order flow

## Design Tokens
blinkit-green:#0C831F · blinkit-yellow:#F8C200 · blinkit-bg:#F8F8F8
blinkit-muted:#666666 · blinkit-border:#E0E0E0 · blinkit-success:#4CAF50
blinkit-error:#F44336 · blinkit-purple:#673AB7

## Phase Build Order (parallel — backend + Angular per phase)
01: Infrastructure (Docker + .NET skeleton + Angular skeleton)
02: Auth (register/login/JWT/interceptor + login/register pages)
03: Products (seed 500+ + APIs + home/list/detail/search/brand stores)
04: Cart (cart API + sidebar/page + nudges/coupons/save-for-later)
05: Checkout + Razorpay (checkout API + 3-step + payments + email)
06: Orders + Account (orders API + tracking + reorder + profile + Blinkit Plus)
07: Admin Panel (admin API + dashboard/products/categories/users/coupons)
08: Polish + Offers + Help + Vercel deploy
09: Claude AI + Azure (optional)

## Commits
| Phase | Commit |
|-------|--------|
| 00a | chore: phase-00a-project-docs |
| 01  | feat: phase-01-infrastructure |
| 02  | feat: phase-02-auth |
| 03  | feat: phase-03-products |
| 04  | feat: phase-04-cart |
| 05  | feat: phase-05-checkout |
| 06  | feat: phase-06-orders-account |
| 07  | feat: phase-07-admin |
| 08  | feat: phase-08-polish-deploy |
| 09  | feat: phase-09-ai-azure |

## Referenced Files
- [docker-compose.yml](docker-compose.yml) — SQL Server 2022 + Redis 7-alpine
- [.env.example](.env.example) — all required env vars
- [backend/BlinkitAPI/Blinkit.sln](backend/BlinkitAPI/Blinkit.sln) — 4-project Clean Architecture solution
- [backend/BlinkitAPI/src/Blinkit.API/Program.cs](backend/BlinkitAPI/src/Blinkit.API/Program.cs) — CORS, JWT, Scalar, /api/health
- [frontend/blinkit-frontend/src/app/core/models/index.ts](frontend/blinkit-frontend/src/app/core/models/index.ts) — all interfaces
- [frontend/blinkit-frontend/src/app/app.routes.ts](frontend/blinkit-frontend/src/app/app.routes.ts) — full lazy route tree
- [frontend/blinkit-frontend/src/app/shared/utils.ts](frontend/blinkit-frontend/src/app/shared/utils.ts) — formatPrice, getCategoryFallback, etc.

## Current Phase
Phase 03 — Products | Status: Complete
