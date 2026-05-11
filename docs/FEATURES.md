# docs/FEATURES.md — Complete Blinkit Feature Checklist
_Read before building any component or endpoint._

## CATALOG
- 500+ products · 15 categories · real Blinkit CDN images
- Product variants → "ADD · X options" → bottom-sheet modal per variant
- ETA "8 MINS" badge on every product card
- Predictive search (300ms debounce · image+name+category+ETA in dropdown)
- Product detail: gallery + variant pills (image swaps) + attributes + trust section + related
- Brand Stores (/brand/:slug — Amul, Haldiram's, Nestlé, etc.)
- Out-of-stock alternatives

## CART & SMART FEATURES
- Variant-aware cart (CartItem stores variantId)
- Free delivery nudge: progress bar "Add ₹X more for free delivery" (threshold ₹199)
- "Customers also bought" strip in cart sidebar (tag-based)
- Coupon codes: WELCOME50 · BLINKIT10 · BANK5 · FREESHIP
- Save for later / wishlist
- Live cart badge in navbar

## CHECKOUT & PAYMENTS
- 3-step CDK Stepper: Address → Delivery Slot → Payment
- Multiple saved addresses + add new + set default
- Razorpay modal: UPI · Card · Net Banking · COD · Pay Later (BNPL)
- Order confirmation: SVG checkmark animation · "📧 email sent"
- Post-checkout add items (before Packed status)

## ORDERS
- 4-step animated tracker: Placed → Packed → Out for Delivery → Delivered
- One-click Reorder
- Order detail: items+CDN images · address · slot · price breakdown

## ACCOUNT
- Profile (edit name/phone) · Saved addresses · Order history
- Blinkit Plus (₹99/month mock subscription — free delivery + 5% extra)
- /offers page: coupon cards + bank offers + "Copy Code"
- /help: FAQ accordion + mock chat widget

## ADMIN (/admin — AdminGuard)
- Dashboard: live stats
- Orders: table + inline status update
- Products: full CRUD + variant management (ProductForm tabs)
- Categories: CRUD + drag-reorder (CdkDragDrop)
- Users: list + view orders
- Coupons: add/edit/deactivate

## EMAILS (Resend)
- Order confirmation (HTML, Blinkit-green)
- Status updates: Packed · OutForDelivery · Delivered
