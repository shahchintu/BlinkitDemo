# Blinkit Clone — Full-Stack Grocery Delivery App

A production-quality clone of [Blinkit](https://blinkit.com) (India's 10-minute grocery delivery platform), built with ASP.NET Core 8 and Angular 18. Implements the complete shopping flow from product browsing through Razorpay payment, including a guest cart, order tracking, and admin panel.

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | ASP.NET Core 8 Web API |
| Language | C# 12 (nullable reference types enabled) |
| Architecture | Clean Architecture (API → Application → Domain → Infrastructure) |
| ORM | Entity Framework Core 8 — Fluent API only |
| Database | SQL Server 2022 (Docker) |
| Cache | Redis 7-alpine (Docker) — cart TTL 7 days |
| CQRS | MediatR 12 |
| Validation | FluentValidation |
| Auth | ASP.NET Core Identity + JWT (15 min access / 7 day refresh) |
| Payments | Razorpay .NET SDK (test mode) |
| Email | Resend.Net (free tier — 3 000 emails/month) |
| API Docs | Scalar at `/scalar` |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Angular 18 (standalone components throughout) |
| Language | TypeScript 5 strict — zero `any` |
| State | NgRx Signals (`@ngrx/signals`) |
| Styling | Tailwind CSS + Angular Material 18 |
| Forms | Angular Reactive Forms |
| HTTP | Angular `HttpClient` with JWT interceptor |
| Routing | Lazy-loaded routes with auth/admin guards |

### Infrastructure
| Service | Details |
|---------|---------|
| SQL Server | Docker — port 1433 — `SA_PASSWORD: BlinkitDev@123` |
| Redis | Docker — port 6379 |
| Angular proxy | `/api/*` → `https://localhost:7001` |

---

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/) and npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)
- A [Razorpay](https://dashboard.razorpay.com) account (free test mode)
- A [Resend](https://resend.com) account (free — 3 000 emails/month)

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/shahchintu/BlinkitDemo.git
cd BlinkitDemo
```

### 2. Start infrastructure (SQL Server + Redis)

```bash
docker-compose up -d
```

Wait ~30 seconds for SQL Server to finish initialising. Verify:

```bash
docker-compose ps
# Both services should show "healthy"
```

### 3. Configure the backend

Edit `backend/BlinkitAPI/src/Blinkit.API/appsettings.Development.json` and fill in your keys:

```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost,1433;Database=BlinkitDb;User=sa;Password=BlinkitDev@123;TrustServerCertificate=True",
    "Redis": "localhost:6379"
  },
  "Jwt": {
    "Key": "your-super-secret-key-at-least-32-characters-long",
    "Issuer": "BlinkitAPI",
    "Audience": "BlinkitClient"
  },
  "Razorpay": {
    "KeyId": "rzp_test_XXXXXXXXXX",
    "KeySecret": "XXXXXXXXXXXXXXXXXXXXXXXX"
  },
  "Resend": {
    "ApiKey": "re_XXXXXXXXXXXXXXXXXXXXXXXX"
  }
}
```

### 4. Run the backend

```bash
cd backend/BlinkitAPI
dotnet run --project src/Blinkit.API
```

The API starts at `https://localhost:7001`. EF Core runs migrations and seeds 500+ products automatically on first launch.

Verify: open `https://localhost:7001/scalar` — you should see the interactive API docs.

### 5. Install frontend dependencies

```bash
cd frontend/blinkit-frontend
npm install
```

### 6. Run the frontend

```bash
npm start
```

Open `http://localhost:4200`.

---

## Architecture Overview

