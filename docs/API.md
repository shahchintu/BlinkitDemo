# API Reference — Blinkit Clone

Base URL: `https://localhost:7001`  
Interactive docs: `https://localhost:7001/scalar`

All authenticated endpoints require `Authorization: Bearer <accessToken>` in the request header. The access token is returned in the login/refresh response body and expires after 15 minutes.

---

## Authentication

### POST /api/auth/register
Register a new user account.

**Request**
```json
{
  "fullName": "Chintan Shah",
  "email": "chintan@example.com",
  "phone": "9876543210",
  "password": "Test@1234"
}
```

**Response 201 Created**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "chintan@example.com",
    "fullName": "Chintan Shah",
    "phone": "9876543210",
    "role": "User"
  }
}
```

**Response 409 Conflict** — email already registered

---

### POST /api/auth/login
Authenticate and receive an access token. Sets httpOnly `refreshToken` cookie (7 days).

**Request**
```json
{
  "email": "chintan@example.com",
  "password": "Test@1234"
}
```

**Response 200 OK**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "chintan@example.com",
    "fullName": "Chintan Shah",
    "phone": "9876543210",
    "role": "User"
  }
}
```

**Response 401 Unauthorized** — invalid credentials

---

### POST /api/auth/refresh
Reissue an access token using the httpOnly refresh cookie. Rotates the refresh token.

**Request** — no body; requires `refreshToken` cookie

**Response 200 OK** — same shape as login response

**Response 401 Unauthorized** — expired or invalid refresh token

---

### POST /api/auth/logout
`[Authorize]` Revoke the refresh token and clear the cookie.

**Response 204 No Content**

---

### GET /api/auth/me
`[Authorize]` Return the currently authenticated user's profile.

