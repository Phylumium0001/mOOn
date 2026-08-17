# mOOn.com — Full Developer Documentation

> Campus ecommerce platform for Ghanaian colleges.
> **Stack:** React 18 · Express 4 · Prisma 5 · PostgreSQL · Tailwind CSS · JWT

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Project Structure](#3-project-structure)
4. [Environment Setup](#4-environment-setup)
5. [Database — Prisma Schema](#5-database--prisma-schema)
6. [Backend — Express API](#6-backend--express-api)
   - [Server Entry Point](#61-server-entry-point)
   - [Authentication Middleware](#62-authentication-middleware)
   - [Auth Routes](#63-auth-routes)
   - [Shops Routes](#64-shops-routes)
   - [Products Routes](#65-products-routes)
   - [Orders Routes](#66-orders-routes)
   - [Admin Routes](#67-admin-routes)
7. [API Reference](#7-api-reference)
8. [Frontend — React](#8-frontend--react)
   - [Routing](#81-routing)
   - [State Management](#82-state-management)
   - [API Client](#83-api-client)
   - [Pages](#84-pages)
9. [Key Feature: Campus vs Nationwide Scope](#9-key-feature-campus-vs-nationwide-scope)
10. [Seeded Accounts](#10-seeded-accounts)
11. [Prisma Cheat Sheet](#11-prisma-cheat-sheet)
12. [Deployment](#12-deployment)
13. [Common Errors & Fixes](#13-common-errors--fixes)

---

## 1. Project Overview

mOOn.com is an ecommerce platform purpose-built for Ghanaian university students. The core differentiating feature is **scope-based shopping** — users can toggle between seeing only shops physically on their campus, or browsing verified vendors nationwide across all supported universities.

**User roles:**

| Role | What they can do |
|------|-----------------|
| `customer` | Browse products, add to cart, place orders, track deliveries |
| `vendor` | Create a shop, manage products, fulfill and update orders |
| `admin` | Verify shops, manage all users, view platform-wide stats |

**Supported campuses:**
- University of Ghana, Legon
- KNUST, Kumasi
- University of Cape Coast
- University of Professional Studies
- University of Energy and Natural Resources
- Ghana Institute of Management and Public Administration
- University of Health and Allied Sciences

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (React)                   │
│  LandingPage · StorePage · AuthPage                 │
│  VendorPage · AdminPage                             │
│                                                     │
│  AuthContext (JWT + user state)                     │
│  CartContext (single-shop cart, localStorage)       │
│  Axios client → /api/*                              │
└────────────────────┬────────────────────────────────┘
                     │ HTTP (proxied in dev)
┌────────────────────▼────────────────────────────────┐
│              Express API (port 5000)                │
│                                                     │
│  /api/auth      /api/shops     /api/products        │
│  /api/orders    /api/admin                          │
│                                                     │
│  JWT middleware · Role guards · express-validator   │
└────────────────────┬────────────────────────────────┘
                     │ Prisma Client
┌────────────────────▼────────────────────────────────┐
│              PostgreSQL Database                    │
│                                                     │
│  users · shops · products · orders · order_items   │
└─────────────────────────────────────────────────────┘
```

**Development proxy:** The React app (`localhost:3000`) proxies all `/api` requests to `localhost:5000` via the `"proxy"` field in `frontend/package.json`. No CORS issues in development.

---

## 3. Project Structure

```
moon-final/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          ← Single source of truth for all DB models
│   │   └── seed.js                ← Seeds admin, vendor, customer, shop, products
│   │
│   ├── src/
│   │   ├── server.js              ← Express app setup, route mounting, startup
│   │   ├── prismaClient.js        ← Prisma singleton (safe for hot-reload)
│   │   │
│   │   ├── middleware/
│   │   │   └── auth.js            ← protect() and requireRole() middleware
│   │   │
│   │   └── routes/
│   │       ├── auth.js            ← register, login, /me, update preferences
│   │       ├── shops.js           ← scope-filtered listing, CRUD
│   │       ├── products.js        ← scope-filtered listing, vendor CRUD
│   │       ├── orders.js          ← place order, list, status updates
│   │       └── admin.js           ← platform stats, shop verification, user mgmt
│   │
│   ├── .env.example               ← Copy to .env and fill in values
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    │
    ├── src/
    │   ├── index.js               ← React DOM entry point
    │   ├── index.css              ← Tailwind directives
    │   ├── App.jsx                ← Router + context providers + protected routes
    │   │
    │   ├── api/
    │   │   └── index.js           ← Axios instance + all API call functions
    │   │
    │   ├── context/
    │   │   ├── AuthContext.jsx    ← User auth state, login/register/logout/prefs
    │   │   └── CartContext.jsx    ← Cart items, single-shop enforcement
    │   │
    │   └── pages/
    │       ├── LandingPage.jsx    ← Public marketing homepage
    │       ├── StorePage.jsx      ← Main storefront (scope toggle, products, cart)
    │       ├── AuthPage.jsx       ← Login + register (single component, tab toggle)
    │       ├── VendorPage.jsx     ← Vendor dashboard (shop setup, products, orders)
    │       ├── AdminPage.jsx      ← Admin dashboard (stats, verify shops, users)
    │       └── ProfilePage.jsx    ← Customer dashboard (orders, addresses, account)
    │
    ├── tailwind.config.js
    └── package.json
```

---

## 4. Environment Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally (or a cloud instance e.g. Supabase, Neon, Railway)
- npm

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
NODE_ENV=development

# Full PostgreSQL connection string — required by Prisma
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/moondb?schema=public"

JWT_SECRET=pick_a_long_random_string_here
JWT_EXPIRES_IN=7d
```

Run migrations (generates the SQL and applies it):

```bash
npx prisma migrate dev --name init
```

Generate Prisma Client (run this whenever `schema.prisma` changes):

```bash
npx prisma generate
```

Seed the database:

```bash
npm run db:seed
```

Start the dev server:

```bash
npm run dev      # nodemon, restarts on save
```

### Frontend

```bash
cd frontend
npm install
npm start        # React dev server on http://localhost:3000
```

The `"proxy": "http://localhost:5000"` line in `frontend/package.json` means all `/api` calls go to the backend automatically during development.

---

## 5. Database — Prisma Schema

Schema lives in `backend/prisma/schema.prisma`. All tables use UUID primary keys and snake_case column names (mapped from camelCase in Prisma).

### Enums

| Enum | Values |
|------|--------|
| `Role` | `customer`, `vendor`, `admin` |
| `ShopScope` | `campus`, `region`, `nationwide` |
| `UserShopScope` | `campus`, `nationwide` |
| `Category` | `textbooks`, `stationery`, `electronics`, `snacks`, `fashion`, `services`, `general` |
| `OrderStatus` | `pending`, `confirmed`, `preparing`, `out_for_delivery`, `delivered`, `cancelled` |
| `PaymentMethod` | `mobile_money`, `cash_on_delivery` |
| `PaymentStatus` | `unpaid`, `paid` |
| `Campus` | `University_of_Ghana_Legon`, `KNUST_Kumasi`, `University_of_Cape_Coast`, `University_of_Professional_Studies`, `University_of_Energy_and_Natural_Resources`, `Ghana_Institute_of_Management_and_Public_Administration`, `University_of_Health_and_Allied_Sciences` |

### Model: `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` PK | Auto-generated |
| `name` | `VARCHAR(150)` | Required |
| `email` | `VARCHAR(255)` | Unique, required |
| `password` | `VARCHAR(255)` | Bcrypt hash, required |
| `phone` | `VARCHAR(20)` | Optional |
| `role` | `Role` | Default: `customer` |
| `campus` | `Campus` | Optional enum |
| `shop_scope` | `UserShopScope` | Default: `campus` |
| `region` | `VARCHAR(100)` | Optional |
| `delivery_addresses` | `JSONB` | Array of address objects, default `[]` |
| `created_at` | `TIMESTAMP` | Auto |
| `updated_at` | `TIMESTAMP` | Auto-updated |

**Relations:** one optional `Shop` (vendor only), many `Order`s.

**`delivery_addresses` shape:**
```json
[
  {
    "label": "Mensah Sarbah Hall",
    "hostel": "Mensah Sarbah",
    "room_number": "A204",
    "landmark": "Near the roundabout",
    "is_default": true
  }
]
```

### Model: `shops`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` PK | |
| `owner_id` | `UUID` FK → `users.id` | Unique (one shop per vendor), cascade delete |
| `name` | `VARCHAR(200)` | Required |
| `description` | `TEXT` | Optional |
| `logo` | `TEXT` | URL, optional |
| `cover_image` | `TEXT` | URL, optional |
| `category` | `Category` | Required |
| `scope` | `ShopScope` | Default: `campus` — controls which users see this shop |
| `campus` | `Campus` | Which campus (for `campus` scope shops) |
| `region` | `VARCHAR(100)` | Which region (for `region` scope shops) |
| `contact_phone` | `VARCHAR(20)` | Optional |
| `contact_email` | `VARCHAR(255)` | Optional |
| `is_verified` | `BOOLEAN` | Default: `false` — must be verified by admin to appear in nationwide listings |
| `is_active` | `BOOLEAN` | Default: `true` |
| `rating` | `FLOAT` | Default: 0 |
| `review_count` | `INT` | Default: 0 |
| `delivery_fee` | `FLOAT` | In GHS, default: 0 |
| `min_order_amount` | `FLOAT` | In GHS, default: 0 |
| `estimated_delivery_time` | `VARCHAR` | Default: `"30-45 mins"` |
| `created_at` | `TIMESTAMP` | Auto |
| `updated_at` | `TIMESTAMP` | Auto-updated |

**Relations:** belongs to `User` (owner), has many `Product`s, has many `Order`s.

### Model: `products`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` PK | |
| `shop_id` | `UUID` FK → `shops.id` | Cascade delete |
| `name` | `VARCHAR(200)` | Required |
| `description` | `TEXT` | Optional |
| `price` | `FLOAT` | Required, in GHS |
| `original_price` | `FLOAT` | Optional — used to show a discount |
| `images` | `TEXT[]` | Array of image URLs, default `[]` |
| `category` | `Category` | Required |
| `tags` | `TEXT[]` | For search, default `[]` |
| `stock` | `INT` | Default: 0 — decremented atomically on order |
| `is_available` | `BOOLEAN` | Default: `true` |
| `rating` | `FLOAT` | Default: 0 |
| `review_count` | `INT` | Default: 0 |
| `created_at` | `TIMESTAMP` | Auto |
| `updated_at` | `TIMESTAMP` | Auto-updated |

**Relations:** belongs to `Shop`, has many `OrderItem`s.

### Model: `orders`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` PK | |
| `customer_id` | `UUID` FK → `users.id` | Cascade delete |
| `shop_id` | `UUID` FK → `shops.id` | Cascade delete |
| `subtotal` | `FLOAT` | Items total before delivery fee |
| `delivery_fee` | `FLOAT` | Copied from shop at time of order |
| `total` | `FLOAT` | `subtotal + delivery_fee` |
| `delivery_address` | `JSONB` | Snapshot of customer's delivery address |
| `status` | `OrderStatus` | Default: `pending` |
| `payment_method` | `PaymentMethod` | Default: `cash_on_delivery` |
| `payment_status` | `PaymentStatus` | Default: `unpaid` |
| `notes` | `TEXT` | Customer notes to vendor, optional |
| `status_history` | `JSONB` | Array of `{status, note, timestamp}` entries |
| `created_at` | `TIMESTAMP` | Auto |
| `updated_at` | `TIMESTAMP` | Auto-updated |

**Relations:** belongs to `User` (customer) and `Shop`, has many `OrderItem`s.

**`delivery_address` shape:**
```json
{
  "hostel": "Mensah Sarbah Hall",
  "roomNumber": "A204",
  "landmark": "Near the roundabout",
  "campus": "University_of_Ghana_Legon"
}
```

**`status_history` shape:**
```json
[
  { "status": "pending", "note": "Order placed", "timestamp": "2024-01-15T10:30:00Z" },
  { "status": "confirmed", "note": "Accepted by vendor", "timestamp": "2024-01-15T10:35:00Z" }
]
```

### Model: `order_items`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` PK | |
| `order_id` | `UUID` FK → `orders.id` | Cascade delete |
| `product_id` | `UUID` FK → `products.id` | Set null on product delete (preserves history) |
| `name` | `VARCHAR(200)` | Snapshot of product name at time of order |
| `price` | `FLOAT` | Snapshot of price at time of order |
| `quantity` | `INT` | |
| `image` | `TEXT` | First image URL at time of order |

> **Why snapshots?** `name`, `price`, and `image` are copied from the product at order time. This preserves order history even if the vendor later changes product details or deletes the product.

### Entity Relationship Diagram

```
users ──────────────── shops
  │  (one vendor,        │
  │   one shop)          │
  │                      │
  └──── orders ──────────┘
           │
           └──── order_items ──── products
                                     │
                                  shops
```

---

## 6. Backend — Express API

### 6.1 Server Entry Point

**`src/server.js`**

- Loads `.env` via `dotenv`
- Applies CORS (allows `localhost:3000` in dev, production origin otherwise)
- Applies `express.json()` and `morgan` logging
- Mounts all route modules under `/api`
- Connects to PostgreSQL via `prisma.$connect()` before starting the HTTP server
- Health check at `GET /api/health`

### 6.2 Authentication Middleware

**`src/middleware/auth.js`** exports two functions:

**`protect`** — verifies JWT and attaches user to `req.user`

```
Request → check Authorization header → verify JWT → lookup user in DB (without password) → attach to req.user → next()
```

Returns `401` if no token, invalid token, or user not found.

**`requireRole(...roles)`** — role guard factory, used after `protect`

```js
router.post('/shops', protect, requireRole('vendor', 'admin'), handler)
```

Returns `403` if `req.user.role` is not in the allowed list.

### 6.3 Auth Routes

**Base path:** `/api/auth`

#### `POST /api/auth/register`

Creates a new user. Accepts `customer` or `vendor` role (admin accounts are seeded only).

**Request body:**
```json
{
  "name": "Ama Mensah",
  "email": "ama@ug.edu.gh",
  "password": "secret123",
  "phone": "0244000000",
  "campus": "University_of_Ghana_Legon",
  "shopScope": "campus",
  "region": "Greater Accra",
  "role": "customer"
}
```

**Response `201`:**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "name": "Ama Mensah", "email": "...", "role": "customer", "campus": "...", "shopScope": "campus" }
}
```

**Validation:** `name` required, `email` valid format, `password` ≥ 6 chars, `campus` required.

#### `POST /api/auth/login`

**Request body:**
```json
{ "email": "ama@ug.edu.gh", "password": "secret123" }
```

**Response `200`:** Same shape as register response.

#### `GET /api/auth/me`

Auth required. Returns the currently logged-in user (no password field).

#### `PATCH /api/auth/preferences`

Auth required. Updates campus, shopScope, region, or delivery addresses without requiring a full re-registration. All fields optional.

**Request body (any subset):**
```json
{
  "campus": "KNUST_Kumasi",
  "shopScope": "nationwide",
  "region": "Ashanti",
  "deliveryAddresses": [{ "label": "Unity Hall", "hostel": "Unity", "roomNumber": "B12", "isDefault": true }]
}
```

### 6.4 Shops Routes

**Base path:** `/api/shops`

#### Scope filtering — `buildScopeFilter()`

All `GET /api/shops` calls go through this internal helper which builds the Prisma `where` clause based on three query params:

| `scope` | `campus` | `region` | What is returned |
|---------|----------|----------|-----------------|
| `nationwide` | — | — | All `isVerified: true` shops |
| `region` | provided | provided | campus + region + nationwide shops |
| `campus` (default) | provided | — | campus shops + nationwide shops + all region shops |

#### `GET /api/shops`

Public. Query params: `scope`, `campus`, `region`, `category`.

#### `GET /api/shops/vendor/mine`

Auth: vendor only. Returns the logged-in vendor's shop.

> ⚠️ This route must be defined **before** `GET /api/shops/:id` in the file, otherwise Express matches `vendor/mine` as an `:id` parameter.

#### `GET /api/shops/:id`

Public. Returns a single shop with owner details.

#### `POST /api/shops`

Auth: vendor, admin. Creates a shop. Vendors are limited to one shop.

**Request body:**
```json
{
  "name": "Campus Bookstore",
  "description": "Textbooks and stationery on Legon campus",
  "category": "textbooks",
  "scope": "campus",
  "campus": "University_of_Ghana_Legon",
  "contactPhone": "0244000001",
  "deliveryFee": 5,
  "minOrderAmount": 10,
  "estimatedDeliveryTime": "30-45 mins"
}
```

#### `PATCH /api/shops/:id`

Auth: vendor (own shop only), admin (any shop). All fields optional — only provided fields are updated.

### 6.5 Products Routes

**Base path:** `/api/products`

#### Scope filtering — `getEligibleShopIds()`

Similar to shops, but first collects eligible shop IDs, then filters products by `shopId: { in: shopIds }`. This two-step approach ensures products always inherit their shop's scope.

#### `GET /api/products`

Public. Query params: `scope`, `campus`, `region`, `category`, `search`, `shopId`, `page` (default 1), `limit` (default 20).

Search uses Prisma `contains` (case-insensitive) on `name` and `description`, plus `has` for `tags` array.

Returns paginated response:
```json
{
  "success": true,
  "total": 45,
  "page": 1,
  "pages": 3,
  "products": [...]
}
```

#### `GET /api/products/vendor/mine`

Auth: vendor only. Returns all products in the vendor's shop (no pagination).

#### `GET /api/products/:id`

Public. Single product with full shop details included.

#### `POST /api/products`

Auth: vendor (must have a shop first), admin.

**Request body:**
```json
{
  "name": "Biochemistry Textbook",
  "description": "Stryer 9th edition",
  "price": 45.00,
  "originalPrice": 60.00,
  "category": "textbooks",
  "tags": ["biochem", "science", "stryer"],
  "stock": 20,
  "images": ["https://example.com/book.jpg"]
}
```

#### `PATCH /api/products/:id`

Auth: vendor (own product), admin. All fields optional.

#### `DELETE /api/products/:id`

Auth: vendor (own product), admin. Hard delete — `order_items` referencing this product will have `product_id` set to `null` (preserving order history).

### 6.6 Orders Routes

**Base path:** `/api/orders`

#### `POST /api/orders`

Auth: customer only. Atomically creates the order, all order items, and decrements product stock using `prisma.$transaction()`.

**Validations before creation:**
1. `items` array must not be empty
2. Shop must exist
3. All products must exist, belong to that shop, and be `isAvailable: true`
4. Each product must have sufficient `stock`
5. Subtotal must meet shop's `minOrderAmount` if set

**Request body:**
```json
{
  "shopId": "uuid-of-shop",
  "items": [
    { "productId": "uuid-of-product", "quantity": 2 },
    { "productId": "uuid-of-another", "quantity": 1 }
  ],
  "deliveryAddress": {
    "hostel": "Mensah Sarbah Hall",
    "roomNumber": "A204",
    "landmark": "Near the roundabout",
    "campus": "University_of_Ghana_Legon"
  },
  "paymentMethod": "mobile_money",
  "notes": "Please call on arrival"
}
```

**Response `201`:** Full order object with items and shop.

#### `GET /api/orders`

Auth required. Returns different results by role:
- `customer` → own orders only
- `vendor` → orders for their shop only
- `admin` → all orders

#### `GET /api/orders/:id`

Auth required. Access check: only the customer who placed it, the vendor of that shop, or an admin can view it.

#### `PATCH /api/orders/:id/status`

Auth: vendor, admin. Appends an entry to `status_history` and updates `status`.

Valid transitions: `confirmed` → `preparing` → `out_for_delivery` → `delivered`. Also accepts `cancelled` at any stage.

**Request body:**
```json
{ "status": "confirmed", "note": "Accepted, preparing now" }
```

### 6.7 Admin Routes

**Base path:** `/api/admin`

All routes require `protect` + `requireRole('admin')` applied at the router level.

#### `GET /api/admin/stats`

Returns platform-wide statistics in a single response using `prisma.$transaction()` for efficiency:

```json
{
  "success": true,
  "stats": {
    "totalUsers": 142,
    "totalVendors": 18,
    "totalShops": 18,
    "totalOrders": 534,
    "pendingOrders": 7,
    "totalProducts": 312,
    "totalRevenue": 28450.50,
    "ordersByStatus": [
      { "status": "delivered", "count": 490 },
      { "status": "pending", "count": 7 }
    ],
    "ordersByCampus": [
      { "campus": "University_of_Ghana_Legon", "count": 310 },
      { "campus": "KNUST_Kumasi", "count": 180 }
    ]
  }
}
```

#### `GET /api/admin/users`

Query params: `role`, `campus`. Returns all users without password fields.

#### `GET /api/admin/shops`

Query params: `isVerified` (`true`/`false`), `campus`, `scope`. Returns all shops with owner info.

#### `PATCH /api/admin/shops/:id/verify`

Toggles `isVerified`. Body: `{ "isVerified": true }`.

Verified shops with `scope: nationwide` become visible to all students. Unverified nationwide shops are hidden from non-admin listings.

#### `DELETE /api/admin/users/:id`

Hard deletes a user. Cascades to their shop, products (via shop), and orders.

---

## 7. API Reference

### Authentication

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

Token is returned on register/login and expires per `JWT_EXPIRES_IN` (default 7 days).

### Full Endpoint Table

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/health` | None | — | Health check |
| `POST` | `/api/auth/register` | None | — | Register new user |
| `POST` | `/api/auth/login` | None | — | Login |
| `GET` | `/api/auth/me` | ✅ | any | Get current user |
| `PATCH` | `/api/auth/preferences` | ✅ | any | Update campus/scope prefs |
| `GET` | `/api/shops` | None | — | List shops (scope-filtered) |
| `GET` | `/api/shops/vendor/mine` | ✅ | vendor | Get own shop |
| `GET` | `/api/shops/:id` | None | — | Get shop by ID |
| `POST` | `/api/shops` | ✅ | vendor, admin | Create shop |
| `PATCH` | `/api/shops/:id` | ✅ | vendor, admin | Update shop |
| `GET` | `/api/products` | None | — | List products (scope-filtered, paginated) |
| `GET` | `/api/products/vendor/mine` | ✅ | vendor | Get own products |
| `GET` | `/api/products/:id` | None | — | Get product by ID |
| `POST` | `/api/products` | ✅ | vendor, admin | Create product |
| `PATCH` | `/api/products/:id` | ✅ | vendor, admin | Update product |
| `DELETE` | `/api/products/:id` | ✅ | vendor, admin | Delete product |
| `POST` | `/api/orders` | ✅ | customer | Place order |
| `GET` | `/api/orders` | ✅ | any | List orders (role-filtered) |
| `GET` | `/api/orders/:id` | ✅ | any | Get order detail |
| `PATCH` | `/api/orders/:id/status` | ✅ | vendor, admin | Update order status |
| `GET` | `/api/admin/stats` | ✅ | admin | Platform statistics |
| `GET` | `/api/admin/users` | ✅ | admin | All users |
| `GET` | `/api/admin/shops` | ✅ | admin | All shops |
| `PATCH` | `/api/admin/shops/:id/verify` | ✅ | admin | Verify/unverify shop |
| `DELETE` | `/api/admin/users/:id` | ✅ | admin | Delete user |

### Standard Error Response Shape

```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

Validation errors return an `errors` array instead:
```json
{
  "success": false,
  "errors": [
    { "field": "email", "msg": "Valid email required" }
  ]
}
```

---

## 8. Frontend — React

### 8.1 Routing

Defined in `src/App.jsx` using React Router v6.

| Path | Component | Guard |
|------|-----------|-------|
| `/` | `LandingPage` | None |
| `/shop` | `StorePage` | None |
| `/login` | `AuthPage` (mode=login) | None |
| `/register` | `AuthPage` (mode=register) | None |
| `/profile` | `ProfilePage` | `ProtectedRoute` — role: customer |
| `/checkout` | `CheckoutPage` | `ProtectedRoute` — role: customer |
| `/vendor` | `VendorPage` | `ProtectedRoute` — role: vendor |
| `/admin` | `AdminPage` | `ProtectedRoute` — role: admin |
| `*` | Redirect to `/` | — |

**`ProtectedRoute`** checks `AuthContext` — if not logged in, redirects to `/login`; if wrong role, redirects to `/shop`.

### 8.2 State Management

#### `AuthContext` (`src/context/AuthContext.jsx`)

Provides:

| Export | Type | Description |
|--------|------|-------------|
| `user` | object \| null | Current user (no password) |
| `loading` | boolean | True while verifying token on mount |
| `login(credentials)` | async fn | Calls `/api/auth/login`, stores token + user |
| `register(data)` | async fn | Calls `/api/auth/register`, stores token + user |
| `logout()` | fn | Clears localStorage, sets user to null |
| `updatePreferences(prefs)` | async fn | Calls `/api/auth/preferences`, updates stored user |
| `CAMPUSES` | string[] | List of all supported campus names |
| `REGIONS` | string[] | List of all Ghanaian regions |

Token is stored in `localStorage` as `moon_token`. User object stored as `moon_user`. On app mount, if a token exists, it calls `GET /api/auth/me` to re-validate and restore session.

#### `CartContext` (`src/context/CartContext.jsx`)

Provides:

| Export | Type | Description |
|--------|------|-------------|
| `cart` | array | Current cart items |
| `cartShopId` | string \| null | Shop ID the current cart belongs to |
| `addItem(product, shopId)` | fn | Returns `{ error }` — errors if item is from a different shop |
| `removeItem(productId)` | fn | Removes item; clears `cartShopId` if cart empties |
| `updateQty(productId, qty)` | fn | Updates quantity; calls `removeItem` if qty ≤ 0 |
| `clearCart()` | fn | Empties cart entirely |
| `total` | number | Sum of `price × qty` for all items |
| `itemCount` | number | Total quantity of all items |

Cart is persisted to `localStorage` as `moon_cart` and `moon_cart_shop`. **Single-shop enforcement:** if a customer tries to add a product from a different shop than the current cart, `addItem` returns `{ error: '...' }` and does not add the item. The UI should prompt to clear the cart first.

### 8.3 API Client

**`src/api/index.js`**

Axios instance with base URL `/api` and two interceptors:

1. **Request interceptor** — automatically attaches `Authorization: Bearer <token>` from localStorage to every request.
2. **Response interceptor** — on `401` responses, clears localStorage and redirects to `/login`.

All API functions are named exports:

```js
// Auth
register(data), login(data), getMe(), updatePreferences(data)

// Shops
getShops(params), getShop(id), createShop(data), updateShop(id, data), getMyShop()

// Products
getProducts(params), getProduct(id), createProduct(data),
updateProduct(id, data), deleteProduct(id), getMyProducts()

// Orders
placeOrder(data), getOrders(), getOrder(id), updateOrderStatus(id, data)

// Admin
getAdminStats(), getAdminUsers(params), getAdminShops(params),
verifyShop(id, isVerified), deleteUser(id)
```

### 8.4 Pages

#### `LandingPage.jsx`

Public marketing page. No auth required.

- Sticky navbar — shows "Sign In" / "Get Started" when logged out, "Go to Store →" when logged in
- Hero section with campus vs nationwide explainer
- Campus pills (all supported campuses)
- Side-by-side cards explaining Campus Mode vs Nationwide Mode
- Category grid linking to `/shop`
- Feature highlights grid
- CTA footer section

#### `StorePage.jsx`

The main shopping interface.

**Scope controls (top of header):**
- Dropdown to toggle between `campus` and `nationwide` scope
- Campus selector (only shown when scope is `campus`)
- Both update the user's preference via `updatePreferences()` if logged in, otherwise just local state

**Category nav:** Horizontal scrolling tabs — All, Textbooks, Food & Snacks, Campus Fashion, Stationery, Electronics, Services. Selecting a category re-fetches products.

**Search:** Form submission triggers `fetchProducts()` with the current search term.

**Product grid:** `ProductCard` components — shows name, shop, rating, price, optional discount badge, optional "National" badge for nationwide-scope shops. "+ Add" button calls `addItem()` and shows a toast.

**Cart sidebar:** Slides in from the right. Shows all cart items with quantity controls. "Proceed to Checkout" navigates to `/checkout` (not yet implemented — extend here).

**Mock data fallback:** If the API call fails (backend not running), `MOCK_PRODUCTS` is displayed so the UI is always testable.

#### `AuthPage.jsx`

Single component handling both login and register via a tab toggle (`isLogin` state).

Register form collects: name, email, password, phone, campus (dropdown), shopScope (radio — Campus / Nationwide), role (radio — Student / Vendor).

On success, routes based on role: admin → `/admin`, vendor → `/vendor`, customer → `/shop`.

#### `VendorPage.jsx`

Protected (vendor only). Sidebar navigation with four sections:

**Dashboard tab:**
- Stats cards: total orders, pending orders, revenue (delivered only), active products
- Recent orders table (last 5)

**Products tab:**
- Grid of product cards with Edit / Delete actions
- "+ Add Product" opens `ProductModal`
- `ProductModal` handles both create and edit — POST or PATCH based on whether `editProduct` is set

**Orders tab:**
- Full list of all shop orders as `OrderRow` components
- Each row shows order details, current status badge, and a "Mark [next status]" button
- Status progression: `pending` → `confirmed` → `preparing` → `out_for_delivery` → `delivered`

**Settings tab:**
- `ShopSettingsForm` — edit shop name, description, scope, campus, delivery fee, contact, estimated delivery time

**Shop Setup Banner (`ShopSetupForm`):**
- Shown at the top if the vendor has no shop yet
- Creates the shop and dismisses the banner on success

#### `CheckoutPage.jsx`

Protected (customer only). Single-page layout with all steps visible at once — no step-by-step wizard. A sticky order summary sidebar on desktop collapses to a bottom summary on mobile.

**Section 1 — Cart review:** Editable cart items with quantity controls and remove buttons. Shows shop name, campus, estimated delivery time, and minimum order amount if set. Changes here update `CartContext` in real time and immediately reflect in the summary sidebar.

**Section 2 — Delivery address:** If the user has saved addresses in their profile, they appear as selectable radio cards (default address pre-selected). A "+ Use a different address" option opens a manual entry form (hostel, room number, landmark). A hint link lets them save the custom address to their profile for future orders.

**Section 3 — Payment method:** Two radio options:
- **Cash on Delivery** — no additional input needed
- **Mobile Money** — reveals a network selector (MTN MoMo, Vodafone Cash, AirtelTigo Money) and a MoMo number field pre-filled from the user's phone number if set. Shows a security reminder not to share PIN. Network-specific number prefixes shown as hints.

**Section 4 — Notes (optional):** Free-text field for delivery instructions or special requests to the vendor.

**Order summary sidebar (sticky):**
- Line items with quantities and totals
- Subtotal, delivery fee (fetched from shop), grand total
- Payment method badge
- Warning if subtotal is below the shop's minimum order amount
- "Place Order · ₵X.XX" CTA button — disabled while placing

**On success:** Replaces the form with a confirmation screen showing order ID, shop name, estimated delivery time, a total breakdown, and two buttons — "Track Order in Profile" and "Continue Shopping". Cart is cleared automatically.

**Guest handling:** The StorePage cart sidebar button reads "Sign in to Checkout" for unauthenticated users and redirects to `/login` instead of `/checkout`.

#### `ProfilePage.jsx`

Protected (customer only). Accessible from the StorePage header via the user's name button. Three-tab layout with a sidebar on desktop and horizontal pill tabs on mobile.

**Profile hero banner:** Shows the user's avatar initial, name, email, campus, scope mode, and total order count.

**Cart tab (default tab):**
- Full view of current cart items with quantity controls (+/−) and remove buttons
- Shop identity banner (single-shop enforcement reminder)
- Cart total with a note that delivery fee is calculated at checkout
- "Clear Cart" button (with confirmation) and "Checkout · ₵X.XX" CTA
- Empty state with a "Browse Store" link
- Nav item shows a live item-count badge

**Orders tab:**
- Full order history list, each card collapsible
- Collapsed view: order ID, status badge, shop name, date, total, item count
- Expanded view:
  - **Progress tracker** — 5-step visual bar (pending → confirmed → preparing → out for delivery → delivered), or a cancellation notice
  - **Items list** — product image, name, unit price × quantity, line total
  - **Totals breakdown** — subtotal, delivery fee, grand total
  - **Delivery address snapshot** — hostel, room, landmark
  - **Status timeline** — each status change with timestamp and vendor note

**Addresses tab:**
- Grid of saved delivery address cards
- Each card shows: label, hostel, room number, landmark, default badge
- Actions per card: Set default, Edit, Delete
- Add / Edit via a modal form (label, hostel, room number, landmark, set-as-default checkbox)
- All changes persist via `PATCH /api/auth/preferences` → `deliveryAddresses` field (JSONB)

**Account tab:**
- Read-only section: name, email, phone, account type
- Editable preferences: campus (dropdown), shop scope (campus / nationwide radio), region (dropdown)
- Saves via `PATCH /api/auth/preferences`
- Sign out button (clears localStorage, redirects to `/`)

#### `AdminPage.jsx`

Protected (admin only). Sidebar navigation with four sections:

**Overview tab:**
- 6 stat cards (students, vendors, shops, products, orders, revenue)
- Campus order distribution bar chart (manual SVG-free bars)
- "Pending Verification" list with one-click verify buttons

**Shops tab:**
- Full list of all shops with verified/pending badge and scope label
- Toggle verify/unverify button per shop

**Users tab:**
- Full user list with role badge, campus, scope, join date
- Delete button (with `window.confirm` guard) for non-admin users

---

## 9. Key Feature: Campus vs Nationwide Scope

This is the central business logic of mOOn.com.

### How it works end-to-end

```
1. User registers → sets campus + shopScope preference
2. StorePage loads → reads scope + campus from AuthContext (or local state)
3. GET /api/products?scope=campus&campus=University_of_Ghana_Legon
4. Backend calls getEligibleShopIds({ scope, campus })
   → queries shops WHERE scope='campus' AND campus='University_of_Ghana_Legon'
      OR scope='nationwide' AND isVerified=true
      OR scope='region'
   → returns array of shop IDs
5. Products WHERE shopId IN [...eligible shop IDs]
6. Only those products are returned to the frontend
```

### Scope matrix

| User scope | Shop scope | Shop visible? |
|-----------|-----------|---------------|
| `campus` (UG Legon) | `campus` (UG Legon) | ✅ Yes |
| `campus` (UG Legon) | `campus` (KNUST) | ❌ No |
| `campus` (any) | `nationwide` + verified | ✅ Yes |
| `campus` (any) | `region` | ✅ Yes (all regions) |
| `nationwide` | `nationwide` + verified | ✅ Yes |
| `nationwide` | `campus` (any) | ❌ No |
| `nationwide` | `region` | ❌ No |

### Changing scope

Users can change their scope preference:
- From the **StorePage** dropdown (persisted via `PATCH /api/auth/preferences` if logged in)
- From the **AuthPage** during registration
- From the **Profile** (not yet built — extend `PATCH /api/auth/preferences`)

The `StorePage` re-fetches products every time scope or campus changes via a `useEffect` dependency.

---

## 10. Seeded Accounts

Run `npm run db:seed` to create these. Safe to run multiple times (`upsert`).

| Role | Email | Password | Campus |
|------|-------|----------|--------|
| Admin | `admin@moon.com` | `admin123` | UG Legon |
| Vendor | `vendor@moon.com` | `vendor123` | UG Legon |
| Customer | `student@ug.edu.gh` | `customer123` | UG Legon |

The seeded vendor has a verified shop called **Campus Bookstore** with 4 sample products.

---

## 11. Prisma Cheat Sheet

```bash
# Apply schema changes during development (creates migration file + runs it)
npx prisma migrate dev --name describe_your_change

# Apply migrations in production (no schema changes, just applies pending)
npx prisma migrate deploy

# Regenerate Prisma Client after schema edits (also runs automatically with migrate dev)
npx prisma generate

# Open visual DB browser at http://localhost:5555
npx prisma studio

# Reset DB completely (drops all data, re-runs all migrations, re-seeds)
npx prisma migrate reset

# View migration history
npx prisma migrate status

# Format schema.prisma file
npx prisma format
```

**Where migrations live:** `backend/prisma/migrations/` — each migration is a folder with a timestamped name and a `migration.sql` file containing the raw SQL Prisma generated. Commit these to git.

**Prisma error codes to know:**

| Code | Meaning |
|------|---------|
| `P2002` | Unique constraint violation (e.g. duplicate email) |
| `P2025` | Record not found (used in update/delete) |
| `P2003` | Foreign key constraint failed |
| `P2000` | Value too long for column |

---

## 12. Deployment — Render Free Tier

This section covers deploying the full stack (PostgreSQL database + Express backend + React frontend) on [Render](https://render.com). All three run on Render's free plan.

> **Free tier limitations to know upfront:**
> - Web services spin down after 15 minutes of inactivity. The first request after sleep takes ~30 seconds to wake up.
> - The free PostgreSQL database expires after **90 days** — you'll need to recreate it and re-seed.
> - 512 MB RAM per service.
> - No persistent disk on free tier (fine for this app — no file uploads yet).

---

### Prerequisites

- A [Render account](https://render.com) (free, no credit card needed)
- Your project pushed to a **GitHub repository** (Render deploys from Git)

If you haven't set up a GitHub repo yet:

```bash
# From the moon-final/ folder
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/moon-final.git
git push -u origin main
```

---

### Step 1 — Create the PostgreSQL Database

Do this **first** — you need the connection string before configuring the backend.

1. Go to [dashboard.render.com](https://dashboard.render.com) → click **New +** → **PostgreSQL**
2. Fill in:
   - **Name:** `moon-db`
   - **Database:** `moondb`
   - **User:** `moonuser`
   - **Region:** Frankfurt (EU West) or Ohio (US East) — pick closest to Ghana
   - **Plan:** Free
3. Click **Create Database**
4. Wait ~1 minute for it to provision
5. On the database detail page, scroll to **Connection** and copy the **Internal Database URL** — it looks like:
   ```
   postgresql://moonuser:RANDOM_PASSWORD@dpg-XXXXX-a/moondb
   ```
   Keep this tab open — you'll paste it into the backend next.

> ⚠️ Use the **Internal** URL (not External) when both the DB and backend are on Render — it's faster and doesn't count against bandwidth limits.

---

### Step 2 — Deploy the Backend

1. Click **New +** → **Web Service**
2. Connect your GitHub account if not already done → select your `moon-final` repository
3. Fill in:
   - **Name:** `moon-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free
4. Scroll to **Environment Variables** → click **Add Environment Variable** for each:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(paste the Internal Database URL from Step 1)* |
   | `JWT_SECRET` | *(click "Generate" or paste a long random string)* |
   | `JWT_EXPIRES_IN` | `7d` |
   | `FRONTEND_URL` | *(leave blank for now — fill in after Step 3)* |

5. Click **Create Web Service**
6. Render will install dependencies, run `npm run build` (which runs `prisma generate` + `prisma migrate deploy`), then start the server
7. Once deployed, your backend URL will be shown at the top — copy it, e.g.:
   ```
   https://moon-backend.onrender.com
   ```
8. Test it: open `https://moon-backend.onrender.com/api/health` in your browser — you should see:
   ```json
   { "status": "ok", "app": "mOOn.com API", "db": "PostgreSQL + Prisma" }
   ```

---

### Step 3 — Deploy the Frontend

1. Click **New +** → **Static Site**
2. Select the same `moon-final` repository
3. Fill in:
   - **Name:** `moon-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`
   - **Plan:** Free
4. Add Environment Variable:

   | Key | Value |
   |-----|-------|
   | `REACT_APP_API_URL` | `https://moon-backend.onrender.com/api` |

5. Click **Create Static Site**
6. Once deployed, your frontend URL will be shown — copy it, e.g.:
   ```
   https://moon-frontend.onrender.com
   ```

---

### Step 4 — Wire Up CORS (Final Step)

Now that you have both URLs, go back to the backend service and add the missing env variable:

1. Open **moon-backend** → **Environment** tab
2. Add:

   | Key | Value |
   |-----|-------|
   | `FRONTEND_URL` | `https://moon-frontend.onrender.com` |

3. Click **Save Changes** — Render will automatically redeploy the backend

---

### Step 5 — Seed the Database

The migrations ran automatically during the build, but the seed data (admin, sample vendor, shop, products) needs to be run manually once.

In your **local terminal** (not Render), run:

```bash
cd backend

# Copy the External Database URL from the Render DB page (not Internal this time)
DATABASE_URL="postgresql://moonuser:PASSWORD@dpg-XXXXX.frankfurt-postgres.render.com/moondb" \
  node prisma/seed.js
```

Alternatively, use Render's **Shell** tab on the backend service:

1. Open **moon-backend** → **Shell** tab
2. Run:
   ```bash
   node prisma/seed.js
   ```

After seeding, these accounts work on your live site:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@moon.com` | `admin123` |
| Vendor | `vendor@moon.com` | `vendor123` |
| Customer | `student@ug.edu.gh` | `customer123` |

---

### Using `render.yaml` (Alternative — Deploy Everything at Once)

The `render.yaml` file in the project root lets Render configure all three services automatically from a single file.

1. Push your code to GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**
3. Connect your repo — Render detects `render.yaml` and shows a preview of all services
4. Review → click **Apply**
5. After everything deploys, manually update the two cross-references:
   - Backend env: `FRONTEND_URL` = your frontend Render URL
   - Frontend env: `REACT_APP_API_URL` = your backend Render URL + `/api`
   - Then trigger a redeploy on both services (click **Manual Deploy** → **Deploy latest commit**)
6. Run the seed script (Step 5 above)

---

### Keeping the Backend Awake (Free Tier Workaround)

Free services sleep after 15 minutes of no traffic. To avoid the cold-start delay for test users, you can use a free uptime monitor to ping your backend every 10 minutes:

- **UptimeRobot** (free) — [uptimerobot.com](https://uptimerobot.com)
  - Add a new HTTP(S) monitor
  - URL: `https://moon-backend.onrender.com/api/health`
  - Interval: 5 minutes

This keeps the backend warm during active testing.

---

### Redeployment (After Code Changes)

Every `git push` to `main` triggers an automatic redeploy on Render for both services. No manual steps needed.

```bash
git add .
git commit -m "your change description"
git push origin main
```

Both services update in parallel. The frontend typically redeploys in ~2 minutes; the backend in ~3 minutes (includes migration step).

---

### Troubleshooting Render Deployments

**Build fails with `prisma: command not found`**
→ Make sure `prisma` is in `dependencies` (not `devDependencies`) in `backend/package.json`. This is already fixed in the project.

**Backend deploys but `/api/health` returns 502**
→ The service is still starting. Wait 30–60 seconds and refresh. If it persists, check the **Logs** tab on Render for the actual error.

**`DATABASE_URL` error on startup**
→ Confirm you pasted the **Internal** connection string (not External) and that the DB is in the same Render region as the backend service.

**Frontend loads but API calls fail (CORS error)**
→ Check that `FRONTEND_URL` on the backend exactly matches your frontend Render URL — no trailing slash. Check the backend **Logs** tab for CORS rejection messages.

**React Router routes return 404 on refresh**
→ The `_redirects` file in `frontend/public/` and the `routes` block in `render.yaml` handle this. If you deployed manually (not via Blueprint), go to **moon-frontend** → **Redirects/Rewrites** and add:
  - Source: `/*`
  - Destination: `/index.html`
  - Action: Rewrite

**Migrations didn't run**
→ SSH into the backend shell and run `npx prisma migrate deploy` manually, or trigger a manual redeploy which re-runs the build command.

**Free database expired (90 days)**
1. Create a new PostgreSQL on Render
2. Copy the new Internal URL
3. Update `DATABASE_URL` on the backend env
4. The redeploy will re-run migrations on the new DB
5. Re-run `node prisma/seed.js`


---

## 13. Common Errors & Fixes

**`PrismaClientInitializationError: Can't reach database server`**
→ PostgreSQL is not running, or `DATABASE_URL` is wrong. Check the connection string and that the DB exists.

**`Error: @prisma/client did not initialize yet`**
→ Run `npx prisma generate` to regenerate the client after a schema change.

**`Migration failed: column already exists`**
→ Your DB is out of sync with migrations. Run `npx prisma migrate reset` in development (⚠️ drops all data).

**`401 Unauthorized` on every request**
→ Token is missing or expired. Check that `localStorage.getItem('moon_token')` returns a value and that `JWT_SECRET` in `.env` hasn't changed since the token was issued.

**`403 Forbidden — Not your shop/product`**
→ The logged-in user is a vendor trying to edit another vendor's resource. Each vendor is scoped to their own shop.

**Frontend shows "No products found" despite having products**
→ The scope/campus filter is likely not matching. Check that the product's shop `campus` and `scope` match what the query sends. Verify the shop is `isVerified: true` if it's a nationwide shop.

**`CORS error` in production**
→ Update the `origin` in `server.js` CORS config to match your deployed frontend URL exactly (no trailing slash).

**Cart won't add item — "items from another shop" error**
→ Expected behaviour. The cart enforces single-shop ordering. Call `clearCart()` before adding from a new shop. The UI should show a dialog asking the user to confirm.