```
BlinkitDemo/
├── backend/BlinkitAPI/
│   └── src/
│       ├── Blinkit.API/            ← Controllers, middleware, Program.cs
│       ├── Blinkit.Application/    ← MediatR handlers, DTOs, interfaces
│       ├── Blinkit.Domain/         ← Entities, enums, domain logic
│       └── Blinkit.Infrastructure/ ← EF Core, Redis, Razorpay, Resend
├── frontend/blinkit-frontend/
│   └── src/app/
│       ├── core/                   ← Services, stores, guards, models
│       ├── features/               ← Lazy-loaded feature pages
│       └── shared/                 ← Reusable components, utils
├── docker-compose.yml
└── docs/                           ← Extended documentation
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full breakdown.

---

## Features

### Guest Flow
- Browse all products and categories without logging in
- Add items to a local guest cart (persisted in `localStorage.guestCart`)
- Cart badge and sidebar update in real time
- On "Proceed to Checkout" — an inline login dialog appears
- After login, guest cart merges automatically with the server cart

### Products
- 500+ products across 15 categories, 30–40 per category
- Multi-variant support with "ADD · X options" split button
- ETA badge "8 MINS" on every product card
- Product detail page: image gallery, variant pills, attributes, related products
- Full-text search with debounce
- Pagination and category filtering

### Cart
- Sidebar cart with real-time free-delivery nudge bar
- Coupon codes: `WELCOME50`, `BLINKIT10`, `BANK5`, `FREESHIP`
- "You might also like" recommendations in sidebar
- Save for later / wishlist (localStorage-backed)
- Free delivery threshold: ₹199

### Checkout
- 3-step flow: Address → Delivery Slot → Payment
- Address CRUD with set-default
- Delivery slot selection
- 5 payment methods: UPI, Card, Net Banking, COD, Pay Later (BNPL)
- Razorpay modal integration with HMAC-SHA256 signature verification
- Animated order confirmation page
- Order confirmation email via Resend

### Orders & Account
- Order history with status tracking
- "Add more items" post-checkout flow (within Placed window)
- Blinkit Plus subscription page
- Profile management

### Admin Panel
- Dashboard: revenue, order counts, top products
- Product management (CRUD with image URL)
- Category management
- User management and role assignment
- Coupon management (create / toggle active)
- Order status updates (Placed → Packed → OutForDelivery → Delivered)

### Offers
- Dynamic coupon cards fetched from the API
- Bank & payment offers section with copy-to-clipboard

---

## API Documentation

Interactive docs (Scalar): `https://localhost:7001/scalar`

Full endpoint reference with request/response examples: [docs/API.md](docs/API.md)

---

## Test Credentials

### Admin account (seeded automatically on first run)
```
Email:    admin@blinkit.com
Password: Admin@123456
```

### Regular user (register via UI or API)
```
POST /api/auth/register
{
  "fullName": "Test User",
  "email": "test@example.com",
  "phone": "9876543210",
  "password": "Test@1234"
}
```

### Razorpay test payments
```
Card:  4111 1111 1111 1111  ·  any future expiry  ·  any 3-digit CVV
UPI:   success@razorpay
```

### Coupon codes
| Code | Type | Value | Min Order | Notes |
|------|------|-------|-----------|-------|
| `WELCOME50` | Percent | 50% (max ₹100) | ₹99 | New users only |
| `BLINKIT10` | Percent | 10% (max ₹50) | ₹149 | All users |
| `BANK5` | Flat | ₹5 off | ₹0 | All users |
| `FREESHIP` | Free delivery | — | ₹0 | All users |

---

## Known Issues

- Orders page and post-checkout tracking are Phase 06 (in progress)
- Admin panel CRUD is Phase 07 (in progress)
- No real-time order status updates via WebSockets (polling not yet implemented)
- Resend email delivery requires a verified sender domain in production

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 01 — Infrastructure | ✅ Done | Docker, .NET skeleton, Angular skeleton |
| 02 — Auth | ✅ Done | JWT, refresh tokens, login/register |
| 03 — Products | ✅ Done | 500+ products, variants, search, detail |
| 04 — Cart | ✅ Done | Guest cart, sidebar, coupons, wishlist |
| 05 — Checkout | ✅ Done | 3-step flow, Razorpay, email confirmation |
| 06 — Orders & Account | 🔲 Next | Order history, tracking, profile |
| 07 — Admin Panel | 🔲 Planned | Full CRUD dashboard |
| 08 — Polish & Deploy | 🔲 Planned | Vercel + Railway deploy |
| 09 — Claude AI | 🔲 Optional | AI product recommendations |

---

## AI Usage

This project was built with [Claude Code](https://claude.ai/code) as the primary development tool. See [docs/AI-USAGE.md](docs/AI-USAGE.md) for a detailed breakdown of how AI was applied throughout the build.