**Response 200 OK**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "chintan@example.com",
  "fullName": "Chintan Shah",
  "role": "User"
}
```

---

## Products

### GET /api/products
List products with optional search and category filter.

**Query params**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Full-text search on name/tags |
| `categoryId` | guid | — | Filter by category |
| `page` | int | 1 | Page number |
| `pageSize` | int | 20 | Items per page (max 40) |

**Response 200 OK**
```json
{
  "items": [
    {
      "id": "...",
      "categoryId": "...",
      "categoryName": "Dairy & Eggs",
      "name": "Amul Full Cream Milk",
      "slug": "amul-full-cream-milk",
      "description": "Fresh pasteurised milk...",
      "price": 62,
      "discountPrice": 58,
      "stockQty": 200,
      "unit": "1 L",
      "imageUrl": "https://cdn.grofers.com/...",
      "images": ["https://cdn.grofers.com/..."],
      "isActive": true,
      "variants": [
        {
          "id": "...",
          "productId": "...",
          "unit": "500 ml",
          "price": 32,
          "discountPrice": 30,
          "stockQty": 150,
          "imageUrl": "https://cdn.grofers.com/...",
          "displayOrder": 0
        }
      ],
      "attributes": [{ "key": "Brand", "value": "Amul" }],
      "relatedTags": ["milk", "dairy"]
    }
  ],
  "totalCount": 523,
  "page": 1,
  "pageSize": 20,
  "totalPages": 27
}
```

---

### GET /api/products/{id}
Get a single product by GUID.

**Response 200 OK** — full `IProduct` object (same shape as list item)

**Response 404 Not Found**

---

### GET /api/products/{id}/related
Get related products for a product detail page.

**Query params**: `limit` (int, default 12)

**Response 200 OK** — array of `IProduct` objects

---

## Categories

### GET /api/categories
List all active categories.

**Response 200 OK**
```json
[
  {
    "id": "...",
    "name": "Fruits & Vegetables",
    "slug": "fruits-vegetables",
    "iconUrl": "https://cdn.grofers.com/...",
    "displayOrder": 1,
    "isActive": true,
    "productCount": 42
  }
]
```

---

## Cart
All cart endpoints require `Authorization` header.

### GET /api/cart
Get the current user's cart.

**Response 200 OK**
```json
{
  "items": [
    {
      "id": "...",
      "productId": "...",
      "productName": "Amul Full Cream Milk",
      "variantId": "...",
      "variantUnit": "1 L",
      "variantImageUrl": "https://cdn.grofers.com/...",
      "quantity": 2,
      "unitPrice": 58
    }
  ],
  "subTotal": 116,
  "itemCount": 2
}
```

---

### POST /api/cart/items
Add an item to the cart (or increment quantity if already present).

**Request**
```json
{
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "variantId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "quantity": 1
}
```

**Response 200 OK** — updated full cart (same shape as GET /api/cart)

---

### PUT /api/cart/items/{id}
Update quantity of a cart item.

**Request**
```json
{ "quantity": 3 }
```

**Response 200 OK** — updated full cart

---

### DELETE /api/cart/items/{id}
Remove a specific item from the cart.

**Response 200 OK** — updated full cart

---

### DELETE /api/cart
Clear the entire cart.

**Response 204 No Content**

---

## Addresses
All address endpoints require `Authorization` header.

### GET /api/addresses
List all addresses for the current user (default first).

**Response 200 OK**
```json
[
  {
    "id": "...",
    "label": "Home",
    "street": "123 MG Road",
    "city": "Bangalore",
    "pincode": "560001",
    "lat": null,
    "lng": null,
    "isDefault": true
  }
]
```

---

### POST /api/addresses
Create a new address. First address is automatically set as default.

**Request**
```json
{
  "label": "Work",
  "street": "Prestige Tech Park",
  "city": "Bangalore",
  "pincode": "560087"
}
```

**Response 201 Created** — the created address object

---

### PUT /api/addresses/{id}
Update an existing address.

**Request** — same shape as POST

**Response 204 No Content**

---

### DELETE /api/addresses/{id}
Delete an address.

**Response 204 No Content**

---

### PATCH /api/addresses/{id}/set-default
Set an address as the default delivery address.

**Response 204 No Content**

---

## Delivery

### GET /api/delivery/slots
List available delivery time slots.

**Response 200 OK**
```json
[
  {
    "id": "...",
    "label": "Express (8 min)",
    "startTime": "Now",
    "endTime": "8 min",
    "maxOrders": 50,
    "isActive": true
  }
]
```

---

### GET /api/delivery/check
Check if delivery is available for a pincode.

**Query params**: `pincode` (string)

**Response 200 OK**
```json
{ "available": true, "pincode": "560001" }
```

---

## Payments
All payment endpoints require `Authorization` header.

### POST /api/payments/create-order
Validate cart, apply coupon, calculate total, create a Razorpay order, and save to DB.

**Request**
```json
{
  "addressId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "deliverySlotId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "couponCode": "BLINKIT10"
}
```

**Response 200 OK**
```json
{
  "orderId": "...",
  "razorpayOrderId": "order_XXXXXXXXXX",
  "amount": 321,
  "currency": "INR"
}
```

**Response 400 Bad Request** — cart empty / insufficient stock

---

### POST /api/payments/verify
Verify Razorpay payment signature, mark order paid, decrement stock, send email.

**Request**
```json
{
  "orderId": "...",
  "razorpayOrderId": "order_XXXXXXXXXX",
  "razorpayPaymentId": "pay_XXXXXXXXXX",
  "razorpaySignature": "HMAC-SHA256-hex"
}
```

**Response 200 OK**
```json
{ "success": true }
```

**Response 400 Bad Request** — signature mismatch

---

### POST /api/payments/webhook
`[AllowAnonymous]` Razorpay webhook for `payment.captured` events.

**Headers**: `X-Razorpay-Signature: <hmac>`

**Response 200 OK** (always — webhook must not receive 4xx/5xx)

---

## Orders
All order endpoints require `Authorization` header.

### GET /api/orders
List all orders for the current user, newest first.

**Response 200 OK**
```json
[
  {
    "id": "...",
    "status": "Placed",
    "subTotal": 292,
    "deliveryFee": 0,
    "couponCode": "BLINKIT10",
    "couponDiscount": 29,
    "totalAmount": 263,
    "paymentStatus": "Paid",
    "createdAt": "2026-05-15T10:30:00Z",
    "itemCount": 3,
    "itemsSummary": "Amul Milk, Britannia Bread, +1 more",
    "address": { "street": "123 MG Road", "city": "Bangalore", "pincode": "560001" },
    "items": [...]
  }
]
```

---

### GET /api/orders/{id}
Get a single order by ID (must belong to the current user).

**Response 200 OK** — full order object

**Response 404 Not Found** — order not found

**Response 403 Forbidden** — order belongs to another user

---

### POST /api/orders/{id}/add-items
Add items to an existing order (only while status is `Placed`).

**Request**
```json
{
  "items": [
    { "productId": "...", "variantId": "...", "qty": 2 }
  ]
}
```

**Response 200 OK**

**Response 400 Bad Request** — order not in Placed status

---

### PATCH /api/orders/{id}/status
`[AdminOnly]` Update order status.

**Request**
```json
{ "status": "Packed" }
```

Valid transitions: `Placed → Packed → OutForDelivery → Delivered`

**Response 200 OK**

---

## Coupons

### GET /api/coupons
`[AllowAnonymous]` List all active coupons.

**Response 200 OK**
```json
[
  {
    "code": "WELCOME50",
    "discountType": "Percent",
    "discountValue": 50,
    "minOrderAmount": 99,
    "maxDiscountAmount": 100,
    "validFor": "NewUsers"
  }
]
```

---

### POST /api/coupons/validate
`[AllowAnonymous]` Validate a coupon code against the current cart subtotal.

**Request**
```json
{ "code": "BLINKIT10", "orderAmount": 292 }
```

**Response 200 OK**
```json
{
  "isValid": true,
  "discountAmount": 29,
  "message": "10% off applied — you save ₹29!"
}
```

---

## Account

### GET /api/account/profile
`[Authorize]` Get the current user's profile.

### PUT /api/account/profile
`[Authorize]` Update name and phone number.

---

## Blinkit Plus

### GET /api/blinkitplus/status
`[Authorize]` Get subscription status.

### POST /api/blinkitplus/subscribe
`[Authorize]` Activate Blinkit Plus subscription.

---

## Admin Endpoints
All admin endpoints require `[AdminOnly]` policy (role = Admin).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/dashboard` | Revenue, order counts, top products |
| GET | `/api/admin/products` | Paginated product list with admin fields |
| POST | `/api/admin/products` | Create product with variants |
| PUT | `/api/admin/products/{id}` | Update product |
| DELETE | `/api/admin/products/{id}` | Soft-delete product |
| GET | `/api/admin/categories` | List all categories |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/{id}` | Update category |
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/{id}/role` | Change user role |
| GET | `/api/admin/orders` | All orders across all users |
| GET | `/api/admin/coupons` | All coupons |
| POST | `/api/admin/coupons` | Create coupon |
| PATCH | `/api/admin/coupons/{id}/toggle` | Enable/disable coupon |

---

## Error Responses

All errors follow a consistent shape (via `GlobalExceptionMiddleware`):

```json
{
  "message": "Human-readable error description",
  "statusCode": 400
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error or business rule violation |
| 401 | Missing or expired access token |
| 403 | Authenticated but insufficient role |
| 404 | Resource not found |
| 409 | Conflict (e.g., email already registered) |
| 500 | Unhandled server error |
